import api from './api';
import { getToken } from './authService';

export const cambiarEstadoEtapa = async (id) => {
    try {
        const token = getToken();
        const response = await api.patch(`/progreso/${id}/estado`, {}, {
            headers: { Authorization: `Bearer ${token}` },
        });

        if (response.data.success) {
            return response.data.data;
        }
        throw new Error(response.data.message || 'Error al cambiar estado');
    } catch (error) {
        console.error('Error al cambiar estado de etapa:', error);
        throw error;
    }
};
