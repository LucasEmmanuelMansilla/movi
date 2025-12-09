/**
 * EventEmitter simple compatible con React Native
 * Reemplaza el módulo 'events' de Node.js que no está disponible en React Native
 */
type EventCallback = (...args: any[]) => void;

class EventEmitter {
  private events: Map<string, EventCallback[]> = new Map();

  on(event: string, callback: EventCallback): void {
    if (!this.events.has(event)) {
      this.events.set(event, []);
    }
    this.events.get(event)!.push(callback);
  }

  off(event: string, callback: EventCallback): void {
    const callbacks = this.events.get(event);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  emit(event: string, ...args: any[]): void {
    const callbacks = this.events.get(event);
    if (callbacks) {
      // Crear una copia para evitar problemas si se modifican durante la ejecución
      [...callbacks].forEach(callback => {
        try {
          callback(...args);
        } catch (error) {
          console.error(`Error en callback del evento ${event}:`, error);
        }
      });
    }
  }

  removeAllListeners(event?: string): void {
    if (event) {
      this.events.delete(event);
    } else {
      this.events.clear();
    }
  }
}

export const pushNotificationEmitter = new EventEmitter();

