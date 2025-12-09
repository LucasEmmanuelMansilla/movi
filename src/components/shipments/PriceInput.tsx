import React from 'react';
import { View, Text, TextInput, StyleSheet, TextInputProps } from 'react-native';

interface PriceInputProps extends Omit<TextInputProps, 'style'> {
  label: string;
  hint?: string;
  error?: string;
  value: string;
  onChangeText: (text: string) => void;
}

export function PriceInput({
  label,
  hint,
  error,
  value,
  onChangeText,
  ...inputProps
}: PriceInputProps) {
  return (
    <View style={styles.section}>
      <View style={styles.labelContainer}>
        <Text style={styles.label}>{label}</Text>
        {hint && <Text style={styles.labelHint}>({hint})</Text>}
      </View>
      <View style={[styles.priceContainer, error && styles.priceContainerError]}>
        <Text style={styles.currencySymbol}>$</Text>
        <TextInput
          style={styles.priceInput}
          placeholder="0"
          keyboardType="decimal-pad"
          value={value}
          onChangeText={onChangeText}
          placeholderTextColor="#9CA3AF"
          {...inputProps}
        />
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: 20,
    paddingHorizontal: 16,
  },
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#053959',
  },
  labelHint: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '400',
    marginLeft: 4,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderColor: '#E5E7EB',
    borderWidth: 1,
    borderRadius: 12,
    paddingLeft: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  priceContainerError: {
    borderColor: '#EF4444',
    borderWidth: 2,
  },
  currencySymbol: {
    fontSize: 18,
    fontWeight: '600',
    color: '#053959',
    marginRight: 8,
  },
  priceInput: {
    flex: 1,
    borderWidth: 0,
    paddingLeft: 0,
    padding: 16,
    fontSize: 16,
    color: '#053959',
    shadowOpacity: 0,
    elevation: 0,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
  },
});

