import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import styles from '../styles/resultado_evaluacionesStyles';
import { useNavigation, useRoute } from '@react-navigation/native';
import { FontAwesome5, Ionicons } from '@expo/vector-icons';
import colors from '../themes/colors';

const ResultadoEvaluacionesScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();

  const evaluacion = route.params?.evaluacion || {};
  
  // Función para determinar el tipo de evaluación
  const getTipoEvaluacion = () => {
    if (evaluacion.tipo === 'fisica') return 'Física';
    if (evaluacion.tipo === 'emocional') return 'Emocional';
    if (evaluacion.titulo?.toLowerCase().includes('física')) return 'Física';
    if (evaluacion.titulo?.toLowerCase().includes('emocional')) return 'Emocional';
    return 'General';
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color={colors.amarillo} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Resultados de Evaluación</Text>
        
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Tarjeta de resumen */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryHeader}>
            <Text style={styles.summaryTitle}>{evaluacion.titulo || "Evaluación"}</Text>
            <View style={[styles.evaluationTypeBadge, 
              getTipoEvaluacion() === 'Física' ? styles.physicalBadge : styles.emotionalBadge
            ]}>
              <Text style={styles.evaluationTypeText}>{getTipoEvaluacion()}</Text>
            </View>
          </View>
          
          <View style={styles.summaryDetails}>
            <View style={styles.detailItem}>
              <Ionicons name="calendar" size={16} color={colors.naranjaFuerte} />
              <Text style={styles.detailText}>
                Realizada: {evaluacion.fechaRealizada || "-"}
              </Text>
            </View>
            
            <View style={styles.detailItem}>
              <Ionicons name="document-text" size={16} color={colors.naranjaFuerte} />
              <Text style={styles.detailText}>
                Resultado: {evaluacion.fechaResultado || "-"}
              </Text>
            </View>
          </View>
        </View>

        {/* Resumen de evaluación */}
        {evaluacion?.resumen ? (
          <View style={styles.reportSection}>
            <View style={styles.sectionHeader}>
              <Ionicons name="document" size={22} color={colors.naranjaFuerte} />
              <Text style={styles.sectionTitle}>Resumen de Evaluación</Text>
            </View>
            <View style={styles.contentBox}>
              <Text style={styles.listText}>{evaluacion.resumen}</Text>
            </View>
          </View>
        ) : null}

        {/* Estado general */}
        {evaluacion?.estado_general ? (
          <View style={styles.reportSection}>
            <View style={styles.sectionHeader}>
              <Ionicons name="stats-chart" size={22} color={colors.naranjaFuerte} />
              <Text style={styles.sectionTitle}>Estado General</Text>
            </View>
            <View style={styles.contentBox}>
              <Text style={styles.listText}>{evaluacion.estado_general}</Text>
            </View>
          </View>
        ) : null}

        {/* Sección de informe */}
        <View style={styles.reportSection}>
          <View style={styles.sectionHeader}>
            <Ionicons name="analytics" size={22} color={colors.naranjaFuerte} />
            <Text style={styles.sectionTitle}>Informe Detallado</Text>
          </View>

          {/* Observaciones */}
          {evaluacion?.observaciones ? (
            <View style={styles.subSection}>
              <View style={styles.subSectionHeader}>
                <Text style={styles.subSectionTitle}>Observaciones Clínicas</Text>
                <Ionicons name="eye" size={18} color={colors.amarillo} />
              </View>
              <View style={styles.contentBox}>
                {evaluacion.observaciones.split('\n').map((obs, i) => (
                  <View key={`obs-${i}`} style={styles.listItem}>
                    <Text style={styles.bullet}>•</Text>
                    <Text style={styles.listText}>{obs}</Text>
                  </View>
                ))}
              </View>
            </View>
          ) : null}

          {/* Recomendaciones */}
          {evaluacion?.recomendaciones ? (
            <View style={styles.subSection}>
              <View style={styles.subSectionHeader}>
                <Text style={styles.subSectionTitle}>Recomendaciones</Text>
                <Ionicons name="medkit" size={18} color={colors.amarillo} />
              </View>
              <View style={styles.contentBox}>
                {evaluacion.recomendaciones.split('\n').map((rec, i) => (
                  <View key={`rec-${i}`} style={styles.listItem}>
                    <Text style={styles.bullet}>•</Text>
                    <Text style={styles.listText}>{rec}</Text>
                  </View>
                ))}
              </View>
            </View>
          ) : null}

          {/* Mensaje si no hay datos */}
          {(!evaluacion?.observaciones && !evaluacion?.recomendaciones) && (
            <View style={styles.emptyState}>
              <Ionicons name="information-circle" size={24} color={colors.gris} />
              <Text style={styles.emptyText}>No hay observaciones ni recomendaciones disponibles</Text>
            </View>
          )}
        </View>


      </ScrollView>
    </View>
  );
};

export default ResultadoEvaluacionesScreen;