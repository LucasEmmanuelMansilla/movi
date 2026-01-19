import { useEffect, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuthStore } from '../../store/useAuthStore';
import { pushNotificationEmitter } from '../push/eventEmitter';
import { LOCATION_EVENTS } from './locationEvents';
import {
  DRIVER_AVAILABLE_STORAGE_KEY,
  setDriverAvailableFlag,
  startBackgroundLocationTracking,
  stopBackgroundLocationTracking,
} from './backgroundLocation';
import { getMyProfile } from '../profile/service';

async function readAvailabilityFromStorage(): Promise<boolean> {
  try {
    const raw = await AsyncStorage.getItem(DRIVER_AVAILABLE_STORAGE_KEY);
    if (raw === null) return true;
    return JSON.parse(raw) === true;
  } catch {
    return true;
  }
}

/**
 * Maneja el tracking de ubicación en background para drivers.
 * - Solo activo cuando el driver está marcado como disponible.
 * - Se detiene al cerrar sesión o si deja de ser driver.
 */
export function useDriverBackgroundLocation() {
  const { session, role, status } = useAuthStore();
  const startedRef = useRef(false);

  useEffect(() => {
    if (status !== 'authenticated') return;
    if (!session?.user?.id) return;

    let cancelled = false;

    const ensure = async () => {
      if (role !== 'driver') {
        await stopBackgroundLocationTracking();
        startedRef.current = false;
        return;
      }

      // Intentar sincronizar disponibilidad desde backend (best-effort)
      try {
        const p = await getMyProfile();
        if (p?.role === 'driver' && typeof (p as any).is_available === 'boolean') {
          await setDriverAvailableFlag(Boolean((p as any).is_available));
        }
      } catch {
        // ignore: seguimos con storage
      }

      const isAvailable = await readAvailabilityFromStorage();
      if (cancelled) return;

      if (isAvailable) {
        const res = await startBackgroundLocationTracking();
        if (cancelled) return;
        startedRef.current = res.ok;
      } else {
        await stopBackgroundLocationTracking();
        startedRef.current = false;
      }
    };

    ensure();

    const onAvailability = async (evt: any) => {
      const isAvailable = Boolean(evt?.isAvailable);
      await setDriverAvailableFlag(isAvailable);
      if (role !== 'driver') return;

      if (isAvailable) {
        const res = await startBackgroundLocationTracking();
        startedRef.current = res.ok;
      } else {
        await stopBackgroundLocationTracking();
        startedRef.current = false;
      }
    };

    pushNotificationEmitter.on(LOCATION_EVENTS.DRIVER_AVAILABILITY_CHANGED, onAvailability);

    return () => {
      cancelled = true;
      pushNotificationEmitter.off(LOCATION_EVENTS.DRIVER_AVAILABILITY_CHANGED, onAvailability);
      // Si se desmonta por logout/cambio de rol, detener
      stopBackgroundLocationTracking().catch(() => {});
      startedRef.current = false;
    };
  }, [session?.user?.id, role, status]);
}

