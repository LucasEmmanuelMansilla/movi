import { api } from '../../lib/api';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/useAuthStore';

export type Profile = {
  id: string;
  role: 'driver' | 'business';
  full_name: string | null;
  phone: string | null;
  email: string | null;
  avatar_url: string | null;
  address: string | null;
  // Campos específicos para drivers
  license_number: string | null;
  vehicle_type: string | null;
  vehicle_plate: string | null;
  is_available: boolean | null;
  // Campos bancarios (para drivers)
  bank_account_type: 'checking' | 'savings' | 'cbu' | 'cvu' | 'alias' | null;
  bank_cbu: string | null;
  bank_cvu: string | null;
  bank_alias: string | null;
  bank_name: string | null;
  bank_account_number: string | null;
  bank_account_holder_name: string | null;
  // Campos específicos para business
  business_name: string | null;
  business_address: string | null;
  // Metadata
  created_at: string;
  updated_at: string | null;
};

export type UpdateProfileData = {
  full_name?: string;
  phone?: string;
  email?: string;
  avatar_url?: string;
  address?: string;
  // Campos específicos para drivers
  license_number?: string;
  vehicle_type?: string;
  vehicle_plate?: string;
  is_available?: boolean;
  // Campos bancarios (para drivers)
  bank_account_type?: 'checking' | 'savings' | 'cbu' | 'cvu' | 'alias';
  bank_cbu?: string;
  bank_cvu?: string;
  bank_alias?: string;
  bank_name?: string;
  bank_account_number?: string;
  bank_account_holder_name?: string;
  // Campos específicos para business
  business_name?: string;
  business_address?: string;
};

export async function getMyProfile() {
  return api<Profile>('/profile/me');
}

export async function updateMyProfile(data: UpdateProfileData) {
  return api<Profile>('/profile/me', { method: 'PUT', body: JSON.stringify(data) });
}

export async function signOutAll() {
  try {
    await supabase.auth.signOut();
  } catch {}
  useAuthStore.getState().setRole(null);
}

/**
 * Actualiza la ubicación del driver (lat/lng)
 * Solo disponible para usuarios con rol 'driver'
 */
export async function updateDriverLocation(latitude: number, longitude: number) {
  return api<{ ok: boolean }>('/profile/me/location', {
    method: 'POST',
    body: JSON.stringify({ latitude, longitude }),
  });
}