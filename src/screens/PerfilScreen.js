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
  RefreshControl
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import styles from '../styles/perfilStyles';
import colors from '../themes/colors';
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

  // Preparar items de historial clínico (últimos 2)
  const historialClinicoItems = todosReportes
    .filter(r => r.resumenFisico)
    .slice(0, 2)
    .map(r => ({
      titulo: 'Resumen Físico',
      descripcion: r.resumenFisico,
      fecha: new Date(r.fechaGenerado).toLocaleDateString()
    }));

  // Preparar items de historial psicológico (últimos 2)
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

  const dotAnims = useRef([]).current;

  const [tipo, setTipo] = useState('');
  const [descripcion, setDescripcion] = useState('');

  const [nivel, setNivel] = useState('');
  // ✅ AGREGAR ESTOS NUEVOS ESTADOS:
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ✅ FUNCIÓN DE VALIDACIÓN
const validateForm = () => {
  const newErrors = {};

  if (!tipo) {
    newErrors.tipo = 'Selecciona un tipo de emergencia';
  }

  if (!nivel) {
    newErrors.nivel = 'Selecciona un nivel de emergencia';
  }

  if (!descripcion || descripcion.trim().length < 10) {
    newErrors.descripcion = 'La descripción debe tener al menos 10 caracteres';
  }

  setErrors(newErrors);
  return Object.keys(newErrors).length === 0;
};

// ✅ FUNCIÓN MEJORADA PARA ENVIAR SOLICITUD
// ✅ FUNCIÓN MEJORADA PARA ENVIAR SOLICITUD
const handleEnviarSolicitud = async () => {
  if (!validateForm()) {
    Alert.alert('Error', 'Por favor completa todos los campos correctamente');
    return;
  }

  if (isSubmitting) {
    console.log('⏳ Ya se está enviando...');
    return;
  }

  setIsSubmitting(true);

  try {
    // 1. Permiso de ubicación
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Error', 'Permiso de ubicación denegado');
      return;
    }

    // 2. Obtener ubicación actual
    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.High,
    });
    const latitud = location.coords.latitude;
    const longitud = location.coords.longitude;

    // ❌ QUITAR TODO EL BLOQUE DE GEOCODING (líneas 118-131)
    // 3. Obtener dirección legible
    // let direccion = 'Ubicación reportada';
    // try {
    //   const geocode = await Location.reverseGeocodeAsync({
    //     latitude: latitud,
    //     longitude: longitud,
    //   });
    //   ...
    // }

    // 4. Fecha actual
    const fecha = new Date().toISOString();

    // 5. Convertir nivel a número
    const nivelNum = parseInt(nivel);

    // 6. Verificar voluntario
    if (!voluntario || !voluntario.id) {
      throw new Error('No se pudo obtener ID del voluntario');
    }

    console.log('📤 Enviando solicitud:', {
      tipo,
      nivelEmergencia: nivelNum,
      descripcion: descripcion.trim(),
      voluntarioId: voluntario.id,
      latitud,
      longitud,
      // ❌ QUITAR: direccion,
    });

    // 7. Enviar a backend
    await crearSolicitudAyuda({
      tipo,
      descripcion: descripcion.trim(),
      nivelEmergencia: nivelNum,
      fecha,
      voluntarioId: voluntario.id.toString(),
      latitud,
      longitud,
      // ❌ QUITAR: direccion,
    });

    console.log('✅ Solicitud enviada exitosamente');

    // 8. Limpiar formulario
    setTipo('');
    setNivel('');
    setDescripcion('');
    setErrors({});

    // 9. Cerrar modal
    closeEmergencia();

    // 10. Mostrar confirmación
    Alert.alert(
      '✅ Emergencia reportada',
      'Tu solicitud ha sido enviada. Un equipo la revisará pronto.',
      [{ text: 'OK' }]
    );

  } catch (err) {
    console.error('❌ Error completo:', err);
    
    const errorMsg = err.response?.data?.message 
      || err.message 
      || 'No se pudo enviar la solicitud';

    Alert.alert('Error', errorMsg);
  } finally {
    setIsSubmitting(false);
  }
};



  const fetchVoluntario = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      const email = getLoggedCi();
      console.log(email);
      const voluntarioData = await getVoluntarioByCi(email);

      if (!voluntarioData) {
        console.warn('Voluntario no encontrado para:', email);
        setVoluntario(null);
        return;
      }

      setVoluntario(voluntarioData);
      const reportes = await obtenerReportePorVoluntarioId(voluntarioData.id.toString());
      const cursos = await obtenerCursosPorVoluntarioId(voluntarioData.id);
      const necesidadesData = await obtenerNecesidadesPorVoluntarioId(voluntarioData.id.toString());
      const capacitacionesData = await obtenerCapacitacionesPorVoluntarioId(voluntarioData.id.toString());

      if (necesidadesData) {
        setNecesidades(necesidadesData);
      }
      if (capacitacionesData) {
        setCapacitaciones(capacitacionesData);
      }

      if (reportes && reportes.length > 0) {
        const reportesOrdenados = [...reportes].sort((a, b) => new Date(b.fechaGenerado) - new Date(a.fechaGenerado));
        setTodosReportes(reportesOrdenados);
        setReporte(reportesOrdenados[0]); // El más reciente para otros usos
      }
      if (cursos) {
        setCursosAsignados(cursos);
      }
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
      // Recargar datos cada vez que la pantalla recibe foco
      fetchVoluntario();
    }, [fetchVoluntario])
  );

  useEffect(() => {
    const initFetch = async () => {
      await fetchVoluntario();
    };

    initFetch();
  }, [fetchVoluntario]);

  useEffect(() => {
    let intervalId;

    const iniciarSeguimiento = async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;

      const email = getLoggedCi();
      const voluntario = await getVoluntarioByCi(email);
      if (!voluntario) return;

      intervalId = setInterval(async () => {
        try {
          const location = await Location.getCurrentPositionAsync({});
          await crearHistorialUbicacion(
            location.coords.latitude,
            location.coords.longitude,
            voluntario.id.toString()
          );
        } catch (err) {
          console.error('Error guardando ubicación:', err.message);
        }
      }, 3600000); //3600000
    };

    iniciarSeguimiento();
    return () => clearInterval(intervalId);
  }, [voluntario?.id]);

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
          toValue: -200, // Ajusta este valor según necesites
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
          outputRange: [colors.blanco, colors.naranjaFuerte],
        });

        return <Animated.View key={i} style={[styles.dot, { backgroundColor }]} />;
      })}
    </View>
  );

  const renderCarouselItem = ({ item }) => (
    <TouchableOpacity
      style={styles.carouselItem}
      onPress={() => navigation.navigate(item.screen)}
    >
      <Text style={styles.carouselSectionTitle}>{item.titulo}</Text>
      {item.items && item.items.length > 0 ? (
        item.items.map((subItem, index) => (
          <View key={index} style={styles.cardContainer}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>{subItem.titulo}</Text>
              {subItem.fecha && (
                <View style={styles.dateContainer}>
                  <FontAwesome5 name="calendar-alt" size={12} color={colors.gray} />
                  <Text style={styles.cardDate}>{subItem.fecha}</Text>
                </View>
              )}
            </View>
            <Text style={styles.cardDescription} numberOfLines={2} ellipsizeMode="tail">{subItem.descripcion}</Text>
          </View>
        ))
      ) : (
        <View style={styles.emptyStateContainer}>
          <FontAwesome5 name="inbox" size={24} color={colors.gray} />
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
      <View style={[styles.loadingContainer, { backgroundColor: colors.fondo }]}>
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color={colors.amarillo} />
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
        <TouchableOpacity
          style={styles.logoutButton2}
          onPress={handleUserNotFound}
        >
          <Text style={styles.logoutText}>Volver al Login</Text>

        </TouchableOpacity>
      </View>
    );
  }

  return (
    <Animated.View style={[styles.container, { backgroundColor: colors.fondo, opacity: fadeAnim }]}>
      <ScrollView 
        contentContainerStyle={{ paddingBottom: 100 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.naranjaFuerte]}
            tintColor={colors.naranjaFuerte}
          />
        }
      >
        <Animated.View style={[styles.greenContainer, { transform: [{ translateY: blueAnim }] }]} />

        <View style={{ flexDirection: 'row', justifyContent: 'flex-end', paddingHorizontal: 20, paddingTop: 10 }}>
          <TouchableOpacity
            style={styles.logoutButton}
            onPress={handleLogout}
          >
            <Ionicons name="log-out-outline" size={24} color={colors.amarillo} />
          </TouchableOpacity>
        </View>
        {/* Perfil */}
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
            <View style={[styles.statusDot, { backgroundColor: 'green' }]} />
          </View>

          <Text style={styles.name}>{voluntario.nombre} {voluntario.apellido}</Text>
          
          {/* Rol del voluntario con diseño mejorado */}
          <View style={styles.roleContainer}>
            <View style={styles.roleBadge}>
              <FontAwesome5 
                name={voluntario.rol_id === 3 ? "users" : "user-friends"} 
                size={14} 
                color={colors.blanco} 
                style={styles.roleIcon}
              />
              <Text style={styles.roleText}>
                {voluntario.rol_id === 3 ? 'Comunario' : 'Voluntario'}
              </Text>
            </View>
          </View>

          <View style={styles.buttonsRow}>
            <TouchableOpacity style={styles.circleButton} onPress={openInfo}>
              <Ionicons name="information-circle-outline" size={24} color={colors.amarillo} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.circleButton} onPress={() => navigation.navigate("Evaluaciones")}>
              <Ionicons name="document-text-outline" size={24} color={colors.amarillo} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.circleButton} onPress={() => navigation.navigate("Solicitudes")}>
              <Ionicons name="file-tray-full-outline" size={24} color={colors.amarillo} />
            </TouchableOpacity>

            

            <TouchableOpacity style={styles.emergenciaButton} onPress={openEmergencia}>
              <Ionicons name="megaphone-outline" size={24} color="white" />
            </TouchableOpacity>


            
          </View>

          

        </View>

        {/* Historial */}
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

        {/* Necesidades y Capacitaciones */}
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

        {/* Cursos Asignados */}
        <TouchableOpacity
          style={styles.sectionCard}
          onPress={() => navigation.navigate('Cursos')}
        >
          <Text style={styles.carouselSectionTitle}>Cursos Asignados</Text>
          {cursosAsignados && cursosAsignados.length > 0 ? (
            cursosAsignados
              .slice(0, 2) 
              .map((curso, index) => (
                <View key={index} style={styles.cardContainer}>
                  <View style={styles.cardHeader}>
                    <Text style={styles.cardTitle}>{curso.nombre}</Text>
                  </View>
                  <Text style={styles.cardDescription}>{curso.descripcion}</Text>
                </View>
              ))
          ) : (
            <View style={styles.emptyStateContainer}>
              <FontAwesome5 name="inbox" size={24} color={colors.gray} />
              <Text style={styles.emptyStateText}>No hay cursos asignados</Text>
            </View>
            
          )}
        </TouchableOpacity>

        <View style={{ alignItems: 'center', marginTop: 20, marginBottom: 40 }}>
          <TouchableOpacity
            onPress={() => navigation.navigate("Comunicacion")}
            style={{
              backgroundColor: colors.naranjaFuerte,
              paddingVertical: 14,
              paddingHorizontal: 30,
              borderRadius: 30,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: 10,
              elevation: 3
            }}
          >
            <Ionicons name="chatbox-ellipses-outline" size={22} color="#fff" />
            <Text style={{ color: "#fff", fontSize: 18, fontWeight: "bold" }}>
              Comunicación
            </Text>
          </TouchableOpacity>
        </View>
  

        



      </ScrollView>

            
      {/* Modal Información Voluntario */}
      <Modal transparent visible={infoVisible} animationType="fade">
        <Pressable style={styles.modalBackdrop} onPress={closeInfo} />
        <Animated.View style={[styles.modalContent, { transform: [{ translateY: panelAnim }] }]}>
          <Text style={styles.modalTitle}>Información del Voluntario</Text>

          <View style={styles.infoRow}>
            <FontAwesome5 name="user" size={20} color={colors.amarillo} />
            <Text style={styles.infoText}>{voluntario.nombre} {voluntario.apellido}</Text>
          </View>
          <View style={styles.infoRow}>
            <FontAwesome5 name="id-card" size={20} color={colors.amarillo} />
            <Text style={styles.infoText}>{voluntario.ci}</Text>
          </View>
          <View style={styles.infoRow}>
            <FontAwesome5 name="phone" size={20} color={colors.amarillo} />
            <Text style={styles.infoText}>{voluntario.telefono}</Text>
          </View>
          <View style={styles.infoRow}>
            <FontAwesome5 name="tint" size={20} color={colors.amarillo} />
            <Text style={styles.infoText}>{voluntario.tipo_sangre}</Text>
          </View>
        </Animated.View>
      </Modal>

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
            {/* ✅ Header con botón de cerrar */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Reportar Emergencia</Text>
              <TouchableOpacity onPress={closeEmergencia} style={styles.closeButton}>
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView
              contentContainerStyle={styles.modalScrollContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              
              {/* Tipo de emergencia */}
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

              {/* Nivel de emergencia */}
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

              {/* Descripción */}
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
                />
                <Text style={styles.charCounter}>{descripcion.length}/500</Text>
                {errors.descripcion && <Text style={styles.errorText}>{errors.descripcion}</Text>}
              </View>

              {/* Botón de enviar */}
              <TouchableOpacity
                style={[
                  styles.enviarButton,
                  isSubmitting && styles.enviarButtonDisabled
                ]}
                onPress={handleEnviarSolicitud}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.enviarButtonText}>ENVIAR EMERGENCIA</Text>
                )}
              </TouchableOpacity>

              {/* Botón de cancelar */}
              <TouchableOpacity
                style={styles.cancelarButton}
                onPress={closeEmergencia}
              >
                <Text style={styles.cancelarButtonText}>Cancelar</Text>
              </TouchableOpacity>
              
            </ScrollView>
          </Animated.View>
        </Modal>
      </KeyboardAvoidingView>
    </Animated.View>
  );
}


