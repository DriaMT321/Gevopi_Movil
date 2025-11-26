import React, { useRef, useCallback, useState, useMemo } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    ScrollView,
    TouchableWithoutFeedback,
    Linking,
} from 'react-native';
import { MapView, Marker } from '../components/MapView';
import { FontAwesome5, MaterialIcons } from '@expo/vector-icons';
import styles from '../styles/detalleSolicitudStyles';
import colors from '../themes/colors';
import { useNavigation, useRoute } from '@react-navigation/native';
import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet';
import { GestureHandlerRootView } from 'react-native-gesture-handler';


export default function DetalleSolicitudScreen() {
    const navigation = useNavigation();
    const route = useRoute();
    const { solicitud } = route.params;
    const bottomSheetRef = useRef(null);
    const [isExpanded, setIsExpanded] = useState(false);

    const snapPoints = useMemo(() => ['12%', '40%'], []);

    const handleSheetChanges = useCallback((index) => {
        console.log('BottomSheet index changed to:', index);
        setIsExpanded(index === 1);
    }, []);

    const toggleBottomSheet = useCallback(() => {
        if (isExpanded) {
            bottomSheetRef.current?.collapse();
        } else {
            bottomSheetRef.current?.expand();
        }
    }, [isExpanded]);

    const handleBottomSheetPress = useCallback(() => {
        if (isExpanded) {
            bottomSheetRef.current?.collapse();
        } else {
            bottomSheetRef.current?.expand();
        }
    }, [isExpanded]);

    const compartirConWhatsApp = () => {
        const { latitud, longitud, descripcion, fecha, tipo, nivelEmergencia } = solicitud;

        const mensaje = `*Emergencia* 
            📄 *Descripción:* ${descripcion}
            📅 *Fecha:* ${new Date(fecha).toLocaleString()}
            📌 *Tipo:* ${tipo}
            ⚠️ *Nivel de Emergencia:* ${nivelEmergencia}

            🗺️ *Ubicación:* https://www.google.com/maps/search/?api=1&query=${latitud},${longitud}

            📲 *Enviado desde la App de Emergencias*
            `;

        const url = `whatsapp://send?text=${encodeURIComponent(mensaje)}`;

        Linking.openURL(url).catch(() => {
            alert('No se pudo abrir WhatsApp. ¿Está instalado?');
        });
    };

    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <View style={styles.container}>
                <MapView
                    style={styles.map}
                    initialRegion={{
                        latitude: parseFloat(solicitud.latitud),
                        longitude: parseFloat(solicitud.longitud),
                        latitudeDelta: 0.01,
                        longitudeDelta: 0.01,
                    }}
                >
                    <Marker
                        coordinate={{
                            latitude: parseFloat(solicitud.latitud),
                            longitude: parseFloat(solicitud.longitud),
                        }}
                        title="Ubicación"
                        description={solicitud.descripcion}
                    />
                </MapView>

                {/* Botón de volver fijo */}
                <TouchableOpacity
                    style={[styles.backButton, { position: 'absolute', top: '8%', left: 20, zIndex: 800 }]}
                    onPress={() => navigation.goBack()}
                >
                    <MaterialIcons name="arrow-back" size={24} color={colors.amarillo} />
                </TouchableOpacity>

                <BottomSheet
                    ref={bottomSheetRef}
                    index={0}
                    snapPoints={snapPoints}
                    onChange={handleSheetChanges}
                    enablePanDownToClose={false}
                    backgroundStyle={{
                        backgroundColor: colors.blanco,
                    }}
                    handleIndicatorStyle={{
                        backgroundColor: colors.amarillo,
                    }}
                >
                    <BottomSheetView style={{ flex: 1 }}>
                        <TouchableWithoutFeedback onPress={handleBottomSheetPress}>
                            <View style={{ flex: 1 }}>
                                <View style={styles.modalPreview}>
                                    <Text style={styles.modalTitle}>Detalles de la Solicitud</Text>
                                </View>

                                <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
                                    <View>
                                        <View style={styles.infoRow}>
                                            <FontAwesome5 name="file-alt" size={18} color={colors.amarillo} />
                                            <Text style={styles.infoText}>{solicitud.descripcion}</Text>
                                        </View>

                                        <View style={styles.infoRow}>
                                            <FontAwesome5 name="calendar" size={18} color={colors.amarillo} />
                                            <Text style={styles.infoText}>
                                                {new Date(solicitud.fecha).toLocaleString()}
                                            </Text>
                                        </View>

                                        <View style={styles.infoRow}>
                                            <FontAwesome5 name="heartbeat" size={18} color={colors.amarillo} />
                                            <Text style={styles.infoText}>Tipo: {solicitud.tipo}</Text>
                                        </View>

                                        <View style={styles.infoRow}>
                                            <FontAwesome5
                                                name="exclamation-triangle"
                                                size={18}
                                                color={colors.amarillo}
                                            />
                                            <Text style={styles.infoText}>Nivel: {solicitud.nivelEmergencia}</Text>
                                        </View>

                                        <TouchableOpacity
                                            onPress={compartirConWhatsApp}
                                            style={{
                                                margin: 16,
                                                backgroundColor: colors.amarillo,
                                                padding: 12,
                                                borderRadius: 8,
                                                alignItems: 'center',
                                            }}
                                        >
                                            <Text style={{ color:colors.blanco, fontWeight: 'bold' }}>COMPARTIR POR WHATSAPP</Text>
                                        </TouchableOpacity>
                                    </View>
                                </ScrollView>
                            </View>
                        </TouchableWithoutFeedback>
                    </BottomSheetView>
                </BottomSheet>
            </View>
        </GestureHandlerRootView>
    );
}
 