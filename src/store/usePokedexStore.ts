import { create } from 'zustand';
import { persist, createJSONStorage, devtools } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

export interface MinimalPokemon {
    id: number;
    nome: string;
    imagemDestaque: string;
}

interface PokedexState {
    // AUTENTICAÇÃO
    isAuthenticated: boolean;
    userEmail: string | null;
    login: (email: string) => void;
    logout: () => void;

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

                toggleTheme: () => set((state) => ({
                    theme: state.theme === 'light' ? 'dark' : 'light'
                })),

                toggleFavorite: (pokemon) => {
                    const currentFavorites = get().favorites;
                    const isAlreadyFavorite = currentFavorites.some((p) => p.id === pokemon.id);

                    if (isAlreadyFavorite) {
                        set({
                            favorites: currentFavorites.filter((p) => p.id !== pokemon.id),
                            toastMessage: `${pokemon.nome} removido dos favoritos!`,
                            visibleToast: true
                        });
                    } else {
                        set({
                            favorites: [...currentFavorites, pokemon],
                            toastMessage: `${pokemon.nome} adicionado aos favoritos!`,
                            visibleToast: true
                        });
                    }
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
                partialize: (state) => ({ isAuthenticated: state.isAuthenticated, userEmail: state.userEmail, theme: state.theme, favorites: state.favorites, history: state.history }),
            }
        ),
        {
            name: 'PokedexStore',
            enabled: Platform.OS === 'web'
        }
    )
);