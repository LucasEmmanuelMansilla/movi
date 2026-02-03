import { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet, Text } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuthStore } from '../../../src/store/useAuthStore';
import { getMyProfile } from '../../../src/features/profile/service';
import { colors, spacing } from '../../../src/ui/theme';

export default function DiditCallback() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { user } = useAuthStore();

  useEffect(() => {
    handleCallback();
  }, []);

  const handleCallback = async () => {
    try {
      const verificationSessionId = params?.verificationSessionId as string;
      
      console.log('📱 Callback de Didit recibido:', { verificationSessionId });

      // El polling en IdentifyVerificationScreen ya maneja la actualización del estado
      // Solo necesitamos redirigir al usuario de vuelta a la app
      // Esperar un momento para que el webhook procese el cambio de estado
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Intentar obtener el perfil actualizado
      if (user) {
        try {
          const profile = await getMyProfile();
          console.log('📊 Perfil después del callback:', profile?.kyc_status);
          
          // Si el estado es aprobado, redirigir a la pantalla principal
          if (profile?.kyc_status === 'approved' || profile?.kyc_status === 'Approved') {
            router.replace('/(app)/available');
            return;
          }
        } catch (error) {
          console.error('Error obteniendo perfil:', error);
        }
      }

      // Redirigir a la pantalla principal (el polling seguirá verificando)
      router.replace('/(app)/available');
    } catch (error) {
      console.error('Error en callback de Didit:', error);
      // Redirigir de todas formas
      router.replace('/(app)/available');
    }
  };

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={colors.accent} />
      <Text style={styles.text}>Procesando verificación...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
    padding: spacing.lg,
  },
  text: {
    marginTop: spacing.md,
    fontSize: 16,
    color: colors.text,
    textAlign: 'center',
  },
});
