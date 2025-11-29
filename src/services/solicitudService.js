// services/solicitudService.js
import axios from 'axios';

const API_BASE_URL = 'http://192.168.0.13:8000/api';
const SOLICITUDES_URL = `${API_BASE_URL}/solicitudes-ayuda`;

// GET /api/solicitudes-ayuda
export const obtenerTodasSolicitudes = async () => {
  const response = await axios.get(SOLICITUDES_URL);
  const data = response.data;

  return data.map((s) => ({
    id: s.id,
    descripcion: s.descripcion,
    fecha: s.fecha,                     // viene como ISO desde el controller
    latitud: s.latitud,
    longitud: s.longitud,
    nivelEmergencia: s.nivelEmergencia, // el controller ya lo manda en camelCase
    tipo: s.tipoEmergencia,
    voluntarioId: s.voluntarioId?.toString(),
    estado: s.estado,
    // estos campos hoy no los manda Laravel; quedan como undefined y no pasa nada
    ciVoluntariosAcudir: s.ciVoluntariosAcudir,
    fechaRespondida: s.fechaRespondida,
  }));
};

// POST /api/solicitudes-ayuda
// services/solicitudService.js
export const crearSolicitudAyuda = async (payload) => {
  const {
    tipo,
    descripcion,
    nivelEmergencia,
    voluntarioId,
    latitud,
    longitud,
    direccion = null,
  } = payload;

  const response = await axios.post(SOLICITUDES_URL, {
    tipo_emergencia: tipo,        // 👈 clave correcta para Laravel
    descripcion,
    nivel_emergencia: nivelEmergencia,
    voluntario_id: voluntarioId,
    latitud,
    longitud,
    direccion,
  });

  const s = response.data;

  return {
    id: s.id,
    descripcion: s.descripcion,
    fecha: s.created_at,
    latitud: s.latitud,
    longitud: s.longitud,
    nivelEmergencia: s.nivel_emergencia,
    tipo: s.tipo,                 // viene de la columna "tipo"
    voluntarioId: s.voluntario_id?.toString(),
    estado: s.estado,
    ciVoluntariosAcudir: s.ci_voluntarios_acudir,
    fechaRespondida: s.fecha_respondida,
  };
};
