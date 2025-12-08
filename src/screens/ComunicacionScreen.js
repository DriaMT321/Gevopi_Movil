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
  StyleSheet,
} from 'react-native';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { theme } from '../themes';
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
          await api.post('/chat-mensajes', item);
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

  useEffect(() => {
    if (!voluntario) return;

    console.log('📡 Conectando al canal consultas para voluntario:', voluntario.id);

    const channel = echo.channel('consultas');

    const onMensaje = (event) => {
      console.log('Evento recibido:', event);

      try {
        const mensaje = event.mensaje;
        
        if (!mensaje) {
          console.log('vento sin mensaje');
          return;
        }

        if (mensaje.voluntario_id != voluntario.id) {
          console.log('⏭ Mensaje de otro voluntario, ignorando');
          return;
        }

        console.log('Agregando mensaje al chat (de:', mensaje.de + ')');

        setMensajes((prev) => {
          if (prev.some(m => m.id === mensaje.id)) {
            console.log('Mensaje duplicado, ignorando');
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
        console.error('Error manejando MensajeChatCreado:', e);
      }
    };

    channel.listen('.MensajeChatCreado', onMensaje);

    channel.subscribed(() => {
      console.log('Suscrito al canal consultas');
    });

    channel.error((error) => {
      console.error('Error en canal consultas:', error);
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

  const renderItem = ({ item }) => {
    const esVol = item.from === 'voluntario';
    const esAdmin = item.from === 'admin';

    return (
      <View
        style={[
          styles.messageContainer,
          esVol ? styles.messageRight : styles.messageLeft
        ]}
      >
        {/* Avatar para admin */}
        {esAdmin && (
          <View style={styles.avatarContainer}>
            <View style={[styles.avatar, { backgroundColor: theme.colors.primary }]}>
              <FontAwesome5 name="user-shield" size={16} color={theme.colors.textLight} />
            </View>
          </View>
        )}

        <View
          style={[
            styles.messageBubble,
            esVol ? styles.messageBubbleVoluntario : styles.messageBubbleAdmin
          ]}
        >
          {/* Label de Admin */}
          {esAdmin && (
            <Text style={styles.senderLabel}>Administrador</Text>
          )}

          <Text
            style={[
              styles.messageText,
              esVol && styles.messageTextVoluntario
            ]}
          >
            {item.text}
          </Text>

          <View style={styles.messageFooter}>
            <FontAwesome5 
              name="clock" 
              size={10} 
              color={esVol ? theme.colors.gray200 : theme.colors.textSecondary} 
            />
            <Text
              style={[
                styles.messageTime,
                esVol && styles.messageTimeVoluntario
              ]}
            >
              {item.at ? new Date(item.at).toLocaleString('es-ES', {
                hour: '2-digit',
                minute: '2-digit'
              }) : ''}
            </Text>
          </View>
        </View>

        {/* Avatar para voluntario */}
        {esVol && (
          <View style={styles.avatarContainer}>
            <View style={[styles.avatar, { backgroundColor: theme.colors.success }]}>
              <FontAwesome5 name="user" size={16} color={theme.colors.textLight} />
            </View>
          </View>
        )}
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 10}
    >
      <View style={styles.wrapper}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color={theme.colors.primary} />
          </TouchableOpacity>

          <View style={styles.headerContent}>
            <View style={styles.headerIcon}>
              <FontAwesome5 name="comments" size={20} color={theme.colors.primary} />
            </View>
            <View style={styles.headerTextContainer}>
              <Text style={styles.headerTitle}>Chat con Administrador</Text>
              <Text style={styles.headerSubtitle}>
                {mensajes.length > 0 ? `${mensajes.length} mensajes` : 'Sin mensajes'}
              </Text>
            </View>
          </View>
        </View>

        {/* Lista de mensajes */}
        <View style={styles.messagesContainer}>
          {loading && mensajes.length === 0 ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={theme.colors.primary} />
              <Text style={styles.loadingText}>Cargando mensajes...</Text>
            </View>
          ) : mensajes.length === 0 ? (
            <View style={styles.emptyContainer}>
              <FontAwesome5 name="comments" size={64} color={theme.colors.gray300} />
              <Text style={styles.emptyTitle}>No hay mensajes aún</Text>
              <Text style={styles.emptySubtext}>Envía tu primer mensaje al administrador</Text>
            </View>
          ) : (
            <FlatList
              ref={listRef}
              data={mensajes}
              keyExtractor={(item) => item.id.toString()}
              renderItem={renderItem}
              contentContainerStyle={styles.messagesList}
              onContentSizeChange={scrollToBottom}
            />
          )}
        </View>

        {/* Input */}
        <View style={styles.inputContainer}>
          <View style={styles.inputWrapper}>
            <TextInput
              placeholder="Escribe tu mensaje..."
              placeholderTextColor={theme.colors.placeholder}
              value={mensaje}
              onChangeText={setMensaje}
              multiline
              maxLength={500}
              style={styles.input}
            />

            <TouchableOpacity
              style={[
                styles.sendButton,
                (!mensaje.trim() || sending) && styles.sendButtonDisabled
              ]}
              disabled={sending || !mensaje.trim()}
              onPress={enviarConsulta}
            >
              {sending ? (
                <ActivityIndicator size="small" color={theme.colors.textLight} />
              ) : (
                <FontAwesome5 name="paper-plane" size={18} color={theme.colors.textLight} />
              )}
            </TouchableOpacity>
          </View>

          {mensaje.length > 450 && (
            <Text style={styles.charCounter}>
              {mensaje.length}/500
            </Text>
          )}
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  wrapper: {
    flex: 1,
    paddingTop: theme.spacing.xxl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
    backgroundColor: theme.colors.cardBackground,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderLight,
    ...theme.shadows.sm,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: theme.spacing.borderRadius.round,
    backgroundColor: theme.colors.gray50,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },
  headerContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIcon: {
    width: 44,
    height: 44,
    borderRadius: theme.spacing.borderRadius.round,
    backgroundColor: theme.colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.sm,
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.textPrimary,
    marginTop: theme.spacing.sm,
  },
  headerSubtitle: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  messagesContainer: {
    flex: 1,
    backgroundColor: theme.colors.gray50,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: theme.spacing.md,
    color: theme.colors.textSecondary,
    fontSize: theme.typography.fontSize.md,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.xl,
  },
  emptyTitle: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.textPrimary,
    marginTop: theme.spacing.lg,
  },
  emptySubtext: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.xs,
    textAlign: 'center',
  },
  messagesList: {
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
  },
  messageContainer: {
    flexDirection: 'row',
    marginVertical: theme.spacing.xs,
    alignItems: 'flex-end',
  },
  messageLeft: {
    justifyContent: 'flex-start',
  },
  messageRight: {
    justifyContent: 'flex-end',
  },
  avatarContainer: {
    marginHorizontal: theme.spacing.xs,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: theme.spacing.borderRadius.round,
    justifyContent: 'center',
    alignItems: 'center',
  },
  messageBubble: {
    maxWidth: '75%',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.spacing.borderRadius.lg,
  },
  messageBubbleAdmin: {
    backgroundColor: theme.colors.cardBackground,
    borderBottomLeftRadius: 4,
    ...theme.shadows.sm,
  },
  messageBubbleVoluntario: {
    backgroundColor: theme.colors.primary,
    borderBottomRightRadius: 4,
    ...theme.shadows.sm,
  },
  senderLabel: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.primary,
    marginBottom: theme.spacing.xs,
  },
  messageText: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.textPrimary,
    lineHeight: 20,
  },
  messageTextVoluntario: {
    color: theme.colors.textLight,
  },
  messageFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: theme.spacing.xs,
    gap: 4,
  },
  messageTime: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.textSecondary,
  },
  messageTimeVoluntario: {
    color: theme.colors.gray200,
  },
  inputContainer: {
    paddingHorizontal: theme.spacing.md,
    paddingTop: theme.spacing.sm,
    paddingBottom: Platform.OS === 'android' ? theme.spacing.xl : theme.spacing.sm,
    backgroundColor: theme.colors.cardBackground,
    borderTopWidth: 1,
    borderTopColor: theme.colors.borderLight,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: theme.spacing.sm,
  },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 100,
    backgroundColor: theme.colors.gray50,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.spacing.borderRadius.xl,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.textPrimary,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: theme.spacing.borderRadius.round,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...theme.shadows.md,
  },
  sendButtonDisabled: {
    backgroundColor: theme.colors.gray300,
  },
  charCounter: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.textSecondary,
    textAlign: 'right',
    marginTop: theme.spacing.xs,
  },
});