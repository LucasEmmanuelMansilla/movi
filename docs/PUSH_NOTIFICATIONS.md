# Configuración de Notificaciones Push Nativas

Este proyecto utiliza React Native Firebase para notificaciones push nativas en Android.

## Requisitos Previos

1. El archivo `google-services.json` ya está ubicado en `android/app/google-services.json`
2. Firebase Cloud Messaging está configurado en Firebase Console

## Instalación

Las dependencias ya están instaladas en `package.json`:
- `@react-native-firebase/app`
- `@react-native-firebase/messaging`

## Configuración

### 1. Generar archivos nativos de Android

Ejecuta el siguiente comando para generar los archivos nativos de Android con la configuración de Firebase:

```bash
npx expo prebuild --platform android
```

O simplemente ejecuta:

```bash
npm run android
```

Esto generará automáticamente los archivos de Android con la configuración de Firebase aplicada por el plugin `withFirebase.js`.

### 2. Verificar configuración

Después de ejecutar `expo prebuild`, verifica que:

1. **android/build.gradle** contiene:
   ```gradle
   buildscript {
       dependencies {
           classpath 'com.google.gms:google-services:4.4.0'
       }
   }
   ```

2. **android/app/build.gradle** contiene al final:
   ```gradle
   apply plugin: 'com.google.gms.google-services'
   ```

3. **android/app/src/main/AndroidManifest.xml** contiene:
   - Permiso `android.permission.INTERNET`
   - Permiso `android.permission.POST_NOTIFICATIONS` (Android 13+)
   - Servicio de Firebase Messaging

## Funcionamiento

### Registro de Tokens

El hook `useRegisterPush` se ejecuta automáticamente cuando el usuario está autenticado (en `app/(app)/_layout.tsx`). Este hook:

1. Solicita permisos de notificaciones en Android
2. Obtiene el token FCM del dispositivo
3. Registra el token en el backend mediante la API `/push/register`
4. Configura listeners para manejar notificaciones en primer plano y cuando la app se abre desde una notificación

### Notificaciones Automáticas

El backend envía notificaciones automáticamente en los siguientes casos:

#### 1. Nuevo Envío Creado
- **Destinatarios**: Drivers con rol "driver" que estén dentro de un radio de 10km de la dirección de retiro
- **Mensaje**: "Nuevo envío disponible - [Título] - Recoger en: [Dirección]"
- **Ubicación**: `movi-server/src/routes/shipments.ts` (líneas 113-170)

#### 2. Cambio de Estado de Envío
- **Destinatarios**: Usuario con rol "business" que creó el envío
- **Mensajes según estado**:
  - `picked_up`: "Envío recogido"
  - `in_transit`: "Envío en tránsito"
  - `delivered`: "Envío entregado"
  - `cancelled`: "Envío cancelado"
- **Ubicación**: `movi-server/src/routes/shipments.ts` (líneas 598-691)

## Pruebas

### Probar Notificaciones

1. **Registro de Token**:
   - Abre la app y verifica en los logs que el token FCM se registre correctamente
   - Verifica en la base de datos que el token se guarde en la tabla `push_tokens`

2. **Notificación a Drivers**:
   - Crea un envío como usuario "business"
   - Verifica que los drivers cercanos (dentro de 10km) reciban la notificación

3. **Notificación de Cambio de Estado**:
   - Cambia el estado de un envío
   - Verifica que el usuario "business" que creó el envío reciba la notificación

### Debugging

- Revisa los logs del servidor para ver si las notificaciones se envían correctamente
- Verifica que los tokens FCM sean válidos en Firebase Console
- Revisa los logs de la app para ver si hay errores al registrar el token

## Configuración del Backend

El backend ya está configurado para enviar notificaciones usando FCM v1 API. Asegúrate de tener configuradas las siguientes variables de entorno:

- `FCM_PROJECT_ID`: ID del proyecto de Firebase (ej: "movi-aead6")
- `FCM_SERVICE_ACCOUNT_KEY`: JSON de la cuenta de servicio de Firebase (como string)

## Notas Importantes

- Las notificaciones funcionan solo en dispositivos físicos (no en emuladores sin Google Play Services)
- En Android 13+, se requiere el permiso `POST_NOTIFICATIONS` que se solicita automáticamente
- Los tokens FCM pueden cambiar, por lo que el hook se ejecuta cada vez que la app se inicia

