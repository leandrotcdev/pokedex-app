import { create } from 'zustand';
import { persist, createJSONStorage, devtools } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { dicionario } from '../utils/translations';

export interface MinimalPokemon {
    id: number;
    nome: string;
    imagemDestaque: string;
    corFundo?: string;
    tipos?: string[];
}

interface PokedexState {
    // AUTENTICAÇÃO
    isAuthenticated: boolean;
    userEmail: string | null;
    login: (email: string) => void;
    logout: () => void;

    // IDIOMA
    language: 'pt' | 'en';
    toggleLanguage: () => void;

    // TEMA
    theme: 'light' | 'dark';
    toggleTheme: () => void;

    // FAVORITOS
    favorites: MinimalPokemon[];
    toggleFavorite: (pokemon: MinimalPokemon) => void;

    // HISTÓRICO
    history: MinimalPokemon[];
    addToHistory: (pokemon: MinimalPokemon) => void;

    // FEEDBACK VISUAL
    toastMessage: string | null;
    visibleToast: boolean;
    dismissToast: () => void;
}

export const usePokedexStore = create<PokedexState>()(
    devtools(
        persist(
            (set, get) => ({
                // --- Estados Iniciais ---
                isAuthenticated: false,
                userEmail: null,
                theme: 'light',
                language: 'pt',
                favorites: [],
                history: [],
                toastMessage: null,
                visibleToast: false,

                // --- Ações ---
                login: (email: string) => set({
                    isAuthenticated: true,
                    userEmail: email,
                }),

                logout: () => set({
                    isAuthenticated: false,
                    userEmail: null,
                    favorites: [],
                    history: []
                }),

                toggleTheme: () => set((state) => ({ theme: state.theme === 'light' ? 'dark' : 'light' })),
                toggleLanguage: () => set((state) => ({ language: state.language === 'pt' ? 'en' : 'pt' })),

                toggleFavorite: (pokemon) => {
                    const favorites = get().favorites;
                    const currentLang = get().language;
                    const t = dicionario[currentLang].store;

                    const isFav = favorites.some((p) => p.id === pokemon.id);

                    set({
                        favorites: isFav ? favorites.filter((p) => p.id !== pokemon.id) : [...favorites, pokemon],
                        toastMessage: isFav
                            ? `${pokemon.nome} ${t.removido}`
                            : `${pokemon.nome} ${t.salvo}`,
                        visibleToast: true
                    });
                },

                addToHistory: (pokemon) => {
                    const currentHistory = get().history;
                    const filteredHistory = currentHistory.filter((p) => p.id !== pokemon.id);
                    set({
                        history: [pokemon, ...filteredHistory].slice(0, 20)
                    });
                },

                dismissToast: () => set({ visibleToast: false, toastMessage: null }),
            }),
            {
                name: 'pokedex-storage',
                storage: createJSONStorage(() => AsyncStorage),
                // theme e language estão no partialize para salvar no celular
                partialize: (state) => ({
                    theme: state.theme,
                    language: state.language,
                    favorites: state.favorites
                }),
            }
        ),
        { name: 'PokedexStore', enabled: Platform.OS === 'web' }
    )
);