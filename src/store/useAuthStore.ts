import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { supabase } from '../lib/supabase';
import type { Session, User as SupabaseUser } from '@supabase/supabase-js';

export type Role = 'driver' | 'business' | null;

type AuthStatus =
  | 'idle'
  | 'loading'
  | 'authenticated'
  | 'unauthenticated'
  | 'error_checked';

type AuthErrorType = 'network' | 'supabase' | 'storage' | 'unknown';

export interface AuthError {
  type: AuthErrorType;
  message: string;
}

export interface AuthProfile {
  role: Exclude<Role, null>;
  fullName?: string;
  phone?: string;
}

interface StoredSessionV1 {
  accessToken: string;
  refreshToken: string;
  expiresAt: number; // ms epoch
  userId: string;
}

export interface AuthState {
  // Canonical state
  user: SupabaseUser | null;
  session: Session | null;
  role: Role;
  profile: AuthProfile | null;
  status: AuthStatus;
  lastError: AuthError | null;

  // Back-compat (otros módulos lo usan aún)
  isLoading: boolean;

  // Actions (nuevas)
  bootstrap: () => Promise<void>;
  applySession: (session: Session | null) => Promise<void>;
  refreshProfile: (userId: string) => Promise<void>;
  startAuthListener: () => () => void;
  signOut: () => Promise<void>;

  // Actions (compat)
  setRole: (role: Role) => void;
  setSession: (session: Session | null) => Promise<void>;
  loadSession: () => Promise<void>;
  initializeAuth: () => () => void;
  resetSessionCheck: () => void;
  setUser: (user: any | null) => void;
  clearUser: () => void;
  checkAuth: () => Promise<void>;
}

const SECURE_KEY = 'movi_auth_session';
const SESSION_SKEW_MS = 30_000;
const AUTH_TIMEOUT_MS = 10_000;

function isRole(value: unknown): value is Exclude<Role, null> {
  return value === 'driver' || value === 'business';
}

function withTimeout<T>(promise: Promise<T>, ms: number, message = 'Timeout'): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error(message)), ms);
  });

  return Promise.race([promise, timeoutPromise]).finally(() => {
    if (timeoutId) clearTimeout(timeoutId);
  });
}

function getSessionExpiryMs(session: Session): number {
  // `expires_at` suele venir en segundos epoch
  if (typeof (session as any).expires_at === 'number') {
    return (session as any).expires_at * 1000;
  }
  return Date.now() + (session.expires_in || 3600) * 1000;
}

async function secureClear(): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(SECURE_KEY);
  } catch {
    // ignore
  }
}

async function secureSaveSession(session: Session): Promise<void> {
  const stored: StoredSessionV1 = {
    accessToken: session.access_token,
    refreshToken: session.refresh_token || '',
    expiresAt: getSessionExpiryMs(session),
    userId: session.user.id,
  };

  await SecureStore.setItemAsync(SECURE_KEY, JSON.stringify(stored));
}

async function secureLoadSession(): Promise<StoredSessionV1 | null> {
  let raw: string | null = null;
  try {
    raw = await SecureStore.getItemAsync(SECURE_KEY);
  } catch {
    return null;
  }
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as Partial<StoredSessionV1>;
    if (
      !parsed ||
      typeof parsed.accessToken !== 'string' ||
      typeof parsed.refreshToken !== 'string' ||
      typeof parsed.expiresAt !== 'number' ||
      typeof parsed.userId !== 'string'
    ) {
      await secureClear();
      return null;
    }
    return parsed as StoredSessionV1;
  } catch {
    await secureClear();
    return null;
  }
}

async function fetchProfileRole(userId: string): Promise<AuthProfile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('role, full_name, phone')
    .eq('id', userId)
    .single();

  if (error || !data) return null;
  if (!isRole(data.role)) return null;

  return {
    role: data.role,
    fullName: data.full_name ?? undefined,
    phone: data.phone ?? undefined,
  };
}

function profileFromMetadata(user: SupabaseUser): AuthProfile | null {
  const role = (user.user_metadata as any)?.role;
  if (!isRole(role)) return null;

  const fullName = (user.user_metadata as any)?.full_name;
  const phone = (user.user_metadata as any)?.phone;

  return {
    role,
    fullName: typeof fullName === 'string' ? fullName : undefined,
    phone: typeof phone === 'string' ? phone : undefined,
  };
}

export const useAuthStore = create<AuthState>()((set, get) => {
  // Estado interno: evita globals a nivel módulo y permite dedup/cancelación lógica
  let activeOpId = 0;
  let bootstrapPromise: Promise<void> | null = null;
  let activeAuthUnsub: (() => void) | null = null;

  const setStatus = (status: AuthStatus, lastError: AuthError | null = null) => {
    set({
      status,
      lastError,
      isLoading: status === 'idle' || status === 'loading',
    });
  };

  const applySessionInternal = async (session: Session | null, opId: number) => {
    if (session === null) {
      await secureClear();
      if (opId !== activeOpId) return;
      set({
        user: null,
        session: null,
        role: null,
        profile: null,
        lastError: null,
      });
      setStatus('unauthenticated', null);
      return;
    }

    try {
      await secureSaveSession(session);
    } catch (e: any) {
      if (opId !== activeOpId) return;
      setStatus('error_checked', { type: 'storage', message: e?.message || 'Error guardando sesión' });
      return;
    }

    const user = session.user;
    let profile = profileFromMetadata(user);
    if (!profile) {
      try {
        profile = await fetchProfileRole(user.id);
      } catch {
        // ignore: dejamos role null si falla el fetch
      }
    }

    if (opId !== activeOpId) return;

    set({
      user,
      session,
      profile,
      role: profile?.role ?? null,
      lastError: null,
    });
    setStatus('authenticated', null);
  };

  const bootstrapInternal = async (opId: number) => {
    // Terminal states: no reintentar automáticamente
    const { status } = get();
    if (status === 'authenticated' || status === 'unauthenticated' || status === 'error_checked') {
      return;
    }

    setStatus('loading', null);

    // 1) Intentar restaurar desde SecureStore (sin red)
    const stored = await secureLoadSession();
    const now = Date.now();
    const storedValid = stored && now + SESSION_SKEW_MS < stored.expiresAt;

    if (storedValid) {
      try {
        const restore = await withTimeout(
          supabase.auth.setSession({
            access_token: stored!.accessToken,
            refresh_token: stored!.refreshToken,
          }),
          AUTH_TIMEOUT_MS,
          'Auth restore timeout'
        );

        const restoredSession = restore?.data?.session ?? null;
        const restoreError = (restore as any)?.error;
        if (restoredSession && !restoreError) {
          await applySessionInternal(restoredSession, opId);
          return;
        }
      } catch {
        // No reintentar; seguir a getSession solo si aún no hay estado terminal
      }
    }

    // 2) Leer sesión desde Supabase (una sola vez)
    try {
      const res = await withTimeout(supabase.auth.getSession(), AUTH_TIMEOUT_MS, 'Auth getSession timeout');
      const session = res?.data?.session ?? null;
      const error = (res as any)?.error;

      if (error) {
        if (opId !== activeOpId) return;
        setStatus('error_checked', { type: 'supabase', message: error.message || 'Error obteniendo sesión' });
        return;
      }

      if (!session) {
        if (opId !== activeOpId) return;
        // No hay sesión: limpiar SecureStore por seguridad
        await secureClear();
        if (opId !== activeOpId) return;
        set({ user: null, session: null, role: null, profile: null, lastError: null });
        setStatus('unauthenticated', null);
        return;
      }

      await applySessionInternal(session, opId);
    } catch (e: any) {
      if (opId !== activeOpId) return;
      setStatus('error_checked', {
        type: e?.name === 'AbortError' || /network/i.test(e?.message) ? 'network' : 'unknown',
        message: e?.message || 'Error cargando sesión',
      });
    }
  };

  return {
    user: null,
    session: null,
    role: null,
    profile: null,
    status: 'idle',
    lastError: null,
    isLoading: true,

    bootstrap: async () => {
      const { status } = get();
      if (status === 'authenticated' || status === 'unauthenticated' || status === 'error_checked') return;

      if (bootstrapPromise) return bootstrapPromise;

      activeOpId += 1;
      const opId = activeOpId;
      bootstrapPromise = bootstrapInternal(opId).finally(() => {
        if (bootstrapPromise) bootstrapPromise = null;
      });

      return bootstrapPromise;
    },

    applySession: async (session) => {
      activeOpId += 1;
      const opId = activeOpId;
      setStatus(session ? 'loading' : 'unauthenticated', null);
      await applySessionInternal(session, opId);
    },

    refreshProfile: async (userId: string) => {
      activeOpId += 1;
      const opId = activeOpId;

      const current = get();
      if (!current.session || !current.user || current.user.id !== userId) return;

      // Metadata-first, luego profiles
      let profile = profileFromMetadata(current.user);
      if (!profile) {
        try {
          profile = await fetchProfileRole(userId);
        } catch {
          profile = null;
        }
      }

      if (opId !== activeOpId) return;
      set({
        profile,
        role: profile?.role ?? null,
      });
    },

    startAuthListener: () => {
      // Garantizar una sola suscripción activa
      if (activeAuthUnsub) {
        try {
          activeAuthUnsub();
        } catch {
          // ignore
        }
        activeAuthUnsub = null;
      }

      const { data } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (event === 'SIGNED_OUT') {
          // Solo invalidar si vamos a mutar estado
          activeOpId += 1;
          const opId = activeOpId;
          await applySessionInternal(null, opId);
          return;
        }

        // Eventos sin sesión (p.ej. INITIAL_SESSION null) NO deben invalidar bootstrap
        if (!session) return;

        // Solo invalidar si vamos a mutar estado
        activeOpId += 1;
        const opId = activeOpId;

        if (event === 'TOKEN_REFRESHED') {
          // Guardar tokens nuevos, pero evitar re-fetch de profile innecesario
          try {
            await secureSaveSession(session);
          } catch {
            // ignore
          }

          if (opId !== activeOpId) return;
          set({
            session,
            user: session.user,
            lastError: null,
          });
          setStatus('authenticated', null);
          return;
        }

        // SIGNED_IN / INITIAL_SESSION con sesión / otros
        await applySessionInternal(session, opId);
      });

      const unsub = () => {
        try {
          data?.subscription?.unsubscribe();
        } catch {
          // ignore
        }
      };

      activeAuthUnsub = unsub;
      return unsub;
    },

    signOut: async () => {
      activeOpId += 1;
      const opId = activeOpId;
      try {
        await supabase.auth.signOut();
      } catch {
        // ignore
      }
      await applySessionInternal(null, opId);
    },

    // Compat
    setRole: (role) => {
      const current = get();
      if (role && isRole(role)) {
        const profile: AuthProfile = { role };
        set({ role, profile: current.profile ? { ...current.profile, role } : profile });
      } else {
        set({ role: null, profile: null });
      }
    },

    setSession: async (session) => get().applySession(session),
    loadSession: async () => get().bootstrap(),
    initializeAuth: () => get().startAuthListener(),
    resetSessionCheck: () => {
      // Permite un nuevo bootstrap explícito (p.ej. después de login)
      set({ status: 'idle', lastError: null, isLoading: true });
    },

    // Legacy: preferir `applySession/bootstrap`
    setUser: (user: any | null) => {
      // Soporte para módulos antiguos: mapeamos a role/profile si existe
      if (!user) {
        set({ user: null, session: null, role: null, profile: null, lastError: null });
        setStatus('unauthenticated', null);
        return;
      }

      const role = isRole(user.role) ? (user.role as Exclude<Role, null>) : null;
      set({
        // No podemos fabricar un SupabaseUser real aquí: dejamos `user` nulo para evitar estado inconsistente.
        user: null,
        session: null,
        role,
        profile: role
          ? { role, fullName: typeof user.fullName === 'string' ? user.fullName : undefined, phone: typeof user.phone === 'string' ? user.phone : undefined }
          : null,
        lastError: null,
      });
      setStatus(role ? 'authenticated' : 'unauthenticated', null);
    },

    clearUser: () => {
      set({ user: null, session: null, role: null, profile: null, lastError: null });
      setStatus('unauthenticated', null);
    },

    checkAuth: async () => get().bootstrap(),
  };
});
