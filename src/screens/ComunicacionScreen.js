// src/screens/ComunicacionScreen.js
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
import styles from '../styles/cursosStyles';
import { useNavigation } from '@react-navigation/native';
import colors from '../themes/colors';
import { getLoggedCi } from '../services/authService';
import { getVoluntarioByCi } from '../services/voluntarioService';
import api from '../services/api';
import echo from '../services/echo';

const OFFLINE_KEY = 'consultas_pendientes';

export default function ComunicacionScreen() {
  const navigation = useNavigation();
  const [voluntario, setVoluntario] = useState(null);
  const [mensajes, setMensajes] = useState([]);
  const [mensaje, setMensaje] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const listRef = useRef(null);

  const scrollToBottom = () => {
    setTimeout(() => {
      if (listRef.current) {
        listRef.current.scrollToEnd({ animated: true });
      }
    }, 200);
  };

  const cargarMensajes = async (silent = false, voluntarioId = null) => {
    const id = voluntarioId ?? voluntario?.id;
    if (!id) return;

    try {
      if (!silent) setLoading(true);

      const resp = await api.get(`/chat-mensajes?voluntario_id=${id}`);
      const mensajesApi = resp.data.data || [];

      const items = mensajesApi.map((m) => ({
        id: m.id,
        from: m.de,
        text: m.texto,
        at: m.created_at,
      }));

      setMensajes(items);
      scrollToBottom();
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
          await api.post('/chat-mensajes', item); // ← Cambiado de /consultas a /chat-mensajes
        } catch (e) {
          nuevos.push(item);
        }
      }

      if (nuevos.length === 0) {
        await AsyncStorage.removeItem(OFFLINE_KEY);
      } else {
        await AsyncStorage.setItem(OFFLINE_KEY, JSON.stringify(nuevos));
      }

      if (arr.length !== nuevos.length) {
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
      de: 'voluntario',
      texto,
    };

    setSending(true);

    try {
      await api.post('/chat-mensajes', payload);
      setMensaje('');
      
      // NO recargamos aquí, confiamos en el evento WebSocket
      // await cargarMensajes(true);
    } catch (error) {
      console.log('Error enviando consulta, guardando offline:', error);
      await guardarPendiente(payload);
      setMensaje('');
      Alert.alert(
        'Sin conexión',
        'No se pudo enviar ahora. El mensaje se guardará localmente.'
      );
    } finally {
      setSending(false);
    }
  };

  // Inicialización
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
        await cargarMensajes(false, u.id);
      } catch (e) {
        console.log('Error init ComunicacionScreen', e);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    init();

    return () => {
      mounted = false;
    };
  }, []);

  // WebSockets con Reverb
  useEffect(() => {
    if (!voluntario) return;

    console.log(' Conectando al canal consultas para voluntario:', voluntario.id);

    const channel = echo.channel('consultas');

    const onMensaje = (event) => {
      console.log(' Evento recibido:', event);

      try {
        const mensaje = event.mensaje;
        
        if (!mensaje) {
          console.log('⚠️ Evento sin mensaje');
          return;
        }

        // Filtrar solo mensajes de este voluntario (comparación flexible)
        if (mensaje.voluntario_id != voluntario.id) {
          console.log('⏭ Mensaje de otro voluntario, ignorando');
          return;
        }

        console.log('Agregando mensaje al chat (de:', mensaje.de + ')');

        setMensajes((prev) => {
          // Evitar duplicados
          if (prev.some(m => m.id === mensaje.id)) {
            console.log('⚠️ Mensaje duplicado, ignorando');
            return prev;
          }

          const nuevoMensaje = {
            id: mensaje.id,
            from: mensaje.de,
            text: mensaje.texto,
            at: mensaje.created_at,
          };

          return [...prev, nuevoMensaje];
        });

        scrollToBottom();
      } catch (e) {
        console.error('❌ Error manejando MensajeChatCreado:', e);
      }
    };

    channel.listen('.MensajeChatCreado', onMensaje);

    // Debug: Verificar conexión
    channel.subscribed(() => {
      console.log(' Suscrito al canal consultas');
    });

    channel.error((error) => {
      console.error('❌ Error en canal consultas:', error);
    });

    return () => {
      try {
        console.log('🔌 Desconectando del canal consultas');
        echo.leaveChannel('consultas');
      } catch (e) {
        console.log('Error al hacer leave del canal', e);
      }
    };
  }, [voluntario]);

  // Render
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
            {item.at ? new Date(item.at).toLocaleString() : ''}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: '#f5f5f5' }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 10}
    >
      <View style={{ flex: 1, paddingTop: 40 }}>
        {/* Cabecera */}
        <View
          style={{
            paddingHorizontal: 16,
            paddingBottom: 8,
            flexDirection: 'row',
            alignItems: 'center',
          }}
        >
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color={colors.naranjaFuerte} />
          </TouchableOpacity>
          <Text
            style={{
              fontSize: 22,
              fontWeight: 'bold',
              color: colors.naranjaFuerte,
              marginLeft: 8,
              flex: 1,
            }}
            numberOfLines={2}
          >
            Comunicación con el administrador
          </Text>
        </View>

        {/* Lista de mensajes */}
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
              onContentSizeChange={scrollToBottom}
            />
          )}
        </View>

        {/* Input */}
        <View
          style={{
            paddingHorizontal: 10,
            paddingTop: 8,
            paddingBottom: Platform.OS === 'android' ? 40 : 10,
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