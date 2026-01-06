import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { api } from '../../../src/lib/api';
import { colors, spacing } from '../../../src/ui/theme';
import { Ionicons } from '@expo/vector-icons';

export default function MercadoPagoOAuthSuccess() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    handleOAuthSuccess();
  }, []);

  const handleOAuthSuccess = async () => {
    try {
      const mpUserId = params?.mp_user_id as string;
      const accessToken = params?.access_token as string;
      const refreshToken = params?.refresh_token as string;
      const expiresIn = params?.expires_in as string;

      if (!mpUserId || !accessToken || !refreshToken || !expiresIn) {
        throw new Error('Faltan parámetros de OAuth');
      }

      // Guardar los tokens en el backend
      await api('/mp/oauth/connect', {
        method: 'POST',
        body: JSON.stringify({
          mp_user_id: parseInt(mpUserId, 10),
          access_token: accessToken,
          refresh_token: refreshToken,
          expires_in: parseInt(expiresIn, 10),
        }),
      });

      setStatus('success');

      // Redirigir al perfil después de 2 segundos
      setTimeout(() => {
        router.replace('/(app)/profile');
      }, 2000);
    } catch (error: any) {
      console.error('Error conectando Mercado Pago:', error);
      setErrorMessage(
        error.message || 'Error al conectar tu cuenta de Mercado Pago'
      );
      setStatus('error');
    }
  };

  if (status === 'loading') {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Conectando tu cuenta de Mercado Pago...</Text>
      </View>
    );
  }

  if (status === 'error') {
    return (
      <View style={styles.container}>
        <Ionicons name="close-circle" size={64} color="#EF4444" />
        <Text style={styles.errorTitle}>Error de conexión</Text>
        <Text style={styles.errorMessage}>{errorMessage}</Text>
        <Text
          style={styles.linkText}
          onPress={() => router.replace('/(app)/profile')}
        >
          Volver al perfil
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Ionicons name="checkmark-circle" size={64} color={colors.accent} />
      <Text style={styles.successTitle}>¡Conexión exitosa!</Text>
      <Text style={styles.successMessage}>
        Tu cuenta de Mercado Pago ha sido conectada correctamente.
      </Text>
      <Text style={styles.redirectText}>Redirigiendo al perfil...</Text>
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
  loadingText: {
    marginTop: spacing.md,
    fontSize: 16,
    color: colors.muted,
    textAlign: 'center',
  },
  successTitle: {
    marginTop: spacing.md,
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    textAlign: 'center',
  },
  successMessage: {
    marginTop: spacing.sm,
    fontSize: 16,
    color: colors.muted,
    textAlign: 'center',
    paddingHorizontal: spacing.md,
  },
  redirectText: {
    marginTop: spacing.lg,
    fontSize: 14,
    color: colors.muted,
    textAlign: 'center',
  },
  errorTitle: {
    marginTop: spacing.md,
    fontSize: 24,
    fontWeight: 'bold',
    color: '#EF4444',
    textAlign: 'center',
  },
  errorMessage: {
    marginTop: spacing.sm,
    fontSize: 16,
    color: colors.muted,
    textAlign: 'center',
    paddingHorizontal: spacing.md,
    marginBottom: spacing.lg,
  },
  linkText: {
    fontSize: 16,
    color: colors.primary,
    textDecorationLine: 'underline',
    marginTop: spacing.md,
  },
});
