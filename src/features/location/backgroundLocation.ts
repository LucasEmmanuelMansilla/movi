import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import { Platform } from 'react-native';
import { updateDriverLocation } from '../profile/service';

export const BACKGROUND_LOCATION_TASK = 'movi-background-location';
export const DRIVER_AVAILABLE_STORAGE_KEY = 'driver_is_available';

type LocationTaskData = {
  locations?: Array<{
    coords?: {
      latitude: number;
      longitude: number;
    };
  }>;
};

async function isDriverAvailable(): Promise<boolean> {
  try {
    const raw = await AsyncStorage.getItem(DRIVER_AVAILABLE_STORAGE_KEY);
    if (raw === null) return true; // default conservador
    return JSON.parse(raw) === true;
  } catch {
    return true;
  }
}

export async function setDriverAvailableFlag(isAvailable: boolean) {
  try {
    await AsyncStorage.setItem(DRIVER_AVAILABLE_STORAGE_KEY, JSON.stringify(Boolean(isAvailable)));
  } catch {
    // ignore
  }
}

export function ensureBackgroundLocationTaskDefined() {
  if (TaskManager.isTaskDefined(BACKGROUND_LOCATION_TASK)) return;

  TaskManager.defineTask(BACKGROUND_LOCATION_TASK, async ({ data, error }) => {
    if (error) return;
    const available = await isDriverAvailable();
    if (!available) return;

    const typed = data as LocationTaskData | undefined;
    const loc = typed?.locations?.[0];
    const lat = loc?.coords?.latitude;
    const lng = loc?.coords?.longitude;
    if (typeof lat !== 'number' || typeof lng !== 'number') return;

    try {
      await updateDriverLocation(lat, lng);
    } catch {
      // No romper el task por errores de red/autenticación
    }
  });
}

export async function startBackgroundLocationTracking() {
  ensureBackgroundLocationTaskDefined();

  const fg = await Location.requestForegroundPermissionsAsync();
  if (fg.status !== Location.PermissionStatus.GRANTED) {
    return { ok: false as const, reason: 'foreground_permission_denied' as const };
  }

  // Background permission (requerido por el objetivo)
  const bg = await Location.requestBackgroundPermissionsAsync();
  if (bg.status !== Location.PermissionStatus.GRANTED) {
    return { ok: false as const, reason: 'background_permission_denied' as const };
  }

  const started = await Location.hasStartedLocationUpdatesAsync(BACKGROUND_LOCATION_TASK);
  if (started) return { ok: true as const };

  await Location.startLocationUpdatesAsync(BACKGROUND_LOCATION_TASK, {
    accuracy: Location.Accuracy.Balanced,
    timeInterval: 60_000, // 60s
    distanceInterval: 150, // ~150m
    deferredUpdatesInterval: 60_000,
    pausesUpdatesAutomatically: true,
    showsBackgroundLocationIndicator: Platform.OS === 'ios',
    // Android: requiere servicio en primer plano para estabilidad
    foregroundService: Platform.OS === 'android'
      ? {
          notificationTitle: 'Movi',
          notificationBody: 'Actualizando ubicación para envíos cercanos',
        }
      : undefined,
  });

  return { ok: true as const };
}

export async function stopBackgroundLocationTracking() {
  ensureBackgroundLocationTaskDefined();
  try {
    const started = await Location.hasStartedLocationUpdatesAsync(BACKGROUND_LOCATION_TASK);
    if (!started) return;
    await Location.stopLocationUpdatesAsync(BACKGROUND_LOCATION_TASK);
  } catch (e) {
    // Si la tarea nunca fue registrada (ej. primera apertura, reinstalación), el nativo
    // lanza TaskNotFoundException al intentar desregistrar. Ignorar para no romper la app.
    const msg = e instanceof Error ? e.message : String(e);
    if (!msg.includes('TaskNotFoundException') && !msg.includes('not found')) {
      throw e;
    }
  }
}

