import { StyleSheet } from 'react-native';
import colors from '../themes/colors';

export default StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.fondo,
  },
  backButton: {
    backgroundColor: colors.blanco,
    padding: 10,
    borderRadius: 25,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  map: {
    flex: 1,
  },
  modalPreview: {
    padding: 16,
    borderTopLeftRadius: 15,
    borderTopRightRadius: 15,
    backgroundColor: colors.blanco,
  },
  modalContent: {
    padding: 16,
    backgroundColor: colors.blanco,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.naranjaFuerte,
    marginBottom: 10,
    textAlign: 'center',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    paddingHorizontal: 10,
  },
  infoText: {
    fontSize: 16,
    marginLeft: 10,
    color: colors.textoPrincipal,
    flex: 1,
  },
  accionButton: {
    marginTop: 16,
    backgroundColor: colors.naranjaFuerte,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  accionButtonDisabled: {
    backgroundColor: colors.amarillo,
  },
  accionButtonText: {
    color: colors.blanco,
    fontWeight: 'bold',
    fontSize: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.naranjaFuerte,
    marginTop: 20,
    marginBottom: 10,
  },
  agregarVoluntarioBtn: {
    marginTop: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.naranjaFuerte,
    borderRadius: 8,
    alignItems: 'center',
    borderStyle: 'dashed',
  },
  agregarVoluntarioText: {
    color: colors.naranjaFuerte,
    fontWeight: 'bold',
  },
  busquedaContainer: {
    marginTop: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.gray,
    borderRadius: 10,
    padding: 12,
    backgroundColor: colors.blanco,
    marginBottom: 10,
  },
  listaVoluntarios: {
    maxHeight: 150,
    borderWidth: 1,
    borderColor: colors.amarillo,
    borderRadius: 8,
    paddingHorizontal: 10,
  },
  voluntarioItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.amarillo,
  },
  voluntarioNombre: {
    fontSize: 16,
    color: colors.textoPrincipal,
  },
  voluntariosAsignadosContainer: {
    marginBottom: 15,
  },
  voluntarioSeleccionado: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: colors.naranjaFuerte,
    borderRadius: 8,
    marginTop: 8,
  },
  voluntarioText: {
    fontSize: 15,
    color: colors.textoPrincipal,
  },
  contadorVoluntarios: {
    textAlign: 'right',
    marginBottom: 5,
    color: colors.textoPrincipal,
    fontSize: 14,
  },
  sinResultados: {
    textAlign: 'center',
    paddingVertical: 15,
    color: colors.textoPrincipal,
  },
});