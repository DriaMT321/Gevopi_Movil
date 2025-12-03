import React, { useEffect, useState, useRef, useCallback } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, Animated, Pressable, Modal, Platform, StyleSheet } from 'react-native';
import { theme } from '../themes';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { FontAwesome5, Ionicons } from '@expo/vector-icons';

import { getLoggedCi } from '../services/authService';
import { getVoluntarioByCi } from '../services/voluntarioService';
import { getCursosByVoluntario } from '../services/cursosService';

export default function CursosScreen() {
  const navigation = useNavigation();

  const [search, setSearch] = useState('');
  const [cursos, setCursos] = useState([]);

  const [filtrosAplicados, setFiltrosAplicados] = useState({
    estado: null,
  });

  const [filtrosTemp, setFiltrosTemp] = useState({
    estado: null,
  });

  const [showFilters, setShowFilters] = useState(false);

  const panelAnim = useRef(new Animated.Value(500)).current;
  const reiniciarOpacity = useRef(new Animated.Value(0)).current;
  const searchWidthAnim = useRef(new Animated.Value(1)).current;

  const hayFiltrosActivos = filtrosAplicados.estado !== null;

  const fetchCursos = useCallback(async () => {
    try {
      const ci = getLoggedCi();
      const voluntario = await getVoluntarioByCi(ci);
      if (!voluntario?.id) return;

      const cursos = await getCursosByVoluntario(voluntario.id);

      const cursosAdaptados = cursos.map((curso) => {
        const totalEtapas = curso.etapas?.length || 0;
        const completadas = curso.etapas?.filter(e => e.estado === 'completado').length || 0;

        const progreso = totalEtapas > 0 ? Math.round((completadas / totalEtapas) * 100) : 0;
        let estado = 'Sin empezar';
        if (completadas === totalEtapas && totalEtapas > 0) estado = 'Finalizado';
        else if (completadas > 0) estado = 'En progreso';

        return {
          id: curso.id,
          titulo: curso.nombre,
          estado,
          progreso,
          fechaInicio: curso.etapas?.[0]?.fechaInicio ?? '',
          fechaFin: curso.etapas?.[curso.etapas.length - 1]?.fechaFinalizacion ?? '',
          voluntarioId: voluntario.id,
          etapas: curso.etapas?.map(et => ({
            id: et.id,
            nombre: et.nombre,
            orden: et.orden,
            estado: et.estado,
            fechaInicio: et.fechaInicio,
            fechaFinalizacion: et.fechaFinalizacion,
          })) || [],
        };
      });

      setCursos(cursosAdaptados);
    } catch (err) {
      console.error('Error al obtener cursos:', err);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchCursos();
    }, [fetchCursos])
  );

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
    setFiltrosAplicados({ estado: null });

    Animated.parallel([
      Animated.timing(reiniciarOpacity, { toValue: 0, duration: 300, useNativeDriver: true }),
      Animated.timing(searchWidthAnim, { toValue: 1, duration: 300, useNativeDriver: false }),
    ]).start();
  };

  if (hayFiltrosActivos) {
    Animated.parallel([
      Animated.timing(reiniciarOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
      Animated.timing(searchWidthAnim, { toValue: 0.75, duration: 300, useNativeDriver: false }),
    ]).start();
  }

  const filtrados = cursos.filter(curso => {
    const estadoFiltro = filtrosAplicados.estado;

    if (estadoFiltro && curso.estado !== estadoFiltro) {
      return false;
    }

    if (search.length > 0 && !curso.titulo.toLowerCase().includes(search.toLowerCase())) {
      return false;
    }

    return true;
  });

  const getEstadoBadgeColor = (estado) => {
    switch (estado) {
      case 'Finalizado':
        return theme.colors.success;
      case 'En progreso':
        return theme.colors.warning;
      case 'Sin empezar':
        return theme.colors.secondary;
      default:
        return theme.colors.gray400;
    }
  };

  const getProgresoColor = (progreso) => {
    if (progreso === 100) return theme.colors.success;
    if (progreso >= 50) return theme.colors.info;
    if (progreso > 0) return theme.colors.warning;
    return theme.colors.gray300;
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
        <Text style={styles.headerTitle}>Cursos Asignados</Text>
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
              placeholder="Buscar curso..."
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
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContainer}
        renderItem={({ item }) => {
          const cursoDetalle = {
            ...item,
            voluntarioId: item.voluntarioId,
            stages: item.etapas.map(et => ({
              id: et.id,
              title: et.nombre,
              description: `Etapa ${et.orden}`,
              estado: et.estado,
              fechaInicio: et.fechaInicio,
              fechaFinalizacion: et.fechaFinalizacion,
            })),
          };

          return (
            <TouchableOpacity
              style={styles.card}
              onPress={() => navigation.navigate('DetalleCursos', { curso: cursoDetalle })}
              activeOpacity={0.7}
            >
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle} numberOfLines={2}>{item.titulo}</Text>
                <View style={[styles.estadoBadge, { backgroundColor: getEstadoBadgeColor(item.estado) }]}>
                  <Text style={styles.estadoBadgeText}>{item.estado}</Text>
                </View>
              </View>

              {item.progreso !== undefined && (
                <View style={styles.progressSection}>
                  <View style={styles.progressHeader}>
                    <Text style={styles.progressLabel}>Progreso</Text>
                    <Text style={styles.progressPercentage}>{item.progreso}%</Text>
                  </View>
                  <View style={styles.progressBarContainer}>
                    <View 
                      style={[
                        styles.progressBarFill, 
                        { 
                          width: `${item.progreso}%`,
                          backgroundColor: getProgresoColor(item.progreso)
                        }
                      ]} 
                    />
                  </View>
                </View>
              )}

              <View style={styles.fechasContainer}>
                {item.fechaInicio && (
                  <View style={styles.fechaRow}>
                    <FontAwesome5 name="calendar-alt" size={14} color={theme.colors.primary} />
                    <Text style={styles.fechaText}>Inicio: {item.fechaInicio}</Text>
                  </View>
                )}
                {item.fechaFin && (
                  <View style={styles.fechaRow}>
                    <FontAwesome5 name="calendar-check" size={14} color={theme.colors.success} />
                    <Text style={styles.fechaText}>Fin: {item.fechaFin}</Text>
                  </View>
                )}
              </View>

              <View style={styles.cardFooter}>
                <FontAwesome5 name="arrow-right" size={16} color={theme.colors.primary} />
              </View>
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={() => (
          <View style={styles.emptyContainer}>
            <FontAwesome5 name="graduation-cap" size={48} color={theme.colors.gray400} />
            <Text style={styles.emptyText}>No se encontraron cursos</Text>
            <Text style={styles.emptySubtext}>Los cursos asignados aparecerán aquí</Text>
          </View>
        )}
      />

      {showFilters && (
        <Modal transparent visible={showFilters} animationType="fade">
          <Pressable style={styles.modalOverlay} onPress={cerrarPanel} />
          <Animated.View style={[styles.modalContent, { transform: [{ translateY: panelAnim }] }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Filtros de Cursos</Text>
              <TouchableOpacity onPress={cerrarPanel} style={styles.closeButton}>
                <Ionicons name="close" size={24} color={theme.colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <Text style={styles.filterLabel}>Estado del Curso</Text>
            <View style={styles.chipsRow}>
              {['Finalizado', 'En progreso', 'Sin empezar'].map(estado => (
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
                  <Text style={[
                    styles.choiceChipText,
                    filtrosTemp.estado === estado && styles.choiceChipTextSelected
                  ]}>
                    {estado}
                  </Text>
                </Pressable>
              ))}
            </View>

            <TouchableOpacity onPress={aplicarFiltros} style={styles.applyButton}>
              <Text style={styles.applyButtonText}>Aplicar Filtros</Text>
            </TouchableOpacity>
          </Animated.View>
        </Modal>
      )}
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
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.md,
  },
  cardTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.textPrimary,
    flex: 1,
    marginRight: theme.spacing.sm,
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
  progressSection: {
    marginBottom: theme.spacing.md,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
  },
  progressLabel: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.textSecondary,
  },
  progressPercentage: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.textPrimary,
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: theme.colors.gray200,
    borderRadius: theme.spacing.borderRadius.round,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: theme.spacing.borderRadius.round,
  },
  fechasContainer: {
    gap: theme.spacing.xs,
    marginBottom: theme.spacing.sm,
  },
  fechaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  fechaText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.textSecondary,
  },
  cardFooter: {
    alignItems: 'flex-end',
    marginTop: theme.spacing.xs,
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
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.lg,
  },
  choiceChip: {
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
  applyButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.spacing.borderRadius.md,
    alignItems: 'center',
    ...theme.shadows.md,
  },
  applyButtonText: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.textLight,
  },
});