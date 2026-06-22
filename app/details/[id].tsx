import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, ActivityIndicator, TouchableOpacity, Platform, ScrollView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import axios from 'axios';
import { usePokedexStore } from '../../src/store/usePokedexStore';
import { dicionario } from '../../src/utils/translations';

const retroFont = Platform.OS === 'ios' ? 'Courier' : 'monospace';

export default function PokemonDetails() {
    
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const { favorites, toggleFavorite, language, theme } = usePokedexStore();
    const [pokemon, setPokemon] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    const tTipos = dicionario[language].tipos;
    const isDark = theme === 'dark';
    const isFavorite = favorites.some((p) => p.id === Number(id));

    // Cores da tela Gameboy Clássica
    const gbScreenBg = isDark ? '#0F380F' : '#9BBC0F';
    const gbText = isDark ? '#9BBC0F' : '#0F380F';

    useEffect(() => {
        const fetchDetails = async () => {
            try {
                const res = await axios.get(`https://pokeapi.co/api/v2/pokemon/${id}`);
                setPokemon(res.data);
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };
        fetchDetails();
    }, [id]);

    if (loading || !pokemon) {
        return (
            <View style={[styles.container, styles.center]}>
                <ActivityIndicator size="large" color="#000" />
            </View>
        );
    }

    // Gera uma barra de progresso em caracteres (ex: █████░░░░░)
    const renderStatBar = (value: number) => {
        const blocks = Math.round(value / 15); // Normaliza para caber na tela
        const filled = '█'.repeat(Math.min(blocks, 10));
        const empty = '░'.repeat(Math.max(10 - blocks, 0));
        return filled + empty;
    };

    return (
        <SafeAreaView style={styles.container}>
            {/* SENSOR E LUZES SUPERIORES */}
            <View style={styles.hardwareTop}>
                <View style={styles.sensorOuter}>
                    <View style={styles.sensorInner}>
                        <View style={styles.glint} />
                    </View>
                </View>
                <View style={styles.miniLedGroup}>
                    <View style={[styles.miniLed, { backgroundColor: '#FF3B30' }]} />
                    <View style={[styles.miniLed, { backgroundColor: '#FFDE00' }]} />
                    <View style={[styles.miniLed, { backgroundColor: '#4CAD4C' }]} />
                </View>
            </View>

            {/* A TELA DO APARELHO */}
            <View style={styles.bezelWrapper}>
                <View style={styles.bezel}>
                    <View style={styles.bezelDots}>
                        <View style={styles.dot} /><View style={styles.dot} />
                    </View>

                    <View style={[styles.gbScreen, { backgroundColor: gbScreenBg }]}>
                        <ScrollView showsVerticalScrollIndicator={false}>

                            <View style={styles.gbHeader}>
                                <Text style={[styles.gbTextBold, { color: gbText }]}>No.{String(pokemon.id).padStart(3, '0')}</Text>
                                <Text style={[styles.gbTextBold, { color: gbText }]}>LVL.???</Text>
                            </View>

                            <View style={[styles.spriteBox, { borderColor: gbText }]}>
                                <Image
                                    source={{ uri: pokemon.sprites.front_default || pokemon.sprites.other['official-artwork'].front_default }}
                                    style={styles.sprite}
                                    resizeMode="contain"
                                />
                            </View>

                            <Text style={[styles.pokemonName, { color: gbText }]}>{pokemon.name.toUpperCase()}</Text>

                            <View style={styles.gbTypes}>
                                {pokemon.types.map((t: any, i: number) => (
                                    <Text key={i} style={[styles.gbTypeText, { color: gbText, borderColor: gbText }]}>
                                        [{tTipos[t.type.name as keyof typeof tTipos]?.toUpperCase() || t.type.name.toUpperCase()}]
                                    </Text>
                                ))}
                            </View>

                            <View style={[styles.divider, { borderBottomColor: gbText }]} />

                            <View style={styles.statsContainer}>
                                <Text style={[styles.statsTitle, { color: gbText }]}>-- BASE STATS --</Text>
                                {pokemon.stats.map((s: any, i: number) => (
                                    <View key={i} style={styles.statRow}>
                                        <Text style={[styles.statName, { color: gbText }]}>
                                            {s.stat.name.toUpperCase().substring(0, 4)}
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

            {/* CONTROLES FÍSICOS DA POKÉDEX */}
            <View style={styles.hardwareControls}>
                <TouchableOpacity style={styles.btnA} onPress={() => router.back()} activeOpacity={0.7}>
                    <Text style={styles.btnText}>B</Text>
                    <Text style={styles.btnLabel}>BACK</Text>
                </TouchableOpacity>

                <View style={styles.dpad}>
                    <View style={styles.dpadVertical} />
                    <View style={styles.dpadHorizontal} />
                    <View style={styles.dpadCenter} />
                </View>

                <TouchableOpacity
                    style={[styles.btnB, isFavorite && { backgroundColor: '#FF3B30' }]}
                    onPress={() => toggleFavorite({ id: pokemon.id, nome: pokemon.name, imagemDestaque: pokemon.sprites.other['official-artwork'].front_default })}
                    activeOpacity={0.7}
                >
                    <Text style={styles.btnText}>A</Text>
                    <Text style={styles.btnLabel}>FAV</Text>
                </TouchableOpacity>
            </View>

        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#DC0A2D' },
    center: { justifyContent: 'center', alignItems: 'center' },

    // Hardware Top
    hardwareTop: { flexDirection: 'row', padding: 20, gap: 15, borderBottomWidth: 4, borderColor: '#8B0000', marginBottom: 15 },
    sensorOuter: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#FFF', justifyContent: 'center', alignItems: 'center', borderWidth: 4, borderColor: '#000' },
    sensorInner: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#3B4CCA', borderWidth: 3, borderColor: '#000' },
    glint: { position: 'absolute', top: 5, left: 5, width: 10, height: 10, backgroundColor: '#FFF' },
    miniLedGroup: { flexDirection: 'row', gap: 8, marginTop: 5 },
    miniLed: { width: 14, height: 14, borderRadius: 7, borderWidth: 3, borderColor: '#000' },

    // Screen Bezel
    bezelWrapper: { flex: 1, paddingHorizontal: 20 },
    bezel: { flex: 1, backgroundColor: '#555', borderWidth: 4, borderColor: '#000', borderBottomLeftRadius: 40, padding: 15, shadowColor: '#000', shadowOffset: { width: 6, height: 6 }, shadowOpacity: 1, shadowRadius: 0 },
    bezelDots: { flexDirection: 'row', justifyContent: 'center', gap: 20, marginBottom: 10 },
    dot: { width: 6, height: 6, backgroundColor: '#333', borderRadius: 3 },

    // GameBoy Screen
    gbScreen: { flex: 1, borderWidth: 4, borderColor: '#000', padding: 15, borderTopWidth: 6, borderLeftWidth: 6 },
    gbHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
    gbTextBold: { fontFamily: retroFont, fontWeight: 'bold', fontSize: 14 },
    spriteBox: { height: 140, borderWidth: 3, borderStyle: 'dashed', justifyContent: 'center', alignItems: 'center', marginBottom: 15 },
    sprite: { width: 120, height: 120 },
    pokemonName: { fontFamily: retroFont, fontSize: 22, fontWeight: '900', textAlign: 'center', marginBottom: 10 },
    gbTypes: { flexDirection: 'row', justifyContent: 'center', gap: 10, marginBottom: 15 },
    gbTypeText: { fontFamily: retroFont, fontWeight: 'bold', fontSize: 12, borderWidth: 2, paddingHorizontal: 6, paddingVertical: 2 },
    divider: { borderBottomWidth: 3, borderStyle: 'dotted', marginVertical: 10 },

    // Stats
    statsContainer: { marginTop: 10 },
    statsTitle: { fontFamily: retroFont, fontWeight: 'bold', textAlign: 'center', marginBottom: 10 },
    statRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
    statName: { fontFamily: retroFont, width: 45, fontWeight: 'bold', fontSize: 12 },
    statValue: { fontFamily: retroFont, width: 30, fontWeight: 'bold', fontSize: 12 },
    statBar: { fontFamily: retroFont, fontSize: 10, letterSpacing: -1 },

    // Controls
    hardwareControls: { paddingHorizontal: 30, paddingVertical: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
    btnA: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: '#555', shadowColor: '#000', shadowOffset: { width: 4, height: 4 }, shadowOpacity: 1, shadowRadius: 0, marginTop: 20 },
    btnB: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: '#555', shadowColor: '#000', shadowOffset: { width: 4, height: 4 }, shadowOpacity: 1, shadowRadius: 0, marginBottom: 20 },
    btnText: { color: '#FFF', fontFamily: retroFont, fontWeight: 'bold', fontSize: 20 },
    btnLabel: { position: 'absolute', bottom: -20, right: -10, color: '#000', fontFamily: retroFont, fontWeight: 'bold', fontSize: 10 },

    // D-PAD Fake visual
    dpad: { width: 90, height: 90, justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
    dpadVertical: { position: 'absolute', width: 30, height: 90, backgroundColor: '#222', borderWidth: 4, borderColor: '#000', borderRadius: 4 },
    dpadHorizontal: { position: 'absolute', width: 90, height: 30, backgroundColor: '#222', borderWidth: 4, borderColor: '#000', borderRadius: 4 },
    dpadCenter: { position: 'absolute', width: 22, height: 22, backgroundColor: '#222' }, // Cobre as bordas cruzadas do meio
});