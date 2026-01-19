import { Platform } from 'react-native';

// Registrar el background message handler de Firebase Messaging.
// Este handler se ejecuta cuando la app está en segundo plano o cerrada.
// IMPORTANTE: Debe estar en el nivel superior del archivo.
//
// Nota: En web no existe @react-native-firebase/messaging, así que lo evitamos.
if (Platform.OS !== 'web') {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const messaging = require('@react-native-firebase/messaging').default;
  messaging().setBackgroundMessageHandler(async remoteMessage => {
    console.log('Mensaje recibido en background:', remoteMessage);
    // Las notificaciones se muestran automáticamente por el sistema
    // Aquí puedes procesar datos adicionales si es necesario
  });
}

// Cargar Expo Router después de registrar el handler.
require('expo-router/entry');

