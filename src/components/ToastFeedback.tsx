import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text } from 'react-native';
import { usePokedexStore } from '../store/usePokedexStore';

export default function ToastFeedback() {

    const { toastMessage, visibleToast, dismissToast, theme } = usePokedexStore();

    const opacityAnim = useRef(new Animated.Value(0)).current;

    const isDark = theme === 'dark';

    useEffect(() => {
        if (visibleToast && toastMessage) {
            Animated.timing(opacityAnim, {
                toValue: 1,
                duration: 300,
                useNativeDriver: true, // Melhora a performance delegando a animação para a UI nativa
            }).start();

            const timer = setTimeout(() => {
                // Animação de saída
                Animated.timing(opacityAnim, {
                    toValue: 0,
                    duration: 250,
                    useNativeDriver: true,
                }).start(() => {
                    dismissToast();
                });
            }, 3000);

            return () => clearTimeout(timer);
        }
    }, [visibleToast, toastMessage]);

    if (!visibleToast || !toastMessage) return null;

    const stylesColors = {
        bg: isDark ? '#333333' : '#222222',
        text: '#FFFFFF',
        // Borda amarela para adição e borda vermelha para remoção
        border: toastMessage.includes('adicionado') ? '#FFDE00' : '#CC0000'
    };

    return (
        <Animated.View
            style={[
                styles.toastContainer,
                {
                    backgroundColor: stylesColors.bg,
                    opacity: opacityAnim,
                    borderLeftColor: stylesColors.border
                }
            ]}
            // Propriedades de Acessibilidade
            accessible={true}
            accessibilityLiveRegion="polite" // Avisa o leitor de tela para ler a mensagem sem interromper o usuário
            accessibilityLabel={`Notificação: ${toastMessage}`}
        >
            <Text style={[styles.toastText, { color: stylesColors.text }]}>
                {toastMessage}
            </Text>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    toastContainer: {
        position: 'absolute',
        bottom: 90, // Posição calculada para ficar acima da barra de navegação das Tabs
        left: 20,
        right: 20,
        paddingVertical: 16,
        paddingHorizontal: 20,
        borderRadius: 8,
        borderLeftWidth: 5,
        flexDirection: 'row',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
        zIndex: 9999,
    },
    toastText: {
        fontSize: 16,
        fontWeight: '600',
    },
});