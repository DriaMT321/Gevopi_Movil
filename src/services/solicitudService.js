import api from './api';

// GET /api/solicitudes-ayuda
export const obtenerTodasSolicitudes = async () => {
  try {
    const response = await api.get('/solicitudes-ayuda');
    const data = response.data || [];

    return data.map((s) => ({
      id: s.id,
      descripcion: s.descripcion,
      fecha: s.fecha,
      latitud: parseFloat(s.latitud),
      longitud: parseFloat(s.longitud),
      nivelEmergencia: s.nivelEmergencia,
      tipo: s.tipoEmergencia,
      voluntarioId: s.voluntarioId?.toString(),
      voluntario: s.voluntario || 'Desconocido',
      estado: s.estado,
      // ❌ QUITAR: direccion: s.direccion,
    }));
  } catch (error) {
    console.error('Error obteniendo solicitudes:', error.response?.data || error.message);
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
      // ❌ QUITAR: direccion = null,
    } = payload;

    // ✅ MAPEAR NIVEL NUMÉRICO A TEXTO EN MAYÚSCULAS
    const mapNivelEmergencia = (nivel) => {
      const nivelNum = parseInt(nivel);
      if (nivelNum <= 2) return 'BAJO';
      if (nivelNum <= 3) return 'MEDIO';
      return 'ALTO';
    };

    const nivelTexto = mapNivelEmergencia(nivelEmergencia);

    const payloadToSend = {
      tipo_emergencia: tipo,
      descripcion,
      nivel_emergencia: nivelTexto,
      voluntario_id: parseInt(voluntarioId),
      latitud: parseFloat(latitud),
      longitud: parseFloat(longitud),
      // ❌ QUITAR: direccion,
    };

    console.log('📤 Payload enviado:', payloadToSend);

    const response = await api.post('/solicitudes-ayuda', payloadToSend);

    console.log('✅ Respuesta del servidor:', response.data);

    const s = response.data.data || response.data;

    return {
      id: s.id,
      descripcion: s.descripcion,
      fecha: s.created_at,
      latitud: parseFloat(s.latitud),
      longitud: parseFloat(s.longitud),
      nivelEmergencia: s.nivel_emergencia,
      tipo: s.tipo,
      voluntarioId: s.voluntario_id?.toString(),
      estado: s.estado,
      // ❌ QUITAR: direccion: s.direccion,
    };
  } catch (error) {
    console.error('❌ Error completo:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
    });
    throw error;
  }
};

// Actualizar estado de una solicitud
export const actualizarEstadoSolicitud = async (id, nuevoEstado) => {
  try {
    const response = await api.patch(`/solicitudes-ayuda/${id}/estado`, {
      estado: nuevoEstado,
    });
    return response.data;
  } catch (error) {
    console.error('Error actualizando estado:', error.response?.data || error.message);
    throw error;
  }
};