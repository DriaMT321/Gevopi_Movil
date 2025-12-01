import { StyleSheet } from 'react-native';
import colors from '../themes/colors';

export default StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.fondo,
    padding: 16,
    paddingTop: 60,

  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 30,
    fontWeight: 'bold',
    color: colors.naranjaFuerte,
    marginLeft: 10,
  },
  filtersRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  filtroButton: {
    padding: 12,
    borderRadius: 12,
    marginRight: 12,
    borderWidth: 1,
    borderColor: colors.naranjaFuerte,
  },
  input: {
    backgroundColor: colors.blanco,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 14,
    fontSize: 14,
    color: colors.textoPrincipal,
    height: 40,
    borderWidth: 1,
    borderColor: colors.naranjaFuerte,
  },
  reiniciarButton: {
    backgroundColor: colors.rojo,
    padding: 12,
    borderRadius: 12,
    marginLeft: 8,
  },
  card: {
    backgroundColor: colors.blanco,
    borderRadius: 10,
    padding: 15,
    width: '95%',
    marginBottom: 10,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    borderLeftColor: colors.amarillo,
    minHeight: 120,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.amarillo,
    marginBottom: 8,
  },
  cardSubtitle: {
    fontSize: 14,
    color: colors.black,
    numberOfLines: 3,
    flex: 1,
  },
  cardFecha: {
    color: colors.textoSecundario,
    fontSize: 12,
    marginTop: 6,
    fontWeight: 'bold',
  },
  emptyContainer: {
    padding: 30,
    alignItems: 'center',
  },
  emptyText: {
    color: colors.naranjaFuerte,
    fontSize: 16,
    textAlign: 'center',
  },
  modalOverlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.card2,
    padding: 24,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.naranjaFuerte,
    marginBottom: 16,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.textoPrincipal,
    marginBottom: 8,
  },
  chipsRow: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  choiceChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: colors.blanco,
    borderRadius: 20,
    marginRight: 10,
    borderWidth: 1,
    borderColor: colors.naranjaFuerte,
  },
  choiceChipSelected: {
    backgroundColor: colors.naranjaFuerte,
  },
  datePicker: {
    padding: 14,
    backgroundColor: colors.blanco,
    borderRadius: 10,
    marginBottom: 10,
  },
  rangoFechaToggle: {
    padding: 14,
    backgroundColor: '#c7cdd3',
    borderRadius: 10,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },

  applyButton: {
    backgroundColor: colors.naranjaFuerte,
    padding: 14,
    borderRadius: 12,
    marginTop: 20,
    alignItems: 'center',
  },
  applyButtonText: {
    color: colors.blanco,
    fontWeight: 'bold',
  },
});