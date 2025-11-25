import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { ApolloProvider } from '@apollo/client';
import client from './src/services/apiSQL'; // cliente Apollo configurado

// Screens
import LoginScreen from './src/screens/LoginScreen';
import PerfilScreen from './src/screens/PerfilScreen';
import EvaluacionesScreen from './src/screens/EvaluacionesScreen';
import HistorialScreen from './src/screens/HistorialScreen';
import NecesidadesCapacitacionesScreen from './src/screens/NecesidadesCapacitacionesScreen';
import SolicitudesScreen from './src/screens/SolicitudesScreen';
import DetalleSolicitudScreen from './src/screens/DetalleSolicitudScreen';
import ResultadoEvaluacionesScreen from './src/screens/ResultadoEvaluaciones';
import CursosScreen from './src/screens/CursosScreen';
import DetalleCursosScreen from './src/screens/DetalleCursosScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ApolloProvider client={client}>
        <NavigationContainer>
          <Stack.Navigator initialRouteName="Login" screenOptions={{ headerShown: false }}>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Perfil" component={PerfilScreen} />
            <Stack.Screen name="Evaluaciones" component={EvaluacionesScreen} />
            <Stack.Screen name="Historial" component={HistorialScreen} />
            <Stack.Screen name="NecesidadesCapacitaciones" component={NecesidadesCapacitacionesScreen} />
            <Stack.Screen name="ResultadoEvaluaciones" component={ResultadoEvaluacionesScreen} />
            <Stack.Screen name="Solicitudes" component={SolicitudesScreen} options={{ title: 'Solicitudes de Ayuda' }} />
            <Stack.Screen name="DetalleSolicitud" component={DetalleSolicitudScreen} options={{ title: 'Detalle de la Solicitud de Ayuda' }} />
            <Stack.Screen name="Cursos" component={CursosScreen}  />
            <Stack.Screen name="DetalleCursos" component={DetalleCursosScreen}/>
          </Stack.Navigator>
          <StatusBar style="auto" />
        </NavigationContainer>
      </ApolloProvider>
    </GestureHandlerRootView>
  );
}
