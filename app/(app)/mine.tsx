import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { listShipments, type Shipment } from '../../src/features/shipments/service';
import { Link, useFocusEffect } from 'expo-router';
import { getErrorMessage, isNetworkError } from '../../src/utils/errorHandler';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors, spacing, radii } from '../../src/ui/theme';
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

export default function MineScreen() {
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

  // Recargar cuando la pantalla recibe foco (cuando el usuario vuelve a esta pantalla)
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

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.accent} />
        <Text style={styles.loadingText}>Cargando tus envíos...</Text>
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
        <Link href={`/(app)/shipment/${item.id}`} asChild>
          <TouchableOpacity style={styles.card} activeOpacity={0.7}>
            <Text style={styles.title}>{item.title}</Text>
            {item.description && (
              <Text style={styles.description} numberOfLines={2}>
                {item.description}
              </Text>
            )}
            <View style={styles.addressContainer}>
              <Text style={styles.label}>📍 Retiro:</Text>
              <Text style={styles.address} numberOfLines={1}>
                {item.pickup_address}
              </Text>
            </View>
            <View style={styles.addressContainer}>
              <Text style={styles.label}>🎯 Entrega:</Text>
              <Text style={styles.address} numberOfLines={1}>
                {item.dropoff_address}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={[styles.status, styles[`status_${item.current_status}`]]}>
                {translateStatus(item.current_status)}
              </Text>
              {item.price && (
                <Text style={styles.price}>
                  💰 ${item.price.toLocaleString()}
                </Text>
              )}
            </View>
            <Text style={styles.more}>Ver detalle →</Text>
          </TouchableOpacity>
        </Link>
      )}
      ListEmptyComponent={
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Sin envíos aún</Text>
          <Text style={styles.emptyHint}>Los envíos que crees aparecerán aquí</Text>
        </View>
      }
    />
  );
}

const styles = StyleSheet.create({
  container: { 
    padding: spacing.md,
    backgroundColor: colors.background,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
    backgroundColor: colors.background,
  },
  loadingText: {
    marginTop: spacing.md,
    color: colors.muted,
    fontSize: 14,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#EF4444',
    marginBottom: spacing.sm,
  },
  errorText: {
    color: colors.muted,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  errorHint: {
    color: '#9CA3AF',
    fontSize: 12,
    marginBottom: spacing.lg,
  },
  retryButton: {
    backgroundColor: colors.accent,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: radii.sm,
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
  card: { 
    backgroundColor: 'white', 
    borderRadius: radii.md, 
    padding: spacing.lg, 
    marginBottom: spacing.md, 
    borderColor: colors.border, 
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  title: { 
    fontSize: 18, 
    fontWeight: '700', 
    color: colors.text, 
    marginBottom: spacing.sm,
  },
  description: {
    fontSize: 14,
    color: colors.muted,
    marginBottom: spacing.md,
    lineHeight: 20,
  },
  addressContainer: {
    marginBottom: spacing.sm,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.muted,
    marginBottom: 2,
  },
  address: {
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  status: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radii.sm,
  },
  status_created: {
    backgroundColor: '#DBEAFE',
    color: '#1E40AF',
  },
  status_assigned: {
    backgroundColor: '#FEF3C7',
    color: '#92400E',
  },
  status_picked_up: {
    backgroundColor: '#D1FAE5',
    color: '#065F46',
  },
  status_in_transit: {
    backgroundColor: '#E0E7FF',
    color: '#3730A3',
  },
  status_delivered: {
    backgroundColor: '#D1FAE5',
    color: '#065F46',
  },
  status_cancelled: {
    backgroundColor: '#FEE2E2',
    color: '#991B1B',
  },
  price: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.accent,
  },
  more: { 
    color: colors.accent, 
    marginTop: spacing.xs, 
    fontWeight: '600',
    fontSize: 14,
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 48,
    padding: spacing.xl,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  emptyHint: {
    fontSize: 14,
    color: colors.muted,
  },
});
