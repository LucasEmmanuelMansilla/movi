import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius } from '../../src/ui/theme';
import { api } from '../../src/lib/api';

interface Transfer {
  id: string;
  amount: number;
  status: string;
  created_at: string;
  driver_id: string;
  notes: string | null;
  driver?: {
    full_name: string;
    email: string;
  };
}

export default function AdminTransfersScreen() {
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchPending = async () => {
    try {
      // Usamos el endpoint que ya creamos en el backend
      const response = await api<any>('/driver-transfers/pending');
      setTransfers(response.pendingTransfers || []);
    } catch (error) {
      console.error('Error fetching pending transfers:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchPending();
  }, []);

  const handleComplete = async (transferId: string) => {
    Alert.alert(
      'Confirmar Pago',
      '¿Ya realizaste la transferencia real al conductor? Esto marcará el pago como completado en el sistema.',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Sí, ya pagué', 
          onPress: async () => {
            try {
              await api(`/driver-transfers/${transferId}`, {
                method: 'PATCH',
                body: JSON.stringify({ status: 'completed', notes: 'Pago procesado por el administrador' })
              });
              Alert.alert('Éxito', 'Transferencia marcada como completada');
              fetchPending();
            } catch (error) {
              Alert.alert('Error', 'No se pudo actualizar el estado');
            }
          }
        }
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Gestión de Pagos</Text>
        <Text style={styles.subtitle}>Transferencias pendientes a conductores</Text>
      </View>

      <FlatList
        data={transfers}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchPending(); }} />}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View>
                <Text style={styles.driverName}>{item.driver?.full_name || 'Conductor'}</Text>
                <Text style={styles.driverEmail}>{item.driver?.email}</Text>
              </View>
              <Text style={styles.amount}>${item.amount.toLocaleString()}</Text>
            </View>
            
            <View style={styles.divider} />
            
            <View style={styles.cardBody}>
              <Text style={styles.date}>Fecha: {new Date(item.created_at).toLocaleDateString()}</Text>
              {item.notes && <Text style={styles.notes}>{item.notes}</Text>}
            </View>

            <TouchableOpacity 
              style={styles.completeBtn}
              onPress={() => handleComplete(item.id)}
            >
              <Ionicons name="checkmark-circle-outline" size={20} color="white" />
              <Text style={styles.completeBtnText}>Confirmar Pago Realizado</Text>
            </TouchableOpacity>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="checkmark-done-circle-outline" size={64} color={colors.success} />
            <Text style={styles.emptyText}>No hay pagos pendientes</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { padding: spacing.lg, backgroundColor: colors.white, borderBottomWidth: 1, borderBottomColor: '#eee' },
  title: { fontSize: 22, fontWeight: 'bold', color: colors.text },
  subtitle: { fontSize: 14, color: colors.muted, marginTop: 4 },
  card: { backgroundColor: colors.white, margin: spacing.md, borderRadius: borderRadius.lg, padding: spacing.md, elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  driverName: { fontSize: 16, fontWeight: 'bold', color: colors.text },
  driverEmail: { fontSize: 12, color: colors.muted },
  amount: { fontSize: 18, fontWeight: 'bold', color: colors.accent },
  divider: { height: 1, backgroundColor: '#eee', marginVertical: spacing.md },
  cardBody: { marginBottom: spacing.md },
  date: { fontSize: 12, color: colors.muted },
  notes: { fontSize: 13, color: colors.text, marginTop: 4, fontStyle: 'italic' },
  completeBtn: { backgroundColor: colors.success, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: spacing.md, borderRadius: borderRadius.md, gap: 8 },
  completeBtnText: { color: 'white', fontWeight: 'bold', fontSize: 14 },
  empty: { alignItems: 'center', justifyContent: 'center', marginTop: 100 },
  emptyText: { marginTop: spacing.md, fontSize: 16, color: colors.muted }
});
