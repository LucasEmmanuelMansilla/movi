import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FormField } from './FormField';
import { colors, spacing, radii } from '../../ui/theme';

// --- Price Display ---
interface PriceDisplayProps {
  calculating: boolean;
  price: string;
}

export const PriceDisplay: React.FC<PriceDisplayProps> = ({ calculating, price }) => (
  <View style={styles.priceDisplayContainer}>
    <Text style={styles.priceLabel}>Precio calculado</Text>
    <Text style={styles.priceValue}>
      {calculating ? 'Calculando...' : price ? `$${Number(price).toLocaleString('es-AR')}` : '-'}
    </Text>
    <Text style={styles.priceHint}>
      Basado en distancia y peso del envío
    </Text>
  </View>
);

// --- Location Selector ---
interface LocationSelectorProps {
  label: string;
  value: string;
  error?: string;
  onSelectMap: () => void;
  loading: boolean;
}

export const LocationSelector: React.FC<LocationSelectorProps> = ({ 
  label, value, error, onSelectMap, loading 
}) => (
  <View style={styles.locationContainer}>
    <FormField
      label={label}
      required
      placeholder="Selecciona en el mapa"
      value={value}
      error={error}
      editable={false}
    />
    <TouchableOpacity
      style={[styles.mapButton, loading && styles.buttonDisabled]}
      onPress={onSelectMap}
      disabled={loading}
    >
      <Ionicons name="location-outline" size={18} color={colors.primary} />
      <Text style={styles.mapButtonText}>
        Buscar en el mapa
      </Text>
    </TouchableOpacity>
  </View>
);

// --- Action Button ---
interface PublishActionButtonProps {
  loading: boolean;
  processingPayment: boolean;
  isValid: boolean;
  onPress: () => void;
}

export const PublishActionButton: React.FC<PublishActionButtonProps> = ({ 
  loading, processingPayment, isValid, onPress 
}) => (
  <TouchableOpacity
    style={[styles.button, (loading || processingPayment || !isValid) && styles.buttonDisabled]}
    onPress={onPress}
    disabled={loading || processingPayment || !isValid}
  >
    <Text style={styles.buttonText}>
      {loading ? 'Publicando...' : processingPayment ? 'Preparando pago...' : 'Publicar envío'}
    </Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  priceDisplayContainer: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.xl,
    padding: spacing.lg,
    backgroundColor: '#E5F6EE',
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.accent,
  },
  priceLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
    marginBottom: 4,
  },
  priceValue: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.accent,
    marginBottom: 4,
  },
  priceHint: {
    fontSize: 12,
    color: colors.muted,
  },
  locationContainer: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    backgroundColor: colors.white,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 2,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  mapButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E5F6EE',
    borderColor: colors.accent,
    borderWidth: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginTop: 6,
    borderRadius: radii.sm,
    justifyContent: 'center',
  },
  mapButtonText: {
    color: colors.primary,
    fontWeight: '600',
    marginLeft: 8,
  },
  button: {
    backgroundColor: colors.accent,
    padding: 18,
    borderRadius: radii.lg,
    alignItems: 'center',
    marginHorizontal: spacing.lg,
    marginTop: spacing.sm,
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: colors.white,
    fontWeight: '700',
    fontSize: 16,
    letterSpacing: 0.5,
  },
});
