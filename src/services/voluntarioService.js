import api from "./api";
import { getToken } from "./authService";

// Obtener TODOS los usuarios (porque no tienes tabla voluntario)
export const getVoluntarios = async () => {
  const token = getToken();

  const response = await api.get("/usuarios", {
    headers: { Authorization: `Bearer ${token}` }
  });

  return response.data;
};

// Buscar voluntario por CI
export const getVoluntarioByCi = async (ci) => {
  const token = getToken();

  try {
    const response = await api.get(`/usuarios/ci/${ci}`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    return response.data;
  } catch (error) {
    console.log("ERROR getVoluntarioByCi:", error);
    return null;
  }
};

// Buscar voluntario por ID (lo necesitas en PerfilScreen)
export const getVoluntarioByUsuarioId = async (id) => {
  const token = getToken();

  const response = await api.get(`/usuarios/${id}`, {
    headers: { Authorization: `Bearer ${token}` }
  });

  return response.data;
};
