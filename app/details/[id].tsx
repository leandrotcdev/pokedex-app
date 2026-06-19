import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { View, Text, Animated, StyleSheet, TouchableOpacity, ActivityIndicator, ScrollView, Platform, AccessibilityInfo, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Heart, Volume2, Weight, Ruler } from 'lucide-react-native';
import { usePokedexStore } from '../../src/store/usePokedexStore';
import { Pokemon, Stats } from '../../src/types/pokemon';
import * as Speech from 'expo-speech';

// Importação condicional esegura do Head (Apenas se for Web)
const Head = Platform.OS === 'web' ? require('expo-router/head').default : (() => null);

const BASE_URL = "https://pokeapi.co/api/v2/pokemon";
const SPECIES_URL = "https://pokeapi.co/api/v2/pokemon-species";

const coresTipos: Record<string, string> = {
    grass: '#78C850', fire: '#F08030', water: '#6890F0', bug: '#A8B820',
    normal: '#A8A878', poison: '#A040A0', electric: '#F8D030', ground: '#E0C068',
    fairy: '#EE99AC', fighting: '#C03028', psychic: '#F85888', rock: '#B8A038',
    ghost: '#705898', ice: '#98D8D8', dragon: '#7038F8', dark: '#705848', steel: '#B8B8D0',
};

interface DetalhesPokemon extends Pokemon {
    corFundo: string;
}

const StatBar = ({ name, value, color, isDark }: { name: string, value: number, color: string, isDark: boolean }) => {
    const fillAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.timing(fillAnim, {
            toValue: value,
            duration: 1000,
            useNativeDriver: false,
        }).start();
    }, [value]);

    const progressWidth = fillAnim.interpolate({
        inputRange: [0, 200],
        outputRange: ['0%', '100%'],
        extrapolate: 'clamp'
    });

    const handleShowTooltip = () => {
        Alert.alert(`Estatística: ${name}`, `Este Pokémon possui ${value} pontos base de ${name}.`);
    };

    return (
        <TouchableOpacity
            style={styles.statRow}
            onPress={handleShowTooltip}
            activeOpacity={0.8}
            accessible={true}
            accessibilityLabel={`${name}: ${value} pontos`}
        >
            <Text style={[styles.statName, { color: isDark ? '#AAA' : '#666' }]}>{name}</Text>
            <Text style={[styles.statValue, { color: isDark ? '#FFF' : '#333' }]}>{value.toString().padStart(3, '0')}</Text>
            <View style={[styles.barBackground, { backgroundColor: isDark ? '#333' : '#EAEAEA' }]}>
                <Animated.View style={[styles.barFill, { width: progressWidth, backgroundColor: color }]} />
            </View>
        </TouchableOpacity>
    );
};

export default function PokemonDetails() {

    const { id } = useLocalSearchParams();
    const router = useRouter();
    const { favorites, toggleFavorite, addToHistory, theme } = usePokedexStore();

    const [pokemon, setPokemon] = useState<DetalhesPokemon | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const fadeAnim = useRef(new Animated.Value(0)).current;
    const floatAnim = useRef(new Animated.Value(0)).current;

    const isFavorite = pokemon ? favorites.some((p) => p.id === pokemon.id) : false;
    const isDark = theme === 'dark';

    const cores = {
        bg: isDark ? '#121212' : '#F5F5F5',
        text: isDark ? '#FFFFFF' : '#333333',
        card: isDark ? '#1E1E1E' : '#FFFFFF',
        pokedexRed: '#CC0000',
        pokedexYellow: '#FFDE00',
    };

    useEffect(() => {
        if (id) fetchPokemonDetails();
    }, [id]);

    const fetchPokemonDetails = async () => {
        try {
            setIsLoading(true);

            const [dadosRes, especieRes] = await Promise.all([
                axios.get(`${BASE_URL}/${id}`),
                axios.get(`${SPECIES_URL}/${id}`)
            ]);

            const data = dadosRes.data;
            const especieData = especieRes.data;

            const entradaDex = especieData.flavor_text_entries.find(
                (e: any) => e.language.name === 'pt-BR' || e.language.name === 'en'
            );
            const descricaoLimpa = entradaDex ? entradaDex.flavor_text.replace(/\n|\f|\r/g, ' ') : 'Descrição indisponível.';
            const tiposExtraidos = data.types.map((t: any) => t.type.name);

            const statsObj: Stats = {
                hp: data.stats.find((s: any) => s.stat.name === 'hp')?.base_stat || 0,
                ataque: data.stats.find((s: any) => s.stat.name === 'attack')?.base_stat || 0,
                defesa: data.stats.find((s: any) => s.stat.name === 'defesa')?.base_stat || 0,
                velocidade: data.stats.find((s: any) => s.stat.name === 'velocidade')?.base_stat || 0,
            };

            const pokemonMapeado: DetalhesPokemon = {
                id: data.id,
                nome: data.name,
                tipo: tiposExtraidos,
                descricao: descricaoLimpa,
                peso: `${data.weight / 10} kg`,
                altura: `${data.height / 10} m`,
                habilidades: statsObj,
                imagemDestaque: data.sprites.other['official-artwork'].front_default || '',
                corFundo: coresTipos[tiposExtraidos[0]] || '#A8A878'
            };

            setPokemon(pokemonMapeado);

            addToHistory({
                id: pokemonMapeado.id,
                nome: pokemonMapeado.nome,
                imagemDestaque: pokemonMapeado.imagemDestaque
            });

            AccessibilityInfo.announceForAccessibility(`Detalhes do Pokémon ${pokemonMapeado.nome} carregados.`);

            // Ajuste automático para useNativeDriver dependendo da plataforma
            const usarDriveNativo = Platform.OS !== 'web';

            Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: usarDriveNativo }).start();
            Animated.loop(
                Animated.sequence([
                    Animated.timing(floatAnim, { toValue: -12, duration: 1500, useNativeDriver: usarDriveNativo }),
                    Animated.timing(floatAnim, { toValue: 0, duration: 1500, useNativeDriver: usarDriveNativo })
                ])
            ).start();

        } catch (err) {
            console.error("[DETALHES ERROR]", err);
        } finally {
            setIsLoading(false);
        }
    };

    const falarDescricaoPokedex = () => {
        if (!pokemon) return;
        Speech.stop();
        Speech.speak(`${pokemon.nome}. Pokémon do tipo ${pokemon.tipo.join(' e ')}. ${pokemon.descricao}`, {
            language: 'pt-BR',
            pitch: 0.9,
            rate: 0.9,
        });
    };

    if (isLoading || !pokemon) {
        return (
            <View style={[styles.centerContainer, { backgroundColor: cores.bg }]}>
                <ActivityIndicator size="large" color={cores.pokedexRed} />
            </View>
        );
    }

    const nomeFormatado = pokemon.nome.charAt(0).toUpperCase() + pokemon.nome.slice(1);

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: pokemon.corFundo }]}>

            {Platform.OS === 'web' && (
                <Head>
                    <title>{nomeFormatado} | Pokédex</title>
                    <meta property="og:image" content={pokemon.imagemDestaque} />
                </Head>
            )}

            <Animated.View style={{ flex: 1, opacity: fadeAnim }}>

                <View style={styles.header}>
                    <TouchableOpacity onPress={() => { Speech.stop(); router.back(); }}>
                        <Text style={[styles.backButton, { color: '#FFF' }]}>← Voltar</Text>
                    </TouchableOpacity>
                    <Text style={styles.breadcrumb}>Início / Pokédex / <Text style={{ fontWeight: 'bold' }}>{nomeFormatado}</Text></Text>
                    <TouchableOpacity onPress={() => toggleFavorite({ id: pokemon.id, nome: pokemon.nome, imagemDestaque: pokemon.imagemDestaque })}>
                        <Heart size={28} color={isFavorite ? cores.pokedexRed : "#FFF"} fill={isFavorite ? cores.pokedexRed : "transparent"} />
                    </TouchableOpacity>
                </View>

                <View style={styles.titleRow}>
                    <Text style={styles.name}>{nomeFormatado}</Text>
                    <Text style={styles.idText}>#{pokemon.id.toString().padStart(3, '0')}</Text>
                </View>

                <View style={styles.typesRow}>
                    {pokemon.tipo.map((t) => (
                        <View key={t} style={[styles.typeBadge, { backgroundColor: 'rgba(255,255,255,0.3)' }]}>
                            <Text style={styles.typeText}>{t}</Text>
                        </View>
                    ))}
                </View>

                <View style={styles.imageContainer}>
                    <Animated.Image
                        source={{ uri: pokemon.imagemDestaque }}
                        style={[styles.image, { transform: [{ translateY: floatAnim }] }]}
                        resizeMode="contain"
                    />
                </View>

                <ScrollView style={[styles.infoSection, { backgroundColor: cores.bg }]} contentContainerStyle={{ paddingBottom: 50 }} showsVerticalScrollIndicator={false}>

                    <TouchableOpacity style={[styles.voiceButton, { backgroundColor: cores.pokedexRed }]} onPress={falarDescricaoPokedex} activeOpacity={0.8}>
                        <Volume2 size={24} color="#FFF" style={{ marginRight: 10 }} />
                        <Text style={styles.voiceButtonText}>Ouvir Pokédex</Text>
                    </TouchableOpacity>

                    <Text style={[styles.description, { color: cores.text }]}>{pokemon.descricao}</Text>

                    <View style={[styles.statsGrid, { backgroundColor: cores.card }]}>
                        <View style={styles.statBox}>
                            <Weight size={20} color={isDark ? '#AAA' : '#666'} />
                            <Text style={[styles.statValue, { color: cores.text }]}>{pokemon.peso}</Text>
                            <Text style={[styles.statLabel, { color: isDark ? '#888' : '#999' }]}>PESO</Text>
                        </View>
                        <View style={[styles.metricLine, { backgroundColor: isDark ? '#333' : '#E0E0E0' }]} />
                        <View style={styles.statBox}>
                            <Ruler size={20} color={isDark ? '#AAA' : '#666'} />
                            <Text style={[styles.statValue, { color: cores.text }]}>{pokemon.altura}</Text>
                            <Text style={[styles.statLabel, { color: isDark ? '#888' : '#999' }]}>ALTURA</Text>
                        </View>
                    </View>

                    <Text style={[styles.sectionTitle, { color: cores.text }]}>Estatísticas Base</Text>
                    <View style={[styles.battleStats, { backgroundColor: cores.card }]}>
                        <StatBar name="HP" value={pokemon.habilidades.hp} color="#78C850" isDark={isDark} />
                        <StatBar name="ATAQUE" value={pokemon.habilidades.ataque} color="#F08030" isDark={isDark} />
                        <StatBar name="DEFESA" value={pokemon.habilidades.defesa} color="#F8D030" isDark={isDark} />
                        <StatBar name="VELOC." value={pokemon.habilidades.velocidade} color="#F85888" isDark={isDark} />
                    </View>

                </ScrollView>
            </Animated.View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: Platform.OS === 'android' ? 40 : 20, zIndex: 10 },
    backButton: { fontSize: 15, fontWeight: 'bold' },
    breadcrumb: { fontSize: 13, color: '#FFF', opacity: 0.9 },
    titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', paddingHorizontal: 20, marginTop: 15, zIndex: 10 },
    name: { fontSize: 36, fontWeight: '900', color: '#FFF', textTransform: 'capitalize' },
    idText: { fontSize: 22, fontWeight: 'bold', color: '#FFF', opacity: 0.8 },
    typesRow: { flexDirection: 'row', paddingHorizontal: 20, marginTop: 5, zIndex: 10, gap: 8 },
    typeBadge: { paddingHorizontal: 15, paddingVertical: 5, borderRadius: 20 },
    typeText: { fontWeight: 'bold', color: '#FFF', textTransform: 'uppercase', fontSize: 12 },
    imageContainer: { alignItems: 'center', zIndex: 10, marginTop: 10 },
    image: { width: 250, height: 250, marginBottom: -40 },

    infoSection: {
        flex: 1,
        borderTopLeftRadius: 35,
        borderTopRightRadius: 35,
        paddingHorizontal: 20,
        paddingTop: 50,
        ...Platform.select({
            ios: { shadowColor: '#000', shadowOffset: { width: 0, height: -5 }, shadowOpacity: 0.1, shadowRadius: 10 },
            android: { elevation: 10 },
            web: { boxShadow: '0px -5px 10px rgba(0,0,0,0.05)' }
        })
    },

    voiceButton: { flexDirection: 'row', padding: 15, borderRadius: 30, alignItems: 'center', justifyContent: 'center', elevation: 3 },
    voiceButtonText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },
    description: { marginTop: 25, fontSize: 16, lineHeight: 24, textAlign: 'justify' },
    sectionTitle: { fontSize: 18, fontWeight: '900', marginTop: 30, marginBottom: 15, textTransform: 'uppercase' },

    statsGrid: {
        flexDirection: 'row',
        justifyContent: 'space-evenly',
        alignItems: 'center',
        marginTop: 20,
        borderRadius: 20,
        paddingVertical: 20,
        ...Platform.select({
            ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 3 },
            android: { elevation: 2 },
            web: { boxShadow: '0px 2px 3px rgba(0,0,0,0.05)' }
        })
    },

    statBox: { flex: 1, alignItems: 'center' },
    statLabel: { fontSize: 11, fontWeight: 'bold', marginTop: 5 },
    metricLine: { width: 1, height: '70%' },

    battleStats: {
        padding: 20,
        borderRadius: 20,
        ...Platform.select({
            ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 3 },
            android: { elevation: 2 },
            web: { boxShadow: '0px 2px 3px rgba(0,0,0,0.05)' }
        })
    },

    statRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
    statName: { width: 70, fontSize: 12, fontWeight: 'bold' },
    statValue: { width: 40, fontSize: 18, fontWeight: '900', marginTop: 8, textAlign: 'center' },
    barBackground: { flex: 1, height: 10, borderRadius: 5, overflow: 'hidden', marginLeft: 5 },
    barFill: { height: '100%', borderRadius: 5 },
});