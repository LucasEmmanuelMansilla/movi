import React from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { colors, spacing, radii } from '../../src/ui/theme';
import { useWalletLogic } from '../../src/hooks/shipments/useWalletLogic';
import {
  WalletLoadingState,
  BalanceCard,
  TransferItem,
  WalletEmptyState
} from '../../src/components/profile/WalletComponents';

/**
 * Pantalla de Billetera del Conductor
 * Muestra el balance acumulado, cobros realizados y el historial de transferencias.
 */
export default function WalletScreen() {
  const {
    stats,
    transfers,
    loading,
    refreshing,
    onRefresh,
    withdraw
  } = useWalletLogic();

  const handleWithdraw = async () => {
    if (!stats || stats.pendingAmount <= 0) {
      Alert.alert('Saldo insuficiente', 'No tienes saldo disponible para retirar.');
      return;
    }

    Alert.alert(
      'Confirmar retiro',
      `¿Deseas retirar $${stats.pendingAmount.toLocaleString()} a tu cuenta de Mercado Pago?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Retirar',
          onPress: async () => {
            try {
              const result = await withdraw();
              Alert.alert('Éxito', result.message || 'Retiro procesado correctamente.');
            } catch (error: any) {
              Alert.alert('Error', error.message || 'No se pudo procesar el retiro.');
            }
          }
        }
      ]
    );
  };

  if (loading && !refreshing) {
    return <WalletLoadingState />;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Mi Billetera</Text>
      </View>

      <BalanceCard stats={stats} />

      {stats && stats.pendingAmount > 0 && (
        <TouchableOpacity
          style={styles.withdrawButton}
          onPress={handleWithdraw}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <Text style={styles.withdrawButtonText}>Retirar Dinero</Text>
          )}
        </TouchableOpacity>
      )}

      <View style={styles.historyContainer}>
        <Text style={styles.historyTitle}>Historial de Pagos</Text>
        <FlatList
          data={transfers}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <TransferItem item={item} />}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[colors.primary]}
            />
          }
          ListEmptyComponent={<WalletEmptyState />}
          showsVerticalScrollIndicator={false}
        />
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerNote}>
          * Las transferencias pendientes se procesan manualmente por el marketplace.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    padding: spacing.lg,
    paddingTop: spacing.xl,
    backgroundColor: colors.white,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
  },
  historyContainer: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
  historyTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: spacing.md,
    color: colors.text,
  },
  footer: {
    padding: spacing.lg,
    alignItems: 'center',
  },
  footerNote: {
    fontSize: 12,
    color: colors.muted,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  withdrawButton: {
    backgroundColor: colors.primary,
    marginHorizontal: spacing.lg,
    padding: spacing.md,
    borderRadius: radii.md,
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  withdrawButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: 'bold',
  }
});
