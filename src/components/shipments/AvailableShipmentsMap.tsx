import React, { useEffect, useState, useRef, useMemo } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Dimensions, TouchableOpacity } from 'react-native';
import MapView, { Marker, Callout, Region } from 'react-native-maps';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radii } from '../../ui/theme';
import { Shipment } from '../../features/shipments/service';
import { ShipmentCard } from './ShipmentCard';

type ShipmentWithCoords = Shipment & {
  coords?: { latitude: number; longitude: number };
};

type Props = {
  shipments: Shipment[];
  onAccept: (id: string) => void;
  isAccepting: (id: string) => boolean;
};

const { width, height } = Dimensions.get('window');
const ASPECT_RATIO = width / height;
const LATITUDE_DELTA = 0.05;
const LONGITUDE_DELTA = LATITUDE_DELTA * ASPECT_RATIO;

// Geocodificar dirección usando Nominatim
const geocodeAddress = async (address: string): Promise<{ lat: number; lng: number } | null> => {
  try {
    // Intentar parsear si es JSON (como hace el servidor)
    try {
      const parsed = JSON.parse(address);
      if (parsed.lat && parsed.lng) {
        return { lat: parsed.lat, lng: parsed.lng };
      }
    } catch (e) {
      // No es JSON, continuar con geocodificación
    }

    const encodedAddress = encodeURIComponent(address);
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodedAddress}&limit=1`;
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'MoviApp/1.0',
      },
    });
    
    if (!response.ok) return null;
    
    const data = await response.json();
    if (Array.isArray(data) && data.length > 0) {
      const result = data[0];
      const lat = parseFloat(result.lat);
      const lng = parseFloat(result.lon);
      if (!isNaN(lat) && !isNaN(lng)) {
        return { lat, lng };
      }
    }
    return null;
  } catch (error) {
    console.error('Error geocodificando dirección:', error);
    return null;
  }
};

export function AvailableShipmentsMap({ shipments, onAccept, isAccepting }: Props) {
  const mapRef = useRef<MapView>(null);
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [shipmentsWithCoords, setShipmentsWithCoords] = useState<ShipmentWithCoords[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedShipment, setSelectedShipment] = useState<ShipmentWithCoords | null>(null);
  const [region, setRegion] = useState<Region | null>(null);

  // Obtener ubicación del usuario
  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          console.warn('Permiso de ubicación denegado');
          setLoading(false);
          return;
        }

        const location = await Location.getCurrentPositionAsync({});
        const coords = {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        };
        setUserLocation(coords);
        
        const initialRegion = {
          ...coords,
          latitudeDelta: LATITUDE_DELTA,
          longitudeDelta: LONGITUDE_DELTA,
        };
        setRegion(initialRegion);
      } catch (error) {
        console.error('Error obteniendo ubicación:', error);
      } finally {
        if (shipments.length === 0) setLoading(false);
      }
    })();
  }, []);

  // Geocodificar envíos
  useEffect(() => {
    const loadShipmentsCoords = async () => {
      if (shipments.length === 0) {
        setShipmentsWithCoords([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      const results = await Promise.all(
        shipments.map(async (s) => {
          const coords = await geocodeAddress(s.pickup_address);
          return {
            ...s,
            coords: coords ? { latitude: coords.lat, longitude: coords.lng } : undefined,
          };
        })
      );

      const filtered = results.filter((s) => s.coords !== undefined);
      setShipmentsWithCoords(filtered);
      setLoading(false);

      // Si tenemos ubicación de usuario y envíos, ajustar el mapa para mostrar todo
      if (userLocation && filtered.length > 0 && mapRef.current) {
        const points = [
          userLocation,
          ...filtered.map(s => s.coords!)
        ];
        mapRef.current.fitToCoordinates(points, {
          edgePadding: { top: 50, right: 50, bottom: 250, left: 50 },
          animated: true,
        });
      }
    };

    loadShipmentsCoords();
  }, [shipments, userLocation]);

  if (loading && shipmentsWithCoords.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.accent} />
        <Text style={styles.loadingText}>Buscando envíos cercanos...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={region || undefined}
        showsUserLocation={true}
        showsMyLocationButton={true}
        onPress={() => setSelectedShipment(null)}
      >
        {shipmentsWithCoords.map((shipment) => (
          <Marker
            key={shipment.id}
            coordinate={shipment.coords!}
            onPress={(e) => {
              e.stopPropagation();
              setSelectedShipment(shipment);
            }}
          >
            <View style={[
              styles.marker,
              selectedShipment?.id === shipment.id && styles.markerSelected
            ]}>
              <Ionicons 
                name="cube" 
                size={20} 
                color={selectedShipment?.id === shipment.id ? colors.white : colors.accent} 
              />
            </View>
          </Marker>
        ))}
      </MapView>

      {/* Tarjeta de envío seleccionado */}
      {selectedShipment && (
        <View style={styles.detailsContainer}>
          <TouchableOpacity 
            style={styles.closeButton} 
            onPress={() => setSelectedShipment(null)}
          >
            <Ionicons name="close-circle" size={24} color={colors.muted} />
          </TouchableOpacity>
          <ShipmentCard
            item={selectedShipment}
            onAccept={onAccept}
            isAccepting={isAccepting(selectedShipment.id)}
          />
        </View>
      )}

      {/* Botón para centrar en mi ubicación */}
      <TouchableOpacity 
        style={styles.myLocationButton}
        onPress={() => {
          if (userLocation && mapRef.current) {
            mapRef.current.animateToRegion({
              ...userLocation,
              latitudeDelta: LATITUDE_DELTA,
              longitudeDelta: LONGITUDE_DELTA,
            });
          }
        }}
      >
        <Ionicons name="locate" size={24} color={colors.primary} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  loadingText: {
    marginTop: spacing.md,
    color: colors.muted,
    fontSize: 16,
  },
  marker: {
    backgroundColor: colors.white,
    padding: 8,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: colors.accent,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  markerSelected: {
    backgroundColor: colors.accent,
    borderColor: colors.white,
  },
  detailsContainer: {
    position: 'absolute',
    bottom: spacing.xl,
    left: spacing.md,
    right: spacing.md,
  },
  closeButton: {
    position: 'absolute',
    top: -12,
    right: -12,
    zIndex: 10,
    backgroundColor: colors.white,
    borderRadius: 12,
  },
  myLocationButton: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    backgroundColor: colors.white,
    padding: 10,
    borderRadius: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  }
});
