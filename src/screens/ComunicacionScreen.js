import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import colors from '../themes/colors'; // si tienes tema
import { getLoggedCi } from '../services/authService';
import { getVoluntarioByCi } from '../services/voluntarioService';
import api from '../services/api';

export default function ComunicacionScreen() {

  const [mensaje, setMensaje] = useState('');

  const enviarConsulta = async () => {
    try {
      const ci = getLoggedCi();
      const user = await getVoluntarioByCi(ci);

      if (!user) {
        Alert.alert("Error", "No se encontró tu usuario");
        return;
      }

      await api.post("/consultas", {
        voluntario_id: user.id,
        mensaje: mensaje.trim()
      });

      Alert.alert("Éxito", "Mensaje enviado correctamente");
      setMensaje("");

    } catch (error) {
      console.log("Error enviando consulta:", error);
      Alert.alert("Error", "No se pudo enviar la consulta");
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: '#f8f8f8' }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >

      <ScrollView
        contentContainerStyle={{ padding: 20 }}
        keyboardShouldPersistTaps="handled"
      >

        {/* Título */}
        <Text style={{
          fontSize: 24,
          fontWeight: 'bold',
          marginBottom: 10,
          marginTop: 40,
          color: '#333'
        }}>
          Comunicación con el Administrador
        </Text>

        <Text style={{
          fontSize: 14,
          color: '#777',
          marginBottom: 20
        }}>
          Escribe tu mensaje y será enviado al equipo administrativo.
        </Text>

        {/* Caja estilo chat */}
        <View
          style={{
            backgroundColor: 'white',
            borderRadius: 12,
            padding: 15,
            borderWidth: 1,
            borderColor: '#ddd',
            minHeight: 150,
            marginBottom: 20,
            elevation: 2,
          }}
        >
          <TextInput
            placeholder="Escribe tu mensaje..."
            value={mensaje}
            onChangeText={setMensaje}
            multiline
            style={{
              fontSize: 16,
              color: '#444',
              height: '100%',
              textAlignVertical: 'top',
            }}
          />
        </View>

        {/* Botón enviar */}
        <TouchableOpacity
          style={{
            backgroundColor: colors.naranjaFuerte ?? '#ff9800',
            paddingVertical: 14,
            borderRadius: 10,
            flexDirection: 'row',
            justifyContent: 'center',
            alignItems: 'center',
            elevation: 3,
          }}
          onPress={enviarConsulta}
        >
          <Ionicons
            name="send-outline"
            size={20}
            color="white"
            style={{ marginRight: 8 }}
          />
          <Text style={{
            color: 'white',
            fontSize: 18,
            fontWeight: '600',
          }}>
            Enviar Mensaje
          </Text>
        </TouchableOpacity>

      </ScrollView>

    </KeyboardAvoidingView>
  );
}
