import { useLocalSearchParams, Link } from 'expo-router';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useAuthStore } from '../src/store/useAuthStore';

export default function Onboarding() {
  const params = useLocalSearchParams<{ role?: string }>();
  const setRole = useAuthStore((s) => s.setRole);

  const roleParam = (params.role as 'driver' | 'business') || 'business';

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Configurar rol</Text>
      <Text style={styles.subtitle}>Rol seleccionado: {roleParam}</Text>
      <TouchableOpacity
        style={styles.button}
        onPress={() => setRole(roleParam)}
      >
        <Text style={styles.buttonText}>Guardar rol</Text>
      </TouchableOpacity>
      <Link href="/" style={{ marginTop: 12, color: '#053959' }}>Volver</Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  title: { fontSize: 28, fontWeight: '700', color: '#053959', marginBottom: 8 },
  subtitle: { fontSize: 16, color: '#053959', marginBottom: 16 },
  button: { backgroundColor: '#09c577', padding: 14, borderRadius: 10 },
  buttonText: { color: '#F3F4F6', fontWeight: '600' }
});
