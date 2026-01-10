import { Ionicons } from '@expo/vector-icons';

export const SHIPMENT_STATUS_MAP: Record<string, string> = {
  draft: 'Borrador (Requiere pago)',
  created: 'Creado',
  assigned: 'Asignado',
  picked_up: 'Recogido',
  in_transit: 'En tránsito',
  delivered: 'Entregado',
  cancelled: 'Cancelado',
};

export const TRANSFER_STATUS_MAP: Record<string, string> = {
  completed: 'Completado',
  pending: 'Pendiente',
  failed: 'Fallido',
};

export const translateStatus = (status: string): string => {
  return SHIPMENT_STATUS_MAP[status] || TRANSFER_STATUS_MAP[status] || status;
};

export const getStatusIcon = (status: string): keyof typeof Ionicons.glyphMap => {
  const iconMap: Record<string, keyof typeof Ionicons.glyphMap> = {
    created: 'create-outline',
    assigned: 'person-add-outline',
    picked_up: 'checkmark-circle-outline',
    in_transit: 'car-outline',
    delivered: 'checkmark-done-circle-outline',
    cancelled: 'close-circle-outline',
  };
  return iconMap[status] || 'ellipse-outline';
};

export const getStatusColor = (status: string) => {
  const colorMap: Record<string, string> = {
    created: '#1E40AF',
    assigned: '#92400E',
    picked_up: '#065F46',
    in_transit: '#3730A3',
    delivered: '#065F46',
    cancelled: '#991B1B',
  };
  return colorMap[status] || '#6B7280';
};

export const NEXT_STATES: Record<string, string[]> = {
  assigned: ['picked_up', 'cancelled'],
  picked_up: ['in_transit', 'cancelled'],
  in_transit: ['delivered', 'cancelled'],
  created: ['cancelled'],
  delivered: [],
  cancelled: [],
};

/**
 * Parsea una dirección que puede estar en formato string plano o JSON con coordenadas
 */
export const formatAddress = (address: string): string => {
  if (!address) return '';
  try {
    const parsed = JSON.parse(address);
    if (typeof parsed === 'object' && parsed.address) {
      return parsed.address;
    }
  } catch (e) {
    // No es JSON, devolver el string original
  }
  return address;
};