import graphqlApi from './apiNOSQL';

export const crearSolicitudAyuda = async ({
  tipo,
  descripcion,
  nivelEmergencia,
  fecha,
  voluntarioId,
  latitud,
  longitud,
}) => {
  try {
    const query = `
    mutation {
      crearSolicitudAyuda(
        ciVoluntariosAcudir: 0
        descripcion: "${descripcion}"
        fecha: "${fecha}"
        nivelEmergencia: ${nivelEmergencia}
        tipo: "${tipo}"
        voluntarioId: "${voluntarioId}"
        latitud: ${latitud}
        longitud: ${longitud}
        estado: "Sin responder"
      ) {
        id
        descripcion
        fecha
        nivelEmergencia
        tipo
        voluntarioId
        latitud
        longitud
        estado
      }
    }
  `;

    const response = await graphqlApi.post('', { query });

    if (response.data.errors) {
      throw new Error(response.data.errors[0].message);
    }

    return response.data.data.crearSolicitudAyuda;
  } catch (error) {
    console.warn('Error creando solicitud (servidor GraphQL no disponible):', error.message);
    throw new Error('Servidor de emergencias no disponible. Intente más tarde.');
  }
};

export const actualizarSolicitudEnProgreso = async (id, ciArray) => {
  try {
    const query = `
      mutation {
        actualizarSolicitudEnProgreso(id: "${id}", nuevosCIs: ${JSON.stringify(ciArray)}) {
          id
          estado
          ciVoluntariosAcudir
        }
      }
    `;
  
    const response = await graphqlApi.post('', { query });
    if (response.data.errors) {
      throw new Error(response.data.errors[0].message);
    }
    return response.data.data.actualizarSolicitudEnProgreso;
  } catch (error) {
    console.warn('Error actualizando solicitud:', error.message);
    return null;
  }
};
  
  
export const marcarSolicitudRespondida = async (id) => {
  try {
    const query = `
      mutation {
        marcarSolicitudRespondida(id: "${id}") {
          id
          estado
          fechaRespondida
        }
      }
    `;
    const response = await graphqlApi.post('', { query });
    if (response.data.errors) {
      throw new Error(response.data.errors[0].message);
    }
    return response.data.data.marcarSolicitudRespondida;
  } catch (error) {
    console.warn('Error marcando solicitud:', error.message);
    return null;
  }
};

export const crearHistorialUbicacion = async (lat, lon, voluntarioId) => {
  try {
    const query = `
      mutation(
        $voluntarioId: ID!
        $lat: Float!
        $lon: Float!
      ) {
        crearHistorialUbicacion(
          voluntarioId: $voluntarioId
          lat: $lat
          lon: $lon
        ) {
          id
          lat
          lon
          fecha
          voluntarioId
        }
      }
    `;
  
    const variables = {
      voluntarioId: voluntarioId.toString(),
      lat: parseFloat(lat),
      lon: parseFloat(lon),
    };
  
    const response = await graphqlApi.post('', { query, variables });
    
    if (response.data.errors) {
      throw new Error(response.data.errors[0].message);
    }
    
    return response.data.data.crearHistorialUbicacion;
  } catch (err) {
    console.warn('Error en crearHistorialUbicacion (servidor no disponible):', err.message);
    return null; // Retorna null si falla, no bloquea la app
  }
};
