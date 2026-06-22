import React, { useEffect } from 'react';
import { View, LogBox } from 'react-native';
import { Stack, useRouter, useRootNavigationState, usePathname } from 'expo-router';
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
      structuralSharing: false, // ESSA LINHA É OBRIGATÓRIA PARA O ANDROID NÃO CRASHAR
    },
  },
});

export default function RootLayout() {
  const { isAuthenticated } = usePokedexStore();
  const pathname = usePathname(); // Captura o caminho exato atual (ex: "/" ou "/details/25")
  const router = useRouter();
  const rootNavigationState = useRootNavigationState();

  // MOTOR DE PROTEÇÃO DE ROTAS BLINDADO
  useEffect(() => {
    // Só age quando o sistema de navegação nativo do Expo estiver 100% pronto
    if (!rootNavigationState?.key) return;

    // Se a rota for exatamente "/", o usuário está na tela de Login
    const isLoginPage = pathname === '/';

    const timer = setTimeout(() => {
      if (!isAuthenticated && !isLoginPage) {
        // Se NÃO está logado e tentou ir para QUALQUER tela interna -> Redireciona para o Login
        router.replace('/');
      } else if (isAuthenticated && isLoginPage) {
        // Se JÁ está logado e caiu na tela de Login -> Pula direto para a Pokédex
        router.replace('/(tabs)/PokemonList');
      }
    }, 150); // 150ms seguros para o Zustand hidratar o banco local

    return () => clearTimeout(timer);
  }, [isAuthenticated, pathname, rootNavigationState?.key]);

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