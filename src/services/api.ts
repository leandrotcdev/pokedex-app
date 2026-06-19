import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const api = axios.create({
    baseURL: 'https://pokeapi.co/api/v2/pokemon',
    timeout: 10000,
});

// Interceptor para adicionar o Token de Autenticação e tratar LGPD
api.interceptors.request.use(
    async (config) => {
        const token = await AsyncStorage.getItem('@auth_token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        // Header para auditoria de LGPD (exemplo)
        config.headers['X-Consent-Granted'] = 'true';
        return config;
    },
    (error) => Promise.reject(error)
);

// Interceptor para Monitoramento e Logs
api.interceptors.response.use(
    (response) => {
        // Normalização dos dados aqui, se necessário
        return response;
    },
    (error) => {
        // Log de monitoramento de falhas
        console.error(`[API ERROR] ${error.response?.status} - ${error.config?.url}`);

        // Tratamento de erro normalizado
        const mensagemPadrao = "Ocorreu um erro de conexão. Tente novamente.";
        return Promise.reject(error.response?.data?.message || mensagemPadrao);
    }
);