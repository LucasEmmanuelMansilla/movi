import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Shipment } from '../../features/shipments/service';
import { translateStatus } from '../../utils/shipmentUtils';
import { colors, spacing, radii } from '../../ui/theme';

interface ShipmentCardProps {
  item: Shipment;
  onAccept: (id: string) => void;
  isAccepting: boolean;
}

export const ShipmentCard: React.FC<ShipmentCardProps> = ({ item, onAccept, isAccepting }) => {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>{item.title}</Text>
      {item.description && (
        <Text style={styles.description} numberOfLines={2}>
          {item.description}
        </Text>
      )}
      
      <View style={styles.addressSection}>
        <View style={styles.addressRow}>
          <Text style={styles.label}>📍 Retiro:</Text>
          <Text style={styles.text} numberOfLines={1}>{item.pickup_address}</Text>
        </View>
        
        <View style={styles.addressRow}>
          <Text style={styles.label}>🎯 Entrega:</Text>
          <Text style={styles.text} numberOfLines={1}>{item.dropoff_address}</Text>
        </View>
      </View>

      <View style={styles.infoFooter}>
        <View>
          <Text style={styles.priceLabel}>Pago ofrecido</Text>
          <Text style={styles.price}>
            {item.price ? `$${item.price.toLocaleString()}` : 'Por convenir'}
          </Text>
        </View>
        <View style={styles.statusBadge}>
          <Text style={styles.statusText}>{translateStatus(item.current_status)}</Text>
        </View>
      </View>

      <TouchableOpacity 
        style={[styles.btn, isAccepting && styles.btnDisabled]} 
        onPress={() => onAccept(item.id)} 
        disabled={isAccepting}
        activeOpacity={0.7}
      >
        <Text style={styles.btnText}>
          {isAccepting ? 'Procesando...' : 'Aceptar envío'}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  card: { 
    backgroundColor: colors.white, 
    borderRadius: radii.md, 
    padding: spacing.lg, 
    marginBottom: spacing.md, 
    borderColor: colors.border, 
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 3,
  },
  title: { 
    fontSize: 18, 
    fontWeight: '700', 
    color: colors.primary, 
    marginBottom: spacing.xs,
  },
  description: {
    fontSize: 14,
    color: colors.muted,
    marginBottom: spacing.md,
    lineHeight: 20,
  },
  addressSection: {
    marginBottom: spacing.md,
    gap: spacing.xs,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.muted,
    width: 70,
  },
  text: { 
    color: colors.text,
    fontSize: 14,
    flex: 1,
  },
  infoFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: spacing.sm,
    marginBottom: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  priceLabel: {
    fontSize: 11,
    color: colors.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  price: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.accent,
  },
  statusBadge: {
    backgroundColor: colors.background,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radii.sm,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.muted,
  },
  btn: { 
    backgroundColor: colors.accent, 
    padding: spacing.md, 
    borderRadius: radii.sm, 
    alignItems: 'center',
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  btnDisabled: {
    opacity: 0.6,
  },
  btnText: { 
    color: colors.white, 
    fontWeight: '700',
    fontSize: 16,
  },
});
