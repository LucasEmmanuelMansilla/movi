import { supabase } from '../../lib/supabase';
import { api } from '../../lib/api';
import { Message } from './types';

export const chatService = {
    async getShipmentParticipants(shipmentId: string) {
        const { data: shipment, error } = await supabase
            .from('shipments')
            .select('created_by, driver_assignments(driver_id)')
            .eq('id', shipmentId)
            .single();

        if (error) throw error;
        
        const driverAssignments = shipment.driver_assignments as any;
        const driverId = Array.isArray(driverAssignments)
            ? driverAssignments[0]?.driver_id
            : driverAssignments?.driver_id;

        return {
            businessId: shipment.created_by,
            driverId: driverId
        };
    },

    async getMessages(shipmentId: string) {
        const { data: messages, error } = await supabase
            .from('messages')
            .select('*')
            .eq('shipment_id', shipmentId)
            .order('created_at', { ascending: true });

        if (error) throw error;
        return messages as Message[];
    },

    async sendMessage(shipmentId: string, receiverId: string, content: string) {
        return api('/chat/send', {
            method: 'POST',
            body: JSON.stringify({
                shipment_id: shipmentId,
                receiver_id: receiverId,
                content: content,
            }),
        });
    },

    async markAsRead(shipmentId: string, senderId: string) {
        return api('/chat/read', {
            method: 'POST',
            body: JSON.stringify({ 
                shipment_id: shipmentId, 
                sender_id: senderId 
            }),
        }).catch(err => {
            console.warn('[ChatService] Error marking as read:', err);
        });
    }
};
