  import React, { useEffect, useState, useRef } from 'react';
  import { View, Text, TextInput, TouchableOpacity, FlatList, Animated, Pressable, Modal, Platform } from 'react-native';
  import colors from '../themes/colors';
  import { useNavigation } from '@react-navigation/native';
  import styles from '../styles/cursosStyles';
  import { FontAwesome5, Ionicons } from '@expo/vector-icons';

  import { getLoggedCi } from '../services/authService';
  import { getVoluntarioByCi } from '../services/voluntarioService';
  import { getCursosByVoluntario } from '../services/cursosService';

  export default function CursosScreen() {
    const navigation = useNavigation();

    const [search, setSearch] = useState('');
    const [cursos, setCursos] = useState([]); // This will hold your course data

    const [filtrosAplicados, setFiltrosAplicados] = useState({
      estado: null, // 'Finalizado', 'En progreso', 'Sin empezar'
    });

    const [filtrosTemp  , setFiltrosTemp] = useState({
      estado: null,
    });

    const [showFilters, setShowFilters] = useState(false);

    const panelAnim = useRef(new Animated.Value(500)).current;
    const reiniciarOpacity = useRef(new Animated.Value(0)).current;
    const searchWidthAnim = useRef(new Animated.Value(1)).current;

    const hayFiltrosActivos = filtrosAplicados.estado !== null;

    // Fetch courses from REST API
    useEffect(() => {
      const fetchCursos = async () => {
        try {
          const ci = getLoggedCi();
          const voluntario = await getVoluntarioByCi(ci);
          if (!voluntario?.id) return;

          const cursos = await getCursosByVoluntario(voluntario.id);

          const cursosAdaptados = cursos.map((curso) => {
            const totalEtapas = curso.etapas?.length || 0;
            const completadas = curso.etapas?.filter(e => e.estado === 'completado').length || 0;

            const progreso = totalEtapas > 0 ? Math.round((completadas / totalEtapas) * 100) : 0;
            let estado = 'Sin empezar';
            if (completadas === totalEtapas && totalEtapas > 0) estado = 'Finalizado';
            else if (completadas > 0) estado = 'En progreso';

            return {
              id: curso.id,
              titulo: curso.nombre,
              estado,
              progreso,
              fechaInicio: curso.etapas?.[0]?.fechaInicio ?? '',
              fechaFin: curso.etapas?.[curso.etapas.length - 1]?.fechaFinalizacion ?? '',
              etapas: curso.etapas?.map(et => ({
                id: et.id,
                nombre: et.nombre,
                orden: et.orden,
                estado: et.estado,
                fechaInicio: et.fechaInicio,
                fechaFinalizacion: et.fechaFinalizacion,
              })) || [],
            };
          });

          setCursos(cursosAdaptados);
        } catch (err) {
          console.error('Error al obtener cursos:', err);
        }
      };

      fetchCursos();
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
      setFiltrosAplicados({ estado: null });

      Animated.parallel([
        Animated.timing(reiniciarOpacity, { toValue: 0, duration: 300, useNativeDriver: true }),
        Animated.timing(searchWidthAnim, { toValue: 1, duration: 300, useNativeDriver: false }),
      ]).start();
    };

    if (hayFiltrosActivos) {
      Animated.parallel([
        Animated.timing(reiniciarOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.timing(searchWidthAnim, { toValue: 0.75, duration: 300, useNativeDriver: false }),
      ]).start();
    }

    const filtrados = cursos.filter(curso => {
      const estadoFiltro = filtrosAplicados.estado;

      // Filtro por estado
      if (estadoFiltro && curso.estado !== estadoFiltro) {
        return false;
      }

      // Filtro por búsqueda
      if (search.length > 0 && !curso.titulo.toLowerCase().includes(search.toLowerCase())) {
        return false;
      }

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
          <Text style={styles.headerTitle}>Cursos Asignados</Text>
        </View>

        <View style={styles.filtersRow}>
          <TouchableOpacity onPress={abrirPanel} style={[styles.filtroButton, { backgroundColor: hayFiltrosActivos ? colors.naranjaFuerte : colors.fondo }]}>
            <FontAwesome5 name="filter" size={18} color={hayFiltrosActivos ? colors.fondo : colors.naranjaFuerte} />
          </TouchableOpacity>

          <Animated.View style={{ flex: searchWidthAnim }}>
            <TextInput
              placeholder="Buscar curso..."
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
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => {
            const cursoDetalle = {
              ...item,
              stages: item.etapas.map(et => ({
                id: et.id,
                title: et.nombre,
                description: `Etapa ${et.orden}`,
                estado: et.estado,
                fechaInicio: et.fechaInicio,
                fechaFinalizacion: et.fechaFinalizacion,
              }))
            };

            return (
                <TouchableOpacity
                    style={styles.card}
                    onPress={() => navigation.navigate('DetalleCursos', { curso: cursoDetalle })}
                >
                  <Text style={styles.cardTitle}>{item.titulo}</Text>
                  <Text style={styles.cardSubtitle}>Estado: {item.estado}</Text>
                  {item.progreso !== undefined && (
                      <Text style={styles.cardSubtitle}>Progreso: {item.progreso}%</Text>
                  )}
                  {item.fechaInicio && (
                      <Text style={styles.cardFecha}>Inicio: {item.fechaInicio}</Text>
                  )}
                  {item.fechaFin && (
                      <Text style={styles.cardFecha}>Fin: {item.fechaFin}</Text>
                  )}
                </TouchableOpacity>
            );
          }}
          ListEmptyComponent={() => (
            <View style={{ padding: 30, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ color: colors.amarillo, textAlign: 'center', fontSize: 16 }}>
                No se encontraron cursos.
              </Text>
            </View>
          )}
        />

        {showFilters && (
          <View style={styles.modalOverlay}>
            <Pressable style={{ flex: 1 }} onPress={cerrarPanel} />
            <Animated.View style={[styles.modalContent, { transform: [{ translateY: panelAnim }] }]}>
              <Text style={styles.modalTitle}>Filtros de Cursos</Text>

              <Text style={styles.filterLabel}>Estado del Curso</Text>
              <View style={styles.chipsRow}>
                {['Finalizado', 'En progreso', 'Sin empezar'].map(estado => (
                  <Pressable
                    key={estado}
                    style={[styles.choiceChip, filtrosTemp.estado === estado && styles.choiceChipSelected]}
                    onPress={() => setFiltrosTemp(prev => ({
                      ...prev,
                      estado: filtrosTemp.estado === estado ? null : estado
                    }))}
                  >
                    <Text style={{ color: filtrosTemp.estado === estado ? colors.blanco : colors.black }}>
                      {estado}
                    </Text>
                  </Pressable>
                ))}
              </View>

              <TouchableOpacity onPress={aplicarFiltros} style={styles.applyButton}>
                <Text style={styles.applyButtonText}>Aplicar Filtros</Text>
              </TouchableOpacity>
            </Animated.View>
          </View>
        )}
      </View>
    );
  }