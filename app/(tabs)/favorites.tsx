import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, FlatList, Image, TouchableOpacity, StyleSheet, Platform, Pressable, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Heart } from 'lucide-react-native';
import { usePokedexStore } from '../../src/store/usePokedexStore';
import { dicionario } from '../../src/utils/translations';

const retroFont = Platform.OS === 'ios' ? 'Courier' : 'monospace';

const coresTipos: Record<string, string> = {
    grass: '#78C850', fire: '#F08030', water: '#6890F0', bug: '#A8B820',
    normal: '#A8A878', poison: '#A040A0', electric: '#F8D030', ground: '#E0C068',
    fairy: '#EE99AC', fighting: '#C03028', psychic: '#F85888', rock: '#B8A038',
    ghost: '#705898', ice: '#98D8D8', dragon: '#7038F8', dark: '#705848', steel: '#B8B8D0',
};

const PokemonCard = React.memo(({ item, onPress, onToggleFavorite, tTipos, colors }: any) => {
    const corFundo = item.corFundo || (colors.bg === '#222' ? '#444' : '#E0E0E0');
    const tipos = item.tipos || [];
    return (
        <Pressable style={[styles.retroCard, { backgroundColor: corFundo }]} onPress={onPress}>
            <View style={styles.retroCardHeader}>
                <Text style={styles.retroId}>No.{item.id.toString().padStart(3, '0')}</Text>
                <Pressable style={styles.retroHeartBtn} onPress={(e) => { e.stopPropagation(); onToggleFavorite(); }}>
                    <Heart size={18} color="#000" fill="#DC0A2D" />
                </Pressable>
            </View>
            <View style={styles.retroImageContainer}>
                <Image source={{ uri: item.imagemDestaque }} style={styles.pokemonImage} resizeMode="contain" />
            </View>
            <View style={[styles.retroCardInfo, { backgroundColor: colors.cardBox }]}>
                <Text style={[styles.retroName, { color: colors.text }]} numberOfLines={1}>{item.nome.toUpperCase()}</Text>
                {tipos.length > 0 && (
                    <View style={styles.typesContainer}>
                        {tipos.map((tipo: string, i: number) => (
                            <View key={i} style={[styles.retroTypePill, { backgroundColor: coresTipos[tipo] || '#777' }]}>
                                <Text style={styles.retroTypeText}>{tTipos[tipo as keyof typeof tTipos] || tipo.toUpperCase()}</Text>
                            </View>
                        ))}
                    </View>
                )}
            </View>
        </Pressable>
    );
});

export default function Favorites() {
    const router = useRouter();
    const { favorites, toggleFavorite, theme, toggleTheme, language, toggleLanguage } = usePokedexStore();
    const [search, setSearch] = useState('');

    const isDark = theme === 'dark';
    const colors = { bg: isDark ? '#222' : '#F0F0F0', text: isDark ? '#FFF' : '#000', cardBox: isDark ? '#333' : '#FFF' };

    const tTipos = dicionario[language].tipos;
    const textoTitulo = language === 'pt' ? 'FAVORITOS' : 'FAVORITES';
    const textoBusca = language === 'pt' ? 'BUSCAR FAVORITO...' : 'SEARCH FAVORITE...';
    const textoVazio = language === 'pt' ? 'NENHUM FAVORITO NA COLEÇÃO.' : 'NO FAVORITES IN COLLECTION.';

    const favoritesExibidos = useMemo(() => {
        let listaFiltrada = favorites;
        if (search.trim() !== '') {
            const termo = search.toLowerCase().trim();
            listaFiltrada = listaFiltrada.filter(pokemon => pokemon.nome.toLowerCase().includes(termo) || pokemon.id.toString().includes(termo));
        }
        return JSON.parse(JSON.stringify(listaFiltrada));
    }, [search, favorites]);

    const renderItem = useCallback(({ item }: { item: any }) => (
        <PokemonCard item={item} onPress={() => router.push(`/details/${item.id}`)} onToggleFavorite={() => toggleFavorite(item)} tTipos={tTipos} colors={colors} />
    ), [router, toggleFavorite, tTipos, colors]);

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
            {/* BOTÕES GLOBAIS DE CONFIGURAÇÃO */}
            <View style={styles.retroTopBar}>
                <TouchableOpacity style={styles.retroBtnSmall} onPress={toggleLanguage} activeOpacity={0.8}>
                    <Text style={styles.retroBtnTextSmall}>{language === 'pt' ? 'SELECT: PT' : 'SELECT: EN'}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.retroBtnSmall} onPress={toggleTheme} activeOpacity={0.8}>
                    <Text style={styles.retroBtnTextSmall}>{isDark ? 'START: DARK' : 'START: LITE'}</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.retroHeader}>
                <View style={styles.headerTop}>
                    <Text style={styles.retroTitle}>{textoTitulo}</Text>
                    <Heart size={28} color="#FFF" fill="#FFF" />
                </View>
                <TextInput
                    style={styles.retroInput}
                    value={search}
                    onChangeText={setSearch}
                    placeholder={`> ${textoBusca}`}
                    placeholderTextColor="#666"
                    autoCapitalize="none"
                    autoCorrect={false}
                />
            </View>

            <FlatList
                data={JSON.parse(JSON.stringify(favoritesExibidos))}
                keyExtractor={(item) => String(item.id)}
                renderItem={renderItem}
                numColumns={2}
                columnWrapperStyle={styles.row}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={
                    <View style={styles.retroEmptyBox}>
                        <Text style={[styles.retroEmptyText, { color: colors.text }]}>! {textoVazio}</Text>
                    </View>
                }
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    retroTopBar: { flexDirection: 'row', justifyContent: 'flex-end', paddingHorizontal: 20, paddingTop: 10, paddingBottom: 10, gap: 15, backgroundColor: '#DC0A2D' },
    retroBtnSmall: { backgroundColor: '#000', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4, borderWidth: 2, borderColor: '#555' },
    retroBtnTextSmall: { color: '#FFF', fontFamily: retroFont, fontWeight: 'bold', fontSize: 10 },
    retroHeader: { backgroundColor: '#DC0A2D', paddingHorizontal: 20, paddingBottom: 20, borderBottomWidth: 6, borderColor: '#000', marginBottom: 20 },
    headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
    retroTitle: { color: '#FFF', fontFamily: retroFont, fontSize: 28, fontWeight: '900', textShadowColor: '#000', textShadowOffset: { width: 3, height: 3 }, textShadowRadius: 0 },
    retroInput: { fontFamily: retroFont, backgroundColor: '#FFF', borderWidth: 4, borderColor: '#000', paddingHorizontal: 15, height: 50, fontSize: 14, fontWeight: 'bold', color: '#000', shadowColor: '#000', shadowOffset: { width: 4, height: 4 }, shadowOpacity: 1, shadowRadius: 0 },
    listContent: { paddingHorizontal: 15, paddingBottom: 20 },
    row: { justifyContent: 'space-between', marginBottom: 20 },
    retroCard: { flex: 1, marginHorizontal: 6, borderWidth: 4, borderColor: '#000', shadowColor: '#000', shadowOffset: { width: 6, height: 6 }, shadowOpacity: 1, shadowRadius: 0 },
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
    retroEmptyBox: { margin: 20, padding: 25, borderWidth: 4, borderColor: '#000', borderStyle: 'dashed', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.05)' },
    retroEmptyText: { fontFamily: retroFont, fontSize: 14, fontWeight: 'bold', textAlign: 'center', lineHeight: 22 },
});