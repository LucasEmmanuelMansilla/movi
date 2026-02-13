import { ConfigContext, ExpoConfig } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: "Movi",
  slug: "movi",
  scheme: "movi",
  version: "1.0.0",
  orientation: "portrait",
  ios: {
    ...config.ios,
    bundleIdentifier: "com.movi.app",
    // Descarga GoogleService-Info.plist de Firebase Console si builds para iOS
    // googleServicesFile: "./GoogleService-Info.plist",
    infoPlist: {
      ...(config.ios as any)?.infoPlist,
      NSLocationWhenInUseUsageDescription:
        "Necesitamos tu ubicación para mostrar envíos cercanos y validar puntos de retiro/entrega.",
      NSLocationAlwaysAndWhenInUseUsageDescription:
        "Necesitamos tu ubicación en segundo plano para avisarte de envíos cercanos aunque la app esté cerrada.",
      UIBackgroundModes: ["location"],
    },
  },
  android: {
    ...config.android,
    package: "com.movi.app",
    // REQUERIDO para Firebase/React Native Firebase en Android
    googleServicesFile: "./google-services.json",
    permissions: [
      "INTERNET",
      "ACCESS_COARSE_LOCATION",
      "ACCESS_FINE_LOCATION",
      "ACCESS_BACKGROUND_LOCATION",
      "FOREGROUND_SERVICE",
      "FOREGROUND_SERVICE_LOCATION",
      "POST_NOTIFICATIONS",
    ],
  },
  extra: {
    ...config.extra,
    theme: {
      primary: "#053959",
      accent: "#09c577",
      background: "#F3F4F6"
    },
    eas: {
      projectId: "5b3515a8-ade0-44f9-957d-b821cd875e86"
    },
    apiUrl: process.env.EXPO_PUBLIC_API_URL,
    supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL,
    supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
    landingUrl: process.env.EXPO_PUBLIC_LANDING_URL,
  },
  experiments: {
    typedRoutes: true
  },
  plugins: [
    ...(config.plugins || []),
    "@react-native-firebase/app",
    "@react-native-firebase/messaging",
    [
      "expo-build-properties",
      {
        ios: {
          useFrameworks: "static",
        },
      },
    ],
  ],
});
