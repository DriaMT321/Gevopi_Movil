  import React, { useState } from 'react';
  import { View, Text, TouchableOpacity, ScrollView, Alert, Platform } from 'react-native';
  import { useNavigation, useRoute } from '@react-navigation/native';
  import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
  import colors from '../themes/colors';
  import styles from '../styles/detalleCursosStyles';
  import * as Progress from 'react-native-progress';
  import { cambiarEstadoEtapa } from '../services/cursosService';


  export default function DetalleCursosScreen() {
    const navigation = useNavigation();
    const route = useRoute();
    const { curso: initialCourse } = route.params;
    const adaptCourse = (course) => {
      const stages = course.stages; // ya vienen armadas en CursosScreen

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



    const [curso, setCurso] = useState(() => adaptCourse(initialCourse));
    const allStagesCompleted = curso.stages.every(stage => stage.estado === 'completado');


    const handleStageStatusCycle = async (stageId) => {
      try {
        const resp = await cambiarEstadoEtapa(stageId, curso.voluntarioId);
        const nuevo = resp.data.data; // 👈 aquí estaba el detalle

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
                // ahora usamos los estados del backend: sin_empezar, en_progreso, completado
                const isCompleted = stage.estado === 'completado';
                const firstIncompleteIndex = curso.stages.findIndex(s => s.estado !== 'completado');
                const isFirstIncomplete = firstIncompleteIndex === index;
                const isTouchable = !isCompleted && isFirstIncomplete;

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
                          <Ionicons name="checkmark-sharp" size={18} color={colors.blanco} />
                        ) : (
                          <Text style={styles.stepNumber}>{index + 1}</Text>
                        )}
                      </View>
                      <View
                        style={[
                          styles.stepLine,
                          isCompleted && styles.stepLineCompleted,
                        ]}
                      />
                    </View>

                    <TouchableOpacity
                      disabled={!isTouchable}
                      onPress={() => isTouchable && handleStageStatusCycle(stage.id)}
                      style={[
                        styles.stepContent,
                        isCompleted && styles.stepContentCompleted,
                        stage.estado === 'en_progreso' && styles.stepContentInProgress,
                        !isTouchable && { opacity: 0.6 },
                      ]}
                    >
                      <View style={styles.stepTextContainer}>
                        <Text
                          style={[
                            styles.stepTitle,
                            isCompleted && styles.stepTitleCompleted,
                            stage.estado === 'en_progreso' && styles.stepTitleInProgress,
                          ]}
                        >
                          {stage.title}
                        </Text>

                        <Text
                          style={[
                            styles.stepDescription,
                            isCompleted && styles.stepDescriptionCompleted,
                            stage.estado === 'en_progreso' && styles.stepDescriptionInProgress,
                          ]}
                        >
                          {stage.description}
                        </Text>

                        {/* AQUÍ VA el Text que preguntabas */}
                        <Text
                          style={[
                            styles.stageStatusText,
                            stage.estado === 'sin_empezar' && styles.stageStatusNoEmpezado,
                            stage.estado === 'en_progreso' && styles.stageStatusEnProgreso,
                            isCompleted && styles.stageStatusCompletado,
                          ]}
                        >
                          {getStatusLabel(stage.estado)}
                        </Text>
                      </View>

                      {!isCompleted && (
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
