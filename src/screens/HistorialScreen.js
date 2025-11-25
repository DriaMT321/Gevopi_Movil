import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, Animated, Pressable, Modal, Platform } from 'react-native';
import colors from '../themes/colors';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useNavigation } from '@react-navigation/native';
import styles from '../styles/historialStyles';
import { FontAwesome5, Ionicons } from '@expo/vector-icons';
import { getLoggedCi } from '../services/authService';
import { getVoluntarioByCi } from '../services/voluntarioService';
import { obtenerReportePorVoluntarioId } from '../services/queriesSQL';

export default function HistorialScreen() {
  const navigation = useNavigation();

  const [search, setSearch] = useState('');
  const [historial, setHistorial] = useState([]);
  const [filtrosAplicados, setFiltrosAplicados] = useState({
    tipo: null,
    desde: null,
    hasta: null,
  });
  const [filtrosTemp, setFiltrosTemp] = useState({
    tipo: null,
    desde: null,
    hasta: null,
  });

  const [showFilters, setShowFilters] = useState(false);
  const [pickerType, setPickerType] = useState(null);
  const [pickerValue, setPickerValue] = useState(null);
  const [mostrarRangoFechas, setMostrarRangoFechas] = useState(false);

  const panelAnim = useRef(new Animated.Value(500)).current;
  const reiniciarOpacity = useRef(new Animated.Value(0)).current;
  const searchWidthAnim = useRef(new Animated.Value(1)).current;

  const hayFiltrosActivos = filtrosAplicados.tipo !== null || filtrosAplicados.desde || filtrosAplicados.hasta;

  const abrirPanel = () => {
    setFiltrosTemp({ ...filtrosAplicados });
    setShowFilters(true);
    Animated.timing(panelAnim, { toValue: 0, duration: 300, useNativeDriver: true }).start();
  };

  const cerrarPanel = () => {
    Animated.timing(panelAnim, { toValue: 500, duration: 300, useNativeDriver: true }).start(() => setShowFilters(false));
  };

  const aplicarFiltros = () => {
    setFiltrosAplicados({ ...filtrosTemp });
    cerrarPanel();
  };

  const reiniciarFiltros = () => {
    setSearch('');
    setFiltrosAplicados({ tipo: null, desde: null, hasta: null });

    Animated.parallel([
      Animated.timing(reiniciarOpacity, { toValue: 0, duration: 300, useNativeDriver: true }),
      Animated.timing(searchWidthAnim, { toValue: 1, duration: 300, useNativeDriver: false }),
    ]).start();
  };

  const abrirPicker = (type) => {
    setPickerType(type);
    setPickerValue(type === "Desde" ? filtrosTemp.desde : filtrosTemp.hasta);
  };

  const onDateChange = (event, selectedDate) => {
    if (pickerType === "Desde") setFiltrosTemp(prev => ({ ...prev, desde: selectedDate }));
    else setFiltrosTemp(prev => ({ ...prev, hasta: selectedDate }));
    setPickerType(null);
  };

  useEffect(() => {
    const fetchHistorial = async () => {
      try {
        const ci = await getLoggedCi();
        const voluntario = await getVoluntarioByCi(ci);
        if (!voluntario || !voluntario.id) return;
  
        const reportes = await obtenerReportePorVoluntarioId(voluntario.id.toString());
        if (reportes?.length > 0) {
          const masReciente = [...reportes].sort((a, b) => new Date(b.fechaGenerado) - new Date(a.fechaGenerado))[0];
  
          const items = [];
  
          if (masReciente.resumenFisico) {
            items.push({
              tipo: "clinico",
              titulo: "Resumen Clínico",
              descripcion: masReciente.resumenFisico,
              fecha: masReciente.fechaGenerado,
            });
          }
  
          if (masReciente.resumenEmocional) {
            items.push({
              tipo: "psicologico",
              titulo: "Resumen Psicológico",
              descripcion: masReciente.resumenEmocional,
              fecha: masReciente.fechaGenerado,
            });
          }
  
          setHistorial(items);
        }
      } catch (err) {
        console.error("Error cargando historial:", err);
      }
    };
  
    fetchHistorial();
  }, []);

  if (hayFiltrosActivos) {
    Animated.parallel([
      Animated.timing(reiniciarOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
      Animated.timing(searchWidthAnim, { toValue: 0.75, duration: 300, useNativeDriver: false }),
    ]).start();
  }

  const filtrados = historial.filter(e => {
    const tipo = filtrosAplicados.tipo;
    const desde = filtrosAplicados.desde;
    const hasta = filtrosAplicados.hasta;

    if (tipo && e.tipo !== tipo) return false;

    const fecha = new Date(e.fecha);
    if (desde && fecha < desde) return false;
    if (hasta && fecha > hasta) return false;

    if (search.length > 0 && !e.titulo.toLowerCase().includes(search.toLowerCase())) return false;

    return true;
  });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
                  onPress={() => navigation.goBack()}
                  style={styles.backButton}
                >
                  <Ionicons name="arrow-back" size={24} color={colors.naranjaFuerte} />
                </TouchableOpacity>
        <Text style={styles.headerTitle}>Historial</Text>
      </View>

      <View style={styles.filtersRow}>
        <TouchableOpacity onPress={abrirPanel} style={[styles.filtroButton, { backgroundColor: hayFiltrosActivos ? colors.naranjaFuerte : colors.fondo }]}>
          <FontAwesome5 name="filter" size={18} color={hayFiltrosActivos ? colors.blanco : colors.naranjaFuerte} />
        </TouchableOpacity>

        <Animated.View style={{ flex: searchWidthAnim }}>
          <TextInput
            placeholder="Buscar historial..."
            style={styles.input}
            value={search}
            onChangeText={setSearch}
          />
        </Animated.View>

        <Animated.View style={{ opacity: reiniciarOpacity }}>
          <TouchableOpacity onPress={reiniciarFiltros} style={styles.reiniciarButton}>
            <Ionicons name="close" size={20} color={colors.blanco} />
          </TouchableOpacity>
        </Animated.View>
      </View>

      <FlatList
        data={filtrados}
        keyExtractor={(item, index) => index.toString()}
        ListEmptyComponent={() => (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No se encontraron resultados.{"\n"}Presione la X para reiniciar los filtros.</Text>
          </View>
        )}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{item.titulo}</Text>
            <Text style={styles.cardSubtitle}>{item.descripcion}</Text>
            <Text style={styles.cardFecha}>Fecha: {new Date(item.fecha).toLocaleDateString()}</Text>
          </View>
        )}
      />

      {showFilters && (
        <View style={styles.modalOverlay}>
          <Pressable style={{ flex: 1 }} onPress={cerrarPanel} />
          <Animated.View style={[styles.modalContent, { transform: [{ translateY: panelAnim }] }]}>
            <Text style={styles.modalTitle}>Filtros</Text>

            <Text style={styles.filterLabel}>Tipo de Historial</Text>
            <View style={styles.chipsRow}>
              {["clinico", "psicologico"].map(tipo => (
                <Pressable
                  key={tipo}
                  style={[styles.choiceChip, filtrosTemp.tipo === tipo && styles.choiceChipSelected]}
                  onPress={() => setFiltrosTemp(prev => ({ ...prev, tipo }))}
                >
                  <Text style={{ color: filtrosTemp.tipo === tipo ? colors.blanco : colors.dark }}>{tipo.charAt(0).toUpperCase() + tipo.slice(1)}</Text>
                </Pressable>
              ))}
            </View>

            <TouchableOpacity onPress={() => setMostrarRangoFechas(!mostrarRangoFechas)} style={styles.rangoFechaToggle}>
              <Text style={{ color: colors.darkBlue, fontWeight: 'bold' }}>Rango de Fechas</Text>
              <Ionicons name={mostrarRangoFechas ? "chevron-up" : "chevron-down"} size={20} color={colors.darkBlue} />
            </TouchableOpacity>

            {mostrarRangoFechas && (
              <>
                <TouchableOpacity onPress={() => abrirPicker("Desde")} style={styles.datePicker}>
                  <Text>Desde: {filtrosTemp.desde ? filtrosTemp.desde.toLocaleDateString() : "----"}</Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={() => abrirPicker("Hasta")} style={styles.datePicker}>
                  <Text>Hasta: {filtrosTemp.hasta ? filtrosTemp.hasta.toLocaleDateString() : "----"}</Text>
                </TouchableOpacity>
              </>
            )}

            <TouchableOpacity onPress={aplicarFiltros} style={styles.applyButton}>
              <Text style={styles.applyButtonText}>APLICAR FILTROS</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      )}

      <Modal visible={pickerType !== null} transparent animationType="fade">
        <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' }} onPress={() => setPickerType(null)} />
        <View style={{ backgroundColor: colors.blanco, padding: 16, borderRadius: 12 }}>
          <DateTimePicker
            value={pickerValue || new Date()}
            mode="date"
            display={Platform.OS === 'ios' ? "inline" : "calendar"}
            onChange={onDateChange}
            textColor={Platform.OS === 'ios' ? colors.amarillo : undefined}
            themeVariant={Platform.OS === 'ios' ? "light" : undefined}
          />
        </View>
      </Modal>
    </View>
  );
};

