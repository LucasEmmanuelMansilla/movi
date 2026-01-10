import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Link } from 'expo-router';
import { Shipment } from '../../features/shipments/service';
import { translateStatus } from '../../utils/shipmentUtils';
import { colors, spacing, radii } from '../../ui/theme';

interface MyShipmentCardProps {
  item: Shipment;
}

const getStatusStyles = (status: Shipment['current_status']) => {
  const statusColors: Record<string, { bg: string; text: string }> = {
    draft: { bg: '#F3F4F6', text: '#374151' },
    created: { bg: '#DBEAFE', text: '#1E40AF' },
    assigned: { bg: '#FEF3C7', text: '#92400E' },
    picked_up: { bg: '#D1FAE5', text: '#065F46' },
    in_transit: { bg: '#E0E7FF', text: '#3730A3' },
    delivered: { bg: '#D1FAE5', text: '#065F46' },
    cancelled: { bg: '#FEE2E2', text: '#991B1B' },
  };

  return statusColors[status] || { bg: colors.background, text: colors.muted };
};

export const MyShipmentCard: React.FC<MyShipmentCardProps> = ({ item }) => {
  const statusStyle = getStatusStyles(item.current_status);

  return (
    <Link href={`/(app)/shipment/${item.id}`} asChild>
      <TouchableOpacity style={styles.card} activeOpacity={0.7}>
        <View style={styles.header}>
          <Text style={styles.title}>{item.title}</Text>
          <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
            <Text style={[styles.statusText, { color: statusStyle.text }]}>
              {translateStatus(item.current_status)}
            </Text>
          </View>
        </View>

        {item.description && (
          <Text style={styles.description} numberOfLines={2}>
            {item.description}
          </Text>
        )}

        <View style={styles.addressSection}>
          <View style={styles.addressRow}>
            <Text style={styles.label}>📍 Retiro:</Text>
            <Text style={styles.address} numberOfLines={1}>
              {item.pickup_address}
            </Text>
          </View>
          <View style={styles.addressRow}>
            <Text style={styles.label}>🎯 Entrega:</Text>
            <Text style={styles.address} numberOfLines={1}>
              {item.dropoff_address}
            </Text>
          </View>
        </View>

        <View style={styles.footer}>
          {item.price ? (
            <Text style={styles.price}>
              💰 ${item.price.toLocaleString()}
            </Text>
          ) : (
            <Text style={styles.noPrice}>Precio por convenir</Text>
          )}
          <Text style={styles.more}>Ver detalle →</Text>
        </View>
      </TouchableOpacity>
    </Link>
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
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  title: { 
    fontSize: 18, 
    fontWeight: '700', 
    color: colors.text, 
    flex: 1,
    marginRight: spacing.sm,
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radii.sm,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  description: {
    fontSize: 14,
    color: colors.muted,
    marginBottom: spacing.md,
    lineHeight: 20,
  },
  addressSection: {
    gap: spacing.xs,
    marginBottom: spacing.md,
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
  address: {
    fontSize: 14,
    color: colors.text,
    flex: 1,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.sm,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  price: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.accent,
  },
  noPrice: {
    fontSize: 14,
    color: colors.muted,
    fontStyle: 'italic',
  },
  more: { 
    color: colors.accent, 
    fontWeight: '600',
    fontSize: 14,
  },
});
