import client from './apiSQL';
import { gql } from '@apollo/client';

const CAMBIAR_ESTADO_ETAPA = gql`
    mutation CambiarEstadoEtapa($id: ID!) {
        cambiarEstadoEtapa(id: $id)
    }
`;

export const cambiarEstadoEtapa = async (id) => {
    try {
        const { data } = await client.mutate({
            mutation: CAMBIAR_ESTADO_ETAPA,
            variables: { id },
        });

        return data.cambiarEstadoEtapa;
    } catch (error) {
        console.error('Error al cambiar estado de etapa:', error);
        throw error;
    }
};
