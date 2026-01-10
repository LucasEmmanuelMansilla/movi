import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/useAuthStore';
import { chatService } from '../../features/chat/service';
import { Message } from '../../features/chat/types';

export function useChat(shipmentId: string) {
    const { session } = useAuthStore();
    const [messages, setMessages] = useState<Message[]>([]);
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [receiverId, setReceiverId] = useState<string | null>(null);
    const flatListRef = useRef<any>(null);

    const currentUserId = session?.user.id;

    const fetchInitialData = useCallback(async () => {
        if (!shipmentId || !currentUserId) return;

        try {
            setLoading(true);
            
            // 1. Obtener participantes y mensajes en paralelo
            const [participants, messagesData] = await Promise.all([
                chatService.getShipmentParticipants(shipmentId),
                chatService.getMessages(shipmentId)
            ]);

            // 2. Determinar quién es el receptor
            const otherUserId = currentUserId === participants.businessId 
                ? participants.driverId 
                : participants.businessId;
            
            setReceiverId(otherUserId);
            setMessages(messagesData || []);

            // 3. Marcar como leídos si hay mensajes del otro
            if (otherUserId) {
                await chatService.markAsRead(shipmentId, otherUserId);
            }
        } catch (error) {
            console.error('[useChat] Error fetching initial data:', error);
        } finally {
            setLoading(false);
            // Scroll al final después de cargar
            setTimeout(() => flatListRef.current?.scrollToEnd({ animated: false }), 200);
        }
    }, [shipmentId, currentUserId]);

    const handleNewMessage = useCallback((newMessage: Message) => {
        setMessages((prev) => {
            if (prev.some(m => m.id === newMessage.id)) return prev;
            return [...prev, newMessage];
        });

        if (newMessage.sender_id !== currentUserId) {
            chatService.markAsRead(shipmentId, newMessage.sender_id);
        }

        setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    }, [shipmentId, currentUserId]);

    const sendMessage = async (content: string) => {
        if (!content.trim() || !receiverId || sending) return;

        setSending(true);
        try {
            await chatService.sendMessage(shipmentId, receiverId, content.trim());
        } catch (error) {
            console.error('[useChat] Error sending message:', error);
            throw error;
        } finally {
            setSending(false);
        }
    };

    useEffect(() => {
        fetchInitialData();

        // Suscripción Realtime
        const subscription = supabase
            .channel(`shipment_chat:${shipmentId}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'messages',
                    filter: `shipment_id=eq.${shipmentId}`,
                },
                (payload) => {
                    handleNewMessage(payload.new as Message);
                }
            )
            .subscribe();

        return () => {
            subscription.unsubscribe();
        };
    }, [shipmentId, fetchInitialData, handleNewMessage]);

    return {
        messages,
        loading,
        sending,
        currentUserId,
        flatListRef,
        sendMessage,
        refresh: fetchInitialData
    };
}
