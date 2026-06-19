import React from 'react';
import { Tabs } from 'expo-router';
import { Home, Heart } from 'lucide-react-native';
import { usePokedexStore } from '../../src/store/usePokedexStore';
import { Platform } from 'react-native';

export default function TabsLayout() {
    const { theme } = usePokedexStore();
    const isDark = theme === 'dark';

    const cores = {
        bg: isDark ? '#1E1E1E' : '#FFFFFF',
        active: '#CC0000',
        inactive: isDark ? '#888888' : '#AAAAAA',
        border: isDark ? '#333333' : '#EAEAEA'
    };

    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                tabBarStyle: {
                    backgroundColor: cores.bg,
                    borderTopColor: cores.border,
                    height: 65,
                    paddingBottom: 10,
                    paddingTop: 5,
                    elevation: 8,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: -2 },
                    shadowOpacity: 0.1,
                    shadowRadius: 4,
                    ...Platform.select({
                        web: { boxShadow: '0px -2px 8px rgba(0,0,0,0.05)' }
                    })
                },
                tabBarActiveTintColor: cores.active,
                tabBarInactiveTintColor: cores.inactive,
                tabBarLabelStyle: { fontSize: 12, fontWeight: 'bold' }
            }}
        >
            <Tabs.Screen
                name="PokemonList"
                options={{
                    title: 'Pokédex',
                    tabBarLabel: 'Início',
                    tabBarIcon: ({ color, size }) => <Home size={size} color={color} />,
                }}
            />

            <Tabs.Screen
                name="favorites"
                options={{
                    title: 'Meus Favoritos',
                    tabBarLabel: 'Favoritos',
                    tabBarIcon: ({ color, size }) => <Heart size={size} color={color} />,
                }}
            />
        </Tabs>
    );
}