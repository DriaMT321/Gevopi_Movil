import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert, StyleSheet } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { theme } from '../themes';
import { cambiarEstadoEtapa } from '../services/cursosService';

export default function DetalleCursosScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { curso: initialCourse } = route.params;

  const adaptCourse = (course) => {
    const stages = course.stages;
    const completedCount = stages.filter(s => s.estado === 'completado').length;
    const progreso = stages.length > 0
      ? Math.floor((completedCount / stages.length) * 100)
      : 0;

    let estado = 'Sin empezar';
    if (progreso === 100) estado = 'Finalizado';
    else if (progreso > 0) estado = 'En progreso';

    return {
      ...course,
      stages,
      progreso,
      estado,
    };
  };

  const getStatusLabel = (estado) => {
    switch (estado) {
      case 'sin_empezar': return 'No Empezado';
      case 'en_progreso': return 'En Progreso';
      case 'completado':  return 'Completado';
      default:            return estado;
    }
  };

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

  const [curso, setCurso] = useState(() => adaptCourse(initialCourse));
  const allStagesCompleted = curso.stages.every(stage => stage.estado === 'completado');

  const handleStageStatusCycle = async (stageId) => {
    try {
      const resp = await cambiarEstadoEtapa(stageId, curso.voluntarioId);
      const nuevo = resp.data.data;

      setCurso(prevCurso => {
        const updatedStages = prevCurso.stages.map(stage => {
          if (stage.id === stageId) {
            return {
              ...stage,
              estado: nuevo.estado,
              fechaInicio: nuevo.fecha_inicio,
              fechaFinalizacion: nuevo.fecha_finalizacion,
            };
          }
          return stage;
        });

        const completedCount = updatedStages.filter(s => s.estado === 'completado').length;
        const newProgreso = Math.floor((completedCount / updatedStages.length) * 100);

        let newEstado = 'Sin empezar';
        if (newProgreso === 100) newEstado = 'Finalizado';
        else if (newProgreso > 0) newEstado = 'En progreso';

        return { ...prevCurso, stages: updatedStages, progreso: newProgreso, estado: newEstado };
      });

    } catch (error) {
      console.error('Error al cambiar estado:', error.response?.status, error.response?.data || error.message);
      Alert.alert('Error', 'No se pudo actualizar la etapa en el servidor.');
    }
  };

  const handleFinalizeCourse = () => {
    if (allStagesCompleted) {
      Alert.alert(
        'Curso Finalizado',
        `¡Has completado el curso "${curso.titulo}" con éxito!`,
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } else {
      Alert.alert(
        'Etapas Incompletas',
        'Debes completar todas las etapas antes de finalizar el curso.',
        [{ text: 'OK' }]
      );
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Detalle del Curso</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.courseDetailsCard}>
          <Text style={styles.courseTitle}>{curso.titulo}</Text>
          
          <View style={styles.badgeRow}>
            <View style={[styles.estadoBadge, { backgroundColor: getEstadoBadgeColor(curso.estado) }]}>
              <FontAwesome5 
                name={curso.estado === 'Finalizado' ? 'check-circle' : curso.estado === 'En progreso' ? 'play-circle' : 'clock'} 
                size={14} 
                color={theme.colors.textLight} 
                style={{ marginRight: theme.spacing.xs }}
              />
              <Text style={styles.estadoBadgeText}>{curso.estado}</Text>
            </View>
          </View>

          <View style={styles.progressSection}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressLabel}>Progreso del Curso</Text>
              <Text style={styles.progressPercentage}>{curso.progreso}%</Text>
            </View>
            <View style={styles.progressBarContainer}>
              <View 
                style={[
                  styles.progressBarFill, 
                  { 
                    width: `${curso.progreso}%`,
                    backgroundColor: getProgresoColor(curso.progreso)
                  }
                ]} 
              />
            </View>
          </View>
        </View>

        <View style={styles.stagesSection}>
          <Text style={styles.stagesSectionTitle}>Etapas del Curso</Text>
          
          {curso.stages.map((stage, index) => {
            const isCompleted = stage.estado === 'completado';
            const firstIncompleteIndex = curso.stages.findIndex(s => s.estado !== 'completado');
            const isFirstIncomplete = firstIncompleteIndex === index;
            const isTouchable = !isCompleted && isFirstIncomplete;
            const isLast = index === curso.stages.length - 1;

            return (
              <View key={stage.id} style={styles.stepWrapper}>
                <View style={styles.stepLineContainer}>
                  <View
                    style={[
                      styles.stepCircle,
                      isCompleted && styles.stepCircleCompleted,
                      stage.estado === 'en_progreso' && styles.stepCircleInProgress,
                    ]}
                  >
                    {isCompleted ? (
                      <Ionicons name="checkmark-sharp" size={18} color={theme.colors.textLight} />
                    ) : (
                      <Text style={styles.stepNumber}>{index + 1}</Text>
                    )}
                  </View>
                  {!isLast && (
                    <View
                      style={[
                        styles.stepLine,
                        isCompleted && styles.stepLineCompleted,
                      ]}
                    />
                  )}
                </View>

                <TouchableOpacity
                  disabled={!isTouchable}
                  onPress={() => isTouchable && handleStageStatusCycle(stage.id)}
                  style={[
                    styles.stepContent,
                    isCompleted && styles.stepContentCompleted,
                    stage.estado === 'en_progreso' && styles.stepContentInProgress,
                    !isTouchable && styles.stepContentDisabled,
                  ]}
                  activeOpacity={0.7}
                >
                  <View style={styles.stepTextContainer}>
                    <Text style={styles.stepTitle}>{stage.title}</Text>
                    <Text style={styles.stepDescription}>{stage.description}</Text>
                    
                    <View style={[
                      styles.stageStatusBadge,
                      stage.estado === 'sin_empezar' && styles.statusBadgeNoEmpezado,
                      stage.estado === 'en_progreso' && styles.statusBadgeEnProgreso,
                      isCompleted && styles.statusBadgeCompletado,
                    ]}>
                      <Text style={styles.stageStatusText}>
                        {getStatusLabel(stage.estado)}
                      </Text>
                    </View>
                  </View>

                  {isTouchable && (
                    <FontAwesome5 name="chevron-right" size={16} color={theme.colors.primary} />
                  )}
                </TouchableOpacity>
              </View>
            );
          })}
        </View>

        <TouchableOpacity
          style={[
            styles.finishButton, 
            !allStagesCompleted && styles.finishButtonDisabled
          ]}
          onPress={handleFinalizeCourse}
          disabled={!allStagesCompleted}
        >
          <FontAwesome5 
            name="check-circle" 
            size={20} 
            color={allStagesCompleted ? theme.colors.textLight : theme.colors.textMuted} 
            style={{ marginRight: theme.spacing.sm }}
          />
          <Text style={[
            styles.finishButtonText, 
            !allStagesCompleted && styles.finishButtonTextDisabled
          ]}>
            Finalizar Curso
          </Text>
        </TouchableOpacity>
      </ScrollView>
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
  scrollContent: {
    padding: theme.spacing.lg,
  },
  courseDetailsCard: {
    backgroundColor: theme.colors.cardBackground,
    borderRadius: theme.spacing.borderRadius.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.primary,
    ...theme.shadows.md,
  },
  courseTitle: {
    fontSize: theme.typography.fontSize.xxl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.md,
  },
  badgeRow: {
    flexDirection: 'row',
    marginBottom: theme.spacing.md,
  },
  estadoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.spacing.borderRadius.round,
  },
  estadoBadgeText: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.textLight,
  },
  progressSection: {
    marginTop: theme.spacing.sm,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  progressLabel: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.textSecondary,
  },
  progressPercentage: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.textPrimary,
  },
  progressBarContainer: {
    height: 12,
    backgroundColor: theme.colors.gray200,
    borderRadius: theme.spacing.borderRadius.round,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: theme.spacing.borderRadius.round,
  },
  stagesSection: {
    backgroundColor: theme.colors.cardBackground,
    borderRadius: theme.spacing.borderRadius.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
    ...theme.shadows.md,
  },
  stagesSectionTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.lg,
  },
  stepWrapper: {
    flexDirection: 'row',
    marginBottom: theme.spacing.md,
  },
  stepLineContainer: {
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },
  stepCircle: {
    width: 36,
    height: 36,
    borderRadius: theme.spacing.borderRadius.round,
    backgroundColor: theme.colors.gray200,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: theme.colors.gray300,
    zIndex: 1,
  },
  stepCircleCompleted: {
    backgroundColor: theme.colors.success,
    borderColor: theme.colors.success,
  },
  stepCircleInProgress: {
    backgroundColor: theme.colors.warning,
    borderColor: theme.colors.warning,
  },
  stepNumber: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.textSecondary,
  },
  stepLine: {
    width: 2,
    flex: 1,
    backgroundColor: theme.colors.gray300,
    marginTop: theme.spacing.xs,
  },
  stepLineCompleted: {
    backgroundColor: theme.colors.success,
  },
  stepContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.gray50,
    borderRadius: theme.spacing.borderRadius.md,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  stepContentCompleted: {
    backgroundColor: theme.colors.successLight,
    borderColor: theme.colors.success,
  },
  stepContentInProgress: {
    backgroundColor: theme.colors.warningLight,
    borderColor: theme.colors.warning,
  },
  stepContentDisabled: {
    opacity: 0.6,
  },
  stepTextContainer: {
    flex: 1,
  },
  stepTitle: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.xs,
  },
  stepDescription: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.sm,
  },
  stageStatusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 2,
    borderRadius: theme.spacing.borderRadius.sm,
  },
  statusBadgeNoEmpezado: {
    backgroundColor: theme.colors.gray200,
  },
  statusBadgeEnProgreso: {
    backgroundColor: theme.colors.warning,
  },
  statusBadgeCompletado: {
    backgroundColor: theme.colors.success,
  },
  stageStatusText: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.textLight,
  },
  finishButton: {
    backgroundColor: theme.colors.success,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.spacing.borderRadius.md,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    ...theme.shadows.md,
  },
  finishButtonDisabled: {
    backgroundColor: theme.colors.gray300,
  },
  finishButtonText: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.textLight,
  },
  finishButtonTextDisabled: {
    color: theme.colors.textMuted,
  },
});