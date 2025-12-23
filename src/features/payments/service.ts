import { api } from '../../lib/api';

export type PaymentStatus = 'pending' | 'approved' | 'cancelled' | 'refunded';

export type Payment = {
  id: string;
  shipment_id: string;
  payer_id: string;
  driver_id: string | null;
  status: PaymentStatus;
  amount: number;
  commission_amount: number;
  driver_amount: number;
  preference_id: string | null;
  payment_id: string | null;
  paid_at: string | null;
  created_at: string;
  updated_at: string;
};

export type CreatePaymentRequest = {
  shipmentId: string;
  payerEmail: string;
  payerName?: string;
};

export type CreatePaymentResponse = {
  paymentId: string;
  preferenceId: string;
  initPoint: string;
  sandboxInitPoint: string;
  checkoutUrl: string; // URL correcta según entorno (sandbox o prod)
};

/**
 * Crea una preferencia de pago para un envío
 */
export async function createPayment(request: CreatePaymentRequest): Promise<CreatePaymentResponse> {
  return api<CreatePaymentResponse>('/payments/create', {
    method: 'POST',
    body: JSON.stringify({
      shipmentId: request.shipmentId,
      payerEmail: request.payerEmail,
      payerName: request.payerName,
    }),
  });
}

/**
 * Obtiene el estado del pago de un envío
 */
export async function getPaymentByShipment(shipmentId: string): Promise<Payment | null> {
  try {
    return await api<Payment>(`/payments/shipment/${shipmentId}`);
  } catch (error: any) {
    // Si el pago no existe, retornar null en lugar de lanzar error
    if (error.statusCode === 404) {
      return null;
    }
    throw error;
  }
}

