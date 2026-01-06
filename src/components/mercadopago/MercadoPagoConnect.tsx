import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radii } from '../../ui/theme';
import { getMercadoPagoOAuthUrl, connectMercadoPago, getMercadoPagoStatus, type MercadoPagoOAuthStatus } from '../../features/mercadopago/service';
import { getErrorMessage } from '../../utils/errorHandler';
import { openBrowserAsync, WebBrowserPresentationStyle } from 'expo-web-browser';

interface MercadoPagoConnectProps {
  onStatusChange?: (status: MercadoPagoOAuthStatus) => void;
}

export function MercadoPagoConnect({ onStatusChange }: MercadoPagoConnectProps) {
  const [status, setStatus] = useState<MercadoPagoOAuthStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const linkingListenerRef = useRef<{ remove: () => void } | null>(null);

  const loadStatus = async () => {
    try {
      setLoading(true);
      const currentStatus = await getMercadoPagoStatus();
      setStatus(currentStatus);
      if (onStatusChange) {
        onStatusChange(currentStatus);
      }
    } catch (error: any) {
      console.error('Error cargando estado de Mercado Pago:', error);
      // Si el endpoint no existe (404), asumir que no está conectado
      if (error.statusCode === 404 || error.message?.includes('no fue encontrado')) {
        setStatus({
          connected: false,
          mp_user_id: null,
          mp_status: null,
          token_expired: false,
          expires_at: null,
        });
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStatus();
  }, []);

  // Listener para deep links de OAuth
  useEffect(() => {
    const handleDeepLink = async (event: { url: string }) => {
      const url = event.url;
      
      // Verificar si es un deep link de OAuth
      if (url.includes('/mp/oauth/success')) {
        const urlObj = new URL(url);
        const mpUserId = urlObj.searchParams.get('mp_user_id');
        const accessToken = urlObj.searchParams.get('access_token');
        const refreshToken = urlObj.searchParams.get('refresh_token');
        const expiresIn = urlObj.searchParams.get('expires_in');

        if (mpUserId && accessToken && refreshToken && expiresIn) {
          try {
            setConnecting(true);
            await connectMercadoPago({
              mp_user_id: parseInt(mpUserId),
              access_token: accessToken,
              refresh_token: refreshToken,
              expires_in: parseInt(expiresIn),
            });

            Alert.alert(
              '✅ Conexión exitosa',
              'Tu cuenta de Mercado Pago ha sido conectada correctamente. Ahora puedes recibir pagos.',
              [{ text: 'Aceptar' }]
            );

            // Recargar estado
            await loadStatus();
          } catch (error: any) {
            const errorMessage = getErrorMessage(error);
            Alert.alert('Error', `No se pudo conectar Mercado Pago: ${errorMessage}`);
          } finally {
            setConnecting(false);
          }
        }
      } else if (url.includes('/mp/oauth/error')) {
        const urlObj = new URL(url);
        const error = urlObj.searchParams.get('error');
        const errorDescription = urlObj.searchParams.get('error_description');

        Alert.alert(
          '❌ Error de conexión',
          errorDescription || error || 'No se pudo conectar con Mercado Pago',
          [{ text: 'Aceptar' }]
        );
        setConnecting(false);
      }
    };

    // Agregar listener
    const subscription = Linking.addEventListener('url', handleDeepLink);
    linkingListenerRef.current = subscription;

    // También verificar si la app se abrió con un deep link
    Linking.getInitialURL().then((url) => {
      if (url) {
        handleDeepLink({ url });
      }
    });

    // Cleanup
    return () => {
      if (linkingListenerRef.current) {
        linkingListenerRef.current.remove();
      }
    };
  }, []);

  const handleConnect = async () => {
    try {
      setConnecting(true);
      const oauthUrl = await getMercadoPagoOAuthUrl();
      
      if (!oauthUrl) {
        Alert.alert(
          'Error de configuración',
          'No se pudo obtener la URL de OAuth. Verifica la configuración del servidor.'
        );
        setConnecting(false);
        return;
      }

      // Abrir OAuth en el navegador
      const canOpen = await openBrowserAsync(oauthUrl, {
        presentationStyle: WebBrowserPresentationStyle.FULL_SCREEN,
        enableBarCollapsing: false,
        controlsColor: colors.accent,
      });

      if (!canOpen) {
        Alert.alert('Error', 'No se puede abrir la URL de OAuth');
        setConnecting(false);
      }
    } catch (error: any) {
      const errorMessage = getErrorMessage(error);
      
      // Mensaje más específico para errores de configuración
      if (error.statusCode === 503 || errorMessage.includes('no está configurado')) {
        Alert.alert(
          'Servicio no disponible',
          'La integración con Mercado Pago no está configurada en el servidor. Por favor contacta al administrador.',
          [{ text: 'Aceptar' }]
        );
      } else {
        Alert.alert('Error', `No se pudo abrir OAuth: ${errorMessage}`);
      }
      setConnecting(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="small" color={colors.accent} />
        <Text style={styles.loadingText}>Cargando estado de Mercado Pago...</Text>
      </View>
    );
  }

  if (!status) {
    return null;
  }

  const isConnected = status.connected && status.mp_status === 'connected';
  const isExpired = status.token_expired;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Ionicons 
          name={isConnected ? "checkmark-circle" : "wallet-outline"} 
          size={24} 
          color={isConnected ? '#10B981' : colors.accent} 
        />
        <Text style={styles.title}>Mercado Pago</Text>
      </View>

      <View style={styles.content}>
        {isConnected ? (
          <>
            <View style={styles.statusContainer}>
              <View style={[styles.statusBadge, { backgroundColor: '#D1FAE5' }]}>
                <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                <Text style={[styles.statusText, { color: '#065F46' }]}>
                  Conectado
                </Text>
              </View>
            </View>

            {isExpired && (
              <View style={styles.warningInfo}>
                <Ionicons name="warning-outline" size={18} color="#F59E0B" />
                <Text style={styles.warningText}>
                  Tu token de acceso ha expirado. Por favor, reconecta tu cuenta.
                </Text>
              </View>
            )}

            <View style={styles.detailsContainer}>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Usuario ID:</Text>
                <Text style={styles.detailValue}>{status.mp_user_id || 'N/A'}</Text>
              </View>
              {status.expires_at && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Token expira:</Text>
                  <Text style={styles.detailValue}>
                    {new Date(status.expires_at).toLocaleDateString('es-AR')}
                  </Text>
                </View>
              )}
            </View>

            <TouchableOpacity
              style={[styles.button, styles.buttonSecondary]}
              onPress={handleConnect}
              disabled={connecting}
            >
              {connecting ? (
                <>
                  <ActivityIndicator size="small" color={colors.accent} style={styles.buttonLoader} />
                  <Text style={[styles.buttonText, { color: colors.accent }]}>
                    Reconectando...
                  </Text>
                </>
              ) : (
                <>
                  <Ionicons name="refresh" size={20} color={colors.accent} style={styles.buttonIcon} />
                  <Text style={[styles.buttonText, { color: colors.accent }]}>
                    Reconectar cuenta
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </>
        ) : (
          <>
            <View style={styles.infoContainer}>
              <Text style={styles.infoText}>
                Conecta tu cuenta de Mercado Pago para recibir pagos directamente en tu cuenta.
              </Text>
              <Text style={styles.infoSubtext}>
                No necesitas proporcionar datos bancarios. Mercado Pago maneja todo el proceso de verificación.
              </Text>
            </View>

            <TouchableOpacity
              style={[styles.button, connecting && styles.buttonDisabled]}
              onPress={handleConnect}
              disabled={connecting}
            >
              {connecting ? (
                <>
                  <ActivityIndicator size="small" color="#FFFFFF" style={styles.buttonLoader} />
                  <Text style={styles.buttonText}>
                    Conectando...
                  </Text>
                </>
              ) : (
                <>
                  <Ionicons name="wallet" size={20} color="#FFFFFF" style={styles.buttonIcon} />
                  <Text style={styles.buttonText}>Conectar Mercado Pago</Text>
                </>
              )}
            </TouchableOpacity>
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    borderRadius: radii.md,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  content: {
    gap: spacing.md,
  },
  statusContainer: {
    marginBottom: spacing.sm,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.sm,
    gap: spacing.sm,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  detailsContainer: {
    backgroundColor: colors.background,
    borderRadius: radii.sm,
    padding: spacing.md,
    gap: spacing.xs,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 14,
    color: colors.muted,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  infoContainer: {
    gap: spacing.xs,
  },
  infoText: {
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
  },
  infoSubtext: {
    fontSize: 12,
    color: colors.muted,
    lineHeight: 18,
    marginTop: spacing.xs,
  },
  warningInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FEF3C7',
    padding: spacing.md,
    borderRadius: radii.sm,
    gap: spacing.sm,
  },
  warningText: {
    flex: 1,
    fontSize: 14,
    color: '#92400E',
    lineHeight: 20,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.accent,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.sm,
    gap: spacing.sm,
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
    marginTop: spacing.sm,
  },
  buttonSecondary: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.accent,
    shadowOpacity: 0,
    elevation: 0,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonIcon: {
    marginRight: spacing.xs,
  },
  buttonLoader: {
    marginRight: spacing.xs,
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 16,
  },
  loadingText: {
    marginTop: spacing.sm,
    fontSize: 14,
    color: colors.muted,
    textAlign: 'center',
  },
});
