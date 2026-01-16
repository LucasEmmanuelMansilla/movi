import { useState, useEffect, useRef, useCallback } from 'react';
import { Alert, Linking } from 'react-native';
import { 
  getMercadoPagoOAuthUrl, 
  getMercadoPagoStatus, 
  type MercadoPagoOAuthStatus 
} from '../../features/mercadopago/service';
import { getErrorMessage } from '../../utils/errorHandler';

interface UseMercadoPagoConnectLogicProps {
  onStatusChange?: (status: MercadoPagoOAuthStatus) => void;
}

export function useMercadoPagoConnectLogic({ onStatusChange }: UseMercadoPagoConnectLogicProps = {}) {
  const [status, setStatus] = useState<MercadoPagoOAuthStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const linkingListenerRef = useRef<{ remove: () => void } | null>(null);

  const loadStatus = useCallback(async () => {
    try {
      setLoading(true);
      const currentStatus = await getMercadoPagoStatus();
      setStatus(currentStatus);
      if (onStatusChange) {
        onStatusChange(currentStatus);
      }
    } catch (error: any) {
      console.error('Error cargando estado de Mercado Pago:', error);
      if (error.statusCode === 404) {
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
  }, [onStatusChange]);

  useEffect(() => {
    loadStatus();
  }, [loadStatus]);

  const handleDeepLink = useCallback(async (event: { url: string }) => {
    const url = event.url;
    
    // El backend ahora guarda los tokens directamente. 
    // Solo recibimos una señal de éxito o error.
    if (url.includes('/mp/oauth/success')) {
      Alert.alert(
        '✅ Conexión exitosa',
        'Tu cuenta de Mercado Pago ha sido conectada correctamente.',
        [{ text: 'Aceptar' }]
      );
      await loadStatus();
      setConnecting(false);
    } else if (url.includes('/mp/oauth/error')) {
      const urlObj = new URL(url);
      const errorDescription = urlObj.searchParams.get('error_description');

      Alert.alert(
        '❌ Error de conexión',
        errorDescription || 'No se pudo conectar con Mercado Pago',
        [{ text: 'Aceptar' }]
      );
      setConnecting(false);
    }
  }, [loadStatus]);

  useEffect(() => {
    const subscription = Linking.addEventListener('url', handleDeepLink);
    linkingListenerRef.current = subscription;

    Linking.getInitialURL().then((url) => {
      if (url) handleDeepLink({ url });
    });

    return () => linkingListenerRef.current?.remove();
  }, [handleDeepLink]);

  const handleConnect = async () => {
    try {
      setConnecting(true);
      const oauthUrl = await getMercadoPagoOAuthUrl();
      if (oauthUrl) {
        await Linking.openURL(oauthUrl);
      }
    } catch (error: any) {
      const errorMessage = getErrorMessage(error);
      Alert.alert('Error', `No se pudo abrir Mercado Pago: ${errorMessage}`);
      setConnecting(false);
    }
  };

  return {
    status,
    loading,
    connecting,
    handleConnect,
    loadStatus,
  };
}
