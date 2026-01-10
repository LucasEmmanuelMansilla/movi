import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { PaymentSection } from '../../../src/components/payments/PaymentSection';
import { ShipmentTrackingMap } from '../../../src/components/shipments/ShipmentTrackingMap';
import { 
  ShipmentDetailLoading, 
  DetailHeader, 
  ShipmentTimeline, 
  DetailActions,
  ChatButton
} from '../../../src/components/shipments/ShipmentDetailComponents';
import { useShipmentDetailLogic } from '../../../src/hooks/shipments/useShipmentDetailLogic';
import { NEXT_STATES } from '../../../src/utils/shipmentUtils';
import { colors, spacing } from '../../../src/ui/theme';

/**
 * Pantalla de Detalle de Envío
 * Muestra el seguimiento en tiempo real, historial de estados y permite 
 * gestionar el ciclo de vida del envío según el rol del usuario.
 */
export default function ShipmentDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const {
    items,
    shipment,
    loading,
    current,
    saving,
    role,
    onChangeStatus,
    handleLocationUpdate,
  } = useShipmentDetailLogic(id);

  if (loading) {
    return <ShipmentDetailLoading />;
  }

  const next = NEXT_STATES[current] || [];

  return (
    <ScrollView 
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      <View style={{ position: 'relative' }}>
        <DetailHeader currentStatus={current} />
        {id && shipment && (shipment.driver_assignments || role === 'driver') && <ChatButton shipmentId={id} />}
      </View>

      {/* Sección de Pago (Solo para Negocios) */}
      {role === 'business' && shipment && shipment.price && shipment.price > 0 && (
        <PaymentSection
          shipmentId={id!}
          price={shipment.price}
          shipmentStatus={current}
        />
      )}

      {/* Tracking en Vivo (Solo para Conductores en estados activos) */}
      {role === 'driver' && shipment && (current === 'assigned' || current === 'picked_up' || current === 'in_transit') && (
        <ShipmentTrackingMap
          pickupAddress={shipment.pickup_address}
          dropoffAddress={shipment.dropoff_address}
          currentStatus={current}
          onLocationUpdate={handleLocationUpdate}
        />
      )}

      <ShipmentTimeline items={items} />

      {/* Acciones de Cambio de Estado */}
      {next.length > 0 && (
        <DetailActions 
          nextStates={next} 
          saving={saving} 
          onChange={onChangeStatus} 
        />
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
});
