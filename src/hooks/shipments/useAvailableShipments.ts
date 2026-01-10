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

  // Suscripción en tiempo real para nuevos envíos (Broadcast - Sin necesidad de réplica)
  useEffect(() => {
    console.log('Iniciando canal de broadcast para envíos...');
    
    const channel = supabase
      .channel('global:shipments')
      .on(
        'broadcast',
        { event: 'new_shipment' },
        (payload) => {
          console.log('📢 Nuevo envío detectado vía Broadcast:', payload);
          // Pequeño delay de seguridad para asegurar que la DB terminó de persistir el cambio
          setTimeout(() => load(true), 1000);
        }
      )
      .on(
        'broadcast',
        { event: 'shipment_updated' },
        (payload) => {
          console.log('📢 Envío actualizado vía Broadcast:', payload);
          // Recargar para quitar de la lista si ya no está disponible
          load(true);
        }
      )
      .subscribe((status) => {
        console.log('📡 Estado del canal de broadcast:', status);
      });

    return () => {
      console.log('Cerrando canal de broadcast');
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
