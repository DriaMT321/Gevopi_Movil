import React, { useState, useRef, useEffect } from 'react';
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
  KeyboardAvoidingView, Platform, Keyboard, Alert
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
import { crearSolicitudAyuda, crearHistorialUbicacion } from '../services/mutationsNOSQL';
import { obtenerReportePorVoluntarioId, obtenerCursosPorVoluntarioId } from '../services/queriesSQL';

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
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);

  const modalOffsetAnim = useRef(new Animated.Value(0)).current;

  const historialData = [
    {
      titulo: 'Historial Clínico',
      screen: 'Historial',
      items: reporte
        ? [{
          titulo: 'Resumen Físico',
          descripcion: reporte.resumenFisico,
          fecha: new Date(reporte.fechaGenerado).toLocaleDateString()
        }].slice(0, 3)
        : [],
    },
    {
      titulo: 'Historial Psicológico',
      screen: 'Historial',
      items: reporte
        ? [{ titulo: 'Resumen Emocional', descripcion: reporte.resumenEmocional, fecha: new Date(reporte.fechaGenerado).toLocaleDateString() }].slice(0, 3)
        : [],
    },
  ];

  const [cursosAsignados, setCursosAsignados] = useState([]);



  const necesidadesData = [
    {
      titulo: 'Necesidades',
      screen: 'NecesidadesCapacitaciones',
      items: reporte?.necesidades?.map((n) => ({
        titulo: n.tipo,
        descripcion: n.descripcion,
      })).slice(0, 3) || [],
    },
    {
      titulo: 'Capacitaciones',
      screen: 'NecesidadesCapacitaciones',
      items: reporte?.capacitaciones?.map((c) => ({
        titulo: c.nombre,
        descripcion: c.descripcion,
      })).slice(0, 3) || [],
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

  const handleEnviarSolicitud = async () => {
    if (!tipo || !descripcion || !nivel) {
      alert('Por favor completa todos los campos');
      return;
    }

    try {
      // 1. Permiso y ubicación
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        alert('Permiso de ubicación denegado');
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      const latitud = location.coords.latitude;
      const longitud = location.coords.longitude;

      // 2. Fecha actual ISO
      const fecha = new Date().toISOString();

      // 3. Convertir nivel a ENUM
      const nivelNum = parseInt(nivel);
      const nivelEnum =
        nivelNum <= 2 ? 'BAJO' : nivelNum <= 3 ? 'MEDIO' : 'ALTO';

      // 4. Verificar ID
      if (!voluntario || !voluntario.id) {
        alert('No se pudo obtener ID del voluntario');
        return;
      }

      // 5. Enviar a backend usando función modular
      await crearSolicitudAyuda({
        tipo,
        descripcion,
        nivelEmergencia: nivelEnum,
        fecha,
        voluntarioId: voluntario.id.toString(),
        latitud,
        longitud,
      });

      // 6. Reset y feedback
      alert('Solicitud de ayuda enviada correctamente');
      setEmergenciaVisible(false);
      setTipo('');
      setDescripcion('');
      setNivel('');
    } catch (err) {
      console.error('Error al enviar solicitud:', err);
      alert('Error al enviar solicitud. Revisa consola.');
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      fadeAnim.setValue(0);
      Animated.timing(fadeAnim, {
        toValue: 1,
        useNativeDriver: true,
      }).start();
    }, [])
  );

  useEffect(() => {
    const fetchVoluntario = async () => {
      try {
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


        if (reportes && reportes.length > 0) {
          const masReciente = [...reportes].sort((a, b) => new Date(b.fechaGenerado) - new Date(a.fechaGenerado))[0];
          setReporte(masReciente);
        }
        if (cursos) {
          setCursosAsignados(cursos);
        }
      } catch (error) {
        console.error('Error al cargar voluntario:', error);
      } finally {
        setLoadingVoluntario(false);

        Animated.timing(blueAnim, {
          toValue: 0,
          duration: 800,
          useNativeDriver: false,
        }).start();
      }
    };

    fetchVoluntario();

  }, []);

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
    Animated.timing(panelAnim, { toValue: 1000, duration: 300, useNativeDriver: true }).start(() =>
      setEmergenciaVisible(false)
    );
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
            <Text style={styles.cardDescription}>{subItem.descripcion}</Text>
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
      <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
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
              .slice(0, 3) 
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
            <Text style={styles.modalTitle}>Reportar Emergencia</Text>

            <ScrollView
              contentContainerStyle={styles.modalScrollContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              
              {/* Tipo de emergencia */}
              <View style={styles.modalSection}>
                <Text style={styles.modalLabel}>Tipo de emergencia</Text>
                <Dropdown
                  style={styles.dropdown}
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
                  onChange={item => setTipo(item.value)}
                />
              </View>

              {/* Nivel de emergencia */}
              <View style={styles.modalSection}>
                <Text style={styles.modalLabel}>Nivel de emergencia</Text>
                <Dropdown
                  style={styles.dropdown}
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
                  onChange={item => setNivel(item.value)}
                />
              </View>

              {/* Descripción */}
              <View style={styles.modalSection}>
                <Text style={styles.modalLabel}>Descripción</Text>
                <TextInput
                  placeholder="Describe brevemente la emergencia..."
                  style={[styles.input, styles.descripcionInput]}
                  value={descripcion}
                  onChangeText={setDescripcion}
                  multiline={false}
                  returnKeyType="done"
                  blurOnSubmit={true}
                  onSubmitEditing={() => {
                    Keyboard.dismiss();
                  }}
                />
              </View>

              {/* Botón */}
              <TouchableOpacity
                style={styles.enviarButton}
                onPress={handleEnviarSolicitud}
              >
                <Text style={styles.enviarButtonText}>ENVIAR</Text>
              </TouchableOpacity>

              
            </ScrollView>

            
          </Animated.View>
        </Modal>
      </KeyboardAvoidingView>
    </Animated.View>
  );
}
