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
    bundleIdentifier: "com.movi.app"
  },
  android: {
    ...config.android,
    package: "com.movi.app"
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
  },
  experiments: {
    typedRoutes: true
  },
  plugins: [
    ...(config.plugins || []),
    './plugins/withFirebase.js'
  ]
});
