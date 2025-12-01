import { StyleSheet } from 'react-native';
import colors from '../themes/colors';

export default StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.fondo,
    paddingTop: 60,
  },
  scrollContainer: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,

    paddingBottom: 15,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '600',
    color: colors.amarillo,
    textAlign: 'center',
    flex: 1,
  },
  headerIconContainer: {
    width: 40,
    alignItems: 'flex-end',
  },
  
  // Tarjeta de resumen
  summaryCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 20,
    marginBottom: 25,
    shadowColor: colors.sombraSuave,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  summaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  summaryTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.naranjaFuerte,
    flex: 1,
  },
  evaluationTypeBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    marginLeft: 10,
  },
  physicalBadge: {
    backgroundColor: colors.naranjaSuave,
  },
  emotionalBadge: {
    backgroundColor: colors.naranjaSuave,
  },
  evaluationTypeText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.blanco,
  },
  summaryDetails: {
    borderTopWidth: 1,
    borderTopColor: colors.naranjaSuave,
    paddingTop: 15,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailText: {
    marginLeft: 10,
    color: colors.texto,
    fontSize: 15,
  },
  
  // Sección de informe
  reportSection: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: colors.sombraSuave,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.naranjaFuerte,
    paddingBottom: 15,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.naranjaFuerte,
    marginLeft: 10,
  },
  
  // Subsecciones
  subSection: {
    marginBottom: 20,
  },
  subSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  subSectionTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.amarillo,
    marginRight: 8,
  },
  contentBox: {
    backgroundColor: colors.card,
    borderRadius: 8,
    padding: 15,
  },
  listItem: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  bullet: {
    color: colors.amarillo,
    fontWeight: 'bold',
    marginRight: 8,
  },
  listText: {
    flex: 1,
    color: colors.negro,
    fontSize: 15,
    lineHeight: 22,
  },
  
  // Estado vacío
  emptyState: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderRadius: 8,
    marginTop: 10,
  },
  emptyText: {
    marginLeft: 10,
    color: colors.gris,
    fontSize: 15,
  },
  
  
});