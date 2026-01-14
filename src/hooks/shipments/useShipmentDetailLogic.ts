import { useState, useCallback, useEffect, useRef } from 'react';
import { useFocusEffect } from 'expo-router';
import * as Location from 'expo-location';
import { listShipmentStatuses, updateShipmentStatus, getShipmentById, type ShipmentStatusRow, type Shipment } from '../../features/shipments/service';
import { useAuthStore } from '../../store/useAuthStore';
import { useAlertStore } from '../../store/useAlertStore';
import { translateStatus } from '../../utils/shipmentUtils';
import type { LocationPayload } from '../useLocationPicker';

export function useShipmentDetailLogic(id: string | undefined) {
  const { role } = useAuthStore();
  const { showAlert } = useAlertStore();
  const [items, setItems] = useState<ShipmentStatusRow[]>([]);
  const [shipment, setShipment] = useState<Shipment | null>(null);
  const [loading, setLoading] = useState(true);
  const [current, setCurrent] = useState<string>('created');
  const [saving, setSaving] = useState<string | null>(null);
  const currentLocationRef = useRef<LocationPayload | null>(null);

  const load = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      const [statuses, shipmentData] = await Promise.all([
        listShipmentStatuses(id),
        getShipmentById(id).catch(() => null),
      ]);
      setItems(statuses);
      setCurrent(statuses[statuses.length - 1]?.status || 'created');
      setShipment(shipmentData);
    } catch (e: any) {
      showAlert({
        title: 'Error',
        message: e.message || 'No se pudo cargar el detalle'
      });
    } finally {
      setLoading(false);
    }
  }, [id, showAlert]);

  useEffect(() => {
    load();
  }, [load]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const onChangeStatus = async (status: string) => {
    console.log("🚀 ~ onChangeStatus ~ status:", status)
    if (!id) return;
    try {
      setSaving(status);

      let location: LocationPayload | undefined;
      if (role === 'driver' && (status === 'picked_up' || status === 'delivered')) {
        try {
          const { status: permStatus } = await Location.requestForegroundPermissionsAsync();
          if (permStatus === Location.PermissionStatus.GRANTED) {
            const currentLoc = await Location.getCurrentPositionAsync({
              accuracy: Location.Accuracy.High,
            });
            location = {
              coords: {
                accuracy: currentLoc.coords.accuracy ?? 0,
                altitude: currentLoc.coords.altitude ?? 0,
                altitudeAccuracy: currentLoc.coords.altitudeAccuracy ?? 0,
                heading: currentLoc.coords.heading ?? 0,
                latitude: currentLoc.coords.latitude,
                longitude: currentLoc.coords.longitude,
                speed: currentLoc.coords.speed ?? 0,
              },
              mocked: Boolean((currentLoc as any).mocked),
              timestamp: currentLoc.timestamp,
            };
          } else {
            showAlert({
              title: 'Permisos requeridos',
              message: 'Se necesitan permisos de ubicación para cambiar este estado.'
            });
            setSaving(null);
            return;
          }
        } catch (_locError) {
          showAlert({
            title: 'Error',
            message: 'No se pudo obtener la ubicación actual. Por favor, intenta nuevamente.'
          });
          setSaving(null);
          return;
        }
      }

      await updateShipmentStatus(id, status as any, undefined, location);
      await load();
      showAlert({
        title: 'Listo',
        message: `Estado actualizado a ${translateStatus(status)}`
      });
    } catch (e: any) {
      showAlert({
        title: 'Error',
        message: e.message || 'No se pudo actualizar'
      });
    } finally {
      setSaving(null);
    }
  };

  const handleLocationUpdate = useCallback((location: { latitude: number; longitude: number }) => {
    currentLocationRef.current = {
      coords: {
        accuracy: 0,
        altitude: 0,
        altitudeAccuracy: 0,
        heading: 0,
        latitude: location.latitude,
        longitude: location.longitude,
        speed: 0,
      },
      mocked: false,
      timestamp: Date.now(),
    };
  }, []);

  return {
    items,
    shipment,
    loading,
    current,
    saving,
    role,
    load,
    onChangeStatus,
    handleLocationUpdate,
  };
}
