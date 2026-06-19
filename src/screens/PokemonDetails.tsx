import React, { useEffect, useState } from 'react';
import { View, Text, Image, ScrollView, StyleSheet, TouchableOpacity, AccessibilityInfo } from 'react-native';
import * as Speech from 'expo-speech';
import { usePokedexStore } from '../store/usePokedexStore';
import { Pokemon } from '../types/pokemon';

const mockPokemon: Pokemon = {
    id: 25,
    nome: "Pikachu",
    tipo: ["Elétrico"],
    descricao: "Quando vários destes Pokémon se reúnem, sua energia elétrica pode causar tempestades de raios.",
    peso: "6 kg",
    altura: "0.4 m",
    habilidades: { ataque: 55, defesa: 40, velocidade: 90, hp: 35 },
    imagemDestaque: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/25.png"
};

export default function PokemonDetails() {
    const { favorites, toggleFavorite, addToHistory, theme } = usePokedexStore();
    const [isLoading, setIsLoading] = useState(true);

    const isFavorite = favorites.some((p) => p.id === mockPokemon.id);
    const isDark = theme === 'dark';

    useEffect(() => {
        // Simula carregamento para o Skeleton Loading
        setTimeout(() => {
            setIsLoading(false);
            addToHistory(mockPokemon);
            announceScreenLoad();
        }, 1000);
    }, []);

    const announceScreenLoad = () => {
        AccessibilityInfo.announceForAccessibility(`Detalhes do Pokémon ${mockPokemon.nome} carregados.`);
    };

    const falarDescricaoPokedex = () => {
        Speech.speak(`${mockPokemon.nome}. Pokémon do tipo ${mockPokemon.tipo.join(' e ')}. ${mockPokemon.descricao}`, {
            language: 'pt-BR',
            pitch: 0.9, // Ajuste para soar um pouco mais robótico/Pokédex
            rate: 0.9,
        });
    };

    const cores = {
        bg: isDark ? '#121212' : '#F5F5F5',
        text: isDark ? '#FFFFFF' : '#333333',
        card: isDark ? '#1E1E1E' : '#FFFFFF',
        pokedexRed: '#CC0000',
        pokedexBlue: '#3B4CCA',
        pokedexYellow: '#FFDE00',
    };

    if (isLoading) {
        return (
            <View style={[styles.container, { backgroundColor: cores.bg }]}>
                <Text style={{ color: cores.text }}>Carregando Skeleton...</Text>
            </View>
        );
    }

    return (
        <ScrollView style={[styles.container, { backgroundColor: cores.bg }]} testID="pokemon-details-scroll">
            {/* Breadcrumbs e Botão Voltar */}
            <View style={styles.header}>
                <TouchableOpacity accessibilityRole="button" accessibilityLabel="Voltar para a lista">
                    <Text style={[styles.backButton, { color: cores.pokedexBlue }]}>← Voltar</Text>
                </TouchableOpacity>
                <Text style={[styles.breadcrumb, { color: cores.text }]}>Início / Pokédex / {mockPokemon.nome}</Text>
            </View>

            {/* Imagem em Destaque */}
            <View style={[styles.imageContainer, { backgroundColor: cores.card }]}>
                <Image
                    source={{ uri: mockPokemon.imagemDestaque }}
                    style={styles.image}
                    accessible={true}
                    accessibilityLabel={`Imagem do Pokémon ${mockPokemon.nome}`}
                    resizeMode="contain"
                />
            </View>

            {/* Cabeçalho de Informações */}
            <View style={styles.infoSection}>
                <View style={styles.titleRow}>
                    <Text style={[styles.name, { color: cores.text }]} accessibilityRole="header">
                        {mockPokemon.nome} <Text style={styles.idText}>#{mockPokemon.id}</Text>
                    </Text>

                    <TouchableOpacity
                        onPress={() => toggleFavorite(mockPokemon)}
                        accessible={true}
                        accessibilityRole="button"
                        accessibilityLabel={isFavorite ? "Remover dos favoritos" : "Adicionar aos favoritos"}
                    >
                        <Text style={{ fontSize: 24, color: isFavorite ? cores.pokedexRed : '#888' }}>
                            {isFavorite ? '♥' : '♡'}
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>

            <View style={styles.typesRow}>
                {mockPokemon.tipo.map((t) => (
                    <View key={t} style={[styles.typeBadge, { backgroundColor: cores.pokedexYellow }]}>
                        <Text style={styles.typeText}>{t}</Text>
                    </View>
                ))}
            </View>

            {/* Botão de Voz do Pokédex */}
            <TouchableOpacity
                style={[styles.voiceButton, { backgroundColor: cores.pokedexRed }]}
                onPress={falarDescricaoPokedex}
                accessibilityRole="button"
                accessibilityLabel="Ouvir descrição na voz do Pokédex"
            >
                <Text style={styles.voiceButtonText}>🔊 Ouvir Pokédex</Text>
            </TouchableOpacity>

            <Text style={[styles.description, { color: cores.text }]}>{mockPokemon.descricao}</Text>

            {/* Estatísticas Físicas */}
            <View style={styles.statsGrid}>
                <View style={[styles.statBox, { backgroundColor: cores.card }]}>
                    <Text style={styles.statLabel}>Peso</Text>
                    <Text style={[styles.statValue, { color: cores.text }]}>{mockPokemon.peso}</Text>
                </View>
                <View style={[styles.statBox, { backgroundColor: cores.card }]}>
                    <Text style={styles.statLabel}>Altura</Text>
                    <Text style={[styles.statValue, { color: cores.text }]}>{mockPokemon.altura}</Text>
                </View>
            </View>

            {/* Status de Batalha */}
            <Text style={[styles.sectionTitle, { color: cores.text }]}>Estatísticas Base</Text>
            <View style={[styles.battleStats, { backgroundColor: cores.card }]}>
                <Text style={{ color: cores.text }}>HP: {mockPokemon.habilidades.hp}</Text>
                <Text style={{ color: cores.text }}>Ataque: {mockPokemon.habilidades.ataque}</Text>
                <Text style={{ color: cores.text }}>Defesa: {mockPokemon.habilidades.defesa}</Text>
                <Text style={{ color: cores.text }}>Velocidade: {mockPokemon.habilidades.velocidade}</Text>
            </View>
        </ScrollView >
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { flexDirection: 'row', padding: 20, alignItems: 'center' },
    backButton: { fontSize: 16, fontWeight: 'bold', marginRight: 10 },
    breadcrumb: { fontSize: 14, opacity: 0.7 },
    imageContainer: { alignItems: 'center', padding: 20, marginHorizontal: 20, borderRadius: 20, elevation: 5 },
    image: { width: 200, height: 200 },
    infoSection: { padding: 20 },
    titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    name: { fontSize: 32, fontWeight: 'bold' /* fontFamily: 'PoetsenOne' */ },
    idText: { fontSize: 20, opacity: 0.5 },
    typesRow: { flexDirection: 'row', marginTop: 10 },
    typeBadge: { paddingHorizontal: 15, paddingVertical: 5, borderRadius: 20, marginRight: 10 },
    typeText: { fontWeight: 'bold', color: '#333' },
    voiceButton: { marginTop: 20, padding: 15, borderRadius: 10, alignItems: 'center' },
    voiceButtonText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
    description: { marginTop: 20, fontSize: 16, lineHeight: 24, opacity: 0.9 },
    statsGrid: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 20 },
    statBox: { flex: 1, padding: 15, borderRadius: 10, marginHorizontal: 5, alignItems: 'center', elevation: 2 },
    statLabel: { fontSize: 12, opacity: 0.6, marginBottom: 5 },
    statValue: { fontSize: 18, fontWeight: 'bold' },
    sectionTitle: { fontSize: 20, fontWeight: 'bold', marginTop: 30, marginBottom: 15 },
    battleStats: { padding: 20, borderRadius: 10, elevation: 2 },
});