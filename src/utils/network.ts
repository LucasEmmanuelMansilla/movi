import { Platform } from 'react-native';
import Constants from 'expo-constants';

/**
 * Obtiene la IP local de la máquina para desarrollo
 * Útil cuando se ejecuta en dispositivos físicos
 */
export function getLocalIP(): string | null {
  // En desarrollo, intentar detectar la IP local
  // Nota: Esto requiere configuración manual en .env para dispositivos físicos
  return null;
}

/**
 * Obtiene la URL base del servidor según la plataforma
 */
export function getServerURL(): string {
  if (__DEV__) {
    // Android emulador usa 10.0.2.2 para acceder al localhost de la máquina host
    if (Platform.OS === 'android') {
      return 'http://10.0.2.2:4000';
    }
    // iOS simulator puede usar localhost
    if (Platform.OS === 'ios') {
      return 'http://localhost:4000';
    }
    // Web también usa localhost
    return 'http://localhost:4000';
  }
  
  // En producción, debe venir de variables de entorno
  return  Constants.expoConfig?.extra?.apiUrl || '';
}

/**
 * Verifica si el servidor está accesible
 */
export async function checkServerHealth(): Promise<boolean> {
  try {
    const url = getServerURL();
    const response = await fetch(`${url}/health`, {
      method: 'GET',
      signal: AbortSignal.timeout(5000), // 5 segundos timeout
    });
    return response.ok;
  } catch (error) {
    console.log("🚀 ~ checkServerHealth ~ error:", error)
    return false;
  }
}

