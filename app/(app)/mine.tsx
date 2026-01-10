import React from 'react';
import { FlatList, StyleSheet } from 'react-native';
import { useMineShipments } from '../../src/hooks/shipments/useMineShipments';
import { MyShipmentCard } from '../../src/components/shipments/MyShipmentCard';
import { MineLoadingState, MineErrorState, MineEmptyState } from '../../src/components/shipments/MineStates';
import { colors, spacing } from '../../src/ui/theme';

/**
 * Pantalla de Mis Envíos
 * Muestra el historial y estado de los envíos del usuario (conductor).
 */
export default function MineScreen() {
  const {
    items,
    loading,
    refreshing,
    error,
    load,
  } = useMineShipments();

  if (loading) {
    return <MineLoadingState />;
  }

  if (error && items.length === 0) {
    return <MineErrorState error={error} onRetry={() => load()} />;
  }

  return (
    <FlatList
      contentContainerStyle={styles.container}
      data={items}
      keyExtractor={(item) => item.id}
      onRefresh={() => load(true)}
      refreshing={refreshing}
      renderItem={({ item }) => (
        <MyShipmentCard item={item} />
      )}
      ListEmptyComponent={<MineEmptyState />}
    />
  );
}

const styles = StyleSheet.create({
  container: { 
    padding: spacing.md,
    backgroundColor: colors.background,
    flexGrow: 1,
  },
});
