import { StyleSheet, Dimensions } from 'react-native';
import colors from '../themes/colors';
const { width, height } = Dimensions.get('window');

export default StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.fondo,
  },
  perfilContainer: {
    alignItems: 'center',
    marginVertical: 20,
    paddingHorizontal: 20,
    paddingTop: 50,
  },
  avatarWrapper: {
    position: 'relative',
    marginBottom: 15,
  },
  greenContainer: {
    position: 'absolute',
    top: 0,
    width: '100%',
    height: height * 0.55,
    backgroundColor: colors.amarillo,
    borderBottomLeftRadius: 50,
    borderBottomRightRadius: 50,
    zIndex: -1,
  },
  statusDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    position: 'absolute',
    bottom: 5,
    right: 5,
    borderWidth: 2,
    borderColor: colors.blanco,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.blanco,
    marginBottom: 5,
  },
  buttonsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    width: '100%',
    marginTop: 10,
  },
  circleButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    color: colors.negro,
    backgroundColor: colors.fondo,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 15,
    elevation: 3,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  emergenciaButton: {
    backgroundColor: colors.naranjaFuerte,
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 15,
    elevation: 3,
  },
  sectionCard: {
    backgroundColor: colors.card,
    margin: 16,
    padding: 16,
  
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.amarillo,
    marginBottom: 15,
  },
  widgetCard: {
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
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.amarillo,
    marginBottom: 5,
  },
  itemSubtitle: {
    fontSize: 14,
    color: '#333',
    marginBottom: 3,
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 10,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: colors.amarillo,
  },

  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  
    backgroundColor: colors.blanco,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 25,
    maxHeight: '90%',
  },
  
  modalScrollContent: {
    paddingBottom: 20,
  },

  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.amarillo,
    marginBottom: 20,
    textAlign: 'left',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  infoText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 15,
    color: colors.textoPrincipal,
    fontWeight: 'bold',
  },

  carouselSectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.naranjaFuerte,
    marginBottom: 10,
  },
  container: {
    flex: 1,
    backgroundColor: colors.amarillo,
  },
  avatarImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },

  avatarPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.blanco,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.blanco,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },

  avatarInitial: {
    fontSize: 48,
    color: colors.amarillo,
    fontWeight: 'bold',
  },


  modalSection: {
    marginBottom: 18,
    
  },
  modalLabel: {
    fontWeight: 'bold',
    marginBottom: 6,
    color: colors.naranjaFuerte,
    fontSize: 15,
    
  },

  descripcionInput: {
    marginBottom: 6,
    borderColor: colors.gray,
    borderWidth: 1,
    color: colors.gray,
    fontSize: 15,
    height: 50,
    backgroundColor: colors.blanco,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },

  enviarButton: {
    backgroundColor: colors.amarillo,
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
  },
  enviarButtonText: {
    color: colors.blanco,
    fontWeight: 'bold',
    fontSize: 16,
  },




  textArea: {
    borderWidth: 1,
    borderColor: colors.gray,
    borderRadius: 10,
    backgroundColor: colors.white,
    padding: 12,
    minHeight: 100,
    textAlignVertical: 'top',
    fontSize: 14,
    color: colors.dark,
    marginTop: 6,
  },
  dropdown: {
    height: 50,
    borderColor: colors.gray,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    backgroundColor: colors.white,
    marginTop: 6,
  },

  placeholderStyle: {
    fontSize: 14,
    color: colors.gray,
  },

  selectedTextStyle: {
    fontSize: 14,
    color: colors.dark,
  },

  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },

  loadingBox: {
    backgroundColor: colors.fondo,
    borderRadius: 16,
    paddingVertical: 30,
    paddingHorizontal: 40,
    alignItems: 'center',
    elevation: 5,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },

  loadingText: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.amarillo,
  },

  loadingSubtext: {
    fontSize: 14,
    color: colors.amarillo,
    marginTop: 6,
  },

  carouselItem: {
    width: width - 64,
    paddingVertical: 10,
  },
  cardContainer: {
    backgroundColor: colors.blanco,
    borderRadius: 15,
    padding: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    width: '98%',
    borderLeftWidth: 4,
    borderLeftColor: colors.amarillo,
    minHeight: 100,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.amarillo,
    flex: 1,
  },
  cardDate: {
    fontSize: 12,
    color: colors.gris,
    marginLeft: 4,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
  },
  cardDescription: {
    fontSize: 14,
    color: colors.dark,
    lineHeight: 20,
    maxHeight: 40,
  },
  emptyStateContainer: {
    backgroundColor: colors.blanco,
    width: '98%',
    borderRadius: 15,
    padding: 20,
    marginVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  emptyStateText: {
    marginTop: 10,
    fontSize: 14,
    color: colors.gris,
    textAlign: 'center',
  },
  logoutButton: {
    position: 'absolute',
    top: 60,
    right: 20,
    backgroundColor: colors.fondo,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  logoutButton2: {
    flexDirection: 'row',
    alignContent: 'center',
    justifyContent: 'center',
    backgroundColor: colors.amarillo,
    borderRadius: 20,
    marginTop: 10,
    padding: 16,
  },
  logoutText: {
    color: colors.blanco,
    fontWeight: 'bold',
    fontSize: 16,
    marginRight: 8,
  },
  
  // Estilos para el rol del voluntario
  roleContainer: {
    marginBottom: 15,
    alignItems: 'center',
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  roleIcon: {
    marginRight: 8,
  },
  roleText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.blanco,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  // ...existing styles...

modalHeader: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: 20,
},

closeButton: {
  padding: 5,
},

closeButtonText: {
  fontSize: 24,
  color: '#666',
  fontWeight: 'bold',
},

required: {
  color: '#e74c3c',
  fontSize: 16,
},

inputError: {
  borderColor: '#e74c3c',
  borderWidth: 1,
},

errorText: {
  color: '#e74c3c',
  fontSize: 12,
  marginTop: 5,
},

charCounter: {
  fontSize: 12,
  color: '#999',
  textAlign: 'right',
  marginTop: 5,
},

enviarButtonDisabled: {
  backgroundColor: '#95a5a6',
  opacity: 0.6,
},

cancelarButton: {
  backgroundColor: 'transparent',
  borderWidth: 1,
  borderColor: '#e74c3c',
  borderRadius: 8,
  paddingVertical: 12,
  marginTop: 10,
  alignItems: 'center',
},

cancelarButtonText: {
  color: '#e74c3c',
  fontSize: 16,
  fontWeight: 'bold',
},
});

