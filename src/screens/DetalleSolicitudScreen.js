import React, { useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    ScrollView,
    Linking,
    Animated,
} from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { FontAwesome5, MaterialIcons } from '@expo/vector-icons';
import styles from '../styles/detalleSolicitudStyles';
import colors from '../themes/colors';
import { useNavigation, useRoute } from '@react-navigation/native';


export default function DetalleSolicitudScreen() {
    const navigation = useNavigation();
    const route = useRoute();
    const { solicitud } = route.params;
    const [isExpanded, setIsExpanded] = useState(false);

    const toggleBottomSheet = () => {
        setIsExpanded(!isExpanded);
    };

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
        <View style={{ flex: 1 }}>
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

                {/* Panel de detalles simplificado */}
                <View style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    backgroundColor: colors.blanco,
                    borderTopLeftRadius: 20,
                    borderTopRightRadius: 20,
                    maxHeight: isExpanded ? '60%' : '20%',
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: -2 },
                    shadowOpacity: 0.25,
                    shadowRadius: 3.84,
                    elevation: 5,
                }}>
                    <TouchableOpacity onPress={toggleBottomSheet} style={{ padding: 16 }}>
                        <View style={{ alignItems: 'center', marginBottom: 8 }}>
                            <View style={{ width: 40, height: 4, backgroundColor: colors.amarillo, borderRadius: 2 }} />
                        </View>
                        <Text style={styles.modalTitle}>Detalles de la Solicitud</Text>
                    </TouchableOpacity>

                    {isExpanded && (
                        <ScrollView style={{ paddingHorizontal: 16 }} showsVerticalScrollIndicator={false}>
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
                                    marginVertical: 16,
                                    backgroundColor: colors.amarillo,
                                    padding: 12,
                                    borderRadius: 8,
                                    alignItems: 'center',
                                }}
                            >
                                <Text style={{ color: colors.blanco, fontWeight: 'bold' }}>COMPARTIR POR WHATSAPP</Text>
                            </TouchableOpacity>
                        </ScrollView>
                    )}
                </View>
            </View>
        </View>
    );
}
 