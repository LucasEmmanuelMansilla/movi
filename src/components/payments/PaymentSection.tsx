import React, { useEffect, useState, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../store/useAuthStore';
import { createPayment, getPaymentByShipment, type Payment, type PaymentStatus } from '../../features/payments/service';
import { colors, spacing, radii } from '../../ui/theme';
import { getErrorMessage } from '../../utils/errorHandler';
import { openBrowserAsync, WebBrowserPresentationStyle } from 'expo-web-browser';

interface PaymentSectionProps {
  shipmentId: string;
  price: number | null;
  onPaymentStatusChange?: (status: PaymentStatus) => void;
}

const translateStatus = (status: PaymentStatus): string => {
  const statusMap: Record<PaymentStatus, string> = {
    pending: 'Pendiente',
    approved: 'Aprobado',
    cancelled: 'Cancelado',
    refunded: 'Reembolsado',
  };
  return statusMap[status] || status;
};

const getStatusColor = (status: PaymentStatus): string => {
  const colorMap: Record<PaymentStatus, string> = {
    pending: '#F59E0B',
    approved: '#10B981',
    cancelled: '#EF4444',
    refunded: '#6B7280',
  };
  return colorMap[status] || colors.muted;
};

const getStatusIcon = (status: PaymentStatus): keyof typeof Ionicons.glyphMap => {
  const iconMap: Record<PaymentStatus, keyof typeof Ionicons.glyphMap> = {
    pending: 'time-outline',
    approved: 'checkmark-circle-outline',
    cancelled: 'close-circle-outline',
    refunded: 'arrow-undo-outline',
  };
  return iconMap[status] || 'help-circle-outline';
};

export function PaymentSection({ shipmentId, price, onPaymentStatusChange }: PaymentSectionProps) {
  const { user } = useAuthStore();
  const [payment, setPayment] = useState<Payment | null>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [processing, setProcessing] = useState(false);
  const linkingListenerRef = useRef<{ remove: () => void } | null>(null);

  const loadPayment = useCallback(async () => {
    try {
      setLoading(true);
      const paymentData = await getPaymentByShipment(shipmentId);
      setPayment(paymentData);
      if (paymentData && onPaymentStatusChange) {
        onPaymentStatusChange(paymentData.status);
      }
    } catch (error) {
      console.error('Error cargando pago:', error);
    } finally {
      setLoading(false);
    }
  }, [shipmentId, onPaymentStatusChange]);

  useEffect(() => {
    if (price && price > 0) {
      loadPayment();
    }
  }, [price, loadPayment]);

  // Listener para deep links de retorno del checkout
  useEffect(() => {
    const handleDeepLink = async (event: { url: string }) => {
      const url = event.url;
      
      // Verificar si es un deep link de pago
      if (url.includes('/payments/success') || 
          url.includes('/payments/failure') || 
          url.includes('/payments/pending')) {
        
        // Extraer shipment_id de la URL
        const urlObj = new URL(url);
        const shipmentIdParam = urlObj.searchParams.get('shipment_id');
        
        // Solo procesar si es el shipment_id correcto
        if (shipmentIdParam === shipmentId) {
          console.log('Deep link de pago recibido', { url, shipmentId: shipmentIdParam });
          
          // Re-fetch payment desde el backend (fuente de verdad)
          // Esperar un momento para que el webhook haya procesado
          setTimeout(async () => {
            try {
              await loadPayment();
            } catch (error) {
              console.error('Error recargando pago después de deep link:', error);
            }
          }, 2000); // 2 segundos para dar tiempo al webhook
        }
      }
    };

    // Agregar listener
    const subscription = Linking.addEventListener('url', handleDeepLink);
    linkingListenerRef.current = subscription;

    // También verificar si la app se abrió con un deep link (app ya estaba cerrada)
    Linking.getInitialURL().then((url) => {
      if (url) {
        handleDeepLink({ url });
      }
    });

    // Cleanup
    return () => {
      if (linkingListenerRef.current) {
        linkingListenerRef.current.remove();
      }
    };
  }, [shipmentId]);

  const handleCreatePayment = async () => {
    if (!user?.email) {
      Alert.alert('Error', 'No se encontró tu correo electrónico. Por favor inicia sesión nuevamente.');
      return;
    }

    try {
      setCreating(true);
      const response = await createPayment({
        shipmentId,
        payerEmail: user.email,
        payerName: user.fullName || undefined,
      });

      // Abrir el checkout de Mercado Pago usando Linking (NO WebView)
      setProcessing(true);
      // Usar checkoutUrl que viene del backend (ya seleccionado según entorno)
      const checkoutUrl = response.checkoutUrl || response.sandboxInitPoint || response.initPoint;
      console.log("🚀 ~ handleCreatePayment ~ checkoutUrl:", checkoutUrl)
      
      if (!checkoutUrl) {
        throw new Error('No se recibió URL de checkout');
      }

      // Abrir en un WebView dentro de la app (no navegador externo)
      // Esto permite que los deep links funcionen correctamente
      const canOpen = await openBrowserAsync(checkoutUrl, {
        presentationStyle: WebBrowserPresentationStyle.FULL_SCREEN,
        // Habilitar que los deep links funcionen
        enableBarCollapsing: false,
        // Controlar el comportamiento de los redirects
        controlsColor: colors.accent,
      });
      
      if (!canOpen) {
        throw new Error('No se puede abrir la URL de checkout');
      }

    } catch (error: any) {
      const errorMessage = getErrorMessage(error);
      Alert.alert('Error al crear el pago', errorMessage);
    } finally {
      setCreating(false);
      setProcessing(false);
    }
  };

  // Si el envío no tiene precio, no mostrar nada
  if (!price || price <= 0) {
    return null;
  }

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="small" color={colors.accent} />
        <Text style={styles.loadingText}>Cargando información de pago...</Text>
      </View>
    );
  }

  // Si no hay pago aún, mostrar botón para crear uno
  if (!payment) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Ionicons name="card-outline" size={24} color={colors.accent} />
          <Text style={styles.title}>Pago requerido</Text>
        </View>
        <View style={styles.content}>
          <Text style={styles.amount}>${price.toFixed(2)}</Text>
          <Text style={styles.description}>
            Para que un conductor acepte tu envío, primero debes realizar el pago.
          </Text>
          <TouchableOpacity
            style={[styles.button, (creating || processing) && styles.buttonDisabled]}
            onPress={handleCreatePayment}
            disabled={creating || processing}
          >
            {creating || processing ? (
              <>
                <ActivityIndicator size="small" color="#FFFFFF" style={styles.buttonLoader} />
                <Text style={styles.buttonText}>
                  {creating ? 'Preparando pago...' : 'Procesando pago...'}
                </Text>
              </>
            ) : (
              <>
                <Ionicons name="card" size={20} color="#FFFFFF" style={styles.buttonIcon} />
                <Text style={styles.buttonText}>Pagar con Mercado Pago</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Si hay pago, mostrar su estado
  const statusColor = getStatusColor(payment.status);
  const statusIcon = getStatusIcon(payment.status);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="card-outline" size={24} color={colors.accent} />
        <Text style={styles.title}>Estado del pago</Text>
      </View>
      <View style={styles.content}>
        <View style={styles.statusContainer}>
          <View style={[styles.statusBadge, { backgroundColor: `${statusColor}15` }]}>
            <Ionicons name={statusIcon} size={20} color={statusColor} />
            <Text style={[styles.statusText, { color: statusColor }]}>
              {translateStatus(payment.status)}
            </Text>
          </View>
        </View>
        
        <View style={styles.detailsContainer}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Monto total:</Text>
            <Text style={styles.detailValue}>${payment.amount.toFixed(2)}</Text>
          </View>
          {payment.commission_amount > 0 && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Comisión plataforma:</Text>
              <Text style={styles.detailValue}>${payment.commission_amount.toFixed(2)}</Text>
            </View>
          )}
          {payment.driver_amount > 0 && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Monto para conductor:</Text>
              <Text style={styles.detailValue}>${payment.driver_amount.toFixed(2)}</Text>
            </View>
          )}
        </View>

        {payment.status === 'pending' && (
          <View style={styles.pendingInfo}>
            <Ionicons name="information-circle-outline" size={18} color="#F59E0B" />
            <Text style={styles.pendingText}>
              Tu pago está siendo procesado. Recibirás una notificación cuando sea aprobado.
            </Text>
          </View>
        )}

        {payment.status === 'approved' && (
          <View style={styles.approvedInfo}>
            <Ionicons name="checkmark-circle-outline" size={18} color="#10B981" />
            <Text style={styles.approvedText}>
              Pago aprobado. Los conductores ahora pueden aceptar tu envío.
            </Text>
          </View>
        )}

        {payment.status === 'cancelled' && (
          <TouchableOpacity
            style={styles.button}
            onPress={handleCreatePayment}
            disabled={creating || processing}
          >
            {creating || processing ? (
              <>
                <ActivityIndicator size="small" color="#FFFFFF" style={styles.buttonLoader} />
                <Text style={styles.buttonText}>Preparando nuevo pago...</Text>
              </>
            ) : (
              <>
                <Ionicons name="refresh" size={20} color="#FFFFFF" style={styles.buttonIcon} />
                <Text style={styles.buttonText}>Intentar pagar nuevamente</Text>
              </>
            )}
          </TouchableOpacity>
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
  content: {
    gap: spacing.md,
  },
  amount: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.text,
  },
  description: {
    fontSize: 14,
    color: colors.muted,
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
  pendingInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FEF3C7',
    padding: spacing.md,
    borderRadius: radii.sm,
    gap: spacing.sm,
  },
  pendingText: {
    flex: 1,
    fontSize: 14,
    color: '#92400E',
    lineHeight: 20,
  },
  approvedInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#D1FAE5',
    padding: spacing.md,
    borderRadius: radii.sm,
    gap: spacing.sm,
  },
  approvedText: {
    flex: 1,
    fontSize: 14,
    color: '#065F46',
    lineHeight: 20,
  },
  loadingText: {
    marginTop: spacing.sm,
    fontSize: 14,
    color: colors.muted,
    textAlign: 'center',
  },
});

