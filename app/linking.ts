// app/linking.ts
export default {
  prefixes: [
    'movi://', // Usa directamente el esquema movi
  ],
  config: {
    screens: {
      // Pantallas públicas
      '(auth)': {
        screens: {
          login: 'login',
          register: 'register',
          confirm: 'confirm',
        }
      },
      // Ruta para manejar el callback de autenticación
      'auth/callback': {
        path: 'auth/callback',
        parse: {
          access_token: String,
          refresh_token: String,
          type: String,
        },
      },
      // Otras rutas...
    },
  },
};