import graphqlApi from './apiNOSQL';

export const obtenerTodasSolicitudes = async () => {
  try {
    const query = `
      query {
          obtenerTodasSolicitudes {
              descripcion
              fecha
              id
              latitud
              longitud
              nivelEmergencia
              tipo
              voluntarioId
              estado
              ciVoluntariosAcudir
              fechaRespondida
          }
      }
    `;

    const response = await graphqlApi.post('', { query });

    if (response.data.errors) {
      throw new Error(response.data.errors[0].message);
    }

    return response.data.data.obtenerTodasSolicitudes;
  } catch (error) {
    console.warn('Error obteniendo solicitudes (servidor GraphQL no disponible):', error.message);
    return []; // Retorna array vacío si falla
  }
};
