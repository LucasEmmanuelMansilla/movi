import { useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/useAuthStore';
import { pushNotificationEmitter } from '../push/eventEmitter';
import { PUSH_EVENTS } from '../push/usePushNotifications';

type BroadcastPayload = {
  payload?: any;
  event?: string;
  type?: string;
};

/**
 * Suscribe a eventos realtime (Supabase broadcast) por usuario.
 * Se integra al mismo event bus de push para reutilizar listeners existentes.
 */
export function useRealtimeBroadcasts() {
  const { session } = useAuthStore();
  const subscribedForUserRef = useRef<string | null>(null);

  useEffect(() => {
    const userId = session?.user?.id;
    if (!userId) return;

    // Evitar suscripciones duplicadas por re-render
    if (subscribedForUserRef.current === userId) return;
    subscribedForUserRef.current = userId;

    const channel = supabase
      .channel(`user:${userId}`)
      .on('broadcast', { event: 'new_shipment_nearby' }, (msg: BroadcastPayload) => {
        const p = (msg as any)?.payload ?? {};
        pushNotificationEmitter.emit(PUSH_EVENTS.NEW_SHIPMENT, {
          title: 'Nuevo envío disponible',
          body: p.title ? String(p.title) : '',
          data: {
            shipmentId: p.shipmentId,
            type: 'new_shipment_nearby',
          },
        });
      })
      .on('broadcast', { event: 'shipment_status_changed' }, (msg: BroadcastPayload) => {
        const p = (msg as any)?.payload ?? {};
        pushNotificationEmitter.emit(PUSH_EVENTS.SHIPMENT_STATUS_CHANGED, {
          title: 'Actualización de envío',
          body: p.status ? String(p.status) : '',
          data: {
            shipmentId: p.shipmentId,
            status: p.status,
            type: 'shipment_status_changed',
          },
        });
      })
      .subscribe();

    return () => {
      subscribedForUserRef.current = null;
      supabase.removeChannel(channel);
    };
  }, [session?.user?.id]);
}

