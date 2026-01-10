import React from 'react';
import { View, StyleSheet } from 'react-native';
import { colors, spacing, radii } from '../../ui/theme';
import { type MercadoPagoOAuthStatus } from '../../features/mercadopago/service';
import { useMercadoPagoConnectLogic } from '../../hooks/mercadopago/useMercadoPagoConnectLogic';
import { 
  MPConectionLoading, 
  MPConectionHeader, 
  ConnectedStatus, 
  DisconnectedStatus 
} from './MercadoPagoConnectComponents';

interface MercadoPagoConnectProps {
  onStatusChange?: (status: MercadoPagoOAuthStatus) => void;
}

/**
 * Componente para gestionar la conexión con Mercado Pago OAuth.
 * Permite a los conductores conectar su cuenta para recibir pagos.
 */
export function MercadoPagoConnect({ onStatusChange }: MercadoPagoConnectProps) {
  const {
    status,
    loading,
    connecting,
    handleConnect,
  } = useMercadoPagoConnectLogic({ onStatusChange });

  if (loading) {
    return (
      <View style={styles.container}>
        <MPConectionLoading />
      </View>
    );
  }

  if (!status) {
    return null;
  }

  const isConnected = status.connected && status.mp_status === 'connected';
  const isExpired = status.token_expired;

  return (
    <View style={styles.container}>
      <MPConectionHeader isConnected={isConnected} />

      <View style={styles.content}>
        {isConnected ? (
          <ConnectedStatus 
            status={status} 
            isExpired={isExpired} 
            connecting={connecting} 
            onConnect={handleConnect} 
          />
        ) : (
          <DisconnectedStatus 
            connecting={connecting} 
            onConnect={handleConnect} 
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    borderRadius: radii.md,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  content: {
    gap: spacing.md,
  },
});
