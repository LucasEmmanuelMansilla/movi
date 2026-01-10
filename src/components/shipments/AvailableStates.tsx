import React from 'react';
import { View, Text, ActivityIndicator, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, spacing, radii } from '../../ui/theme';
import { isNetworkError } from '../../utils/errorHandler';

export const LoadingState = () => (
  <View style={styles.centerContainer}>
    <ActivityIndicator size="large" color={colors.accent} />
    <Text style={styles.loadingText}>Buscando envíos...</Text>
  </View>
);

interface ErrorStateProps {
  error: string;
  onRetry: () => void;
}

export const ErrorState: React.FC<ErrorStateProps> = ({ error, onRetry }) => (
  <View style={styles.centerContainer}>
    <View style={styles.errorIconContainer}>
      <Text style={styles.errorIcon}>⚠️</Text>
    </View>
    <Text style={styles.errorTitle}>Ocurrió un inconveniente</Text>
    <Text style={styles.errorText}>{error}</Text>
    {isNetworkError(error) && (
      <Text style={styles.errorHint}>Por favor, verifica tu conexión a internet</Text>
    )}
    <TouchableOpacity style={styles.retryButton} onPress={onRetry} activeOpacity={0.8}>
      <Text style={styles.retryButtonText}>Reintentar</Text>
    </TouchableOpacity>
  </View>
);

export const EmptyState = () => (
  <View style={styles.emptyContainer}>
    <View style={styles.emptyIconContainer}>
      <Text style={styles.emptyIcon}>📦</Text>
    </View>
    <Text style={styles.emptyText}>No hay envíos disponibles</Text>
    <Text style={styles.emptyHint}>Te avisaremos cuando surjan nuevos traslados en tu zona</Text>
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
    fontSize: 16,
    fontWeight: '500',
  },
  errorIconContainer: {
    marginBottom: spacing.lg,
  },
  errorIcon: {
    fontSize: 48,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.primary,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  errorText: {
    color: colors.muted,
    textAlign: 'center',
    marginBottom: spacing.xs,
    fontSize: 14,
    lineHeight: 20,
  },
  errorHint: {
    color: colors.muted,
    fontSize: 12,
    opacity: 0.8,
    marginBottom: spacing.xl,
  },
  retryButton: {
    backgroundColor: colors.accent,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: radii.sm,
    minWidth: 150,
    alignItems: 'center',
  },
  retryButtonText: {
    color: colors.white,
    fontWeight: '600',
    fontSize: 16,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
    paddingHorizontal: spacing.xl,
  },
  emptyIconContainer: {
    marginBottom: spacing.lg,
    opacity: 0.5,
  },
  emptyIcon: {
    fontSize: 64,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.primary,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  emptyHint: {
    fontSize: 14,
    color: colors.muted,
    textAlign: 'center',
    lineHeight: 20,
  },
});
