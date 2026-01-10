import { api } from '../../lib/api';

export type MercadoPagoOAuthStatus = {
  connected: boolean;
  mp_user_id: string | null;
  mp_status: string | null;
  token_expired: boolean;
  expires_at: string | null;
};

export type ConnectOAuthRequest = {
  mp_user_id: number;
  access_token: string;
  refresh_token: string;
  expires_in: number;
};

/**
 * Obtiene el estado de la conexión de Mercado Pago del usuario
 */
export async function getMercadoPagoStatus(): Promise<MercadoPagoOAuthStatus> {
  return api<MercadoPagoOAuthStatus>('/mp/oauth/status');
}

/**
 * Guarda los tokens de OAuth en el perfil del usuario
 */
export async function connectMercadoPago(request: ConnectOAuthRequest): Promise<{ success: boolean; mp_user_id?: string; mp_status?: string }> {
  return api<{ success: boolean; mp_user_id?: string; mp_status?: string }>('/mp/oauth/connect', {
    method: 'POST',
    body: JSON.stringify(request),
  });
}

/**
 * Refresca el access_token de Mercado Pago
 */
export async function refreshMercadoPagoToken(): Promise<{ success: boolean; expires_in?: number }> {
  return api<{ success: boolean; expires_in?: number }>('/mp/oauth/refresh', {
    method: 'POST',
  });
}

/**
 * Realiza una transferencia a un driver
 */
export async function transferToDriver(payload: {
  driver_id: string;
  amount: number;
  description?: string;
  payment_id?: string;
}) {
  return api<{ success: boolean; transfer: any }>('/mp/transfers', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

/**
 * Obtiene la URL de OAuth de Mercado Pago desde el backend
 */
export async function getMercadoPagoOAuthUrl(): Promise<string> {
  const response = await api<{ oauth_url: string }>('/mp/oauth/url');
  return response.oauth_url;
}
