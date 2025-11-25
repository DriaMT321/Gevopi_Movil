  import React, { useState } from 'react';
  import { View, Text, TouchableOpacity, ScrollView, Alert, Platform } from 'react-native';
  import { useNavigation, useRoute } from '@react-navigation/native';
  import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
  import colors from '../themes/colors';
  import styles from '../styles/detalleCursosStyles';
  import * as Progress from 'react-native-progress';
  import { cambiarEstadoEtapa } from '../services/mutationSQL';

  export default function DetalleCursosScreen() {
    const navigation = useNavigation();
    const route = useRoute();
    const { curso: initialCourse } = route.params;
    const adaptCourse = (course) => {
      const stages = course.etapas.map((etapa, index) => ({
        id: etapa.id,
        title: etapa.nombre,
        description: `Etapa ${etapa.orden}`,
        status: etapa.estado,
        fechaInicio: etapa.fechaInicio,
        fechaFinalizacion: etapa.fechaFinalizacion,
      }));

      const completedCount = stages.filter(s => s.status === 'Completado').length;
      const progreso = Math.floor((completedCount / stages.length) * 100);

      let estado = 'No Empezado';
      if (progreso === 100) estado = 'Finalizado';
      else if (progreso > 0) estado = 'En Progreso';

      return {
        ...course,
        stages,
        progreso,
        estado,
      };
    };


    const [curso, setCurso] = useState(() => adaptCourse(initialCourse));
    const allStagesCompleted = curso.stages.every(stage => stage.status === 'Completado');


    const handleStageStatusCycle = async (stageId) => {
      try {
        const updatedStages = curso.stages.map(stage => {
          if (stage.id === stageId) {
            let nextStatus;
            if (stage.status === 'No Empezado') nextStatus = 'En Progreso';
            else if (stage.status === 'En Progreso') nextStatus = 'Completado';
            else nextStatus = 'No Empezado';
            return { ...stage, status: nextStatus };
          }
          return stage;
        });

        const completedCount = updatedStages.filter(s => s.status === 'Completado').length;
        const newProgreso = Math.floor((completedCount / updatedStages.length) * 100);
        let newEstado = 'No Empezado';
        if (newProgreso === 100) newEstado = 'Finalizado';
        else if (newProgreso > 0) newEstado = 'En Progreso';

        setCurso(prevCurso => ({
          ...prevCurso,
          stages: updatedStages,
          estado: newEstado,
          progreso: newProgreso,
        }));

        await cambiarEstadoEtapa(stageId);
      } catch (error) {
        console.error('Error al cambiar estado:', error);
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
              <Ionicons name="arrow-back" size={24} color={colors.naranjaFuerte} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Detalle del Curso</Text>
          </View>

          <ScrollView contentContainerStyle={styles.scrollContent}>
            <View style={styles.courseDetailsCard}>
              <Text style={styles.courseTitle}>{curso.titulo}</Text>
              <View style={styles.infoRow}><Text style={styles.infoLabel}>Estado:</Text><Text style={styles.infoValue}>{curso.estado}</Text></View>
              <View style={styles.infoRow}><Text style={styles.infoLabel}>Progreso:</Text><Text style={styles.infoValue}>{curso.progreso}%</Text></View>
              {Platform.OS === 'android' ? (
                  <Progress.Bar progress={curso.progreso ? curso.progreso / 100 : 0} width={null} color={colors.naranjaFuerte} height={10} style={styles.progressBar} />
              ) : (
                  <View style={styles.progressBariOS}><View style={[styles.progressBarFilliOS, { width: `${curso.progreso}%` }]} /></View>
              )}
            </View>

            <View style={styles.progressContainer}>
              <Text style={styles.progressSectionTitle}>Etapas del Curso</Text>
              {curso.stages.map((stage, index) => {
                const isCompleted = stage.status === 'Completado';
                const isFirstIncomplete = curso.stages.findIndex(s => s.status !== 'Completado') === index;
                const isTouchable = !isCompleted && isFirstIncomplete;

                return (
                    <View key={stage.id} style={styles.stepWrapper}>
                      <View style={styles.stepLineContainer}>
                        <View style={[
                          styles.stepCircle,
                          isCompleted && styles.stepCircleCompleted,
                          stage.status === 'En Progreso' && styles.stepCircleInProgress,
                        ]}>
                          {isCompleted ? (
                              <Ionicons name="checkmark-sharp" size={18} color={colors.blanco} />
                          ) : (
                              <Text style={styles.stepNumber}>{index + 1}</Text>
                          )}
                        </View>
                        <View style={[
                          styles.stepLine,
                          isCompleted && styles.stepLineCompleted
                        ]} />
                      </View>

                      <TouchableOpacity
                          disabled={!isTouchable}
                          onPress={() => isTouchable && handleStageStatusCycle(stage.id)}
                          style={[
                            styles.stepContent,
                            isCompleted && styles.stepContentCompleted,
                            stage.status === 'En Progreso' && styles.stepContentInProgress,
                            !isTouchable && { opacity: 0.6 }, // Visualmente desactiva
                          ]}
                      >
                        <View style={styles.stepTextContainer}>
                          <Text style={[
                            styles.stepTitle,
                            isCompleted && styles.stepTitleCompleted,
                            stage.status === 'En Progreso' && styles.stepTitleInProgress,
                          ]}>
                            {stage.title}
                          </Text>
                          <Text style={[
                            styles.stepDescription,
                            isCompleted && styles.stepDescriptionCompleted,
                            stage.status === 'En Progreso' && styles.stepDescriptionInProgress,
                          ]}>
                            {stage.description}
                          </Text>
                          <Text style={[
                            styles.stageStatusText,
                            stage.status === 'No Empezado' && styles.stageStatusNoEmpezado,
                            stage.status === 'En Progreso' && styles.stageStatusEnProgreso,
                            isCompleted && styles.stageStatusCompletado,
                          ]}>
                            {stage.status}
                          </Text>
                        </View>
                        {stage.status !== 'Completado' && (
                            <FontAwesome5 name="chevron-right" size={14} color={colors.gray} />
                        )}
                      </TouchableOpacity>
                    </View>
                );
              })}
            </View>

            <TouchableOpacity
                style={[styles.finishButton, !allStagesCompleted && styles.finishButtonDisabled]}
                onPress={handleFinalizeCourse}
                disabled={!allStagesCompleted}
            >
              <Text style={[styles.finishButtonText, !allStagesCompleted && styles.finishButtonTextDisabled]}>
                Finalizar Curso
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
    );
  }
