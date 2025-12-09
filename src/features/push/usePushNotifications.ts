import { useEffect, useRef, useCallback } from 'react';
import messaging from '@react-native-firebase/messaging';
import { Platform, PermissionsAndroid, AppState } from 'react-native';
import { api } from '../../lib/api';
import * as Notifications from 'expo-notifications';
import { pushNotificationEmitter } from './eventEmitter';

// Eventos que se emiten cuando llegan notificaciones
export const PUSH_EVENTS = {
  NEW_SHIPMENT: 'NEW_SHIPMENT',
  SHIPMENT_STATUS_CHANGED: 'SHIPMENT_STATUS_CHANGED',
  SHIPMENT_ACCEPTED: 'SHIPMENT_ACCEPTED',
} as const;

/**
 * Hook para registrar el token de push notifications usando Firebase Cloud Messaging nativo
 * y manejar notificaciones en primer plano
 */
export function usePushNotifications() {
  const registeredRef = useRef(false);
  const appState = useRef(AppState.currentState);

  useEffect(() => {
    // Listener para cambios de estado de la app
    const subscription = AppState.addEventListener('change', nextAppState => {
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === 'active'
      ) {
        // La app volvió al primer plano, verificar si hay notificaciones pendientes
        messaging()
          .getInitialNotification()
          .then(remoteMessage => {
            if (remoteMessage) {
              handleNotification(remoteMessage);
            }
          });
      }
      appState.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, []);

  const handleNotification = useCallback((remoteMessage: any) => {
    console.log('Notificación recibida:', remoteMessage);
    
    // Emitir evento para que las pantallas se actualicen
    const data = remoteMessage.data || {};
    const notification = remoteMessage.notification;
    
    // Determinar el tipo de notificación basado en el título o datos
    if (notification?.title) {
      if (notification.title.includes('Nuevo envío disponible')) {
        pushNotificationEmitter.emit(PUSH_EVENTS.NEW_SHIPMENT, {
          title: notification.title,
          body: notification.body,
          data,
        });
      } else if (
        notification.title.includes('Envío aceptado') ||
        notification.title.includes('Envío recogido') ||
        notification.title.includes('Envío en tránsito') ||
        notification.title.includes('Envío entregado') ||
        notification.title.includes('Envío cancelado') ||
        notification.title.includes('Actualización de envío')
      ) {
        pushNotificationEmitter.emit(PUSH_EVENTS.SHIPMENT_STATUS_CHANGED, {
          title: notification.title,
          body: notification.body,
          data,
        });
      }
    }
  }, []);

  useEffect(() => {
    (async () => {
      try {
        // Evitar múltiples registros
        if (registeredRef.current) return;
        registeredRef.current = true;

        // Solicitar permisos en Android
        if (Platform.OS === 'android') {
          const granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
          );
          
          if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
            console.log('Permisos de notificación denegados');
            return;
          }
        }

        // Configurar expo-notifications para mostrar notificaciones locales en primer plano
        Notifications.setNotificationHandler({
          handleNotification: async () => ({
            shouldShowAlert: true,
            shouldPlaySound: true,
            shouldSetBadge: true,
          }),
        });

        // Obtener el token FCM
        const token = await messaging().getToken();
        
        if (token) {
          console.log('Token FCM obtenido:', token.substring(0, 20) + '...');
          
          // Registrar el token en el backend
          await api('/push/register', {
            method: 'POST',
            body: JSON.stringify({ 
              token, 
              platform: Platform.OS 
            })
          });
          
          console.log('Token registrado exitosamente en el backend');
        }

        // Configurar el manejador de notificaciones en primer plano
        const unsubscribeForeground = messaging().onMessage(async remoteMessage => {
          console.log('Notificación recibida en primer plano:', remoteMessage);
          
          const notification = remoteMessage.notification;
          if (notification) {
            // Mostrar notificación local cuando la app está en primer plano
            // FCM no muestra notificaciones automáticamente en primer plano,
            // así que usamos expo-notifications para mostrarlas
            await Notifications.scheduleNotificationAsync({
              content: {
                title: notification.title || 'Nueva notificación',
                body: notification.body || '',
                data: remoteMessage.data || {},
                sound: true,
              },
              trigger: null, // Mostrar inmediatamente
            });
            
            // Emitir evento para actualizar las listas
            handleNotification(remoteMessage);
          }
        });

        // Configurar el manejador cuando la app se abre desde una notificación
        const unsubscribeOpenedApp = messaging().onNotificationOpenedApp(remoteMessage => {
          console.log('App abierta desde notificación:', remoteMessage);
          handleNotification(remoteMessage);
        });

        // Verificar si la app se abrió desde una notificación (cuando estaba cerrada)
        messaging()
          .getInitialNotification()
          .then(remoteMessage => {
            if (remoteMessage) {
              console.log('App abierta desde notificación (estado cerrado):', remoteMessage);
              handleNotification(remoteMessage);
            }
          });

        // Limpiar suscripciones al desmontar
        return () => {
          unsubscribeForeground();
          unsubscribeOpenedApp();
        };
      } catch (e) {
        // Silenciar errores de push para no bloquear el uso
        console.log('Error al registrar push notifications:', e);
        registeredRef.current = false; // Permitir reintento en caso de error
      }
    })();
  }, [handleNotification]);
}

/**
 * Hook para escuchar eventos de notificaciones push y actualizar las listas
 */
export function usePushNotificationListener(
  onNewShipment?: () => void,
  onStatusChanged?: () => void
) {
  useEffect(() => {
    const listeners: Array<() => void> = [];

    if (onNewShipment) {
      const handler = () => {
        console.log('Nuevo envío recibido, actualizando lista...');
        onNewShipment();
      };
      pushNotificationEmitter.on(PUSH_EVENTS.NEW_SHIPMENT, handler);
      listeners.push(() => pushNotificationEmitter.off(PUSH_EVENTS.NEW_SHIPMENT, handler));
    }

    if (onStatusChanged) {
      const handler = () => {
        console.log('Estado de envío cambiado, actualizando lista...');
        onStatusChanged();
      };
      pushNotificationEmitter.on(PUSH_EVENTS.SHIPMENT_STATUS_CHANGED, handler);
      listeners.push(() => pushNotificationEmitter.off(PUSH_EVENTS.SHIPMENT_STATUS_CHANGED, handler));
    }

    return () => {
      listeners.forEach(cleanup => cleanup());
    };
  }, [onNewShipment, onStatusChanged]);
}

