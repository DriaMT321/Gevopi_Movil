import client from './apiSQL';
import { gql } from '@apollo/client';

export const obtenerReportePorVoluntarioId = async (id) => {
  const { data } = await client.query({
    query: gql`
      query {
        reportesVoluntarios(historialId: ${id}) {
          estadoGeneral
          resumenFisico
          resumenEmocional
          recomendaciones
          observaciones
          fechaGenerado
          necesidades {
            tipo
            descripcion
          }
          capacitaciones {
            nombre
            descripcion
          }
        }
      }
    `,
  });

  return data.reportesVoluntarios;
};

export const GET_EVALUACIONES = gql`
  query GetEvaluaciones($historialId: Int!) {
    evaluacionesVoluntarios(historialId: $historialId) {
      id
      fecha
      respuestas {
        id
        respuestaTexto
        textoPregunta
        pregunta {
          id
          texto
          tipo
        }
      }
      test {
        id
        nombre
        descripcion
        categoria
        preguntas {
          id
          texto
          tipo
        }
      }
    }
  }
`;

export const obtenerCursosPorVoluntarioId = async (id) => {
  const { data } = await client.query({
    query: gql`
      query ObtenerCursosVoluntario($id: Int!) {
        obtenerCursosVoluntario(id: $id) {
          id
          nombre
          descripcion
          etapas {
            id
            nombre
            orden
            estado
            fechaInicio
            fechaFinalizacion
          }
        }
      }
    `,
    variables: { id },
  });

  return data.obtenerCursosVoluntario;
};

