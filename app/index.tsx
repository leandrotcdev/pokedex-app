import React, { useCallback, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { usePokedexStore } from '../src/store/usePokedexStore';
import { dicionario } from '../src/utils/translations';

export default function LoginScreen() {

    const store = usePokedexStore();

    const login = store?.login;
    const theme = store?.theme || 'light';
    const toggleTheme = store?.toggleTheme;
    const language = store?.language || 'pt';
    const toggleLanguage = store?.toggleLanguage;

    const t = dicionario[language]?.login || dicionario['pt'].login;
    const isDark = theme === 'dark';

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [erro, setErro] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    // Cores Retro (Gameboy e Pokédex)
    const retroColors = {
        pokedexRed: '#DC0A2D',
        pokedexDarkRed: '#8B0000',
        black: '#000000',
        white: '#FFFFFF',
        // Tela clássica do GameBoy
        gbScreenBg: isDark ? '#0F380F' : '#9BBC0F',
        gbText: isDark ? '#9BBC0F' : '#0F380F',
        gbBorder: isDark ? '#306230' : '#8BAC0F',
    };

    // Lógica de Autenticação Blindada
    const handleLogin = useCallback(async () => {
        setErro(null);
        if (!email.trim() || !password.trim()) return setErro(t.erros.camposVazios);
        if (!/\S+@\S+\.\S+/.test(email)) return setErro(t.erros.emailInvalido);
        if (password.length < 6) return setErro(t.erros.senhaCurta);

        setLoading(true);
        try {
            await new Promise(resolve => setTimeout(resolve, 800));
            login(email.toLowerCase().trim());
        } catch (e) {
            setErro(t.erros.falhaLogin);
        } finally {
            setLoading(false);
        }
    }, [email, password, login, t]);

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: retroColors.pokedexRed }]}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <ScrollView contentContainerStyle={{ flexGrow: 1 }} bounces={false} showsVerticalScrollIndicator={false}>

                    {/* BOTÕES SELECT / START (Idioma e Tema) */}
                    <View style={styles.retroTopBar}>
                        <TouchableOpacity style={styles.retroBtnSmall} onPress={toggleLanguage} activeOpacity={0.8}>
                            <Text style={styles.retroBtnTextSmall}>{language === 'pt' ? 'SELECT: EN' : 'SELECT: PT'}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.retroBtnSmall} onPress={toggleTheme} activeOpacity={0.8}>
                            <Text style={styles.retroBtnTextSmall}>{isDark ? 'START: LIGHT' : 'START: DARK'}</Text>
                        </TouchableOpacity>
                    </View>

                    {/* CABEÇALHO POKÉDEX (Sensor e LEDs Retro) */}
                    <View style={styles.pokedexHeader}>
                        <View style={styles.sensorContainer}>
                            <View style={styles.mainSensorOuter}>
                                <View style={styles.mainSensorInner}>
                                    <View style={styles.sensorGlint} />
                                </View>
                            </View>
                            <View style={styles.ledRow}>
                                <View style={[styles.miniLed, { backgroundColor: '#FF3B30' }]} />
                                <View style={[styles.miniLed, { backgroundColor: '#FFDE00' }]} />
                                <View style={[styles.miniLed, { backgroundColor: '#4CAD4C' }]} />
                            </View>
                        </View>
                        <View style={styles.carcacaLines}>
                            <View style={styles.line} />
                            <View style={styles.line} />
                            <View style={styles.line} />
                        </View>
                    </View>

                    {/* TELA GAMEBOY (Formulário de Login) */}
                    <View style={styles.screenWrapper}>
                        <View style={styles.screenBezel}>
                            <View style={styles.screenHeader}>
                                <Text style={styles.batteryText}>▶ BATTERY</Text>
                            </View>

                            <View style={[styles.gbScreen, { backgroundColor: retroColors.gbScreenBg }]}>
                                <Text style={[styles.title, { color: retroColors.gbText }]}>
                                    {t.titulo.toUpperCase()}
                                </Text>
                                <Text style={[styles.subtitle, { color: retroColors.gbText }]}>
                                    {t.subtitulo}
                                </Text>

                                {erro && (
                                    <View style={[styles.errorBox, { borderColor: retroColors.gbText }]}>
                                        <Text style={[styles.errorText, { color: retroColors.gbText }]}>! {erro}</Text>
                                    </View>
                                )}

                                <View style={styles.formContainer}>
                                    <Text style={[styles.inputLabel, { color: retroColors.gbText }]}>{t.labelEmail}</Text>
                                    <TextInput
                                        style={[
                                            styles.retroInput,
                                            { color: retroColors.gbText, borderColor: retroColors.gbText, backgroundColor: retroColors.gbBorder }
                                        ]}
                                        placeholder={t.placeholderEmail}
                                        placeholderTextColor={isDark ? '#558855' : '#709030'}
                                        value={email}
                                        onChangeText={setEmail}
                                        keyboardType="email-address"
                                        autoCapitalize="none"
                                        autoCorrect={false}
                                    />

                                    <Text style={[styles.inputLabel, { color: retroColors.gbText }]}>{t.labelSenha}</Text>
                                    <TextInput
                                        style={[
                                            styles.retroInput,
                                            { color: retroColors.gbText, borderColor: retroColors.gbText, backgroundColor: retroColors.gbBorder }
                                        ]}
                                        placeholder="********"
                                        placeholderTextColor={isDark ? '#558855' : '#709030'}
                                        value={password}
                                        onChangeText={setPassword}
                                        secureTextEntry
                                    />

                                    <TouchableOpacity
                                        style={[styles.retroButton, { backgroundColor: retroColors.gbText }]}
                                        onPress={handleLogin}
                                        activeOpacity={0.8}
                                        disabled={loading}
                                    >
                                        {loading ? (
                                            <ActivityIndicator size="small" color={retroColors.gbScreenBg} />
                                        ) : (
                                            <Text style={[styles.retroButtonText, { color: retroColors.gbScreenBg }]}>
                                                [ {t.btnEntrar} ]
                                            </Text>
                                        )}
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </View>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const retroFont = Platform.OS === 'ios' ? 'Courier' : 'monospace';

const styles = StyleSheet.create({
    container: { flex: 1 },

    retroTopBar: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        paddingHorizontal: 20,
        paddingTop: 10,
        gap: 15,
    },
    retroBtnSmall: {
        backgroundColor: '#000',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
        borderWidth: 2,
        borderColor: '#555',
    },
    retroBtnTextSmall: {
        color: '#FFF',
        fontFamily: retroFont,
        fontWeight: 'bold',
        fontSize: 10,
    },

    pokedexHeader: {
        paddingHorizontal: 25,
        paddingTop: 20,
        paddingBottom: 30,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
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
        backgroundColor: '#FFF',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 4,
        borderColor: '#000',
    },
    mainSensorInner: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: '#3B4CCA',
        borderWidth: 3,
        borderColor: '#000',
        position: 'relative',
        overflow: 'hidden',
    },
    sensorGlint: {
        position: 'absolute',
        top: 6,
        left: 8,
        width: 14,
        height: 14,
        backgroundColor: '#FFF',
        borderRadius: 2, // Quadrado para parecer pixel
    },
    ledRow: {
        flexDirection: 'row',
        gap: 8,
        marginTop: 5,
    },
    miniLed: {
        width: 16,
        height: 16,
        borderRadius: 8,
        borderWidth: 3,
        borderColor: '#000',
    },
    carcacaLines: {
        gap: 6,
        marginTop: 10,
    },
    line: {
        width: 40,
        height: 4,
        backgroundColor: '#8B0000',
        borderRadius: 2,
    },

    // O "Console" GameBoy
    screenWrapper: {
        flex: 1,
        paddingHorizontal: 20,
        paddingBottom: 20,
    },
    screenBezel: {
        flex: 1,
        backgroundColor: '#555', // Plástico cinza escuro em volta da tela
        borderTopLeftRadius: 10,
        borderTopRightRadius: 10,
        borderBottomLeftRadius: 40,
        borderBottomRightRadius: 10,
        padding: 15,
        borderWidth: 4,
        borderColor: '#000',
        shadowColor: '#000',
        shadowOffset: { width: 6, height: 6 },
        shadowOpacity: 1,
        shadowRadius: 0,
        elevation: 10,
    },
    screenHeader: {
        flexDirection: 'row',
        marginBottom: 8,
    },
    batteryText: {
        color: '#FF3B30',
        fontFamily: retroFont,
        fontSize: 10,
        fontWeight: 'bold',
    },
    gbScreen: {
        flex: 1,
        borderWidth: 4,
        borderColor: '#000',
        padding: 15,
        borderTopWidth: 6,
        borderLeftWidth: 6,
    },
    welcomeSection: {
        marginBottom: 20,
    },
    title: {
        fontFamily: retroFont,
        fontSize: 22,
        fontWeight: 'bold',
        marginBottom: 10,
        textAlign: 'center',
    },
    subtitle: {
        fontFamily: retroFont,
        fontSize: 12,
        lineHeight: 18,
        textAlign: 'center',
        marginBottom: 20,
    },

    // Formulário
    errorBox: {
        borderWidth: 2,
        borderStyle: 'dashed',
        padding: 10,
        marginBottom: 15,
        alignItems: 'center',
    },
    errorText: {
        fontFamily: retroFont,
        fontSize: 12,
        fontWeight: 'bold',
    },
    formContainer: {
        flex: 1,
    },
    inputLabel: {
        fontFamily: retroFont,
        fontSize: 14,
        fontWeight: 'bold',
        marginBottom: 5,
    },
    retroInput: {
        fontFamily: retroFont,
        height: 50,
        borderWidth: 3,
        paddingHorizontal: 15,
        marginBottom: 20,
        fontSize: 16,
        fontWeight: 'bold',
    },
    retroButton: {
        height: 55,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 3,
        borderColor: '#000',
        marginTop: 10,
        // Efeito de botão pressionável
        shadowColor: '#000',
        shadowOffset: { width: 4, height: 4 },
        shadowOpacity: 1,
        shadowRadius: 0,
        elevation: 4,
    },
    retroButtonText: {
        fontFamily: retroFont,
        fontSize: 16,
        fontWeight: 'bold',
    },
});