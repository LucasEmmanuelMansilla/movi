import { useState, useEffect, useRef, useCallback } from 'react';
import { Alert, Linking } from 'react-native';
import { 
  getMercadoPagoOAuthUrl, 
  connectMercadoPago, 
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
  }, [onStatusChange]);

  useEffect(() => {
    loadStatus();
  }, [loadStatus]);

  const handleDeepLink = useCallback(async (event: { url: string }) => {
    const url = event.url;
    
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
  }, [loadStatus]);

  useEffect(() => {
    const subscription = Linking.addEventListener('url', handleDeepLink);
    linkingListenerRef.current = subscription;

    Linking.getInitialURL().then((url) => {
      if (url) {
        handleDeepLink({ url });
      }
    });

    return () => {
      if (linkingListenerRef.current) {
        linkingListenerRef.current.remove();
      }
    };
  }, [handleDeepLink]);

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

      // Abrir la URL directamente con el sistema. 
      // Al ser una URL de auth.mercadopago.com, si la app de MP está instalada 
      // y tiene habilitados los App Links, el sistema debería ofrecer abrirla con la App.
      await Linking.openURL(oauthUrl);
    } catch (error: any) {
      const errorMessage = getErrorMessage(error);
      if (error.statusCode === 503 || errorMessage.includes('no está configurado')) {
        Alert.alert(
          'Servicio no disponible',
          'La integración con Mercado Pago no está configurada en el servidor. Por favor contacta al administrador.',
          [{ text: 'Aceptar' }]
        );
      } else {
        Alert.alert('Error', `No se pudo abrir Mercado Pago: ${errorMessage}`);
      }
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
