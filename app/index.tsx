import React, { useCallback, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, Alert, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { usePokedexStore } from '../src/store/usePokedexStore';
import { Mail, Lock, LogIn } from 'lucide-react-native';

export default function LoginScreen() {
    const { login, theme } = usePokedexStore();
    const isDark = theme === 'dark';

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [erro, setErro] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const cores = {
        pokedexRed: '#DC0A2D',
        pokedexBlue: '#3B4CCA',
        pokedexYellow: '#FFDE00',
        pokedexGreen: '#4CAD4C',
        bg: isDark ? '#121212' : '#FAFAFA',
        card: isDark ? '#1E1E1E' : '#FFFFFF',
        text: isDark ? '#FFFFFF' : '#333333',
        subtext: isDark ? '#AAA' : '#666',
        inputBg: isDark ? '#2A2A2A' : '#F5F5F5',
        border: isDark ? '#444' : '#E0E0E0'
    };

    const handleLogin = useCallback(async () => {
        setErro(null);

        if (!email.trim() || !password.trim()) {
            setErro('Por favor, preencha todos os campos.');
            return;
        }

        const emailRegex = /\S+@\S+\.\S+/;
        if (!emailRegex.test(email)) {
            setErro('Insira um e-mail válido.');
            return;
        }

        setLoading(true);

        try {
            // Simulando autenticação
            await new Promise(resolve => setTimeout(resolve, 800));

            // O estado será atualizado e o _layout.tsx (RootLayout) 
            // fará o redirect automaticamente via useEffect
            login(email.toLowerCase().trim());
        } catch (e) {
            setErro('Erro ao realizar login. Tente novamente.');
        } finally {
            setLoading(false);
        }
    }, [email, password, login]);

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: cores.pokedexRed }]}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <ScrollView
                    contentContainerStyle={{ flexGrow: 1 }}
                    bounces={false}
                    showsVerticalScrollIndicator={false}
                >

                    <View style={styles.pokedexHeader}>
                        <View style={styles.sensorContainer}>
                            <View style={styles.mainSensorOuter}>
                                <View style={[styles.mainSensorInner, { backgroundColor: cores.pokedexBlue }]}>
                                    <View style={styles.sensorGlint} />
                                </View>
                            </View>

                            <View style={styles.ledRow}>
                                <View style={[styles.miniLed, { backgroundColor: '#FF3B30' }]} />
                                <View style={[styles.miniLed, { backgroundColor: cores.pokedexYellow }]} />
                                <View style={[styles.miniLed, { backgroundColor: cores.pokedexGreen }]} />
                            </View>
                        </View>
                    </View>

                    <View style={[styles.loginSheet, { backgroundColor: cores.bg }]}>

                        <View style={styles.welcomeSection}>
                            <Text style={[styles.title, { color: cores.text }]}>Acessar Pokédex</Text>
                            <Text style={[styles.subtitle, { color: cores.subtext }]}>
                                Faça login para gerenciar seus Pokémon favoritos, consultar dados de combate e sincronizar seu histórico.
                            </Text>
                        </View>

                        {erro && (
                            <View style={styles.errorContainer}>
                                <Text style={styles.errorText}>{erro}</Text>
                            </View>
                        )}

                        <View style={styles.formContainer}>

                            <Text style={[styles.inputLabel, { color: cores.text }]}>E-MAIL</Text>
                            <View style={[styles.inputWrapper, { backgroundColor: cores.inputBg, borderColor: cores.border }]}>
                                <Mail size={20} color={isDark ? '#888' : '#666'} style={styles.inputIcon} />
                                <TextInput
                                    style={[styles.input, { color: cores.text }]}
                                    placeholder="treinador@pokemon.com"
                                    placeholderTextColor={isDark ? '#666' : '#999'}
                                    value={email}
                                    onChangeText={setEmail}
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                    autoCorrect={false}
                                    accessible={true}
                                    accessibilityLabel="Campo de entrada para e-mail"
                                />
                            </View>

                            <Text style={[styles.inputLabel, { color: cores.text }]}>SENHA DE ACESSO</Text>
                            <View style={[styles.inputWrapper, { backgroundColor: cores.inputBg, borderColor: cores.border }]}>
                                <Lock size={20} color={isDark ? '#888' : '#666'} style={styles.inputIcon} />
                                <TextInput
                                    style={[styles.input, { color: cores.text }]}
                                    placeholder="••••••••"
                                    placeholderTextColor={isDark ? '#666' : '#999'}
                                    value={password}
                                    onChangeText={setPassword}
                                    secureTextEntry
                                    autoCapitalize="none"
                                    autoCorrect={false}
                                    accessible={true}
                                    accessibilityLabel="Campo de entrada para senha"
                                />
                            </View>

                            <TouchableOpacity
                                style={[styles.button, { backgroundColor: cores.pokedexRed }]}
                                onPress={handleLogin}
                                activeOpacity={0.8}
                                disabled={loading}
                                accessible={true}
                                accessibilityRole="button"
                                accessibilityLabel="Botão para entrar no aplicativo"
                            >
                                {loading ? (
                                    <ActivityIndicator size="small" color="#FFF" />
                                ) : (
                                    <>
                                        <LogIn size={20} color="#FFF" style={{ marginRight: 8 }} />
                                        <Text style={styles.buttonText}>AUTENTICAR TREINADOR</Text>
                                    </>
                                )}
                            </TouchableOpacity>

                        </View>

                    </View>

                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },

    pokedexHeader: {
        height: 140,
        justifyContent: 'center',
        paddingHorizontal: 25,
    },
    sensorContainer: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 15,
    },
    mainSensorOuter: {
        width: 70,
        height: 70,
        borderRadius: 35,
        backgroundColor: '#FFFFFF',
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
    },
    mainSensorInner: {
        width: 56,
        height: 56,
        borderRadius: 28,
        borderWidth: 3,
        borderColor: '#1D2C5E',
        overflow: 'hidden',
        position: 'relative',
    },
    sensorGlint: {
        position: 'absolute',
        top: 6,
        left: 8,
        width: 16,
        height: 10,
        borderRadius: 5,
        backgroundColor: 'rgba(255,255,255,0.6)',
        transform: [{ rotate: '-30deg' }],
    },
    ledRow: {
        flexDirection: 'row',
        gap: 8,
        marginTop: 5,
    },
    miniLed: {
        width: 14,
        height: 14,
        borderRadius: 7,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.2)',
    },

    loginSheet: {
        flex: 1,
        borderTopLeftRadius: 35,
        borderTopRightRadius: 35,
        paddingHorizontal: 25,
        paddingTop: 40,
        elevation: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -10 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
    },
    welcomeSection: {
        marginBottom: 30,
    },
    title: {
        fontSize: 28,
        fontWeight: '900',
        marginBottom: 10,
        letterSpacing: 0.3,
    },
    subtitle: {
        fontSize: 14,
        lineHeight: 22,
        opacity: 0.9,
    },

    errorContainer: {
        backgroundColor: '#FDE8E8',
        borderWidth: 1,
        borderColor: '#E11D48',
        padding: 12,
        borderRadius: 12,
        marginBottom: 20,
    },
    errorText: {
        color: '#9F1239',
        fontSize: 14,
        fontWeight: 'bold',
        textAlign: 'center',
    },

    formContainer: {
        flex: 1,
    },
    inputLabel: {
        fontSize: 12,
        fontWeight: '900',
        marginBottom: 8,
        letterSpacing: 0.5,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        height: 55,
        borderRadius: 15,
        borderWidth: 1,
        paddingHorizontal: 15,
        marginBottom: 22,
    },
    inputIcon: {
        marginRight: 12,
    },
    input: {
        flex: 1,
        fontSize: 16,
        height: '100%',
    },

    button: {
        flexDirection: 'row',
        height: 55,
        borderRadius: 30,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 10,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 5,
        ...Platform.select({
            web: { boxShadow: '0px 4px 10px rgba(220,10,45,0.25)' }
        })
    },
    buttonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '900',
        letterSpacing: 0.5,
    },
});