import React, { useState } from 'react';
import { FlatList, StyleSheet, View, TouchableOpacity, Text } from 'react-native';
import { useAvailableShipments } from '../../src/hooks/shipments/useAvailableShipments';
import { ShipmentCard } from '../../src/components/shipments/ShipmentCard';
import { LoadingState, ErrorState, EmptyState } from '../../src/components/shipments/AvailableStates';
import { AvailableShipmentsMap } from '../../src/components/shipments/AvailableShipmentsMap';
import { colors, spacing, radii } from '../../src/ui/theme';
import { Ionicons } from '@expo/vector-icons';
import { Region } from 'react-native-maps';

/**
 * Pantalla de Envíos Disponibles
 * Muestra los envíos que pueden ser aceptados por el conductor, con opción de vista de lista o mapa.
 */
export default function AvailableScreen() {
  const [viewMode, setViewMode] = useState<'map' | 'list'>('map');
  const [mapRegion, setMapRegion] = useState<Region | null>(null);
  
  const {
    items,
    loading,
    refreshing,
    accepting,
    error,
    load,
    onAccept,
  } = useAvailableShipments();

  if (loading && items.length === 0) {
    return <LoadingState />;
  }

  if (error && items.length === 0) {
    return <ErrorState error={error} onRetry={() => load()} />;
  }

  return (
    <View style={styles.mainContainer}>
      {/* Header con toggle de vista */}
      <View style={styles.header}>
        <Text style={styles.title}>Envíos Disponibles</Text>
        <View style={styles.toggleContainer}>
          <TouchableOpacity 
            style={[styles.toggleButton, viewMode === 'list' && styles.toggleButtonActive]}
            onPress={() => setViewMode('list')}
          >
            <Ionicons name="list" size={20} color={viewMode === 'list' ? colors.white : colors.muted} />
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.toggleButton, viewMode === 'map' && styles.toggleButtonActive]}
            onPress={() => setViewMode('map')}
          >
            <Ionicons name="map" size={20} color={viewMode === 'map' ? colors.white : colors.muted} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.contentContainer}>
        {/* Mapa - se mantiene montado para persistir estado pero se oculta */}
        <View style={[styles.viewContainer, viewMode !== 'map' && styles.hiddenView]}>
          <AvailableShipmentsMap 
            shipments={items} 
            onAccept={onAccept}
            isAccepting={(id) => accepting === id}
            initialRegion={mapRegion}
            onRegionChange={setMapRegion}
          />
        </View>

        {/* Lista */}
        {viewMode === 'list' && (
          <View style={styles.viewContainer}>
            <FlatList
              contentContainerStyle={styles.listContainer}
              data={items}
              keyExtractor={(item) => item.id}
              onRefresh={() => load(true)}
              refreshing={refreshing}
              renderItem={({ item }) => (
                <ShipmentCard 
                  item={item} 
                  onAccept={onAccept} 
                  isAccepting={accepting === item.id} 
                />
              )}
              ListEmptyComponent={<EmptyState />}
            />
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    zIndex: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.primary,
  },
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: colors.background,
    borderRadius: radii.md,
    padding: 2,
  },
  toggleButton: {
    padding: 8,
    borderRadius: radii.md - 2,
    marginHorizontal: spacing.sm,
  },
  toggleButtonActive: {
    backgroundColor: colors.accent,
  },
  contentContainer: {
    flex: 1,
  },
  viewContainer: {
    flex: 1,
  },
  hiddenView: {
    display: 'none',
  },
  listContainer: { 
    padding: spacing.md,
    flexGrow: 1,
  },
});
