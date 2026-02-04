import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radii } from '../../ui/theme';
import { DriverTransfer, DriverStats } from '../../features/profile/driverService';
import { translateStatus } from '../../utils/shipmentUtils';

// --- Loading State ---
export const WalletLoadingState = () => (
  <View style={styles.center}>
    <ActivityIndicator size="large" color={colors.primary} />
  </View>
);

// --- Balance Card ---
const formatAmount = (n: number | undefined) =>
  (n ?? 0).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export const BalanceCard = ({ stats }: { stats: DriverStats | null }) => (
  <View style={styles.balanceCard}>
    <View style={styles.balanceItem}>
      <Text style={styles.balanceLabel}>Disponible para retirar</Text>
      <Text style={[styles.balanceAmount, { color: colors.warning }]}>
        ${formatAmount(stats?.pendingAmount)}
      </Text>
    </View>
    <View style={styles.divider} />
    <View style={styles.balanceItem}>
      <Text style={styles.balanceLabel}>Ya retirado</Text>
      <Text style={[styles.balanceAmount, { color: colors.success }]}>
        ${formatAmount(stats?.completedAmount)}
      </Text>
    </View>
  </View>
);

// --- Transfer Item ---
export const TransferItem = ({ item }: { item: DriverTransfer }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return colors.success;
      case 'pending': return colors.warning;
      case 'failed': return colors.error;
      default: return colors.muted;
    }
  };

  return (
    <View style={styles.transferItem}>
      <View style={styles.transferIcon}>
        <Ionicons 
          name={item.status === 'completed' ? 'checkmark-circle' : 'time'} 
          size={24} 
          color={getStatusColor(item.status)} 
        />
      </View>
      <View style={styles.transferInfo}>
        <Text style={styles.transferDate}>
          {new Date(item.created_at).toLocaleDateString()}
        </Text>
        <Text style={styles.transferNote} numberOfLines={1}>
          {item.notes || 'Pago por envío'}
        </Text>
      </View>
      <View style={styles.transferRight}>
        <Text style={styles.transferAmount}>${item.amount.toLocaleString()}</Text>
        <Text style={[styles.transferStatus, { color: getStatusColor(item.status) }]}>
          {translateStatus(item.status)}
        </Text>
      </View>
    </View>
  );
};

// --- Empty State ---
export const WalletEmptyState = () => (
  <View style={styles.emptyContainer}>
    <Ionicons name="wallet-outline" size={48} color={colors.muted} />
    <Text style={styles.emptyText}>No tienes transferencias aún</Text>
  </View>
);

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  balanceCard: {
    margin: spacing.lg,
    padding: spacing.lg,
    backgroundColor: colors.white,
    borderRadius: radii.lg,
    flexDirection: 'row',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  balanceItem: {
    flex: 1,
    alignItems: 'center',
  },
  divider: {
    width: 1,
    backgroundColor: '#eee',
    marginHorizontal: spacing.md,
  },
  balanceLabel: {
    fontSize: 12,
    color: colors.muted,
    marginBottom: spacing.xs,
  },
  balanceAmount: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  transferItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    padding: spacing.md,
    borderRadius: radii.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  transferIcon: {
    marginRight: spacing.md,
  },
  transferInfo: {
    flex: 1,
  },
  transferDate: {
    fontSize: 12,
    color: colors.muted,
  },
  transferNote: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
  },
  transferRight: {
    alignItems: 'flex-end',
  },
  transferAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
  },
  transferStatus: {
    fontSize: 11,
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 100,
  },
  emptyText: {
    marginTop: spacing.md,
    color: colors.muted,
    fontSize: 16,
  },
});
