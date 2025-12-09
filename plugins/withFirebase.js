const { withAppBuildGradle, withProjectBuildGradle, withAndroidManifest } = require('@expo/config-plugins');

/**
 * Plugin de Expo para configurar React Native Firebase en Android
 */
const withFirebase = (config) => {
  // Configurar build.gradle del proyecto (nivel raíz)
  config = withProjectBuildGradle(config, (config) => {
    const buildGradle = config.modResults.contents;
    
    // Verificar si ya está configurado
    if (buildGradle.includes('com.google.gms:google-services')) {
      return config;
    }

    // Agregar classpath de Google Services en buildscript.dependencies
    if (buildGradle.includes('buildscript')) {
      config.modResults.contents = buildGradle.replace(
        /(buildscript\s*\{[\s\S]*?dependencies\s*\{)/,
        `$1\n        classpath 'com.google.gms:google-services:4.4.0'`
      );
    } else {
      // Si no hay buildscript, agregarlo
      config.modResults.contents = `buildscript {\n    dependencies {\n        classpath 'com.google.gms:google-services:4.4.0'\n    }\n}\n\n${buildGradle}`;
    }

    return config;
  });

  // Configurar build.gradle de la app
  config = withAppBuildGradle(config, (config) => {
    const buildGradle = config.modResults.contents;
    
    // Verificar si ya está configurado
    if (buildGradle.includes('apply plugin: \'com.google.gms.google-services\'')) {
      return config;
    }

    // Agregar apply plugin al final del archivo
    config.modResults.contents = buildGradle + '\n\napply plugin: \'com.google.gms.google-services\'';

    return config;
  });

  // Configurar AndroidManifest.xml
  config = withAndroidManifest(config, (config) => {
    const manifest = config.modResults.manifest;
    
    // Agregar permisos si no existen
    const permissions = manifest.permission || [];
    const permissionNames = permissions.map(p => p.$['android:name']);
    
    if (!permissionNames.includes('android.permission.INTERNET')) {
      manifest.permission = [
        ...permissions,
        { $: { 'android:name': 'android.permission.INTERNET' } }
      ];
    }
    
    if (!permissionNames.includes('android.permission.POST_NOTIFICATIONS')) {
      manifest.permission = [
        ...(manifest.permission || []),
        { $: { 'android:name': 'android.permission.POST_NOTIFICATIONS' } }
      ];
    }

    // Agregar servicio de Firebase Messaging
    const application = manifest.application?.[0];
    if (application) {
      const services = application.service || [];
      const serviceNames = services.map(s => s.$['android:name']);
      
      if (!serviceNames.includes('com.google.firebase.messaging.FirebaseMessagingService')) {
        application.service = [
          ...services,
          {
            $: {
              'android:name': 'com.google.firebase.messaging.FirebaseMessagingService',
              'android:exported': 'false'
            },
            'intent-filter': [{
              action: [{ $: { 'android:name': 'com.google.firebase.MESSAGING_EVENT' } }]
            }]
          }
        ];
      }

      // Configurar meta-data para mostrar notificaciones en primer plano
      const metaData = application['meta-data'] || [];
      const metaDataNames = metaData.map(m => m.$['android:name']);
      
      if (!metaDataNames.includes('com.google.firebase.messaging.default_notification_channel_id')) {
        application['meta-data'] = [
          ...metaData,
          {
            $: {
              'android:name': 'com.google.firebase.messaging.default_notification_channel_id',
              'android:value': 'default'
            }
          }
        ];
      }
    }

    return config;
  });

  return config;
};

module.exports = withFirebase;
