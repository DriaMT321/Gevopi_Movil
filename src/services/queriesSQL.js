import api from './api';
import { getToken } from './authService';

// Función auxiliar para llamadas REST con manejo de errores
const safeApiCall = async (endpoint) => {
  try {
    const token = getToken();
    const response = await api.get(endpoint, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data.data || response.data || [];
  } catch (error) {
    console.warn(`API call failed for ${endpoint}:`, error.message);
    return [];
  }
};

export const obtenerReportePorVoluntarioId = async (id) => {
  try {
    const token = getToken();
    const response = await api.get(`/voluntarios/${id}/reportes`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data.data || [];
  } catch (error) {
    console.warn('Error obteniendo reportes:', error.message);
    return [];
  }
};

export const GET_EVALUACIONES = {
  // Placeholder - las evaluaciones se cargarán via REST cuando esté disponible
};

export const obtenerCursosPorVoluntarioId = async (id) => {
  return await safeApiCall(`/voluntarios/${id}/cursos`);
};
