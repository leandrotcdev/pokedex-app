import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, ActivityIndicator, TouchableOpacity, Platform, ScrollView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import axios from 'axios';
import * as Speech from 'expo-speech';
import { usePokedexStore } from '../../src/store/usePokedexStore';
import { dicionario } from '../../src/utils/translations';

const retroFont = Platform.OS === 'ios' ? 'Courier' : 'monospace';

const statAbreviacoes: Record<string, string> = {
    hp: 'HP', attack: 'ATK', defense: 'DEF',
    'special-attack': 'SATK', 'special-defense': 'SDEF', speed: 'SPD'
};

const coresTipos: Record<string, string> = {
    grass: '#78C850', fire: '#F08030', water: '#6890F0', bug: '#A8B820',
    normal: '#A8A878', poison: '#A040A0', electric: '#F8D030', ground: '#E0C068',
    fairy: '#EE99AC', fighting: '#C03028', psychic: '#F85888', rock: '#B8A038',
    ghost: '#705898', ice: '#98D8D8', dragon: '#7038F8', dark: '#705848', steel: '#B8B8D0',
};

export default function PokemonDetails() {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const { favorites, toggleFavorite, language, toggleLanguage, theme, toggleTheme } = usePokedexStore();

    const [pokemon, setPokemon] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [isSpeaking, setIsSpeaking] = useState(false);

    const tTipos = dicionario[language].tipos;
    const isDark = theme === 'dark';
    const isFavorite = favorites.some((p) => p.id === Number(id));

    const gbScreenBg = isDark ? '#0F380F' : '#9BBC0F';
    const gbText = isDark ? '#9BBC0F' : '#0F380F';

    const labelPeso = language === 'pt' ? 'PESO' : 'WGT';
    const labelAlt = language === 'pt' ? 'ALTURA' : 'HGT';
    const btnAudio = language === 'pt' ? 'OUVIR POKÉDEX' : 'PLAY POKÉDEX';

    useEffect(() => {
        const fetchDetails = async () => {
            try {
                const res = await axios.get(`https://pokeapi.co/api/v2/pokemon/${id}`);
                setPokemon(res.data);
            } catch (error) { console.error(error); } finally { setLoading(false); }
        };
        fetchDetails();
    }, [id]);

    const lerPokedex = () => {
        if (!pokemon) return;

        if (isSpeaking) {
            Speech.stop();
            setIsSpeaking(false);
            return;
        }

        const tiposTraduzidos = pokemon.types
            .map((t: any) => tTipos[t.type.name as keyof typeof tTipos] || t.type.name)
            .join(language === 'pt' ? ' e ' : ' and ');

        const peso = pokemon.weight / 10;
        const altura = pokemon.height / 10;

        const texto = language === 'pt'
            ? `${pokemon.name}. Pokémon do tipo ${tiposTraduzidos}. Peso: ${peso} quilos. Altura: ${altura} metros.`
            : `${pokemon.name}. ${tiposTraduzidos} type Pokémon. Weight: ${peso} kilograms. Height: ${altura} meters.`;

        setIsSpeaking(true);
        Speech.speak(texto, {
            language: language === 'pt' ? 'pt-BR' : 'en-US',
            pitch: 1.1,
            rate: 0.9,
            onDone: () => setIsSpeaking(false),
            onStopped: () => setIsSpeaking(false),
        });
    };

    // Desliga o áudio automaticamente se o usuário sair da tela
    useEffect(() => {
        return () => { Speech.stop(); };
    }, []);

    if (loading || !pokemon) {
        return (
            <View style={[styles.container, styles.center]}>
                <ActivityIndicator size="large" color="#000" />
            </View>
        );
    }

    // Gera a barra de progresso retro com caracteres
    const renderStatBar = (value: number) => {
        const blocks = Math.round(value / 15);
        const filled = '█'.repeat(Math.min(blocks, 10));
        const empty = '░'.repeat(Math.max(10 - blocks, 0));
        return filled + empty;
    };

    // Captura a arte oficial com fallback seguro contra valores nulos
    const imagemPokemon = pokemon.sprites.other?.['official-artwork']?.front_default || pokemon.sprites.front_default;
    const primeiroTipo = pokemon.types[0]?.type?.name || 'normal';
    const corCardSalvo = coresTipos[primeiroTipo] || '#A8A878';

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.retroTopBar}>
                <TouchableOpacity style={styles.retroBtnSmall} onPress={toggleLanguage} activeOpacity={0.8}>
                    <Text style={styles.retroBtnTextSmall}>{language === 'pt' ? 'SELECT: ´PT' : 'SELECT: EN'}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.retroBtnSmall} onPress={toggleTheme} activeOpacity={0.8}>
                    <Text style={styles.retroBtnTextSmall}>{isDark ? 'START: DARK' : 'START: LIGHT'}</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.hardwareTop}>
                <View style={styles.sensorOuter}>
                    <View style={styles.sensorInner}><View style={styles.glint} /></View>
                </View>
                <View style={styles.miniLedGroup}>
                    <View style={[styles.miniLed, { backgroundColor: '#FF3B30' }]} />
                    <View style={[styles.miniLed, { backgroundColor: '#FFDE00' }]} />
                    <View style={[styles.miniLed, { backgroundColor: '#4CAD4C' }]} />
                </View>
            </View>

            <View style={styles.bezelWrapper}>
                <View style={styles.bezel}>
                    <View style={styles.bezelDots}>
                        <View style={styles.dot} /><View style={styles.dot} />
                    </View>

                    <View style={[styles.gbScreen, { backgroundColor: gbScreenBg }]}>
                        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 10 }}>

                            <View style={styles.gbHeader}>
                                <Text style={[styles.gbTextBold, { color: gbText }]}>No.{String(pokemon.id).padStart(3, '0')}</Text>
                                <Text style={[styles.gbTextBold, { color: gbText }]}>HP {pokemon.stats[0].base_stat}</Text>
                            </View>

                            <View style={[styles.spriteBox, { borderColor: gbText }]}>
                                <Image source={{ uri: imagemPokemon }} style={styles.sprite} resizeMode="contain" />
                            </View>

                            <Text style={[styles.pokemonName, { color: gbText }]}>{pokemon.name.toUpperCase()}</Text>

                            <View style={styles.gbTypes}>
                                {pokemon.types.map((t: any, i: number) => (
                                    <Text key={i} style={[styles.gbTypeText, { color: gbText, borderColor: gbText }]}>
                                        [{tTipos[t.type.name as keyof typeof tTipos]?.toUpperCase() || t.type.name.toUpperCase()}]
                                    </Text>
                                ))}
                            </View>

                            <View style={[styles.infoRow, { borderColor: gbText }]}>
                                <Text style={[styles.infoText, { color: gbText }]}>{labelPeso}: {pokemon.weight / 10}kg</Text>
                                <Text style={[styles.infoText, { color: gbText }]}>{labelAlt}: {pokemon.height / 10}m</Text>
                            </View>

                            <View style={[styles.divider, { borderBottomColor: gbText }]} />

                            <View style={styles.statsContainer}>
                                <Text style={[styles.statsTitle, { color: gbText }]}>-- STATUS BASE --</Text>
                                {pokemon.stats.map((s: any, i: number) => (
                                    <View key={i} style={styles.statRow}>
                                        <Text style={[styles.statName, { color: gbText }]}>
                                            {statAbreviacoes[s.stat.name] || s.stat.name.toUpperCase().substring(0, 4)}
                                        </Text>
                                        <Text style={[styles.statValue, { color: gbText }]}>
                                            {String(s.base_stat).padStart(3, '0')}
                                        </Text>
                                        <Text style={[styles.statBar, { color: gbText }]}>
                                            {renderStatBar(s.base_stat)}
                                        </Text>
                                    </View>
                                ))}
                            </View>
                        </ScrollView>
                    </View>
                </View>
            </View>

            <View style={styles.hardwareControls}>
                <View style={styles.dpadContainer}>
                    <View style={styles.dpad}>
                        <View style={styles.dpadVertical} />
                        <View style={styles.dpadHorizontal} />
                        <View style={styles.dpadCenter} />
                    </View>
                </View>

                <View style={styles.centerControls}>
                    <TouchableOpacity style={styles.pillButtonWrapper} onPress={lerPokedex} activeOpacity={0.7}>
                        <View style={[styles.pillButton, isSpeaking && { backgroundColor: '#FF3B30' }]} />
                        <Text style={styles.pillLabel}>{isSpeaking ? 'STOP' : btnAudio}</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.actionButtons}>
                    <TouchableOpacity style={styles.btnA} onPress={() => router.back()} activeOpacity={0.7}>
                        <Text style={styles.btnText}>B</Text>
                        <Text style={styles.btnLabel}>BACK</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.btnB, isFavorite && { backgroundColor: '#FF3B30' }]}
                        onPress={() => toggleFavorite({
                            id: pokemon.id,
                            nome: pokemon.name,
                            imagemDestaque: imagemPokemon,
                            corFundo: corCardSalvo,
                            tipos: pokemon.types.map((t: any) => t.type.name)
                        })}
                        activeOpacity={0.7}
                    >
                        <Text style={styles.btnText}>A</Text>
                        <Text style={styles.btnLabel}>FAV</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#DC0A2D' },
    center: { justifyContent: 'center', alignItems: 'center' },
    retroTopBar: { flexDirection: 'row', justifyContent: 'flex-end', paddingHorizontal: 20, paddingTop: 10, gap: 15 },
    retroBtnSmall: { backgroundColor: '#000', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4, borderWidth: 2, borderColor: '#555' },
    retroBtnTextSmall: { color: '#FFF', fontFamily: retroFont, fontWeight: 'bold', fontSize: 10 },
    hardwareTop: { flexDirection: 'row', paddingHorizontal: 20, paddingBottom: 15, gap: 15, borderBottomWidth: 4, borderColor: '#8B0000', marginBottom: 15 },
    sensorOuter: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#FFF', justifyContent: 'center', alignItems: 'center', borderWidth: 4, borderColor: '#000' },
    sensorInner: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#3B4CCA', borderWidth: 3, borderColor: '#000' },
    glint: { position: 'absolute', top: 5, left: 5, width: 10, height: 10, backgroundColor: '#FFF' },
    miniLedGroup: { flexDirection: 'row', gap: 8, marginTop: 5 },
    miniLed: { width: 14, height: 14, borderRadius: 7, borderWidth: 3, borderColor: '#000' },
    bezelWrapper: { flex: 1, paddingHorizontal: 20 },
    bezel: { flex: 1, backgroundColor: '#555', borderWidth: 4, borderColor: '#000', borderBottomLeftRadius: 40, padding: 15, shadowColor: '#000', shadowOffset: { width: 6, height: 6 }, shadowOpacity: 1, shadowRadius: 0 },
    bezelDots: { flexDirection: 'row', justifyContent: 'center', gap: 20, marginBottom: 10 },
    dot: { width: 6, height: 6, backgroundColor: '#333', borderRadius: 3 },
    gbScreen: { flex: 1, borderWidth: 4, borderColor: '#000', padding: 15, borderTopWidth: 6, borderLeftWidth: 6 },
    gbHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
    gbTextBold: { fontFamily: retroFont, fontWeight: 'bold', fontSize: 14 },
    spriteBox: { height: 150, borderWidth: 3, borderStyle: 'dashed', justifyContent: 'center', alignItems: 'center', marginBottom: 15 },
    sprite: { width: 130, height: 130 },
    pokemonName: { fontFamily: retroFont, fontSize: 24, fontWeight: '900', textAlign: 'center', marginBottom: 10 },
    gbTypes: { flexDirection: 'row', justifyContent: 'center', gap: 10, marginBottom: 10 },
    gbTypeText: { fontFamily: retroFont, fontWeight: 'bold', fontSize: 12, borderWidth: 2, paddingHorizontal: 6, paddingVertical: 2 },
    infoRow: { flexDirection: 'row', justifyContent: 'space-evenly', borderTopWidth: 2, borderBottomWidth: 2, borderStyle: 'dotted', paddingVertical: 6, marginBottom: 5 },
    infoText: { fontFamily: retroFont, fontWeight: 'bold', fontSize: 12 },
    divider: { borderBottomWidth: 3, borderStyle: 'dotted', marginVertical: 10 },
    statsContainer: { marginTop: 5 },
    statsTitle: { fontFamily: retroFont, fontWeight: 'bold', textAlign: 'center', marginBottom: 10 },
    statRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
    statName: { fontFamily: retroFont, width: 45, fontWeight: 'bold', fontSize: 12 },
    statValue: { fontFamily: retroFont, width: 30, fontWeight: 'bold', fontSize: 12 },
    statBar: { fontFamily: retroFont, fontSize: 10, letterSpacing: -1 },
    hardwareControls: { paddingHorizontal: 20, paddingVertical: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', height: 140 },
    dpadContainer: { flex: 1, justifyContent: 'flex-end', paddingBottom: 10 },
    dpad: { width: 80, height: 80, justifyContent: 'center', alignItems: 'center' },
    dpadVertical: { position: 'absolute', width: 26, height: 80, backgroundColor: '#222', borderWidth: 4, borderColor: '#000', borderRadius: 4 },
    dpadHorizontal: { position: 'absolute', width: 80, height: 26, backgroundColor: '#222', borderWidth: 4, borderColor: '#000', borderRadius: 4 },
    dpadCenter: { position: 'absolute', width: 18, height: 18, backgroundColor: '#222' },
    centerControls: { flex: 1, alignItems: 'center', justifyContent: 'flex-end', paddingBottom: 5 },
    pillButtonWrapper: { alignItems: 'center', transform: [{ rotate: '-20deg' }] },
    pillButton: { width: 50, height: 14, backgroundColor: '#222', borderRadius: 10, borderWidth: 3, borderColor: '#000', shadowColor: '#000', shadowOffset: { width: 2, height: 2 }, shadowOpacity: 1, shadowRadius: 0 },
    pillLabel: { fontFamily: retroFont, color: '#000', fontSize: 10, fontWeight: '900', marginTop: 5 },
    actionButtons: { flex: 1.2, flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'flex-end', gap: 15, paddingBottom: 25 },
    btnA: { width: 45, height: 45, borderRadius: 25, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: '#555', shadowColor: '#000', shadowOffset: { width: 4, height: 4 }, shadowOpacity: 1, shadowRadius: 0, marginTop: 25 },
    btnB: { width: 45, height: 45, borderRadius: 25, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: '#555', shadowColor: '#000', shadowOffset: { width: 4, height: 4 }, shadowOpacity: 1, shadowRadius: 0, marginBottom: 20 },
    btnText: { color: '#FFF', fontFamily: retroFont, fontWeight: 'bold', fontSize: 18 },
    btnLabel: { position: 'absolute', bottom: -20, right: -5, color: '#000', fontFamily: retroFont, fontWeight: '900', fontSize: 10 },
});