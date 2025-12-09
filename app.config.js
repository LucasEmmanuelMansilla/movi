// app.config.js
module.exports = {
  expo: {
    name: 'movi',
    slug: 'movi',
    scheme: 'movi',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/images/icon.jpeg',
    userInterfaceStyle: 'automatic',
    plugins: [
      [
        'expo-linking',
        {
          prefixes: ['movi://'],
          config: {
            screens: {
              '(auth)': {
                screens: {
                  login: 'login',
                  register: 'register',
                  confirm: 'confirm',
                }
              },
              'auth/callback': {
                path: 'auth/callback',
                parse: {
                  access_token: String,
                  refresh_token: String,
                  type: String,
                },
              },
            },
          },
        },
      ],
    ],
    extra: {
      eas: {
        projectId: "5b3515a8-ade0-44f9-957d-b821cd875e86"
      },
      apiUrl: process.env.EXPO_PUBLIC_API_URL,
      supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL,
      supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
    }
  },
};
