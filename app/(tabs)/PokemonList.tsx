import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import axios from 'axios';
import { Pressable } from 'react-native';
import { View, Text, FlatList, TextInput, Image, StyleSheet, TouchableOpacity, ActivityIndicator, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { Search, Heart } from 'lucide-react-native';
import { usePokedexStore } from '../../src/store/usePokedexStore';

const BASE_URL = "https://pokeapi.co/api/v2";

interface LocalPokemon {
    id: number;
    nome: string;
    imagemDestaque: string;
    corFundo: string;
    tipos: string[];
}

const coresTipos: Record<string, string> = {
    grass: '#78C850', fire: '#F08030', water: '#6890F0', bug: '#A8B820',
    normal: '#A8A878', poison: '#A040A0', electric: '#F8D030', ground: '#E0C068',
    fairy: '#EE99AC', fighting: '#C03028', psychic: '#F85888', rock: '#B8A038',
    ghost: '#705898', ice: '#98D8D8', dragon: '#7038F8', dark: '#705848', steel: '#B8B8D0',
};

const mapaTiposEn: Record<string, string> = {
    'Normal': 'normal', 'Fogo': 'fire', 'Água': 'water', 'Elétrico': 'electric',
    'Planta': 'grass', 'Gelo': 'ice', 'Lutador': 'fighting', 'Venenoso': 'poison',
    'Terra': 'ground', 'Voador': 'flying', 'Psíquico': 'psychic', 'Inseto': 'bug',
    'Pedra': 'rock', 'Fantasma': 'ghost', 'Dragão': 'dragon', 'Sombrio': 'dark',
    'Aço': 'steel', 'Fada': 'fairy'
};

const tiposFiltro = ['Todos', ...Object.keys(mapaTiposEn)];

const fetchDetailsFromUrls = async (urls: string[]): Promise<LocalPokemon[]> => {
    try {
        const requests = urls.map(url => axios.get(url));
        const responses = await Promise.all(requests);

        return responses.map(res => {
            const tipos = res.data.types.map((t: any) => t.type.name);
            return {
                id: res.data.id,
                nome: res.data.name,
                imagemDestaque: res.data.sprites.other['official-artwork'].front_default || `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${res.data.id}.png`,
                corFundo: coresTipos[tipos[0]] || '#A8A878',
                tipos,
            };
        });
    } catch (error) {
        console.error('Erro ao buscar detalhes:', error);
        return [];
    }
};

interface PokemonCardProps {
    item: LocalPokemon;
    isFavorite: boolean;
    onPress: () => void;
    onToggleFavorite: () => void;
}

const PokemonCard = React.memo(({ item, onPress, isFavorite, onToggleFavorite }: PokemonCardProps) => (
    <Pressable
        style={[styles.cardContainer, { backgroundColor: item.corFundo }]}
        android_ripple={{ color: 'rgba(0,0,0,0.05)' }}
        onPress={onPress}
    >
        <View style={styles.cardHeader}>
            <Text style={styles.pokemonId}>#{item.id.toString().padStart(3, '0')}</Text>
            <Pressable
                style={styles.heartButton}
                onPress={(e) => {
                    e.stopPropagation(); // Trava a propagação do clique para o card pai
                    onToggleFavorite();
                }}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
                <Heart size={20} color={isFavorite ? "#DC0A2D" : "#FFF"} fill={isFavorite ? "#DC0A2D" : "transparent"} />
            </Pressable>
        </View>

        <Image source={{ uri: item.imagemDestaque }} style={styles.pokemonImage} resizeMode="contain" />

        <View style={styles.cardInfoBox}>
            <Text style={styles.pokemonName}>{item.nome}</Text>
            <View style={styles.typesContainer}>
                {item.tipos.map((tipo, index) => (
                    <View key={index} style={[styles.typePill, { backgroundColor: coresTipos[tipo] }]}>
                        <Text style={styles.typeText}>{tipo}</Text>
                    </View>
                ))}
            </View>
        </View>
    </Pressable>
));

export default function PokemonList() {
    const router = useRouter();
    const { favorites, toggleFavorite } = usePokedexStore();

    const [search, setSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [filtroAtivo, setFiltroAtivo] = useState('Todos');

    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            setDebouncedSearch(search.trim().toLowerCase());
        }, 500);
        return () => clearTimeout(delayDebounceFn);
    }, [search]);

    const tipoEmIngles = mapaTiposEn[filtroAtivo];

    const { data: searchResult, isFetching: isSearching } = useQuery<LocalPokemon[]>({
        queryKey: ['pokemonSearch', debouncedSearch],
        queryFn: async () => {
            try {
                const res = await axios.get(`${BASE_URL}/pokemon/${debouncedSearch}`);
                const tipos = res.data.types.map((t: any) => t.type.name);
                return [{
                    id: res.data.id,
                    nome: res.data.name,
                    imagemDestaque: res.data.sprites.other['official-artwork'].front_default,
                    corFundo: coresTipos[tipos[0]] || '#A8A878',
                    tipos,
                }];
            } catch {
                return [];
            }
        },
        enabled: debouncedSearch !== '',
        staleTime: 1000 * 60 * 5,
    });

    // FILTRO POR TIPO (COM PAGINAÇÃO LOCAL)
    const {
        data: typeData,
        fetchNextPage: fetchNextTypePage,
        hasNextPage: hasNextTypePage,
        isFetchingNextPage: isFetchingNextType,
        isLoading: isLoadingType
    } = useInfiniteQuery({
        queryKey: ['pokemonType', tipoEmIngles],
        initialPageParam: 0,
        queryFn: async ({ pageParam }) => {
            const page = pageParam as number;
            const res = await axios.get(`${BASE_URL}/type/${tipoEmIngles}`);
            const allUrls = res.data.pokemon.map((p: any) => p.pokemon.url);

            const slice = allUrls.slice(page * 20, (page + 1) * 20);
            const details = slice.length > 0 ? await fetchDetailsFromUrls(slice) : [];

            return {
                details,
                nextPage: slice.length === 20 ? page + 1 : undefined,
            };
        },
        getNextPageParam: (lastPage) => lastPage.nextPage,
        enabled: debouncedSearch === '' && filtroAtivo !== 'Todos',
    });

    // LISTAGEM INFINITA PADRÃO ---
    const {
        data: generalData,
        fetchNextPage: fetchNextGeneralPage,
        hasNextPage: hasNextGeneralPage,
        isFetchingNextPage: isFetchingNextGeneral,
        isLoading: isLoadingGeneral
    } = useInfiniteQuery({
        queryKey: ['pokemonGeneral'],
        initialPageParam: `${BASE_URL}/pokemon?limit=20`, // 🚨 OBRIGATÓRIO NA V5: Primeira URL
        queryFn: async ({ pageParam }) => {
            const res = await axios.get(pageParam as string);
            const urls = res.data.results.map((p: any) => p.url);
            const details = await fetchDetailsFromUrls(urls);

            return {
                details,
                nextUrl: res.data.next,
            };
        },

        getNextPageParam: (lastPage) => lastPage.nextUrl || undefined,
        enabled: debouncedSearch === '' && filtroAtivo === 'Todos',
    });

    const pokemonsExibidos = useMemo(() => {
        let listaBruta: LocalPokemon[] = [];
        if (debouncedSearch !== '') listaBruta = searchResult || [];
        else if (filtroAtivo !== 'Todos') listaBruta = typeData?.pages.flatMap(p => p.details) || [];
        else listaBruta = generalData?.pages.flatMap(p => p.details) || [];

        // Remove duplicatas em tempo real para não quebrar o Fabric Engine da FlatList
        const idsVistos = new Set();
        return listaBruta.filter(pokemon => {
            if (!pokemon || !pokemon.id || idsVistos.has(pokemon.id)) return false;
            idsVistos.add(pokemon.id);
            return true;
        });
    }, [debouncedSearch, filtroAtivo, searchResult, typeData, generalData]);

    const isLoading = isLoadingType || isLoadingGeneral || isSearching;
    const isCarregandoMais = isFetchingNextType || isFetchingNextGeneral;

    const carregarMais = () => {
        if (debouncedSearch !== '' || isCarregandoMais) return;
        if (filtroAtivo !== 'Todos' && hasNextTypePage) fetchNextTypePage();
        if (filtroAtivo === 'Todos' && hasNextGeneralPage) fetchNextGeneralPage();
    };

    const navigatingRef = useRef(false);
    const handleNavigate = useCallback((id: number) => {
        if (navigatingRef.current) return;
        navigatingRef.current = true;
        router.push(`/details/${id}`);
        setTimeout(() => { navigatingRef.current = false; }, 600);
    }, [router]);

    const renderItem = useCallback(({ item }: { item: LocalPokemon }) => {
        const isFavorite = favorites.some((fav) => fav.id === item.id);
        return (
            <PokemonCard
                item={item}
                isFavorite={isFavorite}
                onPress={() => handleNavigate(item.id)}
                onToggleFavorite={() => toggleFavorite({ id: item.id, nome: item.nome, imagemDestaque: item.imagemDestaque })}
            />
        );
    }, [favorites, handleNavigate, toggleFavorite]);

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.headerVermelho}>
                <Text style={styles.tituloApp}>Pokédex</Text>
                <Text style={styles.subtituloApp}>
                    Pesquise por qualquer Pokémon pelo nome ou número. Filtre por tipo e monte sua coleção de favoritos.
                </Text>
                <View style={styles.searchBar}>
                    <Search size={20} color="#888" style={styles.searchIcon} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Buscar por letra ou número... Ex: Pikachu ou 25"
                        placeholderTextColor="#888"
                        value={search}
                        onChangeText={setSearch}
                        autoCapitalize="none"
                        autoCorrect={false}
                    />
                </View>
            </View>

            <View style={styles.sectionFiltros}>
                <Text style={styles.sectionTitle}>Tipos de Pokémon</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filtrosScroll}>
                    {tiposFiltro.map((tipo, index) => (
                        <TouchableOpacity
                            key={index}
                            style={[
                                styles.filtroPill,
                                filtroAtivo === tipo ? styles.filtroAtivo : styles.filtroInativo
                            ]}
                            onPress={() => {
                                setFiltroAtivo(tipo);
                                setSearch('');
                            }}
                        >
                            <Text style={[
                                styles.filtroText,
                                filtroAtivo === tipo ? { color: '#FFF' } : { color: '#444' }
                            ]}>{tipo}</Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            <View style={styles.listHeader}>
                <Text style={styles.sectionTitle}>Pokémon Carregados</Text>
                <Text style={styles.countText}>{pokemonsExibidos.length} visíveis</Text>
            </View>

            {isLoading && pokemonsExibidos.length === 0 ? (
                <View style={styles.centerContainer}>
                    <ActivityIndicator size="large" color="#DC0A2D" />
                    <Text style={{ marginTop: 10, color: '#DC0A2D', fontWeight: 'bold' }}>Sincronizando Pokédex...</Text>
                </View>
            ) : (
                <FlatList
                    data={pokemonsExibidos}
                    keyExtractor={(item) => item.id.toString()}
                    renderItem={renderItem}
                    numColumns={2}
                    columnWrapperStyle={styles.row}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                    removeClippedSubviews={true}
                    maxToRenderPerBatch={10}
                    windowSize={5}
                    onEndReached={carregarMais}
                    onEndReachedThreshold={0.5}
                    ListFooterComponent={
                        isCarregandoMais ? <ActivityIndicator size="large" color="#DC0A2D" style={{ marginVertical: 20 }} /> : null
                    }
                    ListEmptyComponent={
                        <View style={{ alignItems: 'center', marginTop: 40 }}>
                            <Text style={{ color: '#888', fontSize: 16 }}>Nenhum Pokémon encontrado.</Text>
                        </View>
                    }
                />
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FAFAFA',
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerVermelho: {
        backgroundColor: '#DC0A2D',
        paddingHorizontal: 20,
        paddingTop: 40,
        paddingBottom: 30,
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
        shadowColor: '#DC0A2D',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 15,
        elevation: 10,
        marginBottom: 20,
    },
    tituloApp: {
        color: '#FFF',
        fontSize: 32,
        fontWeight: '900',
        marginBottom: 10,
    },
    subtituloApp: {
        color: '#FFF',
        fontSize: 14,
        opacity: 0.9,
        lineHeight: 20,
        marginBottom: 20,
    },
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderRadius: 30,
        paddingHorizontal: 15,
        height: 50,
    },
    searchIcon: {
        marginRight: 10,
    },
    searchInput: {
        flex: 1,
        fontSize: 16,
        color: '#333',
    },
    sectionFiltros: {
        paddingHorizontal: 20,
        marginBottom: 15,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 10,
    },
    filtrosScroll: {
        flexDirection: 'row',
        gap: 10,
        paddingBottom: 10,
    },
    filtroPill: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        marginRight: 8,
        borderWidth: 1,
        borderColor: '#E0E0E0',
    },
    filtroAtivo: {
        backgroundColor: '#333',
        borderColor: '#333',
    },
    filtroInativo: {
        backgroundColor: '#FFF',
    },
    filtroText: {
        fontWeight: 'bold',
        fontSize: 14,
    },
    listHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        marginBottom: 10,
    },
    countText: {
        fontSize: 14,
        color: '#888',
    },
    listContent: {
        paddingHorizontal: 15,
        paddingBottom: 20,
    },
    row: {
        justifyContent: 'space-between',
        marginBottom: 15,
    },
    cardContainer: {
        flex: 1,
        marginHorizontal: 5,
        borderRadius: 20,
        paddingTop: 10,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 6,
        elevation: 3,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 12,
        zIndex: 2,
    },
    pokemonId: {
        fontSize: 14,
        fontWeight: '900',
        color: 'rgba(0,0,0,0.4)',
    },
    heartButton: {
        backgroundColor: 'rgba(255,255,255,0.3)',
        borderRadius: 15,
        padding: 5,
    },
    pokemonImage: {
        width: 100,
        height: 100,
        alignSelf: 'center',
        marginTop: -10,
        marginBottom: -20,
        zIndex: 1,
    },
    cardInfoBox: {
        backgroundColor: '#FFFFFF',
        paddingTop: 25,
        paddingBottom: 15,
        alignItems: 'center',
        borderBottomLeftRadius: 20,
        borderBottomRightRadius: 20,
    },
    pokemonName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
        textTransform: 'capitalize',
        marginBottom: 8,
    },
    typesContainer: {
        flexDirection: 'row',
        gap: 5,
    },
    typePill: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    typeText: {
        color: '#FFF',
        fontSize: 10,
        fontWeight: 'bold',
        textTransform: 'capitalize',
    },
});