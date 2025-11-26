import axios from 'axios';
import { Platform } from 'react-native';

// Configuración de URLs según la plataforma
const getBaseURL = () => {
  if (Platform.OS === 'web') {
    // En web, intenta usar localhost si está disponible
    // Si tu backend está en otro servidor, ajusta esta URL
    return 'http://localhost:8000/api';
  }
  // Para dispositivos móviles, usa la IP de la red local
  return 'http://192.168.0.2:8000/api';
};

const api = axios.create({
  baseURL: getBaseURL(),
  timeout: 10000, // Aumentado a 10 segundos
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para debugging
api.interceptors.request.use(
  (config) => {
    console.log(`🔵 API Request: ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`);
    return config;
  },
  (error) => {
    console.error('❌ Request Error:', error);
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => {
    console.log(`✅ API Response: ${response.status} ${response.config.url}`);
    return response;
  },
  (error) => {
    if (error.code === 'ERR_NETWORK') {
      console.error('❌ Network Error: No se pudo conectar al servidor');
      console.error('   Verifica que el backend esté corriendo en:', getBaseURL());
    } else if (error.code === 'ECONNABORTED') {
      console.error('❌ Timeout: La petición tardó demasiado');
    }
    return Promise.reject(error);
  }
);

export default api;
