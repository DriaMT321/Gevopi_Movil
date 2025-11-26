import api from "./api";

export const enviarConsulta = async (voluntarioId, mensaje) => {
  return await api.post('/consultas', {
    voluntario_id: voluntarioId,
    mensaje,
  });
};




