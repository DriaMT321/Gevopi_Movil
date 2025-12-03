import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { FontAwesome5, Ionicons } from '@expo/vector-icons';
import { theme } from '../themes';

const ResultadoEvaluacionesScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();

  const evaluacion = route.params?.evaluacion || {};
  
  const getTipoEvaluacion = () => {
    if (evaluacion.tipo === 'fisica') return 'Física';
    if (evaluacion.tipo === 'emocional') return 'Emocional';
    if (evaluacion.titulo?.toLowerCase().includes('física')) return 'Física';
    if (evaluacion.titulo?.toLowerCase().includes('emocional')) return 'Emocional';
    return 'General';
  };

  const getTipoColor = () => {
    const tipo = getTipoEvaluacion();
    if (tipo === 'Física') return theme.colors.danger;
    if (tipo === 'Emocional') return theme.colors.info;
    return theme.colors.primary;
  };

  const tipoEvaluacion = getTipoEvaluacion();
  const tipoColor = getTipoColor();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color={theme.colors.primary} />
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
            <View style={[styles.iconCircle, { backgroundColor: tipoColor }]}>
              <FontAwesome5 
                name={tipoEvaluacion === 'Física' ? 'heartbeat' : 'brain'} 
                size={24} 
                color={theme.colors.textLight} 
              />
            </View>
            <View style={styles.summaryTitleContainer}>
              <Text style={styles.summaryTitle}>{evaluacion.titulo || "Evaluación"}</Text>
              <View style={[styles.evaluationTypeBadge, { backgroundColor: tipoColor }]}>
                <Text style={styles.evaluationTypeText}>{tipoEvaluacion}</Text>
              </View>
            </View>
          </View>
          
          <View style={styles.summaryDetails}>
            <View style={styles.detailItem}>
              <FontAwesome5 name="calendar-alt" size={16} color={theme.colors.primary} />
              <Text style={styles.detailLabel}>Realizada:</Text>
              <Text style={styles.detailText}>{evaluacion.fechaRealizada || "-"}</Text>
            </View>
            
            <View style={styles.detailItem}>
              <FontAwesome5 name="calendar-check" size={16} color={theme.colors.success} />
              <Text style={styles.detailLabel}>Resultado:</Text>
              <Text style={styles.detailText}>{evaluacion.fechaResultado || "-"}</Text>
            </View>
          </View>
        </View>

        {/* Resumen de evaluación */}
        {evaluacion?.resumen ? (
          <View style={styles.reportSection}>
            <View style={styles.sectionHeader}>
              <View style={[styles.sectionIconContainer, { backgroundColor: theme.colors.primaryLight }]}>
                <FontAwesome5 name="file-alt" size={18} color={theme.colors.primary} />
              </View>
              <Text style={styles.sectionTitle}>Resumen de Evaluación</Text>
            </View>
            <View style={styles.contentBox}>
              <Text style={styles.contentText}>{evaluacion.resumen}</Text>
            </View>
          </View>
        ) : null}

        {/* Estado general */}
        {evaluacion?.estado_general ? (
          <View style={styles.reportSection}>
            <View style={styles.sectionHeader}>
              <View style={[styles.sectionIconContainer, { backgroundColor: theme.colors.infoLight }]}>
                <FontAwesome5 name="chart-line" size={18} color={theme.colors.info} />
              </View>
              <Text style={styles.sectionTitle}>Estado General</Text>
            </View>
            <View style={[styles.contentBox, styles.estadoGeneralBox]}>
              <Text style={styles.contentText}>{evaluacion.estado_general}</Text>
            </View>
          </View>
        ) : null}

        {/* Sección de informe */}
        <View style={styles.reportSection}>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionIconContainer, { backgroundColor: theme.colors.warningLight }]}>
              <FontAwesome5 name="clipboard-list" size={18} color={theme.colors.warning} />
            </View>
            <Text style={styles.sectionTitle}>Informe Detallado</Text>
          </View>

          {/* Observaciones */}
          {evaluacion?.observaciones ? (
            <View style={styles.subSection}>
              <View style={styles.subSectionHeader}>
                <FontAwesome5 name="eye" size={16} color={theme.colors.primary} style={{ marginRight: theme.spacing.sm }} />
                <Text style={styles.subSectionTitle}>Observaciones Clínicas</Text>
              </View>
              <View style={styles.contentBox}>
                {evaluacion.observaciones.split('\n').filter(obs => obs.trim()).map((obs, i) => (
                  <View key={`obs-${i}`} style={styles.listItem}>
                    <View style={styles.bulletContainer}>
                      <FontAwesome5 name="circle" size={6} color={theme.colors.primary} />
                    </View>
                    <Text style={styles.listText}>{obs.trim()}</Text>
                  </View>
                ))}
              </View>
            </View>
          ) : null}

          {/* Recomendaciones */}
          {evaluacion?.recomendaciones ? (
            <View style={styles.subSection}>
              <View style={styles.subSectionHeader}>
                <FontAwesome5 name="lightbulb" size={16} color={theme.colors.success} style={{ marginRight: theme.spacing.sm }} />
                <Text style={styles.subSectionTitle}>Recomendaciones</Text>
              </View>
              <View style={styles.contentBox}>
                {evaluacion.recomendaciones.split('\n').filter(rec => rec.trim()).map((rec, i) => (
                  <View key={`rec-${i}`} style={styles.listItem}>
                    <View style={styles.bulletContainer}>
                      <FontAwesome5 name="check" size={10} color={theme.colors.success} />
                    </View>
                    <Text style={styles.listText}>{rec.trim()}</Text>
                  </View>
                ))}
              </View>
            </View>
          ) : null}

          {/* Mensaje si no hay datos */}
          {(!evaluacion?.observaciones && !evaluacion?.recomendaciones) && (
            <View style={styles.emptyState}>
              <FontAwesome5 name="info-circle" size={48} color={theme.colors.gray400} />
              <Text style={styles.emptyText}>No hay observaciones ni recomendaciones disponibles</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
};

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
  scrollContainer: {
    padding: theme.spacing.lg,
  },
  summaryCard: {
    backgroundColor: theme.colors.cardBackground,
    borderRadius: theme.spacing.borderRadius.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.primary,
    ...theme.shadows.md,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: theme.spacing.borderRadius.round,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },
  summaryTitleContainer: {
    flex: 1,
  },
  summaryTitle: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.xs,
  },
  evaluationTypeBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.spacing.borderRadius.md,
  },
  evaluationTypeText: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.textLight,
  },
  summaryDetails: {
    gap: theme.spacing.sm,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
  },
  detailLabel: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.textSecondary,
  },
  detailText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.textPrimary,
    flex: 1,
  },
  reportSection: {
    backgroundColor: theme.colors.cardBackground,
    borderRadius: theme.spacing.borderRadius.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
    ...theme.shadows.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  sectionIconContainer: {
    width: 36,
    height: 36,
    borderRadius: theme.spacing.borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.sm,
  },
  sectionTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.textPrimary,
  },
  contentBox: {
    backgroundColor: theme.colors.gray50,
    borderRadius: theme.spacing.borderRadius.md,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  estadoGeneralBox: {
    backgroundColor: theme.colors.infoLight,
    borderColor: theme.colors.info,
    borderLeftWidth: 4,
  },
  contentText: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.textPrimary,
    lineHeight: 22,
  },
  subSection: {
    marginBottom: theme.spacing.lg,
  },
  subSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
    paddingBottom: theme.spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderLight,
  },
  subSectionTitle: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.textPrimary,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.sm,
  },
  bulletContainer: {
    width: 20,
    alignItems: 'center',
    marginTop: 6,
  },
  listText: {
    flex: 1,
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.textPrimary,
    lineHeight: 20,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.xxl,
  },
  emptyText: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginTop: theme.spacing.md,
  },
});

export default ResultadoEvaluacionesScreen;