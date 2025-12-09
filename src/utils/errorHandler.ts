import { APIError, NetworkError, TimeoutError } from '../lib/api';

/**
 * Obtiene un mensaje de error amigable para mostrar al usuario
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof APIError) {
    return error.message;
  }

  if (error instanceof NetworkError) {
    return error.message;
  }

  if (error instanceof TimeoutError) {
    return error.message;
  }

  if (error instanceof Error) {
    // Mensajes de error comunes de Supabase
    const supabaseErrors: Record<string, string> = {
      'Invalid login credentials': 'Correo o contraseña incorrectos',
      'Email not confirmed': 'Por favor verifica tu correo electrónico antes de iniciar sesión',
      'User already registered': 'Este correo electrónico ya está registrado',
      'Password should be at least 6 characters': 'La contraseña debe tener al menos 6 caracteres',
    };

    for (const [key, value] of Object.entries(supabaseErrors)) {
      if (error.message.includes(key)) {
        return value;
      }
    }

    return error.message;
  }

  return 'Ocurrió un error inesperado. Por favor intenta de nuevo.';
}

/**
 * Obtiene el código de error si está disponible
 */
export function getErrorCode(error: unknown): string | undefined {
  if (error instanceof APIError) {
    return error.code;
  }
  return undefined;
}

/**
 * Obtiene los detalles del error si están disponibles
 */
export function getErrorDetails(error: unknown): any {
  if (error instanceof APIError) {
    return error.details;
  }
  return undefined;
}

/**
 * Verifica si el error es un error de autenticación
 */
export function isAuthError(error: unknown): boolean {
  if (error instanceof APIError) {
    return error.statusCode === 401 || error.statusCode === 403;
  }
  return false;
}

/**
 * Verifica si el error es un error de red
 */
export function isNetworkError(error: unknown): boolean {
  return error instanceof NetworkError || error instanceof TimeoutError;
}

