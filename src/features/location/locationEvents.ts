import { pushNotificationEmitter } from '../push/eventEmitter';

export const LOCATION_EVENTS = {
  DRIVER_AVAILABILITY_CHANGED: 'DRIVER_AVAILABILITY_CHANGED',
} as const;

export function emitDriverAvailabilityChanged(isAvailable: boolean) {
  pushNotificationEmitter.emit(LOCATION_EVENTS.DRIVER_AVAILABILITY_CHANGED, { isAvailable });
}

