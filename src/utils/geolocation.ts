import * as Location from 'expo-location';

/**
 * Calcula la distancia entre dos puntos geográficos usando la fórmula de Haversine.
 */
export const haversine = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const toRad = (v: number) => (v * Math.PI) / 180;
  const R = 6371; // km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

/**
 * Formatea un objeto de geocodificación en una cadena de dirección legible.
 */
export const formatAddress = (geocode?: Location.LocationGeocodedAddress) => {
  if (!geocode) return '';
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

export type GeoPoint = { latitude: number; longitude: number };
