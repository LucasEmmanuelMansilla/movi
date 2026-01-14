import { api } from '../../lib/api';

export interface DriverTransfer {
  id: string;
  amount: number;
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  transfer_method: string;
  transferred_at: string | null;
  created_at: string;
  notes: string | null;
  payment?: {
    shipment_id: string;
    amount: number;
  };
}

export interface DriverStats {
  total: number;
  pending: number;
  completed: number;
  failed: number;
  totalAmount: number;
  pendingAmount: number;
  completedAmount: number;
}

export async function getDriverTransfers() {
  return api<DriverTransfer[]>('/driver-transfers');
}

export async function getDriverStats() {
  return api<DriverStats>('/driver-transfers/stats');
}

export async function withdrawFunds() {
  return api<{ success: boolean; amount: number; message: string }>('/driver-transfers/withdraw', {
    method: 'POST'
  });
}
