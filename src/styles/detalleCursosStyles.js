import { StyleSheet, Dimensions } from 'react-native';
import colors from '../themes/colors';

const { width } = Dimensions.get('window');

export default StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.fondo,
    paddingHorizontal: 20,
    paddingTop: 60,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.naranjaFuerte,
    marginLeft: 12,
  },
  scrollContent: {
    paddingBottom: 40, // Add some padding at the bottom for scrolling
  },
  courseDetailsCard: {
    backgroundColor: colors.blanco,
    borderRadius: 10,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: 20,
  },
  courseTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.amarillo,
    marginBottom: 15,
    textAlign: 'center',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
    paddingHorizontal: 10, // Add some horizontal padding for rows
  },
  infoLabel: {
    fontSize: 16,
    color: colors.black,
    fontWeight: '600', // Make labels a bit bolder
  },
  infoValue: {
    fontSize: 16,
    color: colors.black,
  },
  progressBar: {
    marginBottom: 10,
  },
  progressBariOS: {
    height: 8,
    width: '100%',
    backgroundColor: colors.grayLight,
    borderRadius: 5,
    overflow: 'hidden',
    marginTop: 5,
    marginBottom: 10,
  },
  progressBarFilliOS: {
    height: '100%',
    backgroundColor: colors.amarillo,
    borderRadius: 5,
  },
  progressContainer: {
    marginTop: 20,
    backgroundColor: colors.blanco,
    borderRadius: 10,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  progressSectionTitle: { // Changed from progressTitle to avoid confusion
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.amarillo,
    marginBottom: 20,
    textAlign: 'center',
  },
  stepWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-start', // Align items to the start for vertical stepper effect
    marginBottom: 15,
  },
  stepLineContainer: {
    alignItems: 'center',
    marginRight: 15,
  },
  stepCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.grayLight, // Incomplete step color
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.gray,
    position: 'relative', // Needed for checkmark absolute positioning
  },
  stepCircleCompleted: {
    backgroundColor: colors.amarillo, // Completed step color
    borderColor: colors.amarillo,
  },
  stepNumber: {
    color: colors.black,
    fontWeight: 'bold',
  },
  stepLine: {
    width: 2,
    flex: 1, // Make line extend between steps
    backgroundColor: colors.textoPrincipal,
    marginVertical: 5, // Space between circle and line
  },
  stepLineCompleted: {
    backgroundColor: colors.amarillo,
  },
  stepContent: {
    flex: 1,
    backgroundColor: colors.blanco, // Light background for content
    borderRadius: 8,
    padding: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.amarillo,
  },
  stepContentCompleted: {
    backgroundColor: colors.amarillo, // Light green for completed content
    borderColor: colors.amarillo,
  },
  stepContentDisabled: {
    backgroundColor: colors.card2,
    opacity: 0.7,
  },
  stepContentInProgress: {
    backgroundColor: colors.naranjaFuerte, // Fondo llamativo para "En progreso"
    borderColor: colors.naranjaFuerte,
    shadowColor: colors.naranjaFuerte,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  stepTextContainer: {
    flex: 1, // Allows title and description to wrap
    marginRight: 10, // Space before chevron
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.textoPrincipal,
    marginBottom: 2,
  },
  stepTitleCompleted: {
    color: colors.blanco,
  },
  stepTitleInProgress: {
    color: colors.blanco,
  },
  stepDescription: {
    fontSize: 13,
    color: colors.textoPrincipal,
  },
  stepDescriptionCompleted: {
    color: colors.blanco,
  },
  stepDescriptionInProgress: {
    color: colors.blanco,
  },
  stepCircleInProgress: {
    backgroundColor: colors.naranjaFuerte,
    borderColor: colors.naranjaFuerte,
  },
  // Estilos para el texto del estado de la etapa
  stageStatusText: {
    marginTop: 8,
    fontWeight: 'bold',
    fontSize: 13,
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 8,
    overflow: 'hidden',
  },
  stageStatusNoEmpezado: {
    backgroundColor: '#fff0f0',
    color: '#d32f2f',
    borderWidth: 1,
    borderColor: '#d32f2f',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  stageStatusEnProgreso: {
    backgroundColor: '#fffbe6',
    color: '#ff9800',
    borderWidth: 1,
    borderColor: '#ff9800',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  stageStatusCompletado: {
    backgroundColor: '#e6ffe6',
    color: '#388e3c',
    borderWidth: 1,
    borderColor: '#388e3c',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  finishButton: {
    backgroundColor: colors.amarillo,
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 30,
    width: '100%',
  },
  finishButtonDisabled: {
    backgroundColor: colors.card2,
    color: colors.amarillo,
  },
  finishButtonText: {
    fontWeight: 'bold',
    fontSize: 18,
  },
  finishButtonTextDisabled: {
    color: colors.amarillo,
  },
});