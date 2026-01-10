import { useState, useCallback, useEffect } from 'react';
import { Alert } from 'react-native';
import { listShipments, acceptShipment, type Shipment } from '../../features/shipments/service';
import { getErrorMessage } from '../../utils/errorHandler';
import { usePushNotificationListener } from '../../features/push/usePushNotifications';
import { supabase } from '../../lib/supabase';

export function useAvailableShipments() {
  const [items, setItems] = useState<Shipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [accepting, setAccepting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);
      const data = await listShipments('available');
      setItems(data);
    } catch (e: any) {
      const errorMessage = getErrorMessage(e);
      setError(errorMessage);
      if (!isRefresh) {
        Alert.alert('Error', errorMessage);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Suscripción en tiempo real para nuevos envíos
  useEffect(() => {
    const channel = supabase
      .channel('available-shipments')
      .on(
        'postgres_changes',
        {
          event: '*', // Escuchar todos los cambios (INSERT, UPDATE, DELETE)
          schema: 'public',
          table: 'shipments',
        },
        (payload) => {
          console.log('Cambio en envíos detectado en tiempo real:', payload.eventType);
          
          // Si es un nuevo envío publicado o un cambio de estado, recargar la lista
          // Solo nos interesan envíos con estado 'created' para la lista de disponibles
          const newShipment = payload.new as Shipment;
          const oldShipment = payload.old as Shipment;

          if (payload.eventType === 'INSERT' && newShipment.current_status === 'created') {
            load(true);
          } else if (payload.eventType === 'UPDATE') {
            // Si cambió a 'created' (publicado) o dejó de ser 'created' (aceptado/cancelado)
            if (
              (newShipment.current_status === 'created' && oldShipment?.current_status !== 'created') ||
              (newShipment.current_status !== 'created' && oldShipment?.current_status === 'created')
            ) {
              load(true);
            }
          } else if (payload.eventType === 'DELETE') {
            load(true);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [load]);

  // Escuchar notificaciones push y actualizar la lista (como respaldo)
  usePushNotificationListener(
    () => {
      // Nuevo envío disponible
      load(true);
    },
    () => {
      // Estado de envío cambiado
      load(true);
    }
  );

  const onAccept = async (id: string) => {
    try {
      setAccepting(id);
      await acceptShipment(id);
      Alert.alert('Éxito', 'Envío aceptado exitosamente');
      await load();
    } catch (e: any) {
      const errorMessage = getErrorMessage(e);
      Alert.alert('Error', errorMessage);
    } finally {
      setAccepting(null);
    }
  };

  return {
    items,
    loading,
    refreshing,
    accepting,
    error,
    load,
    onAccept,
  };
}
