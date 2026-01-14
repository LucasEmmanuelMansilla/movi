import { useState, useEffect, useCallback } from 'react';
import { getDriverStats, getDriverTransfers, withdrawFunds, DriverTransfer, DriverStats } from '../../features/profile/driverService';

export function useWalletLogic() {
  const [stats, setStats] = useState<DriverStats | null>(null);
  const [transfers, setTransfers] = useState<DriverTransfer[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [statsData, transfersData] = await Promise.all([
        getDriverStats(),
        getDriverTransfers()
      ]);
      setStats(statsData);
      setTransfers(transfersData);
    } catch (error) {
      console.error('Error fetching wallet data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchData();
  }, [fetchData]);

  const withdraw = useCallback(async () => {
    try {
      setLoading(true);
      const result = await withdrawFunds();
      await fetchData();
      return result;
    } catch (error) {
      console.error('Error withdrawing funds:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [fetchData]);

  return {
    stats,
    transfers,
    loading,
    refreshing,
    onRefresh,
    fetchData,
    withdraw
  };
}
