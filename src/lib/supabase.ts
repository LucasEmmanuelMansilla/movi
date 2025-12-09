// apps/movi/src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Database } from '../supabase.types';
import Constants from 'expo-constants';
import { getAuthFlow } from '../utils/getAuthFlow';

const supabaseUrl = Constants.expoConfig?.extra?.supabaseUrl as string;
const supabaseAnonKey = Constants.expoConfig?.extra?.supabaseAnonKey as string;
const flowType = getAuthFlow();

// Validar que las variables estén configuradas
if (!supabaseUrl || !supabaseAnonKey) {
  const missing = [];
  if (!supabaseUrl) missing.push('EXPO_PUBLIC_SUPABASE_URL');
  if (!supabaseAnonKey) missing.push('EXPO_PUBLIC_SUPABASE_ANON_KEY');
  
  console.error('❌ Variables de Supabase faltantes:', missing.join(', '));
  console.error('💡 Crea un archivo .env en la raíz del proyecto movi con:');
  console.error('   EXPO_PUBLIC_SUPABASE_URL=tu_url_supabase');
  console.error('   EXPO_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key');
  
  throw new Error(`Variables de Supabase no configuradas: ${missing.join(', ')}`);
}

if (__DEV__) {
  console.log('✅ Supabase configurado:', supabaseUrl ? 'URL presente' : 'URL faltante');
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage as any,
    autoRefreshToken: false, // DESHABILITADO para evitar peticiones automáticas repetidas
    persistSession: true,
    detectSessionInUrl: false,
    flowType: flowType,
  },
  global: {
    fetch: (url, options = {}) => {
      // Agregar timeout a las peticiones de Supabase - SIN REINTENTOS
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 segundos

      return fetch(url, {
        ...options,
        signal: controller.signal,
      })
        .catch((error) => {
          clearTimeout(timeoutId);
          // Capturar errores de red - NO reintentar
          if (error.name === 'AbortError' || error.message?.includes('network')) {
            throw new Error('Network request failed');
          }
          throw error;
        })
        .finally(() => {
          clearTimeout(timeoutId);
        });
    },
  },
});

// Helper to get the current user's role
export const getUserRole = async (): Promise<'driver' | 'business' | null> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();
    
  return profile?.role as 'driver' | 'business' || null;
};