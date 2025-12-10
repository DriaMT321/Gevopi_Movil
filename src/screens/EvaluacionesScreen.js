import React, { useEffect, useState, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, Animated, Pressable, Modal, Platform, StyleSheet } from 'react-native';
import { theme } from '../themes';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useNavigation } from '@react-navigation/native';
import { FontAwesome5, Ionicons } from '@expo/vector-icons';

import { getLoggedCi } from '../services/authService';
import { getVoluntarioByCi } from '../services/voluntarioService';
import { obtenerEvaluacionesPorVoluntarioId } from '../services/queriesSQL';

export default function EvaluacionesScreen() {
  const navigation = useNavigation();

  const [search, setSearch] = useState('');
  const [voluntarioId, setVoluntarioId] = useState(null);
  const [evaluaciones, setEvaluaciones] = useState([]);
  const [loading, setLoading] = useState(true);

  const [filtrosAplicados, setFiltrosAplicados] = useState({
    estado: null,
    tipo: null,
    desde: null,
    hasta: null,
  });

  const [filtrosTemp, setFiltrosTemp] = useState({
    estado: null,
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

  const hayFiltrosActivos = filtrosAplicados.estado !== null || 
                          filtrosAplicados.tipo !== null || 
                          filtrosAplicados.desde || 
                          filtrosAplicados.hasta;

  useEffect(() => {
    const fetchData = async () => {
      try {
        const ci = await getLoggedCi();
        const voluntario = await getVoluntarioByCi(ci);
        if (voluntario && voluntario.id) {
          setVoluntarioId(parseInt(voluntario.id));
          
          const reportes = await obtenerEvaluacionesPorVoluntarioId(voluntario.id);
          
          const evaluacionesAdaptadas = [];
          reportes.forEach(reporte => {
            const fechaFormateada = reporte.fecha ? reporte.fecha : null;
            
            if (reporte.resumen_fisico) {
              evaluacionesAdaptadas.push({
                id: `${reporte.id}-fisica`,
                reporteId: reporte.id,
                titulo: 'Evaluación Física',
                tipo: 'fisica',
                fechaRealizada: fechaFormateada,
                fechaResultado: fechaFormateada,
                resumen: reporte.resumen_fisico,
                observaciones: reporte.observaciones,
                recomendaciones: reporte.recomendaciones,
                estado_general: reporte.estado_general,
                cursos_recomendados: reporte.cursos_recomendados || [],
                aptitud_necesidades: reporte.aptitud_necesidades || null,
              });
            }
            
            if (reporte.resumen_emocional) {
              evaluacionesAdaptadas.push({
                id: `${reporte.id}-emocional`,
                reporteId: reporte.id,
                titulo: 'Evaluación Emocional',
                tipo: 'emocional',
                fechaRealizada: fechaFormateada,
                fechaResultado: fechaFormateada,
                resumen: reporte.resumen_emocional,
                observaciones: reporte.observaciones,
                recomendaciones: reporte.recomendaciones,
                estado_general: reporte.estado_general,
                cursos_recomendados: reporte.cursos_recomendados || [],
                aptitud_necesidades: reporte.aptitud_necesidades || null,
              });
            }
          });
          
          setEvaluaciones(evaluacionesAdaptadas);
        }
      } catch (error) {
        console.error('Error al obtener datos:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

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
    setFiltrosAplicados({ estado: null, tipo: null, desde: null, hasta: null });

    Animated.parallel([
      Animated.timing(reiniciarOpacity, { toValue: 0, duration: 300, useNativeDriver: true }),
      Animated.timing(searchWidthAnim, { toValue: 1, duration: 300, useNativeDriver: false }),
    ]).start();
  };

  const abrirPicker = (type) => {
    setPickerType(type);
    setPickerValue(type === 'Desde' ? filtrosTemp.desde : filtrosTemp.hasta);
  };

  const onDateChange = (event, selectedDate) => {
    if (pickerType === 'Desde') setFiltrosTemp(prev => ({ ...prev, desde: selectedDate }));
    else setFiltrosTemp(prev => ({ ...prev, hasta: selectedDate }));
    setPickerType(null);
  };

  if (hayFiltrosActivos) {
    Animated.parallel([
      Animated.timing(reiniciarOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
      Animated.timing(searchWidthAnim, { toValue: 0.75, duration: 300, useNativeDriver: false }),
    ]).start();
  }

  const filtrados = evaluaciones.filter(e => {
    const estado = filtrosAplicados.estado;
    const tipo = filtrosAplicados.tipo;
    const desde = filtrosAplicados.desde;
    const hasta = filtrosAplicados.hasta;
    const tieneResultado = !!e.fechaResultado;

    if (estado === 'Realizada' && tieneResultado) return false;
    if (estado === 'Entregada' && !tieneResultado) return false;

    if (tipo === 'Fisica' && !e.titulo.toLowerCase().includes('física')) return false;
    if (tipo === 'Emocional' && !e.titulo.toLowerCase().includes('emocional')) return false;

    const fecha = new Date(e.fechaRealizada);
    if (desde && fecha < desde) return false;
    if (hasta && fecha > hasta) return false;

    if (search.length > 0 && !e.titulo.toLowerCase().includes(search.toLowerCase())) return false;

    return true;
  });

  const getEvaluacionIcon = (tipo) => {
    return tipo === 'fisica' ? 'heartbeat' : 'brain';
  };

  const getEvaluacionColor = (tipo) => {
    return tipo === 'fisica' ? theme.colors.danger : theme.colors.info;
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
        <Text style={styles.headerTitle}>Evaluaciones</Text>
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
              placeholder="Buscar evaluación..."
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
        
        
        renderItem={({ item }) => {
  const entregada = item.fechaResultado !== null;
  const iconColor = getEvaluacionColor(item.tipo);
  
  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => entregada && navigation.navigate('ResultadoEvaluaciones', { evaluacion: item })}
      activeOpacity={entregada ? 0.7 : 1}
    >
      <View style={styles.cardHeader}>
        <View style={styles.iconContainer}>
          <View style={[styles.iconCircle, { backgroundColor: iconColor }]}>
            <FontAwesome5 name={getEvaluacionIcon(item.tipo)} size={20} color={theme.colors.textLight} />
          </View>
        </View>
        
        <View style={styles.cardContent}>
          <Text style={styles.cardTitle}>{item.titulo}</Text>
          
          <View style={styles.fechaRow}>
            <FontAwesome5 name="calendar-alt" size={14} color={theme.colors.textSecondary} />
            <Text style={styles.cardFecha}>Realizada: {item.fechaRealizada}</Text>
          </View>

          {entregada && (
            <>
              <View style={styles.fechaRow}>
                <FontAwesome5 name="calendar-check" size={14} color={theme.colors.success} />
                <Text style={styles.cardFecha}>Resultado: {item.fechaResultado}</Text>
              </View>

              <View style={styles.estadoBadge}>
                <FontAwesome5 name="check-circle" size={12} color={theme.colors.textLight} style={{ marginRight: theme.spacing.xs }} />
                <Text style={styles.estadoBadgeText}>Disponible</Text>
              </View>
            </>
          )}

          {!entregada && (
            <View style={[styles.estadoBadge, { backgroundColor: theme.colors.warning }]}>
              <FontAwesome5 name="clock" size={12} color={theme.colors.textLight} style={{ marginRight: theme.spacing.xs }} />
              <Text style={styles.estadoBadgeText}>Pendiente</Text>
            </View>
          )}
        </View>
      </View>

      {/* ← CAMBIO: Flecha en la parte inferior derecha */}
      {entregada && (
        <View style={styles.cardFooter}>
          <Text style={styles.verDetalleText}>Ver detalles</Text>
          <FontAwesome5 name="arrow-right" size={14} color={theme.colors.primary} />
        </View>
      )}
    </TouchableOpacity>
  );
}}



        ListEmptyComponent={() => (
          <View style={styles.emptyContainer}>
            <FontAwesome5 name="clipboard-list" size={48} color={theme.colors.gray400} />
            <Text style={styles.emptyText}>No se encontraron evaluaciones</Text>
            <Text style={styles.emptySubtext}>Las evaluaciones aparecerán aquí cuando estén disponibles</Text>
          </View>
        )}
      />

      {showFilters && (
        <Modal transparent visible={showFilters} animationType="fade">
          <Pressable style={styles.modalOverlay} onPress={cerrarPanel} />
          <Animated.View style={[styles.modalContent, { transform: [{ translateY: panelAnim }] }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Filtros de Evaluaciones</Text>
              <TouchableOpacity onPress={cerrarPanel} style={styles.closeButton}>
                <Ionicons name="close" size={24} color={theme.colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <Text style={styles.filterLabel}>Tipo de Evaluación</Text>
            <View style={styles.chipsRow}>
              {['Fisica', 'Emocional'].map(tipo => (
                <Pressable
                  key={tipo}
                  style={[
                    styles.choiceChip, 
                    filtrosTemp.tipo === tipo && styles.choiceChipSelected
                  ]}
                  onPress={() => setFiltrosTemp(prev => ({ 
                    ...prev, 
                    tipo: filtrosTemp.tipo === tipo ? null : tipo 
                  }))}
                >
                  <FontAwesome5 
                    name={tipo === 'Fisica' ? 'heartbeat' : 'brain'} 
                    size={14} 
                    color={filtrosTemp.tipo === tipo ? theme.colors.textLight : theme.colors.textPrimary}
                    style={{ marginRight: theme.spacing.xs }}
                  />
                  <Text style={[
                    styles.choiceChipText,
                    filtrosTemp.tipo === tipo && styles.choiceChipTextSelected
                  ]}>
                    {tipo === 'Fisica' ? 'Física' : 'Emocional'}
                  </Text>
                </Pressable>
              ))}
            </View>

            <Text style={styles.filterLabel}>Estado de Evaluación</Text>
            <View style={styles.chipsRow}>
              {['Realizada', 'Entregada'].map(estado => (
                <Pressable
                  key={estado}
                  style={[
                    styles.choiceChip, 
                    filtrosTemp.estado === estado && styles.choiceChipSelected
                  ]}
                  onPress={() => setFiltrosTemp(prev => ({ 
                    ...prev, 
                    estado: filtrosTemp.estado === estado ? null : estado 
                  }))}
                >
                  <FontAwesome5 
                    name={estado === 'Entregada' ? 'check-circle' : 'clock'} 
                    size={14} 
                    color={filtrosTemp.estado === estado ? theme.colors.textLight : theme.colors.textPrimary}
                    style={{ marginRight: theme.spacing.xs }}
                  />
                  <Text style={[
                    styles.choiceChipText,
                    filtrosTemp.estado === estado && styles.choiceChipTextSelected
                  ]}>
                    {estado}
                  </Text>
                </Pressable>
              ))}
            </View>

            {filtrosTemp.estado && (
              <>
                <TouchableOpacity 
                  onPress={() => setMostrarRangoFechas(!mostrarRangoFechas)} 
                  style={styles.rangoFechaToggle}
                >
                  <Text style={styles.rangoFechaText}>Rango de Fechas</Text>
                  <Ionicons 
                    name={mostrarRangoFechas ? 'chevron-up' : 'chevron-down'} 
                    size={20} 
                    color={theme.colors.primary} 
                  />
                </TouchableOpacity>

                {mostrarRangoFechas && (
                  <View style={styles.datePickersContainer}>
                    <TouchableOpacity onPress={() => abrirPicker('Desde')} style={styles.datePicker}>
                      <FontAwesome5 name="calendar" size={16} color={theme.colors.primary} style={{ marginRight: theme.spacing.sm }} />
                      <Text style={styles.datePickerText}>
                        Desde: {filtrosTemp.desde ? filtrosTemp.desde.toLocaleDateString() : 'Seleccionar'}
                      </Text>
                    </TouchableOpacity>

                    {filtrosTemp.estado === 'Entregada' && (
                      <TouchableOpacity onPress={() => abrirPicker('Hasta')} style={styles.datePicker}>
                        <FontAwesome5 name="calendar" size={16} color={theme.colors.primary} style={{ marginRight: theme.spacing.sm }} />
                        <Text style={styles.datePickerText}>
                          Hasta: {filtrosTemp.hasta ? filtrosTemp.hasta.toLocaleDateString() : 'Seleccionar'}
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                )}
              </>
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
            display={Platform.OS === 'ios' ? 'inline' : 'calendar'}
            onChange={onDateChange}
            textColor={Platform.OS === 'ios' ? theme.colors.primary : undefined}
            themeVariant={Platform.OS === 'ios' ? 'light' : undefined}
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
    borderLeftWidth: 4, // ← AGREGAR: borde azul a la izquierda
    borderLeftColor: theme.colors.primary,
    ...theme.shadows.md,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start', // ← CAMBIO: de 'center' a 'flex-start'
  },

  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: theme.spacing.md,
    paddingTop: theme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: theme.colors.borderLight,
    gap: theme.spacing.xs,
  },
  verDetalleText: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.primary,
  },
  
  


  iconContainer: {
    marginRight: theme.spacing.md,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: theme.spacing.borderRadius.round,
    justifyContent: 'center',
    alignItems: 'center',
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
    marginBottom: theme.spacing.xs,
  },
  cardFecha: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.textSecondary,
  },
  estadoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: theme.colors.success,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.spacing.borderRadius.md,
    marginTop: theme.spacing.xs,
  },
  estadoBadgeText: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.semibold,
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
    textAlign: 'center',
    paddingHorizontal: theme.spacing.xl,
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