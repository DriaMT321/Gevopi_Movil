import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  FlatList,
  Animated,
  Modal,
  Dimensions,
  Pressable,
  Image,
  ActivityIndicator,
  KeyboardAvoidingView, Platform, Keyboard, Alert,
  RefreshControl,
  StyleSheet
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { theme } from '../themes';
import * as Location from 'expo-location';
import { FontAwesome5 } from '@expo/vector-icons';
import { Dropdown } from 'react-native-element-dropdown';

import { getUsuarios } from '../services/usuarioService';
import { getVoluntarioByUsuarioId } from '../services/voluntarioService';
import { getLoggedCi, logout } from '../services/authService';
import { getVoluntarioByCi } from '../services/voluntarioService';
import { obtenerReportePorVoluntarioId, obtenerCursosPorVoluntarioId, obtenerNecesidadesPorVoluntarioId, obtenerCapacitacionesPorVoluntarioId } from '../services/queriesSQL';
import { crearSolicitudAyuda } from '../services/solicitudService';

const { width } = Dimensions.get('window');
const { height } = Dimensions.get('window');

export default function PerfilScreen() {
  const [infoVisible, setInfoVisible] = useState(false);
  const [voluntario, setVoluntario] = useState(null);
  const [loadingVoluntario, setLoadingVoluntario] = useState(true);
  const [historialIndex, setHistorialIndex] = useState(0);
  const [necesidadesIndex, setNecesidadesIndex] = useState(0);
  const [emergenciaVisible, setEmergenciaVisible] = useState(false);
  const [reporte, setReporte] = useState(null);
  const [necesidades, setNecesidades] = useState([]);
  const [capacitaciones, setCapacitaciones] = useState([]);
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [todosReportes, setTodosReportes] = useState([]);

  const modalOffsetAnim = useRef(new Animated.Value(0)).current;

  const historialClinicoItems = todosReportes
    .filter(r => r.resumenFisico)
    .slice(0, 2)
    .map(r => ({
      titulo: 'Resumen Físico',
      descripcion: r.resumenFisico,
      fecha: new Date(r.fechaGenerado).toLocaleDateString()
    }));

  const historialPsicologicoItems = todosReportes
    .filter(r => r.resumenEmocional)
    .slice(0, 2)
    .map(r => ({
      titulo: 'Resumen Emocional',
      descripcion: r.resumenEmocional,
      fecha: new Date(r.fechaGenerado).toLocaleDateString()
    }));

  const historialData = [
    {
      titulo: 'Historial Clínico',
      screen: 'Historial',
      items: historialClinicoItems,
    },
    {
      titulo: 'Historial Psicológico',
      screen: 'Historial',
      items: historialPsicologicoItems,
    },
  ];

  const [cursosAsignados, setCursosAsignados] = useState([]);

  const necesidadesData = [
    {
      titulo: 'Necesidades',
      screen: 'NecesidadesCapacitaciones',
      items: necesidades?.slice(0, 2).map((n) => ({
        titulo: n.tipo,
        descripcion: n.descripcion,
      })) || [],
    },
    {
      titulo: 'Capacitaciones',
      screen: 'NecesidadesCapacitaciones',
      items: capacitaciones?.slice(0, 2).map((c) => ({
        titulo: c.nombre,
        descripcion: c.descripcion || `Curso: ${c.cursoNombre}`,
      })) || [],
    },
  ];

  const dotAnimsHistorial = useRef([]);
  const dotAnimsNecesidades = useRef([]);

  const navigation = useNavigation();
  const panelAnim = useRef(new Animated.Value(500)).current;
  const scrollXHistorial = useRef(new Animated.Value(0)).current;
  const scrollXNecesidades = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const blueAnim = useRef(new Animated.Value(-height)).current;

  const [tipo, setTipo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [nivel, setNivel] = useState('');
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateForm = () => {
    const newErrors = {};
    if (!tipo) newErrors.tipo = 'Selecciona un tipo de emergencia';
    if (!nivel) newErrors.nivel = 'Selecciona un nivel de emergencia';
    if (!descripcion || descripcion.trim().length < 10) {
      newErrors.descripcion = 'La descripción debe tener al menos 10 caracteres';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleEnviarSolicitud = async () => {
    if (!validateForm()) {
      Alert.alert('Error', 'Por favor completa todos los campos correctamente');
      return;
    }

    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Error', 'Permiso de ubicación denegado');
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      const latitud = location.coords.latitude;
      const longitud = location.coords.longitude;
      const fecha = new Date().toISOString();
      const nivelNum = parseInt(nivel);

      if (!voluntario || !voluntario.id) {
        throw new Error('No se pudo obtener ID del voluntario');
      }

      await crearSolicitudAyuda({
        tipo,
        descripcion: descripcion.trim(),
        nivelEmergencia: nivelNum,
        fecha,
        voluntarioId: voluntario.id.toString(),
        latitud,
        longitud,
      });

      setTipo('');
      setNivel('');
      setDescripcion('');
      setErrors({});
      closeEmergencia();

      Alert.alert(
        '✅ Emergencia reportada',
        'Tu solicitud ha sido enviada. Un equipo la revisará pronto.',
        [{ text: 'OK' }]
      );

    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message || 'No se pudo enviar la solicitud';
      Alert.alert('Error', errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const fetchVoluntario = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      const email = getLoggedCi();
      const voluntarioData = await getVoluntarioByCi(email);

      if (!voluntarioData) {
        setVoluntario(null);
        return;
      }

      setVoluntario(voluntarioData);
      const reportes = await obtenerReportePorVoluntarioId(voluntarioData.id.toString());
      const cursos = await obtenerCursosPorVoluntarioId(voluntarioData.id);
      const necesidadesData = await obtenerNecesidadesPorVoluntarioId(voluntarioData.id.toString());
      const capacitacionesData = await obtenerCapacitacionesPorVoluntarioId(voluntarioData.id.toString());

      if (necesidadesData) setNecesidades(necesidadesData);
      if (capacitacionesData) setCapacitaciones(capacitacionesData);

      if (reportes && reportes.length > 0) {
        const reportesOrdenados = [...reportes].sort((a, b) => new Date(b.fechaGenerado) - new Date(a.fechaGenerado));
        setTodosReportes(reportesOrdenados);
        setReporte(reportesOrdenados[0]);
      }
      if (cursos) setCursosAsignados(cursos);
    } catch (error) {
      console.error('Error al cargar voluntario:', error);
    } finally {
      setLoadingVoluntario(false);
      setRefreshing(false);

      Animated.timing(blueAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: false,
      }).start();
    }
  }, []);

  const onRefresh = useCallback(() => {
    fetchVoluntario(true);
  }, [fetchVoluntario]);

  useFocusEffect(
    useCallback(() => {
      fadeAnim.setValue(0);
      Animated.timing(fadeAnim, {
        toValue: 1,
        useNativeDriver: true,
      }).start();
      fetchVoluntario();
    }, [fetchVoluntario])
  );

  useEffect(() => {
    fetchVoluntario();
  }, [fetchVoluntario]);

  useEffect(() => {
    if (dotAnimsHistorial.current.length !== historialData.length) {
      dotAnimsHistorial.current = historialData.map((_, i) => new Animated.Value(i === historialIndex ? 1 : 0));
    }

    dotAnimsHistorial.current.forEach((anim, i) => {
      Animated.timing(anim, {
        toValue: i === historialIndex ? 1 : 0,
        duration: 300,
        useNativeDriver: false,
      }).start();
    });
  }, [historialIndex]);

  useEffect(() => {
    if (dotAnimsNecesidades.current.length !== necesidadesData.length) {
      dotAnimsNecesidades.current = necesidadesData.map((_, i) => new Animated.Value(i === necesidadesIndex ? 1 : 0));
    }

    dotAnimsNecesidades.current.forEach((anim, i) => {
      Animated.timing(anim, {
        toValue: i === necesidadesIndex ? 1 : 0,
        duration: 300,
        useNativeDriver: false,
      }).start();
    });
  }, [necesidadesIndex]);

  useEffect(() => {
    const keyboardWillShow = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      () => {
        setKeyboardVisible(true);
        Animated.timing(modalOffsetAnim, {
          toValue: -200,
          duration: 300,
          useNativeDriver: true,
        }).start();
      }
    );

    const keyboardWillHide = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => {
        setKeyboardVisible(false);
        Animated.timing(modalOffsetAnim, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }).start();
      }
    );

    return () => {
      keyboardWillShow.remove();
      keyboardWillHide.remove();
    };
  }, []);

  const openInfo = () => {
    setInfoVisible(true);
    Animated.timing(panelAnim, { toValue: 0, duration: 300, useNativeDriver: true }).start();
  };

  const openEmergencia = () => {
    setEmergenciaVisible(true);
    Animated.timing(panelAnim, { toValue: 0, duration: 300, useNativeDriver: true }).start();
  };

  const closeEmergencia = () => {
    setTipo('');
    setNivel('');
    setDescripcion('');
    setErrors({});
    
    Animated.timing(panelAnim, { 
      toValue: 1000, 
      duration: 300, 
      useNativeDriver: true 
    }).start(() => setEmergenciaVisible(false));
  };

  const closeInfo = () => {
    Animated.timing(panelAnim, { toValue: 1000, duration: 300, useNativeDriver: true }).start(() =>
      setInfoVisible(false),
    );
  };

  const renderDots = (count, animsArray) => (
    <View style={styles.dotsContainer}>
      {animsArray.slice(0, count).map((anim, i) => {
        const backgroundColor = anim.interpolate({
          inputRange: [0, 1],
          outputRange: [theme.colors.gray300, theme.colors.primary],
        });

        return <Animated.View key={i} style={[styles.dot, { backgroundColor }]} />;
      })}
    </View>
  );

  const renderCarouselItem = ({ item }) => (
    <TouchableOpacity
      style={styles.carouselItem}
      onPress={() => navigation.navigate(item.screen)}
      activeOpacity={0.7}
    >
      <Text style={styles.carouselSectionTitle}>{item.titulo}</Text>
      {item.items && item.items.length > 0 ? (
        item.items.map((subItem, index) => (
          <View key={index} style={styles.cardContainer}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>{subItem.titulo}</Text>
              {subItem.fecha && (
                <View style={styles.dateContainer}>
                  <FontAwesome5 name="calendar-alt" size={12} color={theme.colors.textSecondary} />
                  <Text style={styles.cardDate}>{subItem.fecha}</Text>
                </View>
              )}
            </View>
            <Text style={styles.cardDescription} numberOfLines={2} ellipsizeMode="tail">
              {subItem.descripcion}
            </Text>
          </View>
        ))
      ) : (
        <View style={styles.emptyStateContainer}>
          <FontAwesome5 name="inbox" size={24} color={theme.colors.gray400} />
          <Text style={styles.emptyStateText}>No hay información para mostrar</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  const handleLogout = () => {
    Alert.alert(
      "Cerrar Sesión",
      "¿Seguro que quieres cerrar sesión?",
      [
        {
          text: "No",
          style: "cancel"
        },
        {
          text: "Sí",
          onPress: () => {
            logout();
            navigation.reset({
              index: 0,
              routes: [{ name: 'Login' }],
            });
          }
        }
      ]
    );
  };

  const handleUserNotFound = () => {
    logout();
    navigation.reset({
      index: 0,
      routes: [{ name: 'Login' }],
    });
  };

  if (loadingVoluntario) {
    return (
      <View style={styles.loadingContainer}>
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Cargando tu perfil...</Text>
          <Text style={styles.loadingSubtext}>Por favor espera un momento</Text>
        </View>
      </View>
    );
  }

  if (!voluntario) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Voluntario no encontrado.</Text>
        <TouchableOpacity style={styles.logoutButton2} onPress={handleUserNotFound}>
          <Text style={styles.logoutText}>Volver al Login</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <ScrollView 
        contentContainerStyle={{ paddingBottom: 100 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[theme.colors.primary]}
            tintColor={theme.colors.primary}
          />
        }
      >
        <Animated.View style={[styles.headerBackground, { transform: [{ translateY: blueAnim }] }]} />

        <View style={styles.logoutContainer}>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={24} color={theme.colors.danger} />
          </TouchableOpacity>
        </View>

        <View style={styles.perfilContainer}>
          <View style={styles.avatarWrapper}>
            {voluntario.fotoPerfil ? (
              <Image source={{ uri: voluntario.fotoPerfil }} style={styles.avatarImage} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarInitial}>
                  {voluntario.nombre?.charAt(0).toUpperCase() ?? '-'}
                </Text>
              </View>
            )}
            <View style={styles.statusDot} />
          </View>

          <Text style={styles.name}>{voluntario.nombre} {voluntario.apellido}</Text>
          
          <View style={styles.roleContainer}>
            <View style={styles.roleBadge}>
              <FontAwesome5 
                name={voluntario.rol_id === 3 ? "users" : "user-friends"} 
                size={14} 
                color={theme.colors.textLight} 
                style={styles.roleIcon}
              />
              <Text style={styles.roleText}>
                {voluntario.rol_id === 3 ? 'Comunario' : 'Voluntario'}
              </Text>
            </View>
          </View>

          <View style={styles.buttonsRow}>
            <TouchableOpacity style={styles.circleButton} onPress={openInfo}>
              <Ionicons name="information-circle-outline" size={24} color={theme.colors.primary} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.circleButton} onPress={() => navigation.navigate("Evaluaciones")}>
              <Ionicons name="document-text-outline" size={24} color={theme.colors.info} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.circleButton} onPress={() => navigation.navigate("Solicitudes")}>
              <Ionicons name="file-tray-full-outline" size={24} color={theme.colors.warning} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.emergenciaButton} onPress={openEmergencia}>
              <Ionicons name="megaphone-outline" size={24} color={theme.colors.textLight} />
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity style={styles.sectionCard} activeOpacity={0.9} onPress={() => navigation.navigate('Historial')}>
          <Animated.FlatList
            data={historialData}
            renderItem={renderCarouselItem}
            keyExtractor={(item, index) => index.toString()}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={Animated.event([{ nativeEvent: { contentOffset: { x: scrollXHistorial } } }], { useNativeDriver: false })}
            onMomentumScrollEnd={(e) => {
              const newIndex = Math.round(e.nativeEvent.contentOffset.x / (width - 64));
              setHistorialIndex(newIndex);
            }}
            scrollEventThrottle={16}
          />
          {renderDots(historialData.length, dotAnimsHistorial.current)}
        </TouchableOpacity>

        <TouchableOpacity style={styles.sectionCard} activeOpacity={0.9} onPress={() => navigation.navigate('NecesidadesCapacitaciones')}>
          <Animated.FlatList
            data={necesidadesData}
            renderItem={renderCarouselItem}
            keyExtractor={(item, index) => index.toString()}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={Animated.event([{ nativeEvent: { contentOffset: { x: scrollXNecesidades } } }], { useNativeDriver: false })}
            onMomentumScrollEnd={(e) => {
              const newIndex = Math.round(e.nativeEvent.contentOffset.x / (width - 64));
              setNecesidadesIndex(newIndex);
            }}
            scrollEventThrottle={16}
          />
          {renderDots(necesidadesData.length, dotAnimsNecesidades.current)}
        </TouchableOpacity>

        <TouchableOpacity style={styles.sectionCard} onPress={() => navigation.navigate('Cursos')}>
          <Text style={styles.carouselSectionTitle}>Cursos Asignados</Text>
          {cursosAsignados && cursosAsignados.length > 0 ? (
            cursosAsignados.slice(0, 2).map((curso, index) => (
              <View key={index} style={styles.cardContainer}>
                <View style={styles.cardHeader}>
                  <Text style={styles.cardTitle}>{curso.nombre}</Text>
                </View>
                <Text style={styles.cardDescription}>{curso.descripcion}</Text>
              </View>
            ))
          ) : (
            <View style={styles.emptyStateContainer}>
              <FontAwesome5 name="inbox" size={24} color={theme.colors.gray400} />
              <Text style={styles.emptyStateText}>No hay cursos asignados</Text>
            </View>
          )}
        </TouchableOpacity>

        <View style={styles.comunicacionContainer}>
          <TouchableOpacity
            onPress={() => navigation.navigate("Comunicacion")}
            style={styles.comunicacionButton}
          >
            <Ionicons name="chatbox-ellipses-outline" size={22} color={theme.colors.textLight} />
            <Text style={styles.comunicacionButtonText}>Comunicación</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Modal Información */}
      <Modal transparent visible={infoVisible} animationType="fade">
        <Pressable style={styles.modalBackdrop} onPress={closeInfo} />
        <Animated.View style={[styles.modalContent, { transform: [{ translateY: panelAnim }] }]}>
          <Text style={styles.modalTitle}>Información del Voluntario</Text>

          <View style={styles.infoRow}>
            <FontAwesome5 name="user" size={20} color={theme.colors.primary} />
            <Text style={styles.infoText}>{voluntario.nombre} {voluntario.apellido}</Text>
          </View>
          <View style={styles.infoRow}>
            <FontAwesome5 name="id-card" size={20} color={theme.colors.primary} />
            <Text style={styles.infoText}>{voluntario.ci}</Text>
          </View>
          <View style={styles.infoRow}>
            <FontAwesome5 name="phone" size={20} color={theme.colors.primary} />
            <Text style={styles.infoText}>{voluntario.telefono}</Text>
          </View>
          <View style={styles.infoRow}>
            <FontAwesome5 name="tint" size={20} color={theme.colors.danger} />
            <Text style={styles.infoText}>{voluntario.tipo_sangre}</Text>
          </View>
        </Animated.View>
      </Modal>

      {/* Modal Emergencia */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <Modal transparent visible={emergenciaVisible} animationType="fade">
          <Pressable style={styles.modalBackdrop} onPress={closeEmergencia} />

          <Animated.View
            style={[
              styles.modalContent,
              {
                transform: [
                  { translateY: panelAnim },
                  { translateY: modalOffsetAnim }
                ]
              }
            ]}
          >
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Reportar Emergencia</Text>
              <TouchableOpacity onPress={closeEmergencia} style={styles.closeButton}>
                <Ionicons name="close" size={24} color={theme.colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView
              contentContainerStyle={styles.modalScrollContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              <View style={styles.modalSection}>
                <Text style={styles.modalLabel}>
                  Tipo de emergencia <Text style={styles.required}>*</Text>
                </Text>
                <Dropdown
                  style={[styles.dropdown, errors.tipo && styles.inputError]}
                  placeholderStyle={styles.placeholderStyle}
                  selectedTextStyle={styles.selectedTextStyle}
                  data={[
                    { label: 'Físico', value: 'Fisico' },
                    { label: 'Emocional', value: 'Emocional' },
                    { label: 'Recurso', value: 'Recurso' },
                  ]}
                  maxHeight={200}
                  labelField="label"
                  valueField="value"
                  placeholder="Selecciona un tipo"
                  value={tipo}
                  onChange={item => {
                    setTipo(item.value);
                    setErrors(prev => ({ ...prev, tipo: null }));
                  }}
                />
                {errors.tipo && <Text style={styles.errorText}>{errors.tipo}</Text>}
              </View>

              <View style={styles.modalSection}>
                <Text style={styles.modalLabel}>
                  Nivel de emergencia <Text style={styles.required}>*</Text>
                </Text>
                <Dropdown
                  style={[styles.dropdown, errors.nivel && styles.inputError]}
                  placeholderStyle={styles.placeholderStyle}
                  selectedTextStyle={styles.selectedTextStyle}
                  data={[
                    { label: 'Bajo', value: '1' },
                    { label: 'Medio', value: '3' },
                    { label: 'Alto', value: '5' },
                  ]}
                  maxHeight={200}
                  labelField="label"
                  valueField="value"
                  placeholder="Selecciona un nivel"
                  value={nivel}
                  onChange={item => {
                    setNivel(item.value);
                    setErrors(prev => ({ ...prev, nivel: null }));
                  }}
                />
                {errors.nivel && <Text style={styles.errorText}>{errors.nivel}</Text>}
              </View>

              <View style={styles.modalSection}>
                <Text style={styles.modalLabel}>
                  Descripción <Text style={styles.required}>*</Text>
                </Text>
                <TextInput
                  placeholder="Describe brevemente la emergencia (mínimo 10 caracteres)..."
                  style={[
                    styles.input, 
                    styles.descripcionInput,
                    errors.descripcion && styles.inputError
                  ]}
                  value={descripcion}
                  onChangeText={(text) => {
                    setDescripcion(text);
                    setErrors(prev => ({ ...prev, descripcion: null }));
                  }}
                  multiline={true}
                  numberOfLines={4}
                  maxLength={500}
                  returnKeyType="done"
                  blurOnSubmit={true}
                  textAlignVertical="top"
                  placeholderTextColor={theme.colors.placeholder}
                />
                <Text style={styles.charCounter}>{descripcion.length}/500</Text>
                {errors.descripcion && <Text style={styles.errorText}>{errors.descripcion}</Text>}
              </View>

              <TouchableOpacity
                style={[
                  styles.enviarButton,
                  isSubmitting && styles.enviarButtonDisabled
                ]}
                onPress={handleEnviarSolicitud}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <ActivityIndicator color={theme.colors.textLight} />
                ) : (
                  <Text style={styles.enviarButtonText}>ENVIAR EMERGENCIA</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity style={styles.cancelarButton} onPress={closeEmergencia}>
                <Text style={styles.cancelarButtonText}>Cancelar</Text>
              </TouchableOpacity>
            </ScrollView>
          </Animated.View>
        </Modal>
      </KeyboardAvoidingView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  headerBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: height * 0.35,
    backgroundColor: theme.colors.primary,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  logoutContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.xxl, // 48px - botón de logout más abajo
    marginBottom: -theme.spacing.md, // ← AGREGAR: compensa el espacio extra
  },
  logoutButton: {
    width: 44,
    height: 44,
    borderRadius: theme.spacing.borderRadius.round,
    backgroundColor: theme.colors.cardBackground,
    justifyContent: 'center',
    alignItems: 'center',
    ...theme.shadows.md,
  },
  logoutButton2: {
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.xl,
    borderRadius: theme.spacing.borderRadius.md,
    marginTop: theme.spacing.lg,
  },
  logoutText: {
    color: theme.colors.textLight,
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
    padding: theme.spacing.xl,
  },
  loadingBox: {
    backgroundColor: theme.colors.cardBackground,
    padding: theme.spacing.xxl,
    borderRadius: theme.spacing.borderRadius.lg,
    alignItems: 'center',
    ...theme.shadows.lg,
  },
  loadingText: {
    marginTop: theme.spacing.lg,
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.textPrimary,
  },
  loadingSubtext: {
    marginTop: theme.spacing.sm,
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.textSecondary,
  },
  perfilContainer: {
    alignItems: 'center',
    marginTop: theme.spacing.lg,
    paddingHorizontal: theme.spacing.lg,
  },
  avatarWrapper: {
    position: 'relative',
    marginBottom: theme.spacing.md,
  },
  avatarImage: {
    width: 100,
    height: 100,
    borderRadius: theme.spacing.borderRadius.round,
    borderWidth: 4,
    borderColor: theme.colors.cardBackground,
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: theme.spacing.borderRadius.round,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: theme.colors.cardBackground,
  },
  avatarInitial: {
    fontSize: theme.typography.fontSize.xxxl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.textLight,
  },
  statusDot: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    width: 20,
    height: 20,
    borderRadius: theme.spacing.borderRadius.round,
    backgroundColor: theme.colors.success,
    borderWidth: 3,
    borderColor: theme.colors.cardBackground,
  },
  name: {
    fontSize: theme.typography.fontSize.xxl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.textLight, 
    marginTop: theme.spacing.xs, 
    marginBottom: theme.spacing.md, 
  },
  roleContainer: {
    marginTop: theme.spacing.xl,
    marginBottom: theme.spacing.lg,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.info,
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.spacing.borderRadius.round,
    gap: theme.spacing.xs,
  },
  roleIcon: {
    marginRight: theme.spacing.xs,
  },
  roleText: {
    color: theme.colors.textLight,
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  buttonsRow: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    marginTop: theme.spacing.lg,
  },
  circleButton: {
    width: 50,
    height: 50,
    borderRadius: theme.spacing.borderRadius.round,
    backgroundColor: theme.colors.cardBackground,
    justifyContent: 'center',
    alignItems: 'center',
    ...theme.shadows.md,
  },
  emergenciaButton: {
    width: 50,
    height: 50,
    borderRadius: theme.spacing.borderRadius.round,
    backgroundColor: theme.colors.danger,
    justifyContent: 'center',
    alignItems: 'center',
    ...theme.shadows.md,
  },
  sectionCard: {
    backgroundColor: theme.colors.cardBackground,
    marginHorizontal: theme.spacing.lg, // 24px cada lado = 48px total
    marginTop: theme.spacing.lg,
    padding: theme.spacing.lg, // 24px cada lado = 48px total
    borderRadius: theme.spacing.borderRadius.lg,
    ...theme.shadows.md,
  },
  carouselItem: {
    width: width - 48 - 48, // ← CAMBIO: width total - marginHorizontal (48px) - padding (48px) = width - 96
    paddingHorizontal: 0,
  },
  carouselSectionTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.md,
    paddingLeft: 0, // ← CAMBIO: quitar padding, ya está alineado
  },
  cardContainer: {
    backgroundColor: theme.colors.gray50,
    padding: theme.spacing.md,
    borderRadius: theme.spacing.borderRadius.md,
    marginBottom: theme.spacing.sm,
    borderLeftWidth: 3,
    borderLeftColor: theme.colors.primary,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
  },
  cardTitle: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.textPrimary,
    flex: 1,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  cardDate: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.textSecondary,
  },
  cardDescription: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.textSecondary,
    lineHeight: 20,
  },
  emptyStateContainer: {
    alignItems: 'center',
    paddingVertical: theme.spacing.xl,
  },
  emptyStateText: {
    marginTop: theme.spacing.sm,
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.textMuted,
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: theme.spacing.xs,
    marginTop: theme.spacing.md,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: theme.spacing.borderRadius.round,
  },
  comunicacionContainer: {
    alignItems: 'center',
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.xxl,
  },
  comunicacionButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.xl,
    borderRadius: theme.spacing.borderRadius.round,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    ...theme.shadows.md,
  },
  comunicacionButtonText: {
    color: theme.colors.textLight,
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: theme.colors.cardBackground,
    borderTopLeftRadius: theme.spacing.borderRadius.xl,
    borderTopRightRadius: theme.spacing.borderRadius.xl,
    paddingTop: theme.spacing.lg,
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.xl,
    maxHeight: height * 0.8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  modalTitle: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.textPrimary,
  },
  closeButton: {
    padding: theme.spacing.sm,
  },
  modalScrollContent: {
    paddingBottom: theme.spacing.xl,
  },
  modalSection: {
    marginBottom: theme.spacing.lg,
  },
  modalLabel: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.sm,
  },
  required: {
    color: theme.colors.danger,
  },
  dropdown: {
    backgroundColor: theme.colors.gray50,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.spacing.borderRadius.md,
    paddingHorizontal: theme.spacing.md,
    height: 50,
  },
  placeholderStyle: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.placeholder,
  },
  selectedTextStyle: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.textPrimary,
  },
  input: {
    backgroundColor: theme.colors.gray50,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.spacing.borderRadius.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.textPrimary,
  },
  descripcionInput: {
    height: 100,
    textAlignVertical: 'top',
  },
  inputError: {
    borderColor: theme.colors.danger,
  },
  errorText: {
    color: theme.colors.danger,
    fontSize: theme.typography.fontSize.sm,
    marginTop: theme.spacing.xs,
  },
  charCounter: {
    textAlign: 'right',
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.textMuted,
    marginTop: theme.spacing.xs,
  },
  enviarButton: {
    backgroundColor: theme.colors.danger,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.spacing.borderRadius.md,
    alignItems: 'center',
    marginTop: theme.spacing.lg,
    ...theme.shadows.md,
  },
  enviarButtonDisabled: {
    opacity: 0.6,
  },
  enviarButtonText: {
    color: theme.colors.textLight,
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.bold,
  },
  cancelarButton: {
    paddingVertical: theme.spacing.md,
    alignItems: 'center',
    marginTop: theme.spacing.sm,
  },
  cancelarButtonText: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.medium,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderLight,
  },
  infoText: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.textPrimary,
    flex: 1,
  },
});