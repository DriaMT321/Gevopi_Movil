// Este archivo es para web
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

// Componente MapView para Web
export const MapView = ({ children, style, region, initialRegion, ...props }) => {
  const lat = region?.latitude || initialRegion?.latitude || 0;
  const lng = region?.longitude || initialRegion?.longitude || 0;
  
  return (
    <View style={[styles.container, style]}>
      <View style={styles.mapPlaceholder}>
        <Text style={styles.placeholderText}>Mapa</Text>
        <Text style={styles.coordsText}>
          Lat: {lat.toFixed(6)}, Lng: {lng.toFixed(6)}
        </Text>
        <Text style={styles.infoText}>
          Para habilitar mapas en web, configura Google Maps API
        </Text>
      </View>
      {children}
    </View>
  );
};

// Componente Marker para Web
export const Marker = ({ coordinate, title, description, children, ...props }) => {
  return null; // En web los markers se renderizan dentro del mapa
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#e0e0e0',
  },
  mapPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
  },
  placeholderText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#666',
    marginBottom: 8,
  },
  coordsText: {
    fontSize: 14,
    color: '#888',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
});

export default MapView;
