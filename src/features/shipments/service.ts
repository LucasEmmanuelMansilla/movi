import { api } from '../../lib/api';
import type { LocationPayload } from '../../hooks/useLocationPicker';

export type Shipment = {
  id: string;
  title: string;
  description: string | null;
  pickup_address: string;
  dropoff_address: string;
  price: number | null;
  current_status: 'created' | 'assigned' | 'picked_up' | 'in_transit' | 'delivered' | 'cancelled';
  created_at: string;
  created_by: string;
};

export async function createShipment(payload: {
  title: string;
  description?: string;
  pickup_address: string;
  dropoff_address: string;
  price?: number;
  images?: string[]; // Array de imágenes en base64
  location?: LocationPayload;
}) {
  return api<Shipment>('/shipments', { method: 'POST', body: JSON.stringify(payload) });
}

export async function listShipments(scope?: 'available' | 'mine') {
  const qs = scope ? `?scope=${scope}` : '';
  return api<Shipment[]>(`/shipments${qs}`);
}

export async function acceptShipment(id: string) {
  return api(`/shipments/${id}/accept`, { method: 'POST' });
}

export async function updateShipmentStatus(id: string, status: 'picked_up' | 'in_transit' | 'delivered' | 'cancelled', note?: string) {
  return api(`/shipments/${id}/status`, { method: 'POST', body: JSON.stringify({ status, note }) });
}

export type ShipmentStatusRow = {
  id: string;
  shipment_id: string;
  status: Shipment['current_status'];
  note: string | null;
  created_by: string;
  created_at: string;
};

export async function listShipmentStatuses(id: string) {
  return api<ShipmentStatusRow[]>(`/shipments/${id}/statuses`);
}

export async function getShipmentById(id: string) {
  // Obtener el envío desde la lista de "mine" para asegurar permisos
  const shipments = await api<Shipment[]>(`/shipments?scope=mine`);
  const shipment = shipments.find(s => s.id === id);
  if (!shipment) {
    throw new Error('Envío no encontrado');
  }
  return shipment;
}