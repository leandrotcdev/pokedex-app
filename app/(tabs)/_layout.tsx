import React from 'react';
import { Tabs } from 'expo-router';
import { Home, Heart } from 'lucide-react-native';
import { usePokedexStore } from '../../src/store/usePokedexStore';
import { Platform } from 'react-native';

const retroFont = Platform.OS === 'ios' ? 'Courier' : 'monospace';

export default function TabsLayout() {
  const { theme, language } = usePokedexStore();
  const isDark = theme === 'dark';

  const tabBg = isDark ? '#111111' : '#FFFFFF';
  const borderTop = isDark ? '#444444' : '#000000';
  const activeColor = '#DC0A2D';
  const inactiveColor = isDark ? '#888888' : '#AAAAAA';

  const labelLista = language === 'pt' ? '[ LISTA ]' : '[ LIST ]';
  const labelFavs = language === 'pt' ? '[ FAVS ]' : '[ FAVS ]';

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: tabBg,
          borderTopWidth: 5,
          borderColor: borderTop,
          height: 65,
          paddingBottom: 10,
          paddingTop: 10,
        },
        tabBarActiveTintColor: activeColor,
        tabBarInactiveTintColor: inactiveColor,
        tabBarLabelStyle: {
          fontFamily: retroFont,
          fontWeight: '900',
          fontSize: 11,
          marginTop: 4,
        },
      }}
    >
      <Tabs.Screen
        name="PokemonList"
        options={{
          title: labelLista,
          tabBarIcon: ({ color }) => <Home color={color} size={26} strokeWidth={2.5} />,
        }}
      />
      <Tabs.Screen
        name="Favorites"
        options={{
          title: labelFavs,
          tabBarIcon: ({ color }) => <Heart color={color} size={26} strokeWidth={2.5} />,
        }}
      />
    </Tabs>
  );
}