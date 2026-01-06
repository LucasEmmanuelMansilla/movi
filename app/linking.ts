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
      // Pantallas de la app
      '(app)': {
        screens: {
          // Rutas para callbacks de pagos
          'payments/success': {
            path: 'payments/success',
            parse: {
              shipment_id: String,
            },
          },
          'payments/failure': {
            path: 'payments/failure',
            parse: {
              shipment_id: String,
            },
          },
          'payments/pending': {
            path: 'payments/pending',
            parse: {
              shipment_id: String,
            },
          },
          // Otras rutas de la app...
        },
      },
      // Rutas para OAuth de Mercado Pago
      'mp/oauth/success': {
        path: 'mp/oauth/success',
        parse: {
          mp_user_id: String,
          access_token: String,
          refresh_token: String,
          expires_in: String,
        },
      },
      'mp/oauth/error': {
        path: 'mp/oauth/error',
        parse: {
          error: String,
          error_description: String,
        },
      },
      // Otras rutas...
    },
  },
};