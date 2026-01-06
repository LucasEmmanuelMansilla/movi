import { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { colors, spacing } from '../../../src/ui/theme';
import { Ionicons } from '@expo/vector-icons';

export default function MercadoPagoOAuthError() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const error = params?.error as string;
  const errorDescription = params?.error_description as string;

  const getErrorMessage = () => {
    if (errorDescription) {
      return errorDescription;
    }

    switch (error) {
      case 'access_denied':
        return 'Has cancelado la conexión con Mercado Pago';
      case 'invalid_request':
        return 'Solicitud inválida. Por favor intenta nuevamente';
      case 'processing_error':
        return 'Error al procesar la conexión. Por favor intenta nuevamente';
      default:
        return 'Ocurrió un error al conectar tu cuenta de Mercado Pago';
    }
  };

  return (
    <View style={styles.container}>
      <Ionicons name="close-circle" size={64} color="#EF4444" />
      <Text style={styles.errorTitle}>Error de conexión</Text>
      <Text style={styles.errorMessage}>{getErrorMessage()}</Text>
      
      <TouchableOpacity
        style={styles.button}
        onPress={() => router.replace('/(app)/profile')}
      >
        <Text style={styles.buttonText}>Volver al perfil</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.button, styles.buttonSecondary]}
        onPress={() => {
          // Volver a intentar la conexión
          router.replace('/(app)/profile');
        }}
      >
        <Text style={styles.buttonTextSecondary}>Intentar nuevamente</Text>
      </TouchableOpacity>
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
    marginBottom: spacing.xl,
  },
  button: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: 8,
    marginTop: spacing.md,
    minWidth: 200,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  buttonSecondary: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.primary,
    marginTop: spacing.sm,
  },
  buttonTextSecondary: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
});
