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
  initialRegion?: Region | null;
  onRegionChange?: (region: Region) => void;
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
      if (typeof parsed === 'object' && parsed.lat && parsed.lng) {
        return { lat: Number(parsed.lat), lng: Number(parsed.lng) };
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

export function AvailableShipmentsMap({ shipments, onAccept, isAccepting, initialRegion, onRegionChange }: Props) {
  const mapRef = useRef<MapView>(null);
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [shipmentsWithCoords, setShipmentsWithCoords] = useState<ShipmentWithCoords[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedShipment, setSelectedShipment] = useState<ShipmentWithCoords | null>(null);
  const [isMapReady, setIsMapReady] = useState(false);
  
  // Región inicial por defecto si no hay una previa
  const [region, setRegion] = useState<Region>(initialRegion || {
    latitude: -34.6037,
    longitude: -58.3816,
    latitudeDelta: LATITUDE_DELTA,
    longitudeDelta: LONGITUDE_DELTA,
  });
  const [hasSetInitialRegion, setHasSetInitialRegion] = useState(!!initialRegion);

  // Animar cuando el mapa esté listo y tengamos una región
  useEffect(() => {
    if (isMapReady && mapRef.current && region) {
      mapRef.current.animateToRegion(region, 1000);
    }
  }, [isMapReady]);

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

        // Intento rápido con última ubicación conocida
        const lastKnown = await Location.getLastKnownPositionAsync();
        if (lastKnown?.coords && !hasSetInitialRegion) {
          const newRegion = {
            latitude: lastKnown.coords.latitude,
            longitude: lastKnown.coords.longitude,
            latitudeDelta: LATITUDE_DELTA,
            longitudeDelta: LONGITUDE_DELTA,
          };
          setRegion(newRegion);
          setUserLocation(lastKnown.coords);
          if (mapRef.current) {
            mapRef.current.animateToRegion(newRegion, 500);
          }
        }

        // Obtener ubicación precisa
        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        
        const coords = {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        };
        setUserLocation(coords);
        
        // Actualizar región si es necesario
        if (!hasSetInitialRegion) {
          const newRegion = {
            ...coords,
            latitudeDelta: LATITUDE_DELTA,
            longitudeDelta: LONGITUDE_DELTA,
          };
          setRegion(newRegion);
          setHasSetInitialRegion(true);
          
          if (mapRef.current) {
            mapRef.current.animateToRegion(newRegion, 1000);
          }
          
          if (onRegionChange) onRegionChange(newRegion);
        }
      } catch (error) {
        console.error('Error obteniendo ubicación:', error);
      } finally {
        if (shipments.length === 0) setLoading(false);
      }
    })();
  }, []);

  // Geocodificar envíos - solo cuando cambian los envíos
  useEffect(() => {
    const loadShipmentsCoords = async () => {
      if (shipments.length === 0) {
        setShipmentsWithCoords([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      
      // Separar envíos que ya tienen coordenadas de los que necesitan geocodificación
      const results = await Promise.all(
        shipments.map(async (s) => {
          // Intentar extraer coordenadas del campo pickup_address (formato JSON)
          const parsed = (function() {
            try {
              const p = JSON.parse(s.pickup_address);
              if (typeof p === 'object' && p.lat && p.lng) return { lat: Number(p.lat), lng: Number(p.lng) };
            } catch (e) {}
            return null;
          })();

          if (parsed) {
            return { ...s, coords: { latitude: parsed.lat, longitude: parsed.lng } };
          }

          // Si no tiene coordenadas, geocodificar (solo como fallback)
          // Usamos un pequeño delay para evitar bloqueos por rate limit si hay muchos
          await new Promise(resolve => setTimeout(resolve, 200)); 
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
    };

    loadShipmentsCoords();
  }, [shipments]); 

  // Ajustar vista cuando cargan los envíos por primera vez o cambian significativamente
  useEffect(() => {
    if (userLocation && shipmentsWithCoords.length > 0 && mapRef.current && !initialRegion) {
      const points = [
        userLocation,
        ...shipmentsWithCoords.map(s => s.coords!)
      ];
      mapRef.current.fitToCoordinates(points, {
        edgePadding: { top: 50, right: 50, bottom: 250, left: 50 },
        animated: true,
      });
    }
  }, [shipmentsWithCoords.length, !!userLocation]);

  const handleRegionChangeComplete = (newRegion: Region) => {
    setRegion(newRegion);
    if (onRegionChange) {
      onRegionChange(newRegion);
    }
  };

  if (loading && shipmentsWithCoords.length === 0 && !region) {
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
        initialRegion={region}
        onRegionChangeComplete={handleRegionChangeComplete}
        onMapReady={() => setIsMapReady(true)}
        showsUserLocation={true}
        showsMyLocationButton={false} // Usamos nuestro propio botón
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
