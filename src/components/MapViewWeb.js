import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';

// Componente MapView para Web - usa un iframe con Google Maps o muestra un placeholder
const MapView = ({ children, style, region, ...props }) => {
  if (Platform.OS === 'web') {
    // Para web, mostramos un iframe de Google Maps o un placeholder
    const lat = region?.latitude || 0;
    const lng = region?.longitude || 0;
    
    return (
      <View style={[styles.container, style]}>
        <iframe
          width="100%"
          height="100%"
          frameBorder="0"
          style={{ border: 0 }}
          src={`https://www.google.com/maps/embed/v1/place?key=YOUR_GOOGLE_MAPS_API_KEY&q=${lat},${lng}&zoom=15`}
          allowFullScreen
        />
        {children}
      </View>
    );
  }
  
  // Para otras plataformas, esto no debería ejecutarse
  return (
    <View style={[styles.container, style]}>
      <Text>Mapa no disponible en esta plataforma</Text>
    </View>
  );
};

// Componente Marker para Web
const Marker = ({ coordinate, title, description, ...props }) => {
  if (Platform.OS === 'web') {
    // En web, los markers se manejan dentro del iframe de Google Maps
    return null;
  }
  
  return null;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export { MapView, Marker };
export default MapView;
