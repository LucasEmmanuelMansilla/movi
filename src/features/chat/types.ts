export interface Message {
    id: string;
    shipment_id: string;
    sender_id: string;
    receiver_id: string;
    content: string;
    created_at: string;
    read_at: string | null;
}

export interface ChatParticipant {
    id: string;
    full_name: string | null;
}
