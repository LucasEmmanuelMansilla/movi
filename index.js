import messaging from '@react-native-firebase/messaging';

// Registrar el background message handler
// Este handler se ejecuta cuando la app está en segundo plano o cerrada
// IMPORTANTE: Debe estar en el nivel superior del archivo, no dentro de una función
messaging().setBackgroundMessageHandler(async remoteMessage => {
  console.log('Mensaje recibido en background:', remoteMessage);
  // Las notificaciones se muestran automáticamente por el sistema
  // Aquí puedes procesar datos adicionales si es necesario
});

