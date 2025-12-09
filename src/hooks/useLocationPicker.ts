import { useCallback, useState } from 'react';
import * as Location from 'expo-location';
import { Linking, Platform } from 'react-native';

export type LocationPayload = {
  coords: {
    accuracy: number;
    altitude: number;
    altitudeAccuracy: number;
    heading: number;
    latitude: number;
    longitude: number;
    speed: number;
  };
  mocked: boolean;
  timestamp: number;
};

type PickResult = {
  address: string;
  location: LocationPayload;
};

const formatAddress = (geocode: Location.LocationGeocodedAddress) => {
  const parts = [
    geocode.streetNumber,
    geocode.street,
    geocode.city || geocode.district,
    geocode.region,
    geocode.postalCode,
    geocode.country,
  ].filter(Boolean);
  return parts.join(', ');
};

export function useLocationPicker() {
  const [requesting, setRequesting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const requestPermissions = useCallback(async (): Promise<boolean> => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    const granted = status === Location.PermissionStatus.GRANTED;
    if (!granted) {
      setError('Se necesitan permisos de ubicación para seleccionar en el mapa.');
    } else {
      setError(null);
    }
    return granted;
  }, []);

  const openInMaps = useCallback((coords: Location.LocationObjectCoords, label: string) => {
    const lat = coords.latitude;
    const lng = coords.longitude;
    const query = encodeURIComponent(label || 'Ubicación seleccionada');
    const url = Platform.select({
      ios: `maps:0,0?q=${query}@${lat},${lng}`,
      android: `geo:${lat},${lng}?q=${lat},${lng}(${query})`,
      default: `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`,
    });
    if (url) {
      Linking.openURL(url).catch(() => {
        setError('No se pudo abrir el mapa del dispositivo.');
      });
    }
  }, []);

  const pickFromCurrentPosition = useCallback(async (): Promise<PickResult | null> => {
    setRequesting(true);
    try {
      const granted = await requestPermissions();
      if (!granted) return null;

      const current = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const [geocode] = await Location.reverseGeocodeAsync(current.coords);
      const address = geocode ? formatAddress(geocode) : '';

      const safeCoords: LocationPayload['coords'] = {
        accuracy: current.coords.accuracy ?? 0,
        altitude: current.coords.altitude ?? 0,
        altitudeAccuracy: current.coords.altitudeAccuracy ?? 0,
        heading: current.coords.heading ?? 0,
        latitude: current.coords.latitude,
        longitude: current.coords.longitude,
        speed: current.coords.speed ?? 0,
      };

      return {
        address,
        location: {
          coords: safeCoords,
          mocked: Boolean((current as any).mocked),
          timestamp: current.timestamp,
        },
      };
    } catch (pickError: any) {
      setError('No se pudo obtener la ubicación actual.');
      return null;
    } finally {
      setRequesting(false);
    }
  }, [requestPermissions]);

  return {
    requesting,
    error,
    pickFromCurrentPosition,
    openInMaps,
  };
}

