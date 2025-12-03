import React, { useState, useRef, useEffect, useCallback } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, Animated, Pressable, Modal, Platform, RefreshControl, StyleSheet } from 'react-native';
import { theme } from '../themes';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { FontAwesome5, Ionicons } from '@expo/vector-icons';
import { getLoggedCi } from '../services/authService';
import { getVoluntarioByCi } from '../services/voluntarioService';
import { obtenerReportePorVoluntarioId } from '../services/queriesSQL';

export default function HistorialScreen() {
  const navigation = useNavigation();

  const [search, setSearch] = useState('');
  const [historial, setHistorial] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [filtrosAplicados, setFiltrosAplicados] = useState({
    tipo: null,
    desde: null,
    hasta: null,
  });
  const [filtrosTemp, setFiltrosTemp] = useState({
    tipo: null,
    desde: null,
    hasta: null,
  });

  const [showFilters, setShowFilters] = useState(false);
  const [pickerType, setPickerType] = useState(null);
  const [pickerValue, setPickerValue] = useState(null);
  const [mostrarRangoFechas, setMostrarRangoFechas] = useState(false);

  const panelAnim = useRef(new Animated.Value(500)).current;
  const reiniciarOpacity = useRef(new Animated.Value(0)).current;
  const searchWidthAnim = useRef(new Animated.Value(1)).current;

  const hayFiltrosActivos = filtrosAplicados.tipo !== null || filtrosAplicados.desde || filtrosAplicados.hasta;

  const abrirPanel = () => {
    setFiltrosTemp({ ...filtrosAplicados });
    setShowFilters(true);
    Animated.timing(panelAnim, { toValue: 0, duration: 300, useNativeDriver: true }).start();
  };

  const cerrarPanel = () => {
    Animated.timing(panelAnim, { toValue: 500, duration: 300, useNativeDriver: true }).start(() => setShowFilters(false));
  };

  const aplicarFiltros = () => {
    setFiltrosAplicados({ ...filtrosTemp });
    cerrarPanel();
  };

  const reiniciarFiltros = () => {
    setSearch('');
    setFiltrosAplicados({ tipo: null, desde: null, hasta: null });

    Animated.parallel([
      Animated.timing(reiniciarOpacity, { toValue: 0, duration: 300, useNativeDriver: true }),
      Animated.timing(searchWidthAnim, { toValue: 1, duration: 300, useNativeDriver: false }),
    ]).start();
  };

  const abrirPicker = (type) => {
    setPickerType(type);
    setPickerValue(type === "Desde" ? filtrosTemp.desde : filtrosTemp.hasta);
  };

  const onDateChange = (event, selectedDate) => {
    if (pickerType === "Desde") setFiltrosTemp(prev => ({ ...prev, desde: selectedDate }));
    else setFiltrosTemp(prev => ({ ...prev, hasta: selectedDate }));
    setPickerType(null);
  };

  const fetchHistorial = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      const ci = await getLoggedCi();
      const voluntario = await getVoluntarioByCi(ci);
      if (!voluntario || !voluntario.id) return;

      const reportes = await obtenerReportePorVoluntarioId(voluntario.id.toString());
      if (reportes?.length > 0) {
        const reportesOrdenados = [...reportes].sort((a, b) => new Date(b.fechaGenerado) - new Date(a.fechaGenerado));

        const items = [];

        reportesOrdenados.forEach((reporte) => {
          if (reporte.resumenFisico) {
            items.push({
              tipo: "clinico",
              titulo: "Resumen Clínico",
              descripcion: reporte.resumenFisico,
              fecha: reporte.fechaGenerado,
            });
          }

          if (reporte.resumenEmocional) {
            items.push({
              tipo: "psicologico",
              titulo: "Resumen Psicológico",
              descripcion: reporte.resumenEmocional,
              fecha: reporte.fechaGenerado,
            });
          }
        });

        setHistorial(items);
      }
    } catch (err) {
      console.error("Error cargando historial:", err);
    } finally {
      setRefreshing(false);
    }
  }, []);

  const onRefresh = useCallback(() => {
    fetchHistorial(true);
  }, [fetchHistorial]);

  useFocusEffect(
    useCallback(() => {
      fetchHistorial();
    }, [fetchHistorial])
  );

  if (hayFiltrosActivos) {
    Animated.parallel([
      Animated.timing(reiniciarOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
      Animated.timing(searchWidthAnim, { toValue: 0.75, duration: 300, useNativeDriver: false }),
    ]).start();
  }

  const filtrados = historial.filter(e => {
    const tipo = filtrosAplicados.tipo;
    const desde = filtrosAplicados.desde;
    const hasta = filtrosAplicados.hasta;

    if (tipo && e.tipo !== tipo) return false;

    const fecha = new Date(e.fecha);
    if (desde && fecha < desde) return false;
    if (hasta && fecha > hasta) return false;

    if (search.length > 0 && !e.titulo.toLowerCase().includes(search.toLowerCase())) return false;

    return true;
  });

  const getTipoIcon = (tipo) => {
    return tipo === 'clinico' ? 'heartbeat' : 'brain';
  };

  const getTipoColor = (tipo) => {
    return tipo === 'clinico' ? theme.colors.danger : theme.colors.info;
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color={theme.colors.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Historial Médico</Text>
      </View>

      <View style={styles.filtersRow}>
        <TouchableOpacity 
          onPress={abrirPanel} 
          style={[
            styles.filtroButton, 
            { backgroundColor: hayFiltrosActivos ? theme.colors.primary : theme.colors.cardBackground }
          ]}
        >
          <FontAwesome5 
            name="filter" 
            size={18} 
            color={hayFiltrosActivos ? theme.colors.textLight : theme.colors.primary} 
          />
        </TouchableOpacity>

        <Animated.View style={{ flex: searchWidthAnim }}>
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color={theme.colors.textSecondary} style={styles.searchIcon} />
            <TextInput
              placeholder="Buscar historial..."
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
        data={filtrados}
        keyExtractor={(item, index) => index.toString()}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[theme.colors.primary]}
            tintColor={theme.colors.primary}
          />
        }
        ListEmptyComponent={() => (
          <View style={styles.emptyContainer}>
            <FontAwesome5 name="file-medical" size={48} color={theme.colors.gray400} />
            <Text style={styles.emptyText}>No se encontraron registros</Text>
            <Text style={styles.emptySubtext}>El historial médico aparecerá aquí</Text>
          </View>
        )}
        renderItem={({ item }) => {
          const tipoIcon = getTipoIcon(item.tipo);
          const tipoColor = getTipoColor(item.tipo);
          
          return (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={[styles.iconCircle, { backgroundColor: tipoColor }]}>
                  <FontAwesome5 name={tipoIcon} size={20} color={theme.colors.textLight} />
                </View>
                
                <View style={styles.cardContent}>
                  <Text style={styles.cardTitle}>{item.titulo}</Text>
                  
                  <View style={styles.fechaRow}>
                    <FontAwesome5 name="calendar-alt" size={14} color={theme.colors.textSecondary} />
                    <Text style={styles.cardFecha}>
                      {new Date(item.fecha).toLocaleDateString('es-ES', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </Text>
                  </View>
                </View>
              </View>

              <View style={styles.cardBody}>
                <Text style={styles.cardSubtitle} numberOfLines={3} ellipsizeMode="tail">
                  {item.descripcion}
                </Text>
              </View>

              <View style={styles.tipoBadge}>
                <Text style={styles.tipoBadgeText}>
                  {item.tipo === 'clinico' ? 'Clínico' : 'Psicológico'}
                </Text>
              </View>
            </View>
          );
        }}
      />

      {showFilters && (
        <Modal transparent visible={showFilters} animationType="fade">
          <Pressable style={styles.modalOverlay} onPress={cerrarPanel} />
          <Animated.View style={[styles.modalContent, { transform: [{ translateY: panelAnim }] }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Filtros de Historial</Text>
              <TouchableOpacity onPress={cerrarPanel} style={styles.closeButton}>
                <Ionicons name="close" size={24} color={theme.colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <Text style={styles.filterLabel}>Tipo de Historial</Text>
            <View style={styles.chipsRow}>
              {[
                { value: 'clinico', label: 'Clínico', icon: 'heartbeat' },
                { value: 'psicologico', label: 'Psicológico', icon: 'brain' }
              ].map(tipo => (
                <Pressable
                  key={tipo.value}
                  style={[
                    styles.choiceChip, 
                    filtrosTemp.tipo === tipo.value && styles.choiceChipSelected
                  ]}
                  onPress={() => setFiltrosTemp(prev => ({ 
                    ...prev, 
                    tipo: filtrosTemp.tipo === tipo.value ? null : tipo.value 
                  }))}
                >
                  <FontAwesome5 
                    name={tipo.icon} 
                    size={14} 
                    color={filtrosTemp.tipo === tipo.value ? theme.colors.textLight : theme.colors.textPrimary}
                    style={{ marginRight: theme.spacing.xs }}
                  />
                  <Text style={[
                    styles.choiceChipText,
                    filtrosTemp.tipo === tipo.value && styles.choiceChipTextSelected
                  ]}>
                    {tipo.label}
                  </Text>
                </Pressable>
              ))}
            </View>

            <TouchableOpacity 
              onPress={() => setMostrarRangoFechas(!mostrarRangoFechas)} 
              style={styles.rangoFechaToggle}
            >
              <Text style={styles.rangoFechaText}>Rango de Fechas</Text>
              <Ionicons 
                name={mostrarRangoFechas ? "chevron-up" : "chevron-down"} 
                size={20} 
                color={theme.colors.primary} 
              />
            </TouchableOpacity>

            {mostrarRangoFechas && (
              <View style={styles.datePickersContainer}>
                <TouchableOpacity onPress={() => abrirPicker("Desde")} style={styles.datePicker}>
                  <FontAwesome5 name="calendar" size={16} color={theme.colors.primary} style={{ marginRight: theme.spacing.sm }} />
                  <Text style={styles.datePickerText}>
                    Desde: {filtrosTemp.desde ? filtrosTemp.desde.toLocaleDateString() : 'Seleccionar'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={() => abrirPicker("Hasta")} style={styles.datePicker}>
                  <FontAwesome5 name="calendar" size={16} color={theme.colors.primary} style={{ marginRight: theme.spacing.sm }} />
                  <Text style={styles.datePickerText}>
                    Hasta: {filtrosTemp.hasta ? filtrosTemp.hasta.toLocaleDateString() : 'Seleccionar'}
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            <TouchableOpacity onPress={aplicarFiltros} style={styles.applyButton}>
              <Text style={styles.applyButtonText}>Aplicar Filtros</Text>
            </TouchableOpacity>
          </Animated.View>
        </Modal>
      )}

      <Modal visible={pickerType !== null} transparent animationType="fade">
        <Pressable style={styles.pickerOverlay} onPress={() => setPickerType(null)} />
        <View style={styles.pickerContainer}>
          <DateTimePicker
            value={pickerValue || new Date()}
            mode="date"
            display={Platform.OS === 'ios' ? "inline" : "calendar"}
            onChange={onDateChange}
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
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: theme.spacing.borderRadius.round,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.xs,
  },
  fechaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  cardFecha: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.textSecondary,
  },
  cardBody: {
    marginBottom: theme.spacing.md,
  },
  cardSubtitle: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.textSecondary,
    lineHeight: 20,
  },
  tipoBadge: {
    alignSelf: 'flex-start',
    backgroundColor: theme.colors.gray100,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.spacing.borderRadius.md,
  },
  tipoBadgeText: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.textSecondary,
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
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  choiceChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.spacing.borderRadius.round,
    backgroundColor: theme.colors.gray100,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  choiceChipSelected: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  choiceChipText: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.textPrimary,
  },
  choiceChipTextSelected: {
    color: theme.colors.textLight,
  },
  rangoFechaToggle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
    backgroundColor: theme.colors.gray50,
    borderRadius: theme.spacing.borderRadius.md,
    marginBottom: theme.spacing.sm,
  },
  rangoFechaText: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.primary,
  },
  datePickersContainer: {
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.md,
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
  },
  datePickerText: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.textPrimary,
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