import { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator, ScrollView } from 'react-native';
import { useLocalSearchParams, useFocusEffect } from 'expo-router';
import { listShipmentStatuses, updateShipmentStatus, getShipmentById, type ShipmentStatusRow, type Shipment } from '../../../src/features/shipments/service';
import { PaymentSection } from '../../../src/components/payments/PaymentSection';
import { useAuthStore } from '../../../src/store/useAuthStore';
import { colors, spacing, radii } from '../../../src/ui/theme';
import { Ionicons } from '@expo/vector-icons';
import type { PaymentStatus } from '../../../src/features/payments/service';

const translateStatus = (status: string): string => {
  const statusMap: Record<string, string> = {
    draft: 'Borrador (Requiere pago)',
    created: 'Creado',
    assigned: 'Asignado',
    picked_up: 'Recogido',
    in_transit: 'En tránsito',
    delivered: 'Entregado',
    cancelled: 'Cancelado',
  };
  return statusMap[status] || status;
};

const NEXT_STATES: Record<string, string[]> = {
  assigned: ['picked_up', 'cancelled'],
  picked_up: ['in_transit', 'cancelled'],
  in_transit: ['delivered', 'cancelled'],
  created: ['cancelled'],
  delivered: [],
  cancelled: [],
};

export default function ShipmentDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { role } = useAuthStore();
  const [items, setItems] = useState<ShipmentStatusRow[]>([]);
  const [shipment, setShipment] = useState<Shipment | null>(null);
  const [loading, setLoading] = useState(true);
  const [current, setCurrent] = useState<string>('created');
  const [saving, setSaving] = useState<string | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const [statuses, shipmentData] = await Promise.all([
        listShipmentStatuses(id!),
        getShipmentById(id!).catch(() => null), // Si falla, continuar sin el detalle
      ]);
      setItems(statuses);
      setCurrent(statuses[statuses.length - 1]?.status || 'created');
      setShipment(shipmentData);
    } catch (e: any) {
      Alert.alert('Error', e.message || 'No se pudo cargar el detalle');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { 
    load(); 
  }, [load]);

  // Recargar cuando la pantalla recibe foco (útil cuando se regresa del WebView de pago)
  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const onChange = async (status: any) => {
    try {
      setSaving(status);
      await updateShipmentStatus(id!, status);
      await load();
      Alert.alert('Listo', `Estado actualizado a ${translateStatus(status)}`);
    } catch (e: any) {
      Alert.alert('Error', e.message || 'No se pudo actualizar');
    } finally {
      setSaving(null);
    }
  };

  const getStatusIcon = (status: string): keyof typeof Ionicons.glyphMap => {
    const iconMap: Record<string, keyof typeof Ionicons.glyphMap> = {
      created: 'create-outline',
      assigned: 'person-add-outline',
      picked_up: 'checkmark-circle-outline',
      in_transit: 'car-outline',
      delivered: 'checkmark-done-circle-outline',
      cancelled: 'close-circle-outline',
    };
    return iconMap[status] || 'ellipse-outline';
  };

  const getStatusColor = (status: string) => {
    const colorMap: Record<string, string> = {
      created: '#1E40AF',
      assigned: '#92400E',
      picked_up: '#065F46',
      in_transit: '#3730A3',
      delivered: '#065F46',
      cancelled: '#991B1B',
    };
    return colorMap[status] || colors.muted;
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.accent} />
        <Text style={styles.loadingText}>Cargando detalle del envío...</Text>
      </View>
    );
  }

  const next = NEXT_STATES[current] || [];

  return (
    <ScrollView 
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Detalle de envío</Text>
        <View style={styles.statusBadge}>
          <Ionicons 
            name={getStatusIcon(current)} 
            size={20} 
            color={getStatusColor(current)} 
          />
          <Text style={[styles.statusText, { color: getStatusColor(current) }]}>
            {translateStatus(current)}
          </Text>
        </View>
      </View>

      {/* Payment Section - Solo para usuarios business y si el envío tiene precio */}
      {role === 'business' && shipment && shipment.price && shipment.price > 0 && (
        <PaymentSection
          shipmentId={id!}
          price={shipment.price}
          onPaymentStatusChange={setPaymentStatus}
        />
      )}

      {/* Timeline Section */}
      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>Historial de estados</Text>
        {items.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="time-outline" size={48} color={colors.muted} />
            <Text style={styles.emptyText}>Sin eventos aún</Text>
            <Text style={styles.emptyHint}>Los cambios de estado aparecerán aquí</Text>
          </View>
        ) : (
          <View style={styles.timelineContainer}>
            {items.map((item, index) => (
              <View key={item.id} style={styles.timelineItem}>
                <View style={styles.timelineLeft}>
                  <View style={[styles.timelineDot, { backgroundColor: getStatusColor(item.status) }]}>
                    <Ionicons 
                      name={getStatusIcon(item.status)} 
                      size={16} 
                      color="white" 
                    />
                  </View>
                  {index < items.length - 1 && <View style={styles.timelineLine} />}
                </View>
                <View style={styles.timelineContent}>
                  <View style={styles.timelineHeader}>
                    <Text style={[styles.timelineStatus, { color: getStatusColor(item.status) }]}>
                      {translateStatus(item.status)}
                    </Text>
                    <Text style={styles.timelineDate}>
                      {new Date(item.created_at).toLocaleString('es-ES', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </Text>
                  </View>
                  {item.note && (
                    <Text style={styles.timelineNote}>{item.note}</Text>
                  )}
                </View>
              </View>
            ))}
          </View>
        )}
      </View>

      {/* Actions Section */}
      {next.length > 0 && (
        <View style={styles.actionsContainer}>
          <Text style={styles.actionsTitle}>Acciones disponibles</Text>
          <View style={styles.actions}>
            {next.map((s) => (
              <TouchableOpacity
                key={s}
                style={[
                  styles.actionBtn,
                  saving === s && styles.actionBtnDisabled
                ]}
                onPress={() => onChange(s)}
                disabled={saving === s}
                activeOpacity={0.7}
              >
                <Ionicons 
                  name={getStatusIcon(s)} 
                  size={20} 
                  color="white" 
                  style={styles.actionIcon}
                />
                <Text style={styles.actionText}>
                  {saving === s ? 'Actualizando...' : `Marcar como ${translateStatus(s)}`}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  contentContainer: {
    padding: spacing.lg,
    paddingBottom: spacing.xl * 2,
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
  header: {
    backgroundColor: 'white',
    borderRadius: radii.md,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.md,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.sm,
    backgroundColor: colors.background,
    gap: spacing.sm,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  sectionContainer: {
    backgroundColor: 'white',
    borderRadius: radii.md,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.lg,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: spacing.xl * 2,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  emptyHint: {
    fontSize: 14,
    color: colors.muted,
    textAlign: 'center',
  },
  timelineContainer: {
    paddingLeft: spacing.sm,
  },
  timelineItem: {
    flexDirection: 'row',
    marginBottom: spacing.lg,
  },
  timelineLeft: {
    alignItems: 'center',
    marginRight: spacing.md,
    width: 32,
  },
  timelineDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  timelineLine: {
    width: 2,
    flex: 1,
    backgroundColor: colors.border,
    marginTop: spacing.xs,
    minHeight: 40,
  },
  timelineContent: {
    flex: 1,
    backgroundColor: colors.background,
    borderRadius: radii.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  timelineHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  timelineStatus: {
    fontSize: 16,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  timelineDate: {
    fontSize: 12,
    color: colors.muted,
  },
  timelineNote: {
    fontSize: 14,
    color: colors.text,
    marginTop: spacing.xs,
    lineHeight: 20,
  },
  actionsContainer: {
    backgroundColor: 'white',
    borderRadius: radii.md,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  actionsTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.md,
  },
  actions: {
    gap: spacing.md,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.accent,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.sm,
    gap: spacing.sm,
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  actionBtnDisabled: {
    opacity: 0.6,
  },
  actionIcon: {
    marginRight: spacing.xs,
  },
  actionText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 16,
  },
});
