import React, { useEffect, useState, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, FlatList,
  Animated, Pressable, Modal, Platform, StyleSheet
} from 'react-native';
import { Dropdown } from 'react-native-element-dropdown';
import DateTimePicker from '@react-native-community/datetimepicker';
import MapView, { Marker } from 'react-native-maps';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { theme } from '../themes';
import { useNavigation } from '@react-navigation/native';

import { getLoggedCi } from '../services/authService';
import { getVoluntarioByCi } from '../services/voluntarioService';
import { obtenerTodasSolicitudes } from '../services/solicitudService';

export default function SolicitudesScreen() {
  const navigation = useNavigation();
  const panelAnim = useRef(new Animated.Value(500)).current;
  const searchWidthAnim = useRef(new Animated.Value(1)).current;
  const reiniciarOpacity = useRef(new Animated.Value(0)).current;

  const [solicitudes, setSolicitudes] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [pickerVisible, setPickerVisible] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [pickerDate, setPickerDate] = useState(null);

  const [filtros, setFiltros] = useState({ tipo: null, nivel: null, estado: null, fecha: null });
  const [tempFiltros, setTempFiltros] = useState({ tipo: null, nivel: null, estado: null, fecha: null });

  const hayFiltros = Object.values(filtros).some(v => v);

  const cargarSolicitudes = async () => {
    try {
      const email = getLoggedCi();
      const voluntario = await getVoluntarioByCi(email);
      const todas = await obtenerTodasSolicitudes();
      const propias = todas.filter(s => s.voluntarioId !== voluntario.id.toString());
      setSolicitudes(propias);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarSolicitudes();
  }, []);

  useEffect(() => {
    const filtrados = solicitudes.filter(s => {
      const coincideTipo = !filtros.tipo || s.tipo?.toLowerCase() === filtros.tipo?.toLowerCase();
      const coincideNivel = !filtros.nivel || s.nivelEmergencia?.toLowerCase() === filtros.nivel?.toLowerCase();
      const coincideEstado = !filtros.estado || s.estado?.toLowerCase() === filtros.estado?.toLowerCase();
      
      const coincideFecha = !filtros.fecha || 
        new Date(s.fecha).toLocaleDateString() === new Date(filtros.fecha).toLocaleDateString();
      
      const coincideBusqueda = !search || 
        s.descripcion?.toLowerCase().includes(search.toLowerCase());
      
      return coincideTipo && coincideNivel && coincideEstado && coincideFecha && coincideBusqueda;
    });
    setFiltered(filtrados);
  }, [filtros, search, solicitudes]);

  const abrirPanel = () => {
    setTempFiltros({ ...filtros });
    setShowFilters(true);
    Animated.timing(panelAnim, { toValue: 0, duration: 300, useNativeDriver: true }).start();
  };

  const cerrarPanel = () => {
    Animated.timing(panelAnim, { toValue: 500, duration: 300, useNativeDriver: true }).start(() => setShowFilters(false));
  };

  const aplicarFiltros = () => {
    setFiltros({ ...tempFiltros });
    cerrarPanel();
  };

  const reiniciarFiltros = () => {
    setSearch('');
    setFiltros({ tipo: null, nivel: null, estado: null, fecha: null });
    Animated.parallel([
      Animated.timing(reiniciarOpacity, { toValue: 0, duration: 300, useNativeDriver: true }),
      Animated.timing(searchWidthAnim, { toValue: 1, duration: 300, useNativeDriver: false }),
    ]).start();
  };

  if (hayFiltros) {
    Animated.parallel([
      Animated.timing(reiniciarOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
      Animated.timing(searchWidthAnim, { toValue: 0.75, duration: 300, useNativeDriver: false }),
    ]).start();
  }

  const getNivelColor = (nivel) => {
    switch (nivel?.toLowerCase()) {
      case 'alta': return theme.colors.danger;
      case 'media': return theme.colors.warning;
      case 'baja': return theme.colors.success;
      default: return theme.colors.gray400;
    }
  };

  const getNivelIcon = (nivel) => {
    switch (nivel?.toLowerCase()) {
      case 'alta': return 'exclamation-triangle';
      case 'media': return 'exclamation-circle';
      case 'baja': return 'info-circle';
      default: return 'circle';
    }
  };

  const getEstadoColor = (estado) => {
    switch (estado?.toLowerCase()) {
      case 'resuelto': return theme.colors.success;
      case 'en progreso': return theme.colors.info;
      case 'respondido': return theme.colors.warning;
      case 'sin responder': return theme.colors.secondary;
      default: return theme.colors.gray400;
    }
  };

  const getTipoIcon = (tipo) => {
    switch (tipo?.toLowerCase()) {
      case 'medica': return 'heartbeat';
      case 'fisica': return 'running';
      case 'emocional': return 'brain';
      case 'recursos': return 'hands-helping';
      default: return 'question-circle';
    }
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity 
      onPress={() => navigation.navigate('DetalleSolicitud', { solicitud: item })}
      activeOpacity={0.7}
    >
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.iconTypeContainer}>
            <View style={[styles.iconCircle, { backgroundColor: theme.colors.primaryLight }]}>
              <FontAwesome5 name={getTipoIcon(item.tipo)} size={18} color={theme.colors.primary} />
            </View>
          </View>
          
          <View style={styles.cardTitleContainer}>
            <Text style={styles.cardTitle}>{item.tipo}</Text>
            <View style={styles.badgesRow}>
              <View style={[styles.priorityBadge, { backgroundColor: getNivelColor(item.nivelEmergencia) }]}>
                <FontAwesome5 name={getNivelIcon(item.nivelEmergencia)} size={10} color={theme.colors.textLight} />
                <Text style={styles.priorityText}>{item.nivelEmergencia}</Text>
              </View>
              <View style={[styles.estadoBadge, { backgroundColor: getEstadoColor(item.estado) }]}>
                <Text style={styles.estadoBadgeText}>{item.estado}</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.descriptionContainer}>
          <FontAwesome5 name="align-left" size={14} color={theme.colors.textSecondary} />
          <Text style={styles.cardSubtitle} numberOfLines={2}>{item.descripcion}</Text>
        </View>

        <View style={styles.infoRow}>
          <View style={styles.infoItem}>
            <FontAwesome5 name="calendar-alt" size={14} color={theme.colors.primary} />
            <Text style={styles.infoText}>{new Date(item.fecha).toLocaleDateString('es-ES', {
              day: '2-digit',
              month: 'short',
              year: 'numeric'
            })}</Text>
          </View>
        </View>

        <View style={styles.mapContainer}>
          <MapView
            style={styles.map}
            initialRegion={{
              latitude: parseFloat(item.latitud),
              longitude: parseFloat(item.longitud),
              latitudeDelta: 0.01,
              longitudeDelta: 0.01,
            }}
            scrollEnabled={false}
            zoomEnabled={false}
            pitchEnabled={false}
            rotateEnabled={false}
          >
            <Marker coordinate={{ latitude: parseFloat(item.latitud), longitude: parseFloat(item.longitud) }}>
              <View style={styles.markerContainer}>
                <FontAwesome5 name="map-marker-alt" size={32} color={theme.colors.danger} />
              </View>
            </Marker>
          </MapView>
          <View style={styles.mapOverlay}>
            <FontAwesome5 name="map-marked-alt" size={14} color={theme.colors.primary} />
            <Text style={styles.locationText}>Ver ubicación completa</Text>
            <FontAwesome5 name="chevron-right" size={12} color={theme.colors.primary} />
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color={theme.colors.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Solicitudes de Ayuda</Text>
      </View>

      <View style={styles.filtersRow}>
        <TouchableOpacity 
          onPress={abrirPanel} 
          style={[
            styles.filtroButton,
            { backgroundColor: hayFiltros ? theme.colors.primary : theme.colors.cardBackground }
          ]}
        >
          <FontAwesome5 
            name="filter" 
            size={18} 
            color={hayFiltros ? theme.colors.textLight : theme.colors.primary} 
          />
        </TouchableOpacity>

        <Animated.View style={{ flex: searchWidthAnim }}>
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color={theme.colors.textSecondary} style={styles.searchIcon} />
            <TextInput
              placeholder="Buscar por descripción..."
              style={styles.input}
              value={search}
              onChangeText={setSearch}
              placeholderTextColor={theme.colors.placeholder}
            />
          </View>
        </Animated.View>

        <Animated.View style={{ opacity: reiniciarOpacity }}>
          <TouchableOpacity onPress={reiniciarFiltros} style={styles.reiniciarButton}>
            <Ionicons name="close" size={20} color={theme.colors.textLight} />
          </TouchableOpacity>
        </Animated.View>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item, index) => index.toString()}
        contentContainerStyle={styles.listContainer}
        renderItem={renderItem}
        ListEmptyComponent={() => (
          <View style={styles.emptyContainer}>
            <FontAwesome5 name="hands-helping" size={48} color={theme.colors.gray400} />
            <Text style={styles.emptyText}>No hay solicitudes disponibles</Text>
            <Text style={styles.emptySubtext}>Las solicitudes de ayuda aparecerán aquí</Text>
          </View>
        )}
      />

      {showFilters && (
        <Modal transparent visible={showFilters} animationType="fade">
          <Pressable style={styles.modalOverlay} onPress={cerrarPanel} />
          <Animated.View style={[styles.modalContent, { transform: [{ translateY: panelAnim }] }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Filtros de Solicitudes</Text>
              <TouchableOpacity onPress={cerrarPanel} style={styles.closeButton}>
                <Ionicons name="close" size={24} color={theme.colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <Text style={styles.filterLabel}>Tipo de Solicitud</Text>
            <Dropdown
              style={styles.dropdown}
              placeholderStyle={styles.dropdownPlaceholder}
              selectedTextStyle={styles.dropdownSelectedText}
              iconStyle={styles.dropdownIcon}
              data={[
                { label: 'Médica', value: 'medica' },
                { label: 'Física', value: 'fisica' },
                { label: 'Emocional', value: 'emocional' },
                { label: 'Recursos', value: 'recursos' }
              ]}
              labelField="label"
              valueField="value"
              value={tempFiltros.tipo}
              placeholder="Selecciona tipo"
              onChange={item => setTempFiltros(prev => ({ ...prev, tipo: item.value }))}
            />

            <Text style={styles.filterLabel}>Nivel de Emergencia</Text>
            <Dropdown
              style={styles.dropdown}
              placeholderStyle={styles.dropdownPlaceholder}
              selectedTextStyle={styles.dropdownSelectedText}
              iconStyle={styles.dropdownIcon}
              data={[
                { label: 'Baja', value: 'baja' },
                { label: 'Media', value: 'media' },
                { label: 'Alta', value: 'alta' }
              ]}
              labelField="label"
              valueField="value"
              value={tempFiltros.nivel}
              placeholder="Selecciona nivel"
              onChange={item => setTempFiltros(prev => ({ ...prev, nivel: item.value }))}
            />

            <Text style={styles.filterLabel}>Estado</Text>
            <Dropdown
              style={styles.dropdown}
              placeholderStyle={styles.dropdownPlaceholder}
              selectedTextStyle={styles.dropdownSelectedText}
              iconStyle={styles.dropdownIcon}
              data={[
                { label: 'Sin responder', value: 'sin responder' },
                { label: 'En progreso', value: 'en progreso' },
                { label: 'Respondido', value: 'respondido' },
                { label: 'Resuelto', value: 'resuelto' }
              ]}
              labelField="label"
              valueField="value"
              value={tempFiltros.estado}
              placeholder="Selecciona estado"
              onChange={item => setTempFiltros(prev => ({ ...prev, estado: item.value }))}
            />

            <Text style={styles.filterLabel}>Fecha</Text>
            <TouchableOpacity onPress={() => setPickerVisible(true)} style={styles.datePicker}>
              <FontAwesome5 name="calendar" size={16} color={theme.colors.primary} style={{ marginRight: theme.spacing.sm }} />
              <Text style={styles.datePickerText}>
                {tempFiltros.fecha ? tempFiltros.fecha.toLocaleDateString() : 'Seleccionar fecha'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={aplicarFiltros} style={styles.applyButton}>
              <Text style={styles.applyButtonText}>Aplicar Filtros</Text>
            </TouchableOpacity>
          </Animated.View>
        </Modal>
      )}

      <Modal visible={pickerVisible} transparent animationType="fade">
        <Pressable style={styles.pickerOverlay} onPress={() => setPickerVisible(false)} />
        <View style={styles.pickerContainer}>
          <DateTimePicker
            value={tempFiltros.fecha || new Date()}
            mode="date"
            display={Platform.OS === 'ios' ? "inline" : "calendar"}
            onChange={(event, selectedDate) => {
              if (selectedDate) {
                setTempFiltros(prev => ({ ...prev, fecha: selectedDate }));
              }
              setPickerVisible(false);
            }}
            textColor={Platform.OS === 'ios' ? theme.colors.primary : undefined}
            themeVariant={Platform.OS === 'ios' ? "light" : undefined}
          />
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.xxl,
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
  headerTitle: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.textPrimary,
    flex: 1,
  },
  filtersRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    gap: theme.spacing.sm,
    backgroundColor: theme.colors.cardBackground,
  },
  filtroButton: {
    width: 44,
    height: 44,
    borderRadius: theme.spacing.borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    ...theme.shadows.sm,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.gray50,
    borderRadius: theme.spacing.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingHorizontal: theme.spacing.md,
    height: 44,
  },
  searchIcon: {
    marginRight: theme.spacing.sm,
  },
  input: {
    flex: 1,
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.textPrimary,
  },
  reiniciarButton: {
    width: 44,
    height: 44,
    borderRadius: theme.spacing.borderRadius.md,
    backgroundColor: theme.colors.danger,
    justifyContent: 'center',
    alignItems: 'center',
    ...theme.shadows.sm,
  },
  listContainer: {
    padding: theme.spacing.lg,
  },
  card: {
    backgroundColor: theme.colors.cardBackground,
    borderRadius: theme.spacing.borderRadius.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.primary,
    ...theme.shadows.md,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.md,
  },
  iconTypeContainer: {
    marginRight: theme.spacing.md,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: theme.spacing.borderRadius.round,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardTitleContainer: {
    flex: 1,
  },
  cardTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.xs,
  },
  badgesRow: {
    flexDirection: 'row',
    gap: theme.spacing.xs,
    flexWrap: 'wrap',
  },
  priorityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.spacing.borderRadius.md,
    gap: theme.spacing.xs,
  },
  priorityText: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.textLight,
    textTransform: 'capitalize',
  },
  estadoBadge: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.spacing.borderRadius.md,
  },
  estadoBadgeText: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.textLight,
  },
  descriptionContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: theme.colors.borderLight,
  },
  cardSubtitle: {
    flex: 1,
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.textSecondary,
    lineHeight: 20,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.md,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  infoText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.textSecondary,
  },
  mapContainer: {
    height: 180,
    borderRadius: theme.spacing.borderRadius.md,
    overflow: 'hidden',
    backgroundColor: theme.colors.gray100,
  },
  map: {
    flex: 1,
  },
  markerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  mapOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 123, 255, 0.95)',
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.xs,
  },
  locationText: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.textLight,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: theme.spacing.xxl * 2,
  },
  emptyText: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.textPrimary,
    marginTop: theme.spacing.lg,
  },
  emptySubtext: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.xs,
  },
  modalOverlay: {
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
    padding: theme.spacing.lg,
    maxHeight: '80%',
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
  filterLabel: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.sm,
    marginTop: theme.spacing.sm,
  },
  dropdown: {
    height: 44,
    backgroundColor: theme.colors.gray50,
    borderRadius: theme.spacing.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  dropdownPlaceholder: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.placeholder,
  },
  dropdownSelectedText: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.textPrimary,
  },
  dropdownIcon: {
    width: 20,
    height: 20,
  },
  datePicker: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.gray50,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.spacing.borderRadius.md,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  datePickerText: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.textPrimary,
    flex: 1,
  },
  applyButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.spacing.borderRadius.md,
    alignItems: 'center',
    marginTop: theme.spacing.md,
    ...theme.shadows.md,
  },
  applyButtonText: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.textLight,
  },
  pickerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  pickerContainer: {
    backgroundColor: theme.colors.cardBackground,
    padding: theme.spacing.lg,
  },
});