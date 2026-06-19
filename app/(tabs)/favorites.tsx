import React from 'react';
import { View, Text, FlatList, Image, TouchableOpacity, StyleSheet } from 'react-native';
import Head from 'expo-router/head';
import { usePokedexStore } from '../../src/store/usePokedexStore';

export default function TelaFavoritos() {
    const { favorites, toggleFavorite, theme } = usePokedexStore();
    const isDark = theme === 'dark';

    const cores = {
        bg: isDark ? '#121212' : '#F5F5F5',
        card: isDark ? '#1E1E1E' : '#FFFFFF',
        text: isDark ? '#FFFFFF' : '#333333',
        pokedexRed: '#CC0000',
    };

    const renderItem = ({ item }: any) => (
        <View style={[styles.card, { backgroundColor: cores.card }]}>
            <Image source={{ uri: item.imagem }} style={styles.image} />
            <View style={styles.info}>
                <Text style={[styles.name, { color: cores.text }]}>{item.nome}</Text>
                <Text style={styles.id}>#{item.id}</Text>
            </View>
            <TouchableOpacity
                style={styles.removeBtn}
                onPress={() => toggleFavorite(item)}
            >
                <Text style={styles.removeBtnText}>Remover</Text>
            </TouchableOpacity>
        </View>
    );

    return (
        <View style={[styles.container, { backgroundColor: cores.bg }]}>
            <Head>
                <title>Meus Favoritos | Pokédex App</title>
                <meta name="robots" content="noindex, nofollow" /> {/* Áreas autenticadas não devem ser indexadas por SEO */}
            </Head>

            <Text style={[styles.headerText, { color: cores.text }]}>Meus Pokémons Favoritos</Text>

            <FlatList
                data={favorites}
                keyExtractor={(item) => item.id.toString()}
                renderItem={renderItem}
                contentContainerStyle={styles.list}
                ListEmptyComponent={
                    <Text style={[styles.emptyText, { color: cores.text }]}>Você ainda não possui favoritos.</Text>
                }
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 16 },
    headerText: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, marginTop: 40 },
    list: { paddingBottom: 20 },
    card: { flexDirection: 'row', alignItems: 'center', padding: 16, marginBottom: 12, borderRadius: 12, elevation: 2 },
    image: { width: 60, height: 60, marginRight: 16 },
    info: { flex: 1 },
    name: { fontSize: 18, fontWeight: 'bold' },
    id: { fontSize: 14, opacity: 0.6 },
    removeBtn: { backgroundColor: '#CC0000', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 6 },
    removeBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 12 },
    emptyText: { textAlign: 'center', marginTop: 40, fontSize: 16, opacity: 0.7 }
});