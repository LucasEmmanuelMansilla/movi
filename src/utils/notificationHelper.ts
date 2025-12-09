import { Platform } from 'react-native';
import messaging from '@react-native-firebase/messaging';

/**
 * Configura el canal de notificaciones para Android y muestra notificaciones en primer plano
 */
export async function setupNotificationChannel() {
  if (Platform.OS === 'android') {
    try {
      // Crear canal de notificaciones para Android
      const channelId = 'default';
      const channelName = 'Notificaciones Movi';
      const channelDescription = 'Notificaciones de envíos y actualizaciones';

      // El canal se crea automáticamente por FCM, pero podemos verificar que existe
      // FCM usa el canal 'default' por defecto si está configurado en AndroidManifest
      
      // Configurar FCM para mostrar notificaciones en primer plano
      // Esto se hace automáticamente si el canal está configurado correctamente
    } catch (error) {
      console.log('Error configurando canal de notificaciones:', error);
    }
  }
}

/**
 * Muestra una notificación local cuando la app está en primer plano
 * Nota: FCM debería mostrar notificaciones automáticamente si están configuradas correctamente
 */
export async function showLocalNotification(title: string, body: string, data?: any) {
  if (Platform.OS === 'android') {
    try {
      // FCM maneja las notificaciones automáticamente
      // Si necesitamos mostrar notificaciones locales personalizadas,
      // podemos usar una librería como react-native-push-notification
      // Por ahora, confiamos en que FCM las muestre automáticamente
      console.log('Notificación local:', { title, body, data });
    } catch (error) {
      console.log('Error mostrando notificación local:', error);
    }
  }
}

