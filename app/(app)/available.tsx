import { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { acceptShipment, listShipments, type Shipment } from '../../src/features/shipments/service';
import { getErrorMessage, isNetworkError } from '../../src/utils/errorHandler';
import { usePushNotificationListener } from '../../src/features/push/usePushNotifications';

const translateStatus = (status: string): string => {
  const statusMap: Record<string, string> = {
    created: 'Creado',
    assigned: 'Asignado',
    picked_up: 'Recogido',
    in_transit: 'En tránsito',
    delivered: 'Entregado',
    cancelled: 'Cancelado',
  };
  return statusMap[status] || status;
};

export default function AvailableScreen() {
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

  // Escuchar notificaciones push y actualizar la lista
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

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#09c577" />
        <Text style={styles.loadingText}>Cargando envíos...</Text>
      </View>
    );
  }

  if (error && items.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorTitle}>Error al cargar</Text>
        <Text style={styles.errorText}>{error}</Text>
        {isNetworkError(error) && (
          <Text style={styles.errorHint}>Verifica tu conexión a internet</Text>
        )}
        <TouchableOpacity style={styles.retryButton} onPress={() => load()}>
          <Text style={styles.retryButtonText}>Reintentar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <FlatList
      contentContainerStyle={styles.container}
      data={items}
      keyExtractor={(i) => i.id}
      onRefresh={() => load(true)}
      refreshing={refreshing}
      renderItem={({ item }) => (
        <View style={styles.card}>
          <Text style={styles.title}>{item.title}</Text>
          {item.description && (
            <Text style={styles.description}>{item.description}</Text>
          )}
          <View style={styles.addressContainer}>
            <Text style={styles.label}>📍 Retiro:</Text>
            <Text style={styles.text}>{item.pickup_address}</Text>
          </View>
          <View style={styles.addressContainer}>
            <Text style={styles.label}>🎯 Entrega:</Text>
            <Text style={styles.text}>{item.dropoff_address}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.price}>
              💰 {item.price ? `$${item.price.toLocaleString()}` : 'Precio a convenir'}
            </Text>
            <Text style={styles.status}>Estado: {translateStatus(item.current_status)}</Text>
          </View>
          <TouchableOpacity 
            style={[styles.btn, accepting === item.id && styles.btnDisabled]} 
            onPress={() => onAccept(item.id)} 
            disabled={accepting === item.id}
          >
            <Text style={styles.btnText}>
              {accepting === item.id ? 'Aceptando...' : 'Aceptar envío'}
            </Text>
          </TouchableOpacity>
        </View>
      )}
      ListEmptyComponent={
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No hay envíos disponibles</Text>
          <Text style={styles.emptyHint}>Los nuevos envíos aparecerán aquí</Text>
        </View>
      }
    />
  );
}

const styles = StyleSheet.create({
  container: { padding: 12 },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loadingText: {
    marginTop: 12,
    color: '#6B7280',
    fontSize: 14,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#EF4444',
    marginBottom: 8,
  },
  errorText: {
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 4,
  },
  errorHint: {
    color: '#9CA3AF',
    fontSize: 12,
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#09c577',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  card: { 
    backgroundColor: 'white', 
    borderRadius: 10, 
    padding: 16, 
    marginBottom: 12, 
    borderColor: '#E5E7EB', 
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  title: { 
    fontSize: 18, 
    fontWeight: '700', 
    color: '#053959', 
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 12,
  },
  addressContainer: {
    marginBottom: 8,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 2,
  },
  text: { 
    color: '#053959',
    fontSize: 14,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  price: {
    fontSize: 16,
    fontWeight: '700',
    color: '#09c577',
  },
  status: {
    fontSize: 12,
    color: '#6B7280',
    textTransform: 'capitalize',
  },
  btn: { 
    backgroundColor: '#09c577', 
    padding: 12, 
    borderRadius: 8, 
    alignItems: 'center', 
    marginTop: 4,
  },
  btnDisabled: {
    opacity: 0.6,
  },
  btnText: { 
    color: '#F3F4F6', 
    fontWeight: '600',
    fontSize: 16,
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 48,
    padding: 24,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#053959',
    marginBottom: 8,
  },
  emptyHint: {
    fontSize: 14,
    color: '#6B7280',
  },
});
