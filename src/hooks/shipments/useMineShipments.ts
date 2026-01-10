import { useState, useCallback, useEffect } from 'react';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from 'expo-router';
import { listShipments, type Shipment } from '../../features/shipments/service';
import { getErrorMessage } from '../../utils/errorHandler';
import { usePushNotificationListener } from '../../features/push/usePushNotifications';

export function useMineShipments() {
  const [items, setItems] = useState<Shipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadPendingShipments = useCallback(async () => {
    try {
      const pendingData = await AsyncStorage.getItem('pending_shipments');
      if (pendingData) {
        const pendingShipments: Shipment[] = JSON.parse(pendingData);
        return pendingShipments;
      }
    } catch (error) {
      console.warn('Error cargando envíos pendientes:', error);
    }
    return [];
  }, []);

  const load = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);
      
      // Cargar envíos pendientes del almacenamiento local
      const pendingShipments = await loadPendingShipments();
      
      // Cargar envíos del servidor
      const serverData = await listShipments('mine');
      
      // Combinar envíos: primero los del servidor (más actualizados), luego los pendientes
      // Filtrar duplicados por ID
      const allShipments = [...serverData];
      pendingShipments.forEach((pending) => {
        if (!allShipments.find((s) => s.id === pending.id)) {
          allShipments.push(pending);
        }
      });
      
      // Ordenar por fecha de creación (más recientes primero)
      allShipments.sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      
      setItems(allShipments);
      
      // Limpiar envíos pendientes después de cargar (solo si no es refresh manual)
      if (!isRefresh && pendingShipments.length > 0) {
        await AsyncStorage.removeItem('pending_shipments');
      }
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
  }, [loadPendingShipments]);

  useEffect(() => { 
    load(); 
  }, [load]);

  // Recargar cuando la pantalla recibe foco
  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  // Escuchar notificaciones push y actualizar la lista
  usePushNotificationListener(
    undefined, // No escuchar nuevos envíos en "Mis envíos"
    () => {
      // Estado de envío cambiado - actualizar lista
      load(true);
    }
  );

  return {
    items,
    loading,
    refreshing,
    error,
    load,
  };
}
