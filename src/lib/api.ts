import { useAuthStore } from '../../src/store/useAuthStore';
import { useAlertStore } from '../../src/store/useAlertStore';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

// Configuración de la API
const getBaseURL = (): string => {
  // Prioridad: variable de entorno > constante de Expo > fallback inteligente
  let apiUrl = Constants.expoConfig?.extra?.apiUrl as string;
  
  if (!apiUrl) {
    // En desarrollo, usar la IP local en lugar de localhost para dispositivos móviles
    if (__DEV__) {
      // Para Android emulador
      if (Platform.OS === 'android') {
        apiUrl = 'http://10.0.2.2:4000';
      } 
      // Para iOS simulator
      else if (Platform.OS === 'ios') {
        apiUrl = 'http://localhost:4000';
      }
      // Para web
      else {
        apiUrl = 'http://localhost:4000';
      }
    } else {
      // En producción, debe estar configurado
      apiUrl = 'http://localhost:4000';
    }
  }

  // Validar que la URL sea válida
  if (!apiUrl || (!apiUrl.startsWith('http://') && !apiUrl.startsWith('https://'))) {
    console.error('⚠️ API URL inválida:', apiUrl);
    throw new Error('API URL no configurada correctamente. Verifica EXPO_PUBLIC_API_URL en tu .env');
  }

  if (__DEV__) {
    console.log('🔗 API URL configurada:', apiUrl);
  }

  return apiUrl;
};

const baseURL = getBaseURL();
const REQUEST_TIMEOUT = 15000; // 15 segundos

// Tipos de error personalizados
export class APIError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public code?: string,
    public details?: any
  ) {
    super(message);
    this.name = 'APIError';
  }
}

export class NetworkError extends Error {
  constructor(message: string = 'Error de conexión. Verifica tu internet.') {
    super(message);
    this.name = 'NetworkError';
  }
}

export class TimeoutError extends Error {
  constructor(message: string = 'La solicitud tardó demasiado. Intenta de nuevo.') {
    super(message);
    this.name = 'TimeoutError';
  }
}

// Función de fetch SIN REINTENTOS - solo una petición
async function fetchOnce(
  url: string,
  options: RequestInit
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    return response;
  } catch (error: any) {
    clearTimeout(timeoutId);
    
    if (error.name === 'AbortError') {
      throw new TimeoutError();
    }

    // Cualquier error de red se lanza inmediatamente SIN reintentos
    if (error.message?.includes('fetch') || error.message?.includes('network') || error.message?.includes('Network')) {
      throw new NetworkError('No se pudo conectar al servidor. Verifica tu conexión a internet.');
    }

    throw new NetworkError();
  }
}

// Función para parsear errores de la API
async function parseErrorResponse(response: Response): Promise<APIError> {
  let errorMessage = `Error ${response.status}`;
  let errorDetails: any = null;

  try {
    const contentType = response.headers.get('content-type');
    if (contentType?.includes('application/json')) {
      const data = await response.json();
      errorMessage = data.error || data.message || errorMessage;
      errorDetails = data.details || data;
    } else {
      const text = await response.text();
      if (text) {
        try {
          const parsed = JSON.parse(text);
          errorMessage = parsed.error || parsed.message || errorMessage;
          errorDetails = parsed.details || parsed;
        } catch {
          errorMessage = text || errorMessage;
        }
      }
    }
  } catch {
    // Si falla el parseo, usar el mensaje por defecto
  }

  // Mensajes de error amigables según el código de estado
  const statusMessages: Record<number, string> = {
    401: 'Tu sesión ha expirado. Por favor inicia sesión nuevamente.',
    403: 'No tienes permisos para realizar esta acción.',
    404: 'El recurso solicitado no fue encontrado.',
    422: 'Los datos proporcionados no son válidos.',
    429: 'Demasiadas solicitudes. Por favor espera un momento.',
    500: 'Error del servidor. Por favor intenta más tarde.',
    503: 'El servicio no está disponible. Por favor intenta más tarde.',
  };

  const friendlyMessage = statusMessages[response.status] || errorMessage;

  return new APIError(
    friendlyMessage,
    response.status,
    response.status.toString(),
    errorDetails
  );
}

// Función principal de la API - SIN REINTENTOS, solo una petición
export async function api<T = any>(path: string, options: RequestInit = {}): Promise<T> {
  const { session } = useAuthStore.getState();
  const token = session?.access_token;

  // NO refrescar token automáticamente - solo usar el token actual
  // Si el token está expirado, la petición fallará y el usuario deberá iniciar sesión nuevamente

  const headers = new Headers(options.headers || {});
  headers.set('Content-Type', 'application/json');
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const url = `${baseURL}${path}`;

  if (__DEV__) {
    console.log(`🌐 API Request: ${options.method || 'GET'} ${url}`);
  }

  try {
    // SOLO UNA PETICIÓN - SIN REINTENTOS
    const response = await fetchOnce(url, {
      ...options,
      headers,
    });

    // Si es 401, NO reintentar - lanzar error directamente
    if (response.status === 401) {
      const error = await parseErrorResponse(response);
      
      // Cerrar sesión automáticamente y mostrar alerta global
      useAuthStore.getState().signOut();
      useAlertStore.getState().showAlert({
        title: 'Sesión expirada',
        message: 'Tu sesión ha vencido por seguridad. Por favor, inicia sesión de nuevo.',
        buttons: [{ text: 'Aceptar' }]
      });

      throw error;
    }

    if (!response.ok) {
      throw await parseErrorResponse(response);
    }

    if (response.status === 204) {
      return undefined as unknown as T;
    }

    return (await response.json()) as T;
  } catch (error) {
    // Re-lanzar errores personalizados
    if (error instanceof APIError || error instanceof NetworkError || error instanceof TimeoutError) {
      throw error;
    }

    // Convertir errores desconocidos
    if (error instanceof Error) {
      throw new APIError(error.message);
    }

    throw new APIError('Error desconocido');
  }
}
