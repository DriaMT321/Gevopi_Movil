import api from './api';
import { getToken } from './authService';

export const getUsuarios = async () => {
  const token = getToken();
  const response = await api.get('/usuarios', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};

export const getUsuario = async (id) => {
  const token = getToken();
  const response = await api.get(`/usuarios/${id}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};
