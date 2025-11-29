// services/solicitudService.js
import api from './api';

// GET /api/solicitudes-ayuda
export const obtenerTodasSolicitudes = async () => {
  try {
    const response = await api.get('/solicitudes-ayuda');
    const data = response.data.data || response.data || [];

    return data.map((s) => ({
      id: s.id,
      descripcion: s.descripcion,
      fecha: s.fecha,
      latitud: s.latitud,
      longitud: s.longitud,
      nivelEmergencia: s.nivelEmergencia || s.nivel_emergencia,
      tipo: s.tipoEmergencia || s.tipo_emergencia || s.tipo,
      voluntarioId: s.voluntarioId?.toString() || s.voluntario_id?.toString(),
      estado: s.estado,
      ciVoluntariosAcudir: s.ciVoluntariosAcudir,
      fechaRespondida: s.fechaRespondida,
    }));
  } catch (error) {
    console.warn('Error obteniendo solicitudes:', error.message);
    return [];
  }
};

// POST /api/solicitudes-ayuda
export const crearSolicitudAyuda = async (payload) => {
  try {
    const {
      tipo,
      descripcion,
      nivelEmergencia,
      voluntarioId,
      latitud,
      longitud,
      direccion = null,
    } = payload;

    const response = await api.post('/solicitudes-ayuda', {
      tipo_emergencia: tipo,
      descripcion,
      nivel_emergencia: nivelEmergencia,
      voluntario_id: voluntarioId,
      latitud,
      longitud,
      direccion,
    });

    const s = response.data.data || response.data;

    return {
      id: s.id,
      descripcion: s.descripcion,
      fecha: s.created_at,
      latitud: s.latitud,
      longitud: s.longitud,
      nivelEmergencia: s.nivel_emergencia,
      tipo: s.tipo,
      voluntarioId: s.voluntario_id?.toString(),
      estado: s.estado,
      ciVoluntariosAcudir: s.ci_voluntarios_acudir,
      fechaRespondida: s.fecha_respondida,
    };
  } catch (error) {
    console.warn('Error creando solicitud de ayuda:', error.message);
    return null;
  }
};
