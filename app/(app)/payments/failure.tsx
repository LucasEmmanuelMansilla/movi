import { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { colors } from '../../../src/ui/theme';

export default function PaymentFailure() {
  const router = useRouter();
  const params = useLocalSearchParams<{ shipment_id: string }>();
  const { shipment_id } = params;

  useEffect(() => {
    // Redirigir a la pantalla del envío
    if (shipment_id) {
      router.replace(`/(app)/shipment/${shipment_id}`);
    } else {
      // Si no hay shipment_id, ir a la lista de envíos
      router.replace('/(app)/mine');
    }
  }, [shipment_id, router]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={colors.accent} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
});

