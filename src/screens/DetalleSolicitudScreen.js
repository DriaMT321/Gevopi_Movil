import React, { useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    ScrollView,
    Linking,
    StyleSheet,
} from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { FontAwesome5, Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { theme } from '../themes';

export default function DetalleSolicitudScreen() {
    const navigation = useNavigation();
    const route = useRoute();
    const { solicitud } = route.params;
    const [isExpanded, setIsExpanded] = useState(false);

    const toggleBottomSheet = () => {
        setIsExpanded(!isExpanded);
    };

    const getNivelColor = (nivel) => {
        switch (nivel?.toLowerCase()) {
            case 'alta': return theme.colors.danger;
            case 'media': return theme.colors.warning;
            case 'baja': return theme.colors.success;
            default: return theme.colors.gray400;
        }
    };

    const getNivelIcon = (nivel) => {
        switch (nivel?.toLowerCase()) {
            case 'alta': return 'exclamation-triangle';
            case 'media': return 'exclamation-circle';
            case 'baja': return 'info-circle';
            default: return 'circle';
        }
    };

    const getEstadoColor = (estado) => {
        switch (estado?.toLowerCase()) {
            case 'resuelto': return theme.colors.success;
            case 'en progreso': return theme.colors.info;
            case 'respondido': return theme.colors.warning;
            case 'sin responder': return theme.colors.secondary;
            default: return theme.colors.gray400;
        }
    };

    const getTipoIcon = (tipo) => {
        switch (tipo?.toLowerCase()) {
            case 'medica': return 'heartbeat';
            case 'fisica': return 'running';
            case 'emocional': return 'brain';
            case 'recursos': return 'hands-helping';
            default: return 'question-circle';
        }
    };

    const compartirConWhatsApp = () => {
        const { latitud, longitud, descripcion, fecha, tipo, nivelEmergencia } = solicitud;

        const mensaje = `🚨 *EMERGENCIA GEVOPI*

📄 *Descripción:* ${descripcion}
📅 *Fecha:* ${new Date(fecha).toLocaleString('es-BO')}
📌 *Tipo:* ${tipo}
⚠️ *Nivel:* ${nivelEmergencia}

🗺️ *Ubicación:*
https://www.google.com/maps/search/?api=1&query=${latitud},${longitud}

Compartido desde App GEVOPI`;

        const url = `whatsapp://send?text=${encodeURIComponent(mensaje)}`;

        Linking.openURL(url).catch(() => {
            alert('No se pudo abrir WhatsApp. ¿Está instalado?');
        });
    };

    const abrirEnMaps = () => {
        const { latitud, longitud } = solicitud;
        const url = `https://www.google.com/maps/search/?api=1&query=${latitud},${longitud}`;
        Linking.openURL(url);
    };

    return (
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
                >
                    <View style={styles.markerContainer}>
                        <FontAwesome5 name="map-marker-alt" size={40} color={theme.colors.danger} />
                    </View>
                </Marker>
            </MapView>

            {/* Botón de volver */}
            <TouchableOpacity
                style={styles.backButton}
                onPress={() => navigation.goBack()}
            >
                <Ionicons name="arrow-back" size={24} color={theme.colors.primary} />
            </TouchableOpacity>

            {/* Botón de abrir en Maps */}
            <TouchableOpacity
                style={styles.mapsButton}
                onPress={abrirEnMaps}
            >
                <FontAwesome5 name="directions" size={20} color={theme.colors.textLight} />
            </TouchableOpacity>

            {/* Bottom Sheet */}
            <View style={[
                styles.bottomSheet,
                { maxHeight: isExpanded ? '70%' : '25%' }
            ]}>
                <TouchableOpacity 
                    onPress={toggleBottomSheet} 
                    style={styles.sheetHandle}
                    activeOpacity={0.7}
                >
                    <View style={styles.handleBar} />
                    <View style={styles.sheetHeader}>
                        <View style={[styles.iconCircle, { backgroundColor: theme.colors.primaryLight }]}>
                            <FontAwesome5 
                                name={getTipoIcon(solicitud.tipo)} 
                                size={20} 
                                color={theme.colors.primary} 
                            />
                        </View>
                        <View style={styles.headerTextContainer}>
                            <Text style={styles.modalTitle}>Detalles de la Solicitud</Text>
                            <View style={styles.badgesRow}>
                                <View style={[styles.priorityBadge, { backgroundColor: getNivelColor(solicitud.nivelEmergencia) }]}>
                                    <FontAwesome5 
                                        name={getNivelIcon(solicitud.nivelEmergencia)} 
                                        size={10} 
                                        color={theme.colors.textLight} 
                                    />
                                    <Text style={styles.priorityText}>{solicitud.nivelEmergencia}</Text>
                                </View>
                                {solicitud.estado && (
                                    <View style={[styles.estadoBadge, { backgroundColor: getEstadoColor(solicitud.estado) }]}>
                                        <Text style={styles.estadoText}>{solicitud.estado}</Text>
                                    </View>
                                )}
                            </View>
                        </View>
                        <Ionicons 
                            name={isExpanded ? "chevron-down" : "chevron-up"} 
                            size={24} 
                            color={theme.colors.textSecondary} 
                        />
                    </View>
                </TouchableOpacity>

                {isExpanded && (
                    <ScrollView 
                        style={styles.scrollContent} 
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={{ paddingBottom: theme.spacing.xl }}
                    >
                        {/* Tipo de solicitud */}
                        <View style={styles.detailCard}>
                            <View style={styles.detailHeader}>
                                <FontAwesome5 name="tag" size={16} color={theme.colors.primary} />
                                <Text style={styles.detailLabel}>Tipo de Solicitud</Text>
                            </View>
                            <Text style={styles.detailValue}>{solicitud.tipo}</Text>
                        </View>

                        {/* Descripción */}
                        <View style={styles.detailCard}>
                            <View style={styles.detailHeader}>
                                <FontAwesome5 name="file-alt" size={16} color={theme.colors.primary} />
                                <Text style={styles.detailLabel}>Descripción</Text>
                            </View>
                            <Text style={styles.detailValue}>{solicitud.descripcion}</Text>
                        </View>

                        {/* Fecha */}
                        <View style={styles.detailCard}>
                            <View style={styles.detailHeader}>
                                <FontAwesome5 name="calendar-alt" size={16} color={theme.colors.primary} />
                                <Text style={styles.detailLabel}>Fecha y Hora</Text>
                            </View>
                            <Text style={styles.detailValue}>
                                {new Date(solicitud.fecha).toLocaleString('es-ES', {
                                    day: '2-digit',
                                    month: 'long',
                                    year: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                })}
                            </Text>
                        </View>

                        {/* Nivel de emergencia */}
                        <View style={styles.detailCard}>
                            <View style={styles.detailHeader}>
                                <FontAwesome5 
                                    name={getNivelIcon(solicitud.nivelEmergencia)} 
                                    size={16} 
                                    color={getNivelColor(solicitud.nivelEmergencia)} 
                                />
                                <Text style={styles.detailLabel}>Nivel de Emergencia</Text>
                            </View>
                            <View style={[
                                styles.nivelBadge, 
                                { backgroundColor: getNivelColor(solicitud.nivelEmergencia) }
                            ]}>
                                <Text style={styles.nivelBadgeText}>{solicitud.nivelEmergencia}</Text>
                            </View>
                        </View>

                        {/* Ubicación */}
                        <View style={styles.detailCard}>
                            <View style={styles.detailHeader}>
                                <FontAwesome5 name="map-marker-alt" size={16} color={theme.colors.danger} />
                                <Text style={styles.detailLabel}>Coordenadas</Text>
                            </View>
                            <Text style={styles.detailValue}>
                                Lat: {parseFloat(solicitud.latitud).toFixed(6)}{'\n'}
                                Lng: {parseFloat(solicitud.longitud).toFixed(6)}
                            </Text>
                        </View>

                        {/* Botones de acción */}
                        <View style={styles.actionsContainer}>
                            <TouchableOpacity
                                onPress={abrirEnMaps}
                                style={[styles.actionButton, { backgroundColor: theme.colors.info }]}
                            >
                                <FontAwesome5 name="directions" size={18} color={theme.colors.textLight} />
                                <Text style={styles.actionButtonText}>Abrir en Maps</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                onPress={compartirConWhatsApp}
                                style={[styles.actionButton, { backgroundColor: theme.colors.success }]}
                            >
                                <FontAwesome5 name="whatsapp" size={18} color={theme.colors.textLight} />
                                <Text style={styles.actionButtonText}>Compartir</Text>
                            </TouchableOpacity>
                        </View>
                    </ScrollView>
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    map: {
        flex: 1,
    },
    markerContainer: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    backButton: {
        position: 'absolute',
        top: 50,
        left: theme.spacing.lg,
        width: 44,
        height: 44,
        borderRadius: theme.spacing.borderRadius.round,
        backgroundColor: theme.colors.cardBackground,
        justifyContent: 'center',
        alignItems: 'center',
        ...theme.shadows.md,
    },
    mapsButton: {
        position: 'absolute',
        top: 50,
        right: theme.spacing.lg,
        width: 44,
        height: 44,
        borderRadius: theme.spacing.borderRadius.round,
        backgroundColor: theme.colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        ...theme.shadows.md,
    },
    bottomSheet: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: theme.colors.cardBackground,
        borderTopLeftRadius: theme.spacing.borderRadius.xl,
        borderTopRightRadius: theme.spacing.borderRadius.xl,
        ...theme.shadows.lg,
    },
    sheetHandle: {
        paddingTop: theme.spacing.md,
        paddingHorizontal: theme.spacing.lg,
        paddingBottom: theme.spacing.sm,
    },
    handleBar: {
        width: 40,
        height: 4,
        backgroundColor: theme.colors.gray300,
        borderRadius: theme.spacing.borderRadius.round,
        alignSelf: 'center',
        marginBottom: theme.spacing.md,
    },
    sheetHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.sm,
    },
    iconCircle: {
        width: 44,
        height: 44,
        borderRadius: theme.spacing.borderRadius.round,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTextContainer: {
        flex: 1,
    },
    modalTitle: {
        fontSize: theme.typography.fontSize.lg,
        fontWeight: theme.typography.fontWeight.bold,
        color: theme.colors.textPrimary,
        marginBottom: theme.spacing.xs,
    },
    badgesRow: {
        flexDirection: 'row',
        gap: theme.spacing.xs,
        flexWrap: 'wrap',
    },
    priorityBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: theme.spacing.sm,
        paddingVertical: 2,
        borderRadius: theme.spacing.borderRadius.md,
        gap: theme.spacing.xs,
    },
    priorityText: {
        fontSize: theme.typography.fontSize.xs,
        fontWeight: theme.typography.fontWeight.semibold,
        color: theme.colors.textLight,
        textTransform: 'capitalize',
    },
    estadoBadge: {
        paddingHorizontal: theme.spacing.sm,
        paddingVertical: 2,
        borderRadius: theme.spacing.borderRadius.md,
    },
    estadoText: {
        fontSize: theme.typography.fontSize.xs,
        fontWeight: theme.typography.fontWeight.semibold,
        color: theme.colors.textLight,
    },
    scrollContent: {
        paddingHorizontal: theme.spacing.lg,
        marginTop: theme.spacing.sm,
    },
    detailCard: {
        backgroundColor: theme.colors.gray50,
        borderRadius: theme.spacing.borderRadius.md,
        padding: theme.spacing.md,
        marginBottom: theme.spacing.md,
        borderLeftWidth: 3,
        borderLeftColor: theme.colors.primary,
    },
    detailHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.sm,
        marginBottom: theme.spacing.xs,
    },
    detailLabel: {
        fontSize: theme.typography.fontSize.sm,
        fontWeight: theme.typography.fontWeight.semibold,
        color: theme.colors.textSecondary,
    },
    detailValue: {
        fontSize: theme.typography.fontSize.md,
        color: theme.colors.textPrimary,
        lineHeight: 22,
    },
    nivelBadge: {
        alignSelf: 'flex-start',
        paddingHorizontal: theme.spacing.md,
        paddingVertical: theme.spacing.xs,
        borderRadius: theme.spacing.borderRadius.md,
        marginTop: theme.spacing.xs,
    },
    nivelBadgeText: {
        fontSize: theme.typography.fontSize.md,
        fontWeight: theme.typography.fontWeight.bold,
        color: theme.colors.textLight,
        textTransform: 'uppercase',
    },
    actionsContainer: {
        flexDirection: 'row',
        gap: theme.spacing.sm,
        marginTop: theme.spacing.md,
    },
    actionButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: theme.spacing.sm,
        paddingVertical: theme.spacing.md,
        borderRadius: theme.spacing.borderRadius.md,
        ...theme.shadows.md,
    },
    actionButtonText: {
        fontSize: theme.typography.fontSize.md,
        fontWeight: theme.typography.fontWeight.bold,
        color: theme.colors.textLight,
    },
});