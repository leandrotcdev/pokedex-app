import React, { useState, useCallback, useMemo, useEffect } from 'react';
import axios from 'axios';
import { View, Text, FlatList, TextInput, Image, StyleSheet, TouchableOpacity, ActivityIndicator, ScrollView, Pressable, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Heart, Languages } from 'lucide-react-native';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { usePokedexStore } from '../../src/store/usePokedexStore';
import { dicionario } from '../../src/utils/translations';

const BASE_URL = "https://pokeapi.co/api/v2";

const retroFont = Platform.OS === 'ios' ? 'Courier' : 'monospace';

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

const tiposFiltroKeys = [
    'all', 'normal', 'fire', 'water', 'electric', 'grass', 'ice',
    'fighting', 'poison', 'ground', 'flying', 'psychic', 'bug',
    'rock', 'ghost', 'dragon', 'dark', 'steel', 'fairy'
];

const fetchDetailsFromUrls = async (urls: string[]): Promise<LocalPokemon[]> => {
    try {
        const responses = await Promise.all(urls.map(url => axios.get(url)));
        return responses.map(res => ({
            id: res.data.id,
            nome: res.data.name,
            imagemDestaque: res.data.sprites.other['official-artwork'].front_default || `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${res.data.id}.png`,
            corFundo: coresTipos[res.data.types[0].type.name] || '#A8A878',
            tipos: res.data.types.map((t: any) => t.type.name),
        }));
    } catch (error) { return []; }
};

const PokemonCard = React.memo(({ item, isFavorite, onPress, onToggleFavorite, tTipos, colors }: any) => (
    <Pressable style={[styles.retroCard, { backgroundColor: item.corFundo }]} onPress={onPress}>
        <View style={styles.retroCardHeader}>
            <Text style={styles.retroId}>No.{item.id.toString().padStart(3, '0')}</Text>
            <Pressable style={styles.retroHeartBtn} onPress={(e) => { e.stopPropagation(); onToggleFavorite(); }}>
                <Heart size={18} color="#000" fill={isFavorite ? "#DC0A2D" : "transparent"} />
            </Pressable>
        </View>

        <View style={styles.retroImageContainer}>
            <Image source={{ uri: item.imagemDestaque }} style={styles.pokemonImage} resizeMode="contain" />
        </View>

        <View style={[styles.retroCardInfo, { backgroundColor: colors.cardBox }]}>
            <Text style={[styles.retroName, { color: colors.text }]} numberOfLines={1}>
                {item.nome.toUpperCase()}
            </Text>
            <View style={styles.typesContainer}>
                {item.tipos.map((tipo: string, i: number) => (
                    <View key={i} style={[styles.retroTypePill, { backgroundColor: coresTipos[tipo] || '#777' }]}>
                        <Text style={styles.retroTypeText}>{tTipos[tipo as keyof typeof tTipos] || tipo.toUpperCase()}</Text>
                    </View>
                ))}
            </View>
        </View>
    </Pressable>
));

export default function PokemonList() {

    const router = useRouter();

    const { favorites = [], toggleFavorite, theme, toggleTheme, language, toggleLanguage } = usePokedexStore() || {};
    const favoritesSet = useMemo(() => new Set(favorites.map(f => f.id)), [favorites]);

    const [search, setSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [filtroAtivo, setFiltroAtivo] = useState('all');

    const isDark = theme === 'dark';
    const colors = { bg: isDark ? '#222' : '#F0F0F0', text: isDark ? '#FFF' : '#000', cardBox: isDark ? '#333' : '#FFF' };

    const safeLanguage = language || 'pt'; // Se a memória estiver vazia/carregando, usa 'pt'

    const tLista = dicionario[safeLanguage]?.lista || dicionario['pt'].lista;
    const tTipos = dicionario[safeLanguage]?.tipos || dicionario['pt'].tipos;
    const tComum = dicionario[safeLanguage]?.comum || dicionario['pt'].comum;

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(search.trim());
        }, 400);

        return () => clearTimeout(timer);
    }, [search]);

    const { data: masterList } = useQuery({
        queryKey: ['masterPokemonList'],
        queryFn: async () => {
            const res = await axios.get(`${BASE_URL}/pokemon?limit=12000`);
            return res.data.results.map((p: any) => {
                const parts = p.url.split('/').filter(Boolean);
                return { name: p.name, url: p.url, id: parseInt(parts[parts.length - 1], 10) };
            });
        },
        staleTime: Infinity,
    });

    const searchMatches = useMemo(() => {
        if (!debouncedSearch || !masterList) return null;
        const termo = debouncedSearch.toLowerCase().trim();

        return masterList
            .filter((p: { name: string; id: { toString: () => string; } | null; }) => {

                if (!p || !p.name) return false;

                const matchName = p.name.toLowerCase().includes(termo);
                const matchId = p.id != null && p.id.toString().toLowerCase() === termo;

                return matchName || matchId;
            })
            .slice(0, 20);
    }, [debouncedSearch, masterList]);

    const { data: searchResults, isFetching: isSearchingApi } = useQuery({
        queryKey: ['searchResults', searchMatches?.map((m: { id: any; }) => m.id).join(',')],
        queryFn: async () => {
            if (!searchMatches || searchMatches.length === 0) return [];
            return fetchDetailsFromUrls(searchMatches.map((m: { url: any; }) => m.url));
        },
        enabled: !!searchMatches && searchMatches.length > 0,
    });

    const { data: typeData, fetchNextPage: f1, hasNextPage: h1, isFetchingNextPage: if1, isLoading: il1 } = useInfiniteQuery({
        queryKey: ['pokemonType', filtroAtivo], initialPageParam: 0,
        queryFn: async ({ pageParam }) => {
            const res = await axios.get(`${BASE_URL}/type/${filtroAtivo}`);
            const slice = res.data.pokemon.map((p: any) => p.pokemon.url).slice((pageParam as number) * 20, ((pageParam as number) + 1) * 20);
            return { details: await fetchDetailsFromUrls(slice), next: slice.length === 20 ? (pageParam as number) + 1 : undefined };
        }, getNextPageParam: (l) => l.next, enabled: filtroAtivo !== 'all' && debouncedSearch === '',
    });

    const { data: generalData, fetchNextPage: f2, hasNextPage: h2, isFetchingNextPage: if2, isLoading: il2 } = useInfiniteQuery({
        queryKey: ['pokemonGeneral'], initialPageParam: `${BASE_URL}/pokemon?limit=20`,
        queryFn: async ({ pageParam }) => {
            const res = await axios.get(pageParam as string);
            return { details: await fetchDetailsFromUrls(res.data.results.map((p: any) => p.url)), next: res.data.next };
        }, getNextPageParam: (l) => l.next || undefined, enabled: filtroAtivo === 'all' && debouncedSearch === '',
    });

    const pokemonsExibidos = useMemo(() => {
        if (debouncedSearch !== '') {
            return JSON.parse(JSON.stringify(searchResults || []));
        }

        let listaBase = filtroAtivo !== 'all' ? typeData?.pages.flatMap(p => p.details || []) ?? [] : generalData?.pages.flatMap(p => p.details || []) ?? [];
        const seen = new Set();
        let listaFiltrada = listaBase.filter(p => !seen.has(p.id) && seen.add(p.id));

        return JSON.parse(JSON.stringify(listaFiltrada));
    }, [debouncedSearch, searchResults, filtroAtivo, typeData, generalData]);

    const renderItem = useCallback(({ item }: { item: LocalPokemon }) => (
        <PokemonCard item={item} isFavorite={favoritesSet.has(item.id)} onPress={() => router.push(`/details/${item.id}`)} onToggleFavorite={() => toggleFavorite({ id: item.id, nome: item.nome, imagemDestaque: item.imagemDestaque })} tTipos={tTipos} colors={colors} />
    ), [favoritesSet, router, toggleFavorite, tTipos, colors]);

    const isLoading = debouncedSearch !== '' ? isSearchingApi : (filtroAtivo !== 'all' ? il1 : il2);
    const isCarregandoMais = debouncedSearch !== '' ? false : (filtroAtivo !== 'all' ? if1 : if2);

    const carregarMais = useCallback(() => {
        if (isCarregandoMais || debouncedSearch.trim() !== '') return;
        if (filtroAtivo !== 'all' && h1) f1();
        if (filtroAtivo === 'all' && h2) f2();
    }, [isCarregandoMais, debouncedSearch, filtroAtivo, h1, f1, h2, f2]);

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
            <View style={styles.retroTopBar}>
                <TouchableOpacity style={styles.retroBtnSmall} onPress={toggleLanguage} activeOpacity={0.8}>
                    <Text style={styles.retroBtnTextSmall}>{language === 'pt' ? 'SELECT: EN' : 'SELECT: PT'}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.retroBtnSmall} onPress={toggleTheme} activeOpacity={0.8}>
                    <Text style={styles.retroBtnTextSmall}>{isDark ? 'START: LIGHT' : 'START: DARK'}</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.retroHeader}>
                <View style={styles.headerTop}>
                    <Text style={styles.retroTitle}>{tComum.pokedex.toUpperCase()}</Text>
                </View>
                <TextInput
                    style={styles.retroInput}
                    value={search}
                    onChangeText={setSearch}
                    placeholder={`> ${tLista.buscaPlaceholder.toUpperCase()}`}
                    placeholderTextColor="#666"
                    autoCapitalize="none"
                    autoCorrect={false}
                />
            </View>

            <View style={styles.sectionFiltros}>
                <Text style={[styles.retroSectionTitle, { color: colors.text }]}>[{tLista.tiposTitulo.toUpperCase()}]</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filtrosScroll}>
                    {tiposFiltroKeys.map((tipoKey) => (
                        <TouchableOpacity
                            key={tipoKey}
                            style={[styles.retroFilterPill, filtroAtivo === tipoKey ? styles.retroFilterActive : { backgroundColor: colors.cardBox }]}
                            onPress={() => { setFiltroAtivo(tipoKey); setSearch(''); }}
                            activeOpacity={1}
                        >
                            <Text style={[styles.retroFilterText, filtroAtivo === tipoKey ? { color: '#FFF' } : { color: colors.text }]}>
                                {tTipos[tipoKey as keyof typeof tTipos].toUpperCase() || tipoKey.toUpperCase()}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            {isLoading && pokemonsExibidos.length === 0 ? (
                <View style={styles.centerContainer}>
                    <ActivityIndicator size="large" color={colors.text} />
                    <Text style={[styles.retroSectionTitle, { marginTop: 12, color: colors.text }]}>{tLista.carregando.toUpperCase()}</Text>
                </View>
            ) : (
                <FlatList
                    key={isDark ? 'dark' : 'light'}
                    data={pokemonsExibidos}
                    keyExtractor={(item) => String(item.id)}
                    renderItem={renderItem}
                    numColumns={2}
                    columnWrapperStyle={{
                        justifyContent: 'space-between',
                        paddingHorizontal: 10,
                        marginBottom: 20
                    }}
                    contentContainerStyle={{
                        paddingBottom: 40
                    }}
                    removeClippedSubviews={false}

                    onEndReached={carregarMais}
                    onEndReachedThreshold={0.4}
                    showsVerticalScrollIndicator={false}
                />
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    retroTopBar: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 10, gap: 10 },
    retroHeader: {
        backgroundColor: '#DC0A2D',
        padding: 20,
        borderBottomWidth: 6,
        borderColor: '#000',
        marginBottom: 20,
    },
    headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
    retroTitle: { color: '#FFF', fontFamily: retroFont, fontSize: 28, fontWeight: '900', textShadowColor: '#000', textShadowOffset: { width: 3, height: 3 }, textShadowRadius: 0 },
    retroBtnSmall: { backgroundColor: '#000', paddingHorizontal: 10, paddingVertical: 6, borderWidth: 2, borderColor: '#555' },
    retroBtnTextSmall: { color: '#FFF', fontFamily: retroFont, fontWeight: 'bold', fontSize: 10 },
    retroInput: {
        fontFamily: retroFont, backgroundColor: '#FFF', borderWidth: 4, borderColor: '#000',
        paddingHorizontal: 15, height: 50, fontSize: 14, fontWeight: 'bold', color: '#000',
        shadowColor: '#000', shadowOffset: { width: 4, height: 4 }, shadowOpacity: 1, shadowRadius: 0,
    },
    sectionFiltros: { paddingHorizontal: 20, marginBottom: 15 },
    retroSectionTitle: { fontFamily: retroFont, fontSize: 14, fontWeight: 'bold', marginBottom: 10 },
    filtrosScroll: { flexDirection: 'row', paddingBottom: 10 },
    retroFilterPill: {
        paddingHorizontal: 12, paddingVertical: 8, marginRight: 10,
        borderWidth: 3, borderColor: '#000',
        shadowColor: '#000', shadowOffset: { width: 3, height: 3 }, shadowOpacity: 1, shadowRadius: 0,
    },
    retroFilterActive: { backgroundColor: '#000' },
    retroFilterText: { fontFamily: retroFont, fontWeight: 'bold', fontSize: 12 },
    listContent: { paddingHorizontal: 15, paddingBottom: 20 },
    row: { justifyContent: 'space-between', marginBottom: 20 },

    // O Cartucho Retro
    retroCard: {
        flex: 1, marginHorizontal: 6, borderWidth: 4, borderColor: '#000',
        shadowColor: '#000', shadowOffset: { width: 6, height: 6 }, shadowOpacity: 1, shadowRadius: 0,
    },
    retroCardHeader: { flexDirection: 'row', justifyContent: 'space-between', padding: 8, borderBottomWidth: 2, borderColor: 'rgba(0,0,0,0.2)' },
    retroId: { fontFamily: retroFont, fontSize: 12, fontWeight: '900', color: '#000' },
    retroHeartBtn: { backgroundColor: '#FFF', borderWidth: 2, borderColor: '#000', borderRadius: 0, padding: 3 },
    retroImageContainer: { height: 90, justifyContent: 'center', alignItems: 'center' },
    pokemonImage: { width: 80, height: 80 },
    retroCardInfo: { borderTopWidth: 4, borderColor: '#000', padding: 10, alignItems: 'center' },
    retroName: { fontFamily: retroFont, fontSize: 14, fontWeight: 'bold', marginBottom: 8, textAlign: 'center' },
    typesContainer: { flexDirection: 'row', gap: 6, flexWrap: 'wrap', justifyContent: 'center' },
    retroTypePill: { borderWidth: 2, borderColor: '#000', paddingHorizontal: 6, paddingVertical: 2 },
    retroTypeText: { fontFamily: retroFont, color: '#FFF', fontSize: 9, fontWeight: 'bold' },
    retroEmptyBox: { margin: 20, padding: 15, borderWidth: 4, borderColor: '#000', borderStyle: 'dashed', alignItems: 'center' },
    retroEmptyText: { fontFamily: retroFont, fontSize: 14, fontWeight: 'bold', textAlign: 'center' },
});