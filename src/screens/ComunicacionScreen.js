import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';

import colors from '../themes/colors';
import { getLoggedCi } from '../services/authService';
import { getVoluntarioByCi } from '../services/voluntarioService';
import api from '../services/api';

const OFFLINE_KEY = 'consultas_pendientes';

export default function ComunicacionScreen() {
  const [voluntario, setVoluntario] = useState(null);
  const [mensajes, setMensajes] = useState([]); // [{id, from, text, at}]
  const [mensaje, setMensaje] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const pollRef = useRef(null);
  const listRef = useRef(null);

  // ------------------ helpers backend ------------------ //

  const cargarMensajes = async (silent = false) => {
    if (!voluntario) return;

    try {
      if (!silent) setLoading(true);

      const resp = await api.get(
        `/consultas?voluntario_id=${voluntario.id}`
      );

      const consultas = resp.data.data || [];

      // Aplanar: cada consulta es 1 (voluntario) + 0/1 (admin)
      const items = [];
      consultas.forEach((c) => {
        items.push({
          id: `v-${c.id}`,
          from: 'voluntario',
          text: c.mensaje,
          at: c.created_at,
        });

        if (c.respuesta_admin) {
          items.push({
            id: `a-${c.id}`,
            from: 'admin',
            text: c.respuesta_admin,
            at: c.updated_at || c.created_at,
          });
        }
      });

      setMensajes(items);
      // scroll al final
      setTimeout(() => {
        if (listRef.current) {
          listRef.current.scrollToEnd({ animated: true });
        }
      }, 200);
    } catch (error) {
      console.log('Error cargando mensajes', error);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const guardarPendiente = async (payload) => {
    try {
      const raw = await AsyncStorage.getItem(OFFLINE_KEY);
      const arr = raw ? JSON.parse(raw) : [];
      arr.push(payload);
      await AsyncStorage.setItem(OFFLINE_KEY, JSON.stringify(arr));
    } catch (e) {
      console.log('Error guardando pendiente', e);
    }
  };

  const procesarPendientes = async () => {
    try {
      const raw = await AsyncStorage.getItem(OFFLINE_KEY);
      if (!raw) return;

      let arr = JSON.parse(raw);
      if (!Array.isArray(arr) || arr.length === 0) return;

      const nuevos = [];

      for (const item of arr) {
        try {
          await api.post('/consultas', item);
        } catch (e) {
          // si falla, lo dejamos para después
          nuevos.push(item);
        }
      }

      if (nuevos.length === 0) {
        await AsyncStorage.removeItem(OFFLINE_KEY);
      } else {
        await AsyncStorage.setItem(OFFLINE_KEY, JSON.stringify(nuevos));
      }

      if (arr.length !== nuevos.length) {
        // se envió algo, recargar mensajes
        await cargarMensajes(true);
      }
    } catch (e) {
      console.log('Error procesando pendientes', e);
    }
  };

  const enviarConsulta = async () => {
    const texto = mensaje.trim();
    if (!texto) return;

    if (!voluntario) {
      Alert.alert('Error', 'No se encontró tu usuario');
      return;
    }

    const payload = {
      voluntario_id: voluntario.id,
      mensaje: texto,
    };

    setSending(true);

    try {
      // intento online
      await api.post('/consultas', payload);

      setMensaje('');
      await cargarMensajes(true);
    } catch (error) {
      console.log('Error enviando consulta, guardando offline:', error);
      await guardarPendiente(payload);
      setMensaje('');
      Alert.alert(
        'Sin conexión',
        'No se pudo enviar ahora. El mensaje se guardó y se enviará cuando tengas internet.'
      );
    } finally {
      setSending(false);
    }
  };

  // ------------------ useEffect inicial ------------------ //

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      try {
        const ci = getLoggedCi();
        const u = await getVoluntarioByCi(ci);

        if (!u) {
          Alert.alert('Error', 'No se encontró tu usuario');
          return;
        }

        if (!mounted) return;
        setVoluntario(u);

        await procesarPendientes();
        await cargarMensajes(false);

        // polling cada 5s para recibir respuestas del admin
        pollRef.current = setInterval(() => {
          cargarMensajes(true);
        }, 5000);
      } catch (e) {
        console.log('Error init ComunicacionScreen', e);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    init();

    return () => {
      mounted = false;
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  // ------------------ render ------------------ //

  const renderItem = ({ item }) => {
    const esVol = item.from === 'voluntario';

    return (
      <View
        style={{
          flexDirection: 'row',
          justifyContent: esVol ? 'flex-end' : 'flex-start',
          marginVertical: 4,
        }}
      >
        <View
          style={{
            maxWidth: '80%',
            paddingHorizontal: 12,
            paddingVertical: 8,
            borderRadius: 16,
            backgroundColor: esVol
              ? colors.naranjaFuerte || '#ff9800'
              : '#e4e6eb',
          }}
        >
          <Text
            style={{
              color: esVol ? 'white' : '#222',
              fontSize: 15,
            }}
          >
            {item.text}
          </Text>
          <Text
            style={{
              marginTop: 4,
              fontSize: 10,
              color: esVol ? '#fcefe3' : '#777',
              textAlign: 'right',
            }}
          >
            {item.at
              ? new Date(item.at).toLocaleString()
              : ''}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: '#f5f5f5' }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <View style={{ flex: 1, paddingTop: 40 }}>
        {/* cabecera */}
        <View
          style={{
            paddingHorizontal: 16,
            paddingBottom: 8,
          }}
        >
          <Text style={{ fontSize: 22, fontWeight: 'bold', color: '#333' }}>
            Comunicación con el administrador
          </Text>
          <Text style={{ fontSize: 13, color: '#777', marginTop: 4 }}>
            Envía tus dudas y revisa las respuestas del equipo.
          </Text>
        </View>

        {/* listado de mensajes */}
        <View style={{ flex: 1, paddingHorizontal: 16, marginTop: 8 }}>
          {loading && mensajes.length === 0 ? (
            <View
              style={{
                flex: 1,
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <ActivityIndicator size="large" color="#999" />
              <Text style={{ marginTop: 8, color: '#777' }}>
                Cargando mensajes...
              </Text>
            </View>
          ) : (
            <FlatList
              ref={listRef}
              data={mensajes}
              keyExtractor={(item) => item.id.toString()}
              renderItem={renderItem}
              contentContainerStyle={{ paddingVertical: 8 }}
              onContentSizeChange={() => {
                if (listRef.current) {
                  listRef.current.scrollToEnd({ animated: true });
                }
              }}
            />
          )}
        </View>

        {/* input + botón abajo fijo */}
        <View
          style={{
            padding: 10,
            borderTopWidth: 1,
            borderTopColor: '#ddd',
            backgroundColor: 'white',
          }}
        >
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
            }}
          >
            <TextInput
              placeholder="Escribe tu mensaje..."
              value={mensaje}
              onChangeText={setMensaje}
              multiline
              style={{
                flex: 1,
                maxHeight: 90,
                borderWidth: 1,
                borderColor: '#ddd',
                borderRadius: 20,
                paddingHorizontal: 20,
                paddingVertical: 10,
                fontSize: 15,
                backgroundColor: '#fff',
              }}
            />

            <TouchableOpacity
              style={{
                marginLeft: 8,
                backgroundColor:
                  sending || !mensaje.trim()
                    ? '#bbb'
                    : colors.naranjaFuerte || '#ff9800',
                borderRadius: 20,
                padding: 10,
              }}
              disabled={sending || !mensaje.trim()}
              onPress={enviarConsulta}
            >
              {sending ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Ionicons name="send" size={20} color="#fff" />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
