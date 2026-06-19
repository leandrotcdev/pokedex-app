import React, { useEffect } from 'react';
import { View, LogBox } from 'react-native';
import { Stack, useRouter, useSegments, useRootNavigationState } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { usePokedexStore } from '../src/store/usePokedexStore';
import ToastFeedback from '../src/components/ToastFeedback';

// 1. POLYFILL DE SEGURANÇA (Manter no topo)
if (typeof globalThis.DOMException === 'undefined') {
  (globalThis as any).DOMException = class DOMException extends Error {
    constructor(message?: string, name?: string) {
      super(message);
      this.name = name || 'DOMException';
    }
  };
}

// 2. FILTROS DE ALERTAS
LogBox.ignoreLogs([
  'style props are deprecated',
  'props.pointerEvents is deprecated',
  'useNativeDriver is not supported'
]);

// 3. CLIENTE DO REACT QUERY (Instância fora do componente)
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 1000 * 60 * 5,
    },
  },
});

export default function RootLayout() {
  const { isAuthenticated } = usePokedexStore();
  const segments = useSegments();
  const router = useRouter();
  const rootNavigationState = useRootNavigationState();

  useEffect(() => {
    // A. Verifica se o navegador/sistema de rotas está pronto
    if (!rootNavigationState?.key) return;

    // B. Verifica onde o usuário está
    const inAuthGroup = segments[0] === '(tabs)';

    // C. Lógica de Redirecionamento com delay mínimo para garantir leitura do Storage
    const timer = setTimeout(() => {
      if (!isAuthenticated && inAuthGroup) {
        // Usuário não autenticado tentando acessar app -> Login
        router.replace('/');
      } else if (isAuthenticated && !inAuthGroup) {
        // Usuário autenticado tentando acessar Login -> App
        router.replace('/(tabs)/PokemonList');
      }
    }, 100); // Adicionado 100ms para permitir a hidratação do persist

    return () => clearTimeout(timer);
  }, [isAuthenticated, segments, rootNavigationState?.key]);

  return (
    <QueryClientProvider client={queryClient}>
      <View style={{ flex: 1 }}>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="details/[id]" />
        </Stack>

        <ToastFeedback />
      </View>
    </QueryClientProvider>
  );
}