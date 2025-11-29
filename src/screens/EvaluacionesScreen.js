import React, { useEffect, useState, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, Animated, Pressable, Modal, Platform } from 'react-native';
import colors from '../themes/colors';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useNavigation } from '@react-navigation/native';
import styles from '../styles/evaluacionesStyles';
import { FontAwesome5, Ionicons } from '@expo/vector-icons';

import { getLoggedCi } from '../services/authService';
import { getVoluntarioByCi } from '../services/voluntarioService';

export default function EvaluacionesScreen() {
  const navigation = useNavigation();

  const [search, setSearch] = useState('');
  const [voluntarioId, setVoluntarioId] = useState(null);
  const [evaluaciones, setEvaluaciones] = useState([]);
  const [loading, setLoading] = useState(true);

  const [filtrosAplicados, setFiltrosAplicados] = useState({
    estado: null,
    tipo: null,
    desde: null,
    hasta: null,
  });

  const [filtrosTemp, setFiltrosTemp] = useState({
    estado: null,
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

  const hayFiltrosActivos = filtrosAplicados.estado !== null || 
                          filtrosAplicados.tipo !== null || 
                          filtrosAplicados.desde || 
                          filtrosAplicados.hasta;

  useEffect(() => {
    const fetchData = async () => {
      try {
        const ci = await getLoggedCi();
        const voluntario = await getVoluntarioByCi(ci);
        if (voluntario && voluntario.id) {
          setVoluntarioId(parseInt(voluntario.id));
          // Por ahora las evaluaciones están vacías hasta implementar el endpoint REST
          setEvaluaciones([]);
        }
      } catch (error) {
        console.error('Error al obtener datos:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

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
    setFiltrosAplicados({ estado: null, tipo: null, desde: null, hasta: null });

    Animated.parallel([
      Animated.timing(reiniciarOpacity, { toValue: 0, duration: 300, useNativeDriver: true }),
      Animated.timing(searchWidthAnim, { toValue: 1, duration: 300, useNativeDriver: false }),
    ]).start();
  };

  const abrirPicker = (type) => {
    setPickerType(type);
    setPickerValue(type === 'Desde' ? filtrosTemp.desde : filtrosTemp.hasta);
  };

  const onDateChange = (event, selectedDate) => {
    if (pickerType === 'Desde') setFiltrosTemp(prev => ({ ...prev, desde: selectedDate }));
    else setFiltrosTemp(prev => ({ ...prev, hasta: selectedDate }));
    setPickerType(null);
  };

  if (hayFiltrosActivos) {
    Animated.parallel([
      Animated.timing(reiniciarOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
      Animated.timing(searchWidthAnim, { toValue: 0.75, duration: 300, useNativeDriver: false }),
    ]).start();
  }

  const filtrados = evaluaciones.filter(e => {
    const estado = filtrosAplicados.estado;
    const tipo = filtrosAplicados.tipo;
    const desde = filtrosAplicados.desde;
    const hasta = filtrosAplicados.hasta;
    const tieneResultado = !!e.fechaResultado;

    // Filtro por estado
    if (estado === 'Realizada' && tieneResultado) return false;
    if (estado === 'Entregada' && !tieneResultado) return false;

    // Filtro por tipo
    if (tipo === 'Fisica' && !e.titulo.toLowerCase().includes('fisica')) return false;
    if (tipo === 'Emocional' && !e.titulo.toLowerCase().includes('emocional')) return false;

    // Filtro por fecha
    const fecha = new Date(e.fechaRealizada);
    if (desde && fecha < desde) return false;
    if (hasta && fecha > hasta) return false;

    // Filtro por búsqueda
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
        <Text style={styles.headerTitle}>Evaluaciones</Text>
      </View>

      <View style={styles.filtersRow}>
        <TouchableOpacity onPress={abrirPanel} style={[styles.filtroButton, { backgroundColor: hayFiltrosActivos ? colors.naranjaFuerte : colors.fondo }]}>
          <FontAwesome5 name="filter" size={18} color={hayFiltrosActivos ? colors.fondo : colors.naranjaFuerte} />
        </TouchableOpacity>

        <Animated.View style={{ flex: searchWidthAnim }}>
          <TextInput
            placeholder="Buscar evaluación..."
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
        renderItem={({ item }) => {
          const entregada = item.fechaResultado !== null;
          return (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>{item.titulo}</Text>
              <Text style={styles.cardFecha}>Fecha realizada: {item.fechaRealizada}</Text>
              {entregada && <Text style={styles.cardFecha}>Resultado entregado: {item.fechaResultado}</Text>}
              {entregada && (
                <TouchableOpacity style={styles.verButton} onPress={() => navigation.navigate('ResultadoEvaluaciones', { evaluacion: item })}>
                  <Text style={styles.verButtonText}>Ver resultado</Text>
                </TouchableOpacity>
              )}
            </View>
          );
        }}
        ListEmptyComponent={() => (
          <View style={{ padding: 30, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ color: colors.naranjaFuerte, textAlign: 'center', fontSize: 16 }}>
              No se encontraron resultados.
            </Text>
          </View>
        )}
      />

      {showFilters && (
        <View style={styles.modalOverlay}>
          <Pressable style={{ flex: 1 }} onPress={cerrarPanel} />
          <Animated.View style={[styles.modalContent, { transform: [{ translateY: panelAnim }] }]}>
            <Text style={styles.modalTitle}>Filtros</Text>

            {/* Nuevo filtro por tipo de evaluación */}
            <Text style={styles.filterLabel}>Tipo de Evaluación</Text>
            <View style={styles.chipsRow}>
              {['Fisica', 'Emocional'].map(tipo => (
                <Pressable
                  key={tipo}
                  style={[styles.choiceChip, filtrosTemp.tipo === tipo && styles.choiceChipSelected]}
                  onPress={() => setFiltrosTemp(prev => ({ 
                    ...prev, 
                    tipo: filtrosTemp.tipo === tipo ? null : tipo 
                  }))}
                >
                  <Text style={{ color: filtrosTemp.tipo === tipo ? colors.blanco : colors.negro }}>
                    {tipo}
                  </Text>
                </Pressable>
              ))}
            </View>

            <Text style={styles.filterLabel}>Estado de Evaluación</Text>
            <View style={styles.chipsRow}>
              {['Realizada', 'Entregada'].map(tipo => (
                <Pressable
                  key={tipo}
                  style={[styles.choiceChip, filtrosTemp.estado === tipo && styles.choiceChipSelected]}
                  onPress={() => setFiltrosTemp(prev => ({ 
                    ...prev, 
                    estado: filtrosTemp.estado === tipo ? null : tipo 
                  }))}
                >
                  <Text style={{ color: filtrosTemp.estado === tipo ? colors.blanco : colors.negro }}>
                    {tipo}
                  </Text>
                </Pressable>
              ))}
            </View>

            {filtrosTemp.estado && (
              <>
                <TouchableOpacity onPress={() => setMostrarRangoFechas(!mostrarRangoFechas)} style={styles.rangoFechaToggle}>
                  <Text style={{ color: colors.naranjaFuerte, fontWeight: 'bold' }}>Rango de Fechas</Text>
                  <Ionicons name={mostrarRangoFechas ? 'chevron-up' : 'chevron-down'} size={20} color={colors.naranjaFuerte} />
                </TouchableOpacity>

                {mostrarRangoFechas && (
                  <>
                    <TouchableOpacity onPress={() => abrirPicker('Desde')} style={styles.datePicker}>
                      <Text>Desde: {filtrosTemp.desde ? filtrosTemp.desde.toLocaleDateString() : '----'}</Text>
                    </TouchableOpacity>

                    {filtrosTemp.estado === 'Entregada' && (
                      <TouchableOpacity onPress={() => abrirPicker('Hasta')} style={styles.datePicker}>
                        <Text>Hasta: {filtrosTemp.hasta ? filtrosTemp.hasta.toLocaleDateString() : '----'}</Text>
                      </TouchableOpacity>
                    )}
                  </>
                )}
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
        <View style={{ backgroundColor: colors.blanco, padding: 16 }}>
          <DateTimePicker
            value={pickerValue || new Date()}
            mode="date"
            display={Platform.OS === 'ios' ? 'inline' : 'calendar'}
            onChange={onDateChange}
            textColor={Platform.OS === 'ios' ? colors.naranjaFuerte : undefined}
            themeVariant={Platform.OS === 'ios' ? 'light' : undefined}
          />
        </View>
      </Modal>
    </View>
  );
};

