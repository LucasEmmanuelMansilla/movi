import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { supabase } from '../lib/supabase';
import { Session } from '@supabase/supabase-js';

type Role = 'driver' | 'business' | null;

interface StoredSession {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  user: {
    id: string;
    email?: string;
  };
}

interface User {
  id: string;
  email: string;
  role: 'driver' | 'business';
  fullName?: string;
  phone?: string;
}

interface AuthState {
  user: any | null;
  session: Session | null;
  role: Role;
  isLoading: boolean;
  sessionChecked: boolean; // Indica si ya se verificó que no hay sesión disponible

  // Actions
  setRole: (role: Role) => void;
  setSession: (session: Session | null) => Promise<void>;
  loadSession: () => Promise<void>;
  signOut: () => Promise<void>;
  initializeAuth: () => () => void;
  setUser: (user: User | null) => void;
  clearUser: () => void;
  checkAuth: () => Promise<void>;
  resetSessionCheck: () => void; // Resetear el flag cuando se inicia sesión
}

const SECURE_KEY = 'movi_auth_session';

const storeSession = async (session: Session | null): Promise<void> => {
  if (!session) {
    await SecureStore.deleteItemAsync(SECURE_KEY);
    return;
  }

  const storedSession: StoredSession = {
    accessToken: session.access_token,
    refreshToken: session.refresh_token || '',
    expiresAt: Date.now() + (session.expires_in || 3600) * 1000,
    user: {
      id: session.user.id,
      email: session.user.email || undefined,
    },
  };

  await SecureStore.setItemAsync(SECURE_KEY, JSON.stringify(storedSession));
};

const getStoredSession = async (): Promise<StoredSession | null> => {
  const sessionString = await SecureStore.getItemAsync(SECURE_KEY);
  if (!sessionString) return null;

  try {
    return JSON.parse(sessionString);
  } catch (error) {
    console.log('Error parsing stored session:', error);
    return null;
  }
};

// Protección contra múltiples llamadas - una sola vez
let loadingSession = false;
let sessionLoadAttempted = false; // Flag para rastrear si ya se intentó cargar

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      session: null,
      role: null,
      isLoading: true,
      sessionChecked: false, // Inicialmente no se ha verificado
      
      setUser: (user) => set({ user, isLoading: false }),
      clearUser: () => set({ user: null, isLoading: false }),

      setRole: (role) => set({ role }),

      setSession: async (session) => {
        if (session) {
          await storeSession(session);
          // Si hay sesión, resetear los flags de verificación
          sessionLoadAttempted = false; // Permitir nueva carga después de login
          set({ user: session.user, session, isLoading: false, sessionChecked: false });
        } else {
          await storeSession(null);
          set({ user: null, session: null, isLoading: false, role: null, sessionChecked: true });
        }
      },

      resetSessionCheck: () => {
        sessionLoadAttempted = false; // Resetear flag de intento
        set({ sessionChecked: false });
      },

      loadSession: async () => {
        const state = get();
        
        // Si ya se verificó que no hay sesión (ni en Supabase ni local), NO intentar de nuevo
        if (state.sessionChecked && !state.session) {
          console.log('ℹ️ Sesión ya verificada: no hay sesión disponible, evitando peticiones');
          set({ isLoading: false });
          return;
        }

        // Si ya se intentó cargar la sesión, NO volver a intentar
        if (sessionLoadAttempted && !state.session) {
          console.log('ℹ️ Sesión ya intentó cargarse anteriormente, evitando peticiones repetidas');
          set({ isLoading: false });
          return;
        }
        
        // Prevenir múltiples llamadas simultáneas
        if (loadingSession) {
          console.log('⚠️ loadSession ya está en progreso, ignorando llamada duplicada');
          return;
        }

        // Marcar como intentado ANTES de hacer la petición
        sessionLoadAttempted = true;
        loadingSession = true;

        try {
          set({ isLoading: true });

          // PRIMERO: Verificar sesión almacenada localmente (SIN petición de red)
          const stored = await getStoredSession();
          
          if (stored && Date.now() < stored.expiresAt) {
            // Hay sesión almacenada válida - intentar restaurarla UNA VEZ
            try {
              const { data: { session: restoredSession }, error: restoreError } = await supabase.auth.setSession({
                access_token: stored.accessToken,
                refresh_token: stored.refreshToken,
              });

              if (restoredSession && !restoreError) {
                await storeSession(restoredSession);
                
                // Obtener el rol del perfil
                try {
                  const { data: profile } = await supabase
                    .from('profiles')
                    .select('role')
                    .eq('id', restoredSession.user.id)
                    .single();
                  
                  const userRole = profile?.role as Role || null;
                  set({
                    user: restoredSession.user,
                    session: restoredSession,
                    role: userRole,
                    isLoading: false,
                    sessionChecked: false
                  });
                } catch (profileError) {
                  console.warn('⚠️ Error al obtener perfil, continuando sin rol:', profileError);
                  set({
                    user: restoredSession.user,
                    session: restoredSession,
                    isLoading: false,
                    sessionChecked: false
                  });
                }
                
                loadingSession = false;
                return;
              }
            } catch (setSessionError) {
              console.warn('⚠️ Error al restaurar sesión almacenada:', setSessionError);
              // Continuar para verificar en Supabase
            }
          }

          // SEGUNDO: Intentar obtener sesión de Supabase UNA SOLA VEZ con timeout
          const sessionPromise = supabase.auth.getSession();
          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Network timeout')), 10000)
          );

          let sessionData;
          try {
            sessionData = await Promise.race([sessionPromise, timeoutPromise]) as any;
          } catch (networkError: any) {
            // Error de red - NO reintentar, marcar como verificado
            console.warn('⚠️ Error de red al obtener sesión de Supabase:', networkError.message);
            
            // Si no hay sesión almacenada válida, marcar como sin sesión
            await storeSession(null);
            set({ user: null, session: null, isLoading: false, role: null, sessionChecked: true });
            console.log('ℹ️ Error de red y no hay sesión almacenada, marcando como verificado');
            loadingSession = false;
            return;
          }

          const { data: { session }, error } = sessionData || { data: { session: null }, error: null };

          if (error) {
            // Error al obtener sesión - NO reintentar
            console.warn('⚠️ Error al obtener sesión:', error.message);
            
            // Si no hay sesión almacenada válida, marcar como sin sesión
            await storeSession(null);
            set({ user: null, session: null, isLoading: false, role: null, sessionChecked: true });
            console.log('ℹ️ Error y no hay sesión válida, marcando como verificado');
            loadingSession = false;
            return;
          }

          if (session) {
            // Hay sesión válida de Supabase - cargar el rol del perfil
            await storeSession(session);
            
            // Obtener el rol del perfil
            try {
              const { data: profile } = await supabase
                .from('profiles')
                .select('role')
                .eq('id', session.user.id)
                .single();
              
              const userRole = profile?.role as Role || null;
              set({ 
                user: session.user, 
                session, 
                role: userRole,
                isLoading: false, 
                sessionChecked: false 
              });
            } catch (profileError) {
              console.warn('⚠️ Error al obtener perfil, continuando sin rol:', profileError);
              set({ 
                user: session.user, 
                session, 
                isLoading: false, 
                sessionChecked: false 
              });
            }
            
            loadingSession = false;
            return;
          }

          // Si llegamos aquí, NO hay sesión ni en Supabase ni local
          // Marcar como verificado para NUNCA intentar de nuevo
          await storeSession(null);
          set({ user: null, session: null, isLoading: false, role: null, sessionChecked: true });
          console.log('ℹ️ No hay sesión disponible (ni Supabase ni local), marcando como verificado - NO se volverá a intentar');

        } catch (error: any) {
          console.error('❌ Error loading session:', error?.message || error);
          
          // CUALQUIER error - marcar como verificado y NO reintentar
          await storeSession(null);
          set({ user: null, session: null, isLoading: false, role: null, sessionChecked: true });
          console.log('ℹ️ Error en loadSession, marcando como verificado - NO se volverá a intentar');
        } finally {
          loadingSession = false;
        }
      },

      checkAuth: async () => {
        try {
          const { data: { session } } = await supabase.auth.getSession();

          if (session?.user) {
            const { data: profile } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', session.user.id)
              .single();

            if (profile) {
              set({
                user: {
                  id: session.user.id,
                  email: session.user.email!,
                  role: profile.role,
                  fullName: profile.full_name,
                  phone: profile.phone
                },
                session: session,
                role: profile.role as Role,
                isLoading: false
              });
              return;
            }
          }
        } catch (error) {
          console.error('Error checking auth:', error);
        }
        set({ user: null, session: null, role: null, isLoading: false });
      },

      signOut: async () => {
        try {
          await supabase.auth.signOut();
        } catch (error) {
          console.error('Error signing out:', error);
        }
        await storeSession(null);
        // Al cerrar sesión, resetear flags y marcar como verificado
        sessionLoadAttempted = false;
        set({ user: null, session: null, isLoading: false, role: null, sessionChecked: true });
      },

      initializeAuth: () => {
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          async (event, session) => {
            if (event === 'SIGNED_IN') {
              // Solo en SIGNED_IN (no en TOKEN_REFRESHED para evitar peticiones repetidas)
              if (session) {
                await storeSession(session);
                // Resetear flags al iniciar sesión
                sessionLoadAttempted = false;
                
                // Obtener el rol del perfil
                try {
                  const { data: profile } = await supabase
                    .from('profiles')
                    .select('role')
                    .eq('id', session.user.id)
                    .single();
                  
                  const userRole = profile?.role as Role || null;
                  set({ 
                    user: session.user, 
                    session, 
                    role: userRole,
                    isLoading: false, 
                    sessionChecked: false 
                  });
                } catch (profileError) {
                  console.warn('⚠️ Error al obtener perfil, continuando sin rol:', profileError);
                  set({ 
                    user: session.user, 
                    session, 
                    isLoading: false, 
                    sessionChecked: false 
                  });
                }
              }
            } else if (event === 'SIGNED_OUT') {
              await storeSession(null);
              // Resetear flags al cerrar sesión
              sessionLoadAttempted = false;
              set({ user: null, session: null, isLoading: false, role: null, sessionChecked: true });
            }
            // NO manejar TOKEN_REFRESHED para evitar peticiones automáticas repetidas
          }
        );

        return () => {
          subscription?.unsubscribe();
        };
      },
    }),
    {
      name: 'movi-auth',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        role: state.role,
        sessionChecked: state.sessionChecked, // Persistir el flag de verificación
      }),
    }
  )
);
