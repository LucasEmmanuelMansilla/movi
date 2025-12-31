import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import MapView, { Marker, Polyline, Region } from 'react-native-maps';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radii } from '../../ui/theme';

type Props = {
  pickupAddress: string;
  dropoffAddress: string;
  currentStatus: string;
  onLocationUpdate?: (location: { latitude: number; longitude: number }) => void;
};

const DEFAULT_DELTA = { latitudeDelta: 0.01, longitudeDelta: 0.01 };
const LOCATION_UPDATE_INTERVAL = 5000; // 5 segundos
const MAX_DISTANCE_KM = 0.1; // 100 metros para validar proximidad

// Función de Haversine para calcular distancia
const haversine = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371; // Radio de la Tierra en km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

// Geocodificar dirección usando Nominatim
const geocodeAddress = async (address: string): Promise<{ lat: number; lng: number } | null> => {
  try {
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

export function ShipmentTrackingMap({ pickupAddress, dropoffAddress, currentStatus, onLocationUpdate }: Props) {
  const mapRef = useRef<MapView>(null);
  const [driverLocation, setDriverLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [pickupCoords, setPickupCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [dropoffCoords, setDropoffCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [region, setRegion] = useState<Region | null>(null);
  const locationWatchRef = useRef<Location.LocationSubscription | null>(null);

  // Determinar qué dirección mostrar según el estado
  const showPickup = currentStatus === 'assigned';
  const showDropoff = currentStatus === 'picked_up' || currentStatus === 'in_transit';

  // Cargar coordenadas de las direcciones
  useEffect(() => {
    const loadCoordinates = async () => {
      setLoading(true);
      try {
        const [pickup, dropoff] = await Promise.all([
          geocodeAddress(pickupAddress),
          geocodeAddress(dropoffAddress),
        ]);

        if (pickup) {
          setPickupCoords({ latitude: pickup.lat, longitude: pickup.lng });
        }
        if (dropoff) {
          setDropoffCoords({ latitude: dropoff.lat, longitude: dropoff.lng });
        }

        // Establecer región inicial basada en el estado actual
        if (pickup && showPickup) {
          const newRegion = {
            latitude: pickup.lat,
            longitude: pickup.lng,
            ...DEFAULT_DELTA,
          };
          setRegion(newRegion);
        } else if (dropoff && showDropoff) {
          const newRegion = {
            latitude: dropoff.lat,
            longitude: dropoff.lng,
            ...DEFAULT_DELTA,
          };
          setRegion(newRegion);
        }
      } catch (error) {
        console.error('Error cargando coordenadas:', error);
      } finally {
        setLoading(false);
      }
    };

    loadCoordinates();
  }, [pickupAddress, dropoffAddress, showPickup, showDropoff, currentStatus]);

  // Actualizar región cuando cambia el estado
  useEffect(() => {
    if (!loading && mapRef.current) {
      const targetCoords = showPickup ? pickupCoords : dropoffCoords;
      if (targetCoords) {
        const newRegion = {
          latitude: targetCoords.latitude,
          longitude: targetCoords.longitude,
          ...DEFAULT_DELTA,
        };
        setRegion(newRegion);
        mapRef.current.animateToRegion(newRegion, 1000);
      }
    }
  }, [currentStatus, showPickup, showDropoff, pickupCoords, dropoffCoords, loading]);

  // Iniciar tracking de ubicación en tiempo real
  useEffect(() => {
    const startLocationTracking = async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== Location.PermissionStatus.GRANTED) {
          console.warn('Permisos de ubicación no concedidos');
          return;
        }

        // Obtener ubicación inicial
        const current = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });
        const initialLocation = {
          latitude: current.coords.latitude,
          longitude: current.coords.longitude,
        };
        setDriverLocation(initialLocation);
        onLocationUpdate?.(initialLocation);

        // Ajustar región para incluir driver y destino
        const targetCoords = showPickup ? pickupCoords : dropoffCoords;
        if (targetCoords) {
          const centerLat = (initialLocation.latitude + targetCoords.latitude) / 2;
          const centerLng = (initialLocation.longitude + targetCoords.longitude) / 2;
          const latDelta = Math.abs(initialLocation.latitude - targetCoords.latitude) * 1.5 + 0.01;
          const lngDelta = Math.abs(initialLocation.longitude - targetCoords.longitude) * 1.5 + 0.01;
          
          const newRegion = {
            latitude: centerLat,
            longitude: centerLng,
            latitudeDelta: Math.max(latDelta, DEFAULT_DELTA.latitudeDelta),
            longitudeDelta: Math.max(lngDelta, DEFAULT_DELTA.longitudeDelta),
          };
          setRegion(newRegion);
          
          // Animar el mapa a la nueva región
          if (mapRef.current) {
            mapRef.current.animateToRegion(newRegion, 1000);
          }
        }

        // Iniciar watch de ubicación
        locationWatchRef.current = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.High,
            timeInterval: LOCATION_UPDATE_INTERVAL,
            distanceInterval: 10, // Actualizar cada 10 metros
          },
          (location) => {
            const newLocation = {
              latitude: location.coords.latitude,
              longitude: location.coords.longitude,
            };
            setDriverLocation(newLocation);
            onLocationUpdate?.(newLocation);
          }
        );
      } catch (error) {
        console.error('Error iniciando tracking de ubicación:', error);
      }
    };

    // Solo iniciar tracking si tenemos las coordenadas del destino
    const targetCoords = showPickup ? pickupCoords : dropoffCoords;
    if (targetCoords) {
      startLocationTracking();
    }

    return () => {
      if (locationWatchRef.current) {
        locationWatchRef.current.remove();
        locationWatchRef.current = null;
      }
    };
  }, [showPickup, showDropoff, pickupCoords, dropoffCoords, onLocationUpdate]);

  // Calcular distancia y verificar proximidad
  const getDistanceToTarget = (): number | null => {
    if (!driverLocation) return null;
    const targetCoords = showPickup ? pickupCoords : dropoffCoords;
    if (!targetCoords) return null;
    return haversine(
      driverLocation.latitude,
      driverLocation.longitude,
      targetCoords.latitude,
      targetCoords.longitude
    );
  };

  const distance = getDistanceToTarget();
  const isNearTarget = distance !== null && distance <= MAX_DISTANCE_KM;

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.accent} />
          <Text style={styles.loadingText}>Cargando mapa...</Text>
        </View>
      </View>
    );
  }

  if (!region) {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="location-outline" size={48} color={colors.muted} />
          <Text style={styles.errorText}>No se pudo cargar el mapa</Text>
        </View>
      </View>
    );
  }

  const targetCoords = showPickup ? pickupCoords : dropoffCoords;
  const targetAddress = showPickup ? pickupAddress : dropoffAddress;
  const targetLabel = showPickup ? 'Punto de retiro' : 'Punto de entrega';

  return (
    <View style={styles.container}>
      <View style={styles.mapContainer}>
        <MapView
          ref={mapRef}
          style={styles.map}
          initialRegion={region}
          showsUserLocation={true}
          showsMyLocationButton={true}
        >
          {/* Marcador del driver */}
          {driverLocation && (
            <Marker
              coordinate={driverLocation}
              title="Tu ubicación"
              description="Ubicación actual"
            >
              <View style={styles.driverMarker}>
                <Ionicons name="car" size={24} color="#FFFFFF" />
              </View>
            </Marker>
          )}

          {/* Marcador de retiro (solo si el estado es assigned) */}
          {showPickup && pickupCoords && (
            <Marker
              coordinate={pickupCoords}
              title={targetLabel}
              description={pickupAddress}
            >
              <View style={styles.pickupMarker}>
                <Ionicons name="location" size={24} color="#FFFFFF" />
              </View>
            </Marker>
          )}

          {/* Marcador de entrega (solo si el estado es picked_up o in_transit) */}
          {showDropoff && dropoffCoords && (
            <Marker
              coordinate={dropoffCoords}
              title={targetLabel}
              description={dropoffAddress}
            >
              <View style={styles.dropoffMarker}>
                <Ionicons name="flag" size={24} color="#FFFFFF" />
              </View>
            </Marker>
          )}

          {/* Línea entre driver y destino */}
          {driverLocation && targetCoords && (
            <Polyline
              coordinates={[driverLocation, targetCoords]}
              strokeColor={colors.accent}
              strokeWidth={3}
              lineDashPattern={[5, 5]}
            />
          )}
        </MapView>
      </View>

      {/* Información de distancia */}
      <View style={styles.infoContainer}>
        <View style={styles.infoRow}>
          <Ionicons 
            name={isNearTarget ? "checkmark-circle" : "location-outline"} 
            size={20} 
            color={isNearTarget ? colors.accent : colors.text} 
          />
          <Text style={styles.infoText}>
            {targetLabel}: {targetAddress}
          </Text>
        </View>
        {distance !== null && (
          <Text style={[styles.distanceText, isNearTarget && styles.distanceTextNear]}>
            {isNearTarget 
              ? '✓ Estás en la ubicación correcta' 
              : `Distancia: ${(distance * 1000).toFixed(0)} metros`}
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    borderRadius: radii.md,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  mapContainer: {
    height: 300,
    width: '100%',
  },
  map: {
    flex: 1,
  },
  loadingContainer: {
    height: 300,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: spacing.md,
    color: colors.muted,
    fontSize: 14,
  },
  errorContainer: {
    height: 300,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  errorText: {
    marginTop: spacing.md,
    color: colors.muted,
    fontSize: 14,
    textAlign: 'center',
  },
  driverMarker: {
    backgroundColor: colors.accent,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  pickupMarker: {
    backgroundColor: '#1E40AF',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  dropoffMarker: {
    backgroundColor: '#065F46',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  infoContainer: {
    padding: spacing.md,
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: colors.text,
    fontWeight: '600',
  },
  distanceText: {
    fontSize: 12,
    color: colors.muted,
    marginLeft: 28,
  },
  distanceTextNear: {
    color: colors.accent,
    fontWeight: '600',
  },
});

