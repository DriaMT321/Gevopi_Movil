import api from './api';
import { getToken } from './authService';

export const getVoluntarios = async () => {
    const token = getToken();
    const response = await api.get('/voluntario/voluntarios', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  };
  
  export const getVoluntarioByCi = async (ci) => {
    const voluntarios = await getVoluntarios();
    return voluntarios.find(v => v.ci === ci);
  };

export const getVoluntarioByUsuarioId = async (id) => {
    const token = getToken();
    const response = await api.get(`/voluntario/voluntarios/${id}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  };