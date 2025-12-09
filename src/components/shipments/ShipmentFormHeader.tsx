import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export function ShipmentFormHeader() {
  return (
    <View style={styles.header}>
      <Text style={styles.title}>Publicar envío</Text>
      <Text style={styles.subtitle}>Completa los datos del pedido</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: 'white',
    padding: 20,
    paddingTop: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#053959',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
});

