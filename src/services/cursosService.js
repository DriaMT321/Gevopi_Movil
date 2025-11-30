import api from './api';
import { getToken } from './authService';

/**
 * Obtener todos los cursos asignados a un usuario (id_usuario)
 */
export const getCursosByVoluntario = async (idUsuario) => {
  const token = getToken();
  const response = await api.get(`/voluntarios/${idUsuario}/cursos`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data.data || response.data;
};

/**
 * Obtener todas las capacitaciones disponibles
 */
export const getCapacitaciones = async () => {
  const token = getToken();
  const response = await api.get('/capacitaciones', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data.data || response.data;
};

/**
 * Obtener una capacitación específica con sus cursos
 */
export const getCapacitacion = async (id) => {
  const token = getToken();
  const response = await api.get(`/capacitaciones/${id}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data.data || response.data;
};

/**
 * Asignar un curso a un voluntario (usuario)
 */
export const asignarCursoAVoluntario = async (idUsuario, idCurso) => {
  const token = getToken();
  const response = await api.post(
    '/voluntarios/asignar-curso',
    {
      id_usuario: idUsuario,
      id_curso: idCurso,
    },
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
  return response.data;
};

export const cambiarEstadoEtapa = async (idEtapa, idUsuario) => {
  const token = getToken();
  console.log('TOKEN PARA PATCH /etapas:', token);

  const response = await api.patch(
    `/etapas/${idEtapa}/estado`,
    { id_usuario: idUsuario },
    {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
      },
    }
  );

  return response;
};

