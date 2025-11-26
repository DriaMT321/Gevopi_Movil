import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert } from 'react-native';
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
        mensaje
      });

      Alert.alert("Éxito", "Mensaje enviado correctamente");
      setMensaje("");

    } catch (error) {
      console.log("Error enviando consulta:", error);
      Alert.alert("Error", "No se pudo enviar la consulta");
    }
  };

  return (
    <View style={{ padding: 20 }}>
      <Text style={{ fontSize: 22, fontWeight: 'bold', marginBottom: 20 }}>
        Comunicación con Administrador
      </Text>

      <TextInput
        placeholder="Escribe tu mensaje..."
        value={mensaje}
        onChangeText={setMensaje}
        multiline
        style={{
          height: 150,
          borderWidth: 1,
          borderColor: "#ccc",
          borderRadius: 10,
          padding: 10,
          fontSize: 16,
          backgroundColor: "#fff"
        }}
      />

      <TouchableOpacity
        style={{
          backgroundColor: "#ff9800",
          padding: 15,
          borderRadius: 10,
          alignItems: "center",
          marginTop: 20
        }}
        onPress={enviarConsulta}
      >
        <Text style={{ color: "#fff", fontSize: 18, fontWeight: "bold" }}>
          Enviar Mensaje
        </Text>
      </TouchableOpacity>
    </View>
  );
}


