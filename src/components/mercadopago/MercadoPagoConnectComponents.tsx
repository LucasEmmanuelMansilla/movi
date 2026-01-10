import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radii } from '../../ui/theme';
import { type MercadoPagoOAuthStatus } from '../../features/mercadopago/service';

// --- Loading State ---
export const MPConectionLoading = () => (
  <View style={styles.loadingContainer}>
    <ActivityIndicator size="small" color={colors.accent} />
    <Text style={styles.loadingText}>Cargando estado de Mercado Pago...</Text>
  </View>
);

// --- Header ---
export const MPConectionHeader = ({ isConnected }: { isConnected: boolean }) => (
  <View style={styles.header}>
    <Ionicons 
      name={isConnected ? "checkmark-circle" : "wallet-outline"} 
      size={24} 
      color={isConnected ? colors.success : colors.accent} 
    />
    <Text style={styles.title}>Mercado Pago</Text>
  </View>
);

// --- Status Info ---
export const ConnectedStatus = ({ status, isExpired, connecting, onConnect }: { 
  status: MercadoPagoOAuthStatus, 
  isExpired: boolean, 
  connecting: boolean,
  onConnect: () => void 
}) => (
  <>
    <View style={styles.statusContainer}>
      <View style={[styles.statusBadge, { backgroundColor: '#D1FAE5' }]}>
        <Ionicons name="checkmark-circle" size={20} color={colors.success} />
        <Text style={[styles.statusText, { color: '#065F46' }]}>
          Conectado
        </Text>
      </View>
    </View>

    {isExpired && (
      <View style={styles.warningInfo}>
        <Ionicons name="warning-outline" size={18} color={colors.warning} />
        <Text style={styles.warningText}>
          Tu token de acceso ha expirado. Por favor, reconecta tu cuenta.
        </Text>
      </View>
    )}

    <View style={styles.detailsContainer}>
      <View style={styles.detailRow}>
        <Text style={styles.detailLabel}>Usuario ID:</Text>
        <Text style={styles.detailValue}>{status.mp_user_id || 'N/A'}</Text>
      </View>
      {status.expires_at && (
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Token expira:</Text>
          <Text style={styles.detailValue}>
            {new Date(status.expires_at).toLocaleDateString('es-AR')}
          </Text>
        </View>
      )}
    </View>

    <TouchableOpacity
      style={[styles.button, styles.buttonSecondary]}
      onPress={onConnect}
      disabled={connecting}
    >
      {connecting ? (
        <>
          <ActivityIndicator size="small" color={colors.accent} style={styles.buttonLoader} />
          <Text style={[styles.buttonText, { color: colors.accent }]}>
            Reconectando...
          </Text>
        </>
      ) : (
        <>
          <Ionicons name="refresh" size={20} color={colors.accent} style={styles.buttonIcon} />
          <Text style={[styles.buttonText, { color: colors.accent }]}>
            Reconectar cuenta
          </Text>
        </>
      )}
    </TouchableOpacity>
  </>
);

export const DisconnectedStatus = ({ connecting, onConnect }: { 
  connecting: boolean, 
  onConnect: () => void 
}) => (
  <>
    <View style={styles.infoContainer}>
      <Text style={styles.infoText}>
        Conecta tu cuenta de Mercado Pago para recibir pagos directamente en tu cuenta.
      </Text>
      <Text style={styles.infoSubtext}>
        No necesitas proporcionar datos bancarios. Mercado Pago maneja todo el proceso de verificación.
      </Text>
    </View>

    <TouchableOpacity
      style={[styles.button, connecting && styles.buttonDisabled]}
      onPress={onConnect}
      disabled={connecting}
    >
      {connecting ? (
        <>
          <ActivityIndicator size="small" color="#FFFFFF" style={styles.buttonLoader} />
          <Text style={styles.buttonText}>
            Conectando...
          </Text>
        </>
      ) : (
        <>
          <Ionicons name="wallet" size={20} color="#FFFFFF" style={styles.buttonIcon} />
          <Text style={styles.buttonText}>Conectar Mercado Pago</Text>
        </>
      )}
    </TouchableOpacity>
  </>
);

const styles = StyleSheet.create({
  loadingContainer: {
    padding: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: spacing.sm,
    fontSize: 14,
    color: colors.muted,
    textAlign: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  statusContainer: {
    marginBottom: spacing.sm,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.sm,
    gap: spacing.sm,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  detailsContainer: {
    backgroundColor: colors.background,
    borderRadius: radii.sm,
    padding: spacing.md,
    gap: spacing.xs,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 14,
    color: colors.muted,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  infoContainer: {
    gap: spacing.xs,
  },
  infoText: {
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
  },
  infoSubtext: {
    fontSize: 12,
    color: colors.muted,
    lineHeight: 18,
    marginTop: spacing.xs,
  },
  warningInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FEF3C7',
    padding: spacing.md,
    borderRadius: radii.sm,
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  warningText: {
    flex: 1,
    fontSize: 14,
    color: '#92400E',
    lineHeight: 20,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.accent,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.sm,
    gap: spacing.sm,
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
    marginTop: spacing.sm,
  },
  buttonSecondary: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.accent,
    shadowOpacity: 0,
    elevation: 0,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonIcon: {
    marginRight: spacing.xs,
  },
  buttonLoader: {
    marginRight: spacing.xs,
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 16,
  },
});
