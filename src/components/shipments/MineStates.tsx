import React from 'react';
import { View, Text, ActivityIndicator, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, spacing, radii } from '../../ui/theme';
import { isNetworkError } from '../../utils/errorHandler';

export const MineLoadingState = () => (
  <View style={styles.centerContainer}>
    <ActivityIndicator size="large" color={colors.accent} />
    <Text style={styles.loadingText}>Cargando tus envíos...</Text>
  </View>
);

interface MineErrorStateProps {
  error: string;
  onRetry: () => void;
}

export const MineErrorState: React.FC<MineErrorStateProps> = ({ error, onRetry }) => (
  <View style={styles.centerContainer}>
    <Text style={styles.errorTitle}>Error al cargar</Text>
    <Text style={styles.errorText}>{error}</Text>
    {isNetworkError(error) && (
      <Text style={styles.errorHint}>Verifica tu conexión a internet</Text>
    )}
    <TouchableOpacity style={styles.retryButton} onPress={onRetry}>
      <Text style={styles.retryButtonText}>Reintentar</Text>
    </TouchableOpacity>
  </View>
);

export const MineEmptyState = () => (
  <View style={styles.emptyContainer}>
    <Text style={styles.emptyText}>Sin envíos aún</Text>
    <Text style={styles.emptyHint}>Los envíos que crees aparecerán aquí</Text>
  </View>
);

const styles = StyleSheet.create({
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
    color: colors.error,
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
  },
  retryButtonText: {
    color: colors.white,
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
