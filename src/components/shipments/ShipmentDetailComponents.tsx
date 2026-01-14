import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radii } from '../../ui/theme';
import { translateStatus, getStatusIcon, getStatusColor } from '../../utils/shipmentUtils';
import { ShipmentStatusRow } from '../../features/shipments/service';
import { useRouter } from 'expo-router';

// --- Loading State ---
export const ShipmentDetailLoading = () => (
  <View style={styles.centerContainer}>
    <ActivityIndicator size="large" color={colors.accent} />
    <Text style={styles.loadingText}>Cargando detalle del envío...</Text>
  </View>
);

// --- Header Component ---
interface DetailHeaderProps {
  currentStatus: string;
}

export const DetailHeader: React.FC<DetailHeaderProps> = ({ currentStatus }) => (
  <View style={styles.header}>
    <Text style={styles.title}>Detalle de envío</Text>
    <View style={styles.statusBadge}>
      <Ionicons
        name={getStatusIcon(currentStatus)}
        size={20}
        color={getStatusColor(currentStatus)}
      />
      <Text style={[styles.statusText, { color: getStatusColor(currentStatus) }]}>
        {translateStatus(currentStatus)}
      </Text>
    </View>
  </View>
);

// --- Chat Button Component ---
interface ChatButtonProps {
  shipmentId: string;
}

export const ChatButton: React.FC<ChatButtonProps> = ({ shipmentId }) => {
  const router = useRouter();

  return (
    <TouchableOpacity
      style={styles.chatButton}
      onPress={() => router.push(`/chat/${shipmentId}`)}
      activeOpacity={0.8}
    >
      <Ionicons name="chatbubbles" size={24} color="white" />
      <Text style={styles.chatButtonText}>Chat</Text>
    </TouchableOpacity>
  );
};

// --- Timeline Component ---
interface TimelineProps {
  items: ShipmentStatusRow[];
}

export const ShipmentTimeline: React.FC<TimelineProps> = ({ items }) => (
  <View style={styles.sectionContainer}>
    <Text style={styles.sectionTitle}>Historial de estados</Text>
    {items.length === 0 ? (
      <View style={styles.emptyContainer}>
        <Ionicons name="time-outline" size={48} color={colors.muted} />
        <Text style={styles.emptyText}>Sin eventos aún</Text>
        <Text style={styles.emptyHint}>Los cambios de estado aparecerán aquí</Text>
      </View>
    ) : (
      <View style={styles.timelineContainer}>
        {items.map((item, index) => (
          <View key={item.id} style={styles.timelineItem}>
            <View style={styles.timelineLeft}>
              <View style={[styles.timelineDot, { backgroundColor: getStatusColor(item.status) }]}>
                <Ionicons
                  name={getStatusIcon(item.status)}
                  size={16}
                  color="white"
                />
              </View>
              {index < items.length - 1 && <View style={styles.timelineLine} />}
            </View>
            <View style={styles.timelineContent}>
              <View style={styles.timelineHeader}>
                <Text style={[styles.timelineStatus, { color: getStatusColor(item.status) }]}>
                  {translateStatus(item.status)}
                </Text>
                <Text style={styles.timelineDate}>
                  {new Date(item.created_at).toLocaleString('es-ES', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </Text>
              </View>
              {item.note && (
                <Text style={styles.timelineNote}>{item.note}</Text>
              )}
            </View>
          </View>
        ))}
      </View>
    )}
  </View>
);

// --- Actions Component ---
interface DetailActionsProps {
  nextStates: string[];
  saving: string | null;
  onChange: (status: string) => void;
  role: string;
}

export const DetailActions: React.FC<DetailActionsProps> = ({ nextStates, saving, onChange, role }) => (
  <View style={styles.actionsContainer}>
    <Text style={styles.actionsTitle}>Acciones disponibles</Text>
    <View style={styles.actions}>
      {nextStates.map((s) => {
        const isDelivered = s === 'delivered';
        const isReadyForDelivery = s === 'ready_for_delivery';

        let label = `Marcar como ${translateStatus(s)}`;

        if (isDelivered && role === 'business') {
          label = 'Confirmar Entrega';
        } else if (isReadyForDelivery && role === 'driver') {
          label = 'Marcar como Entregado';
        }

        return (
          <TouchableOpacity
            key={s}
            style={[
              styles.actionBtn,
              saving === s && styles.actionBtnDisabled,
              isDelivered && { backgroundColor: colors.success }
            ]}
            onPress={() => onChange(s)}
            disabled={saving === s}
            activeOpacity={0.7}
          >
            <Ionicons
              name={getStatusIcon(s)}
              size={20}
              color="white"
              style={styles.actionIcon}
            />
            <Text style={styles.actionText}>
              {saving === s ? 'Actualizando...' : label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  </View>
);

const styles = StyleSheet.create({
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
    backgroundColor: colors.background,
  },
  loadingText: {
    marginTop: spacing.md,
    color: colors.muted,
    fontSize: 14,
  },
  header: {
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
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.md,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.sm,
    backgroundColor: colors.background,
    gap: spacing.sm,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  sectionContainer: {
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.lg,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: spacing.xl * 2,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  emptyHint: {
    fontSize: 14,
    color: colors.muted,
    textAlign: 'center',
  },
  timelineContainer: {
    paddingLeft: spacing.sm,
  },
  timelineItem: {
    flexDirection: 'row',
    marginBottom: spacing.lg,
  },
  timelineLeft: {
    alignItems: 'center',
    marginRight: spacing.md,
    width: 32,
  },
  timelineDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  timelineLine: {
    width: 2,
    flex: 1,
    backgroundColor: colors.border,
    marginTop: spacing.xs,
    minHeight: 40,
  },
  timelineContent: {
    flex: 1,
    backgroundColor: colors.background,
    borderRadius: radii.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  timelineHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  timelineStatus: {
    fontSize: 16,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  timelineDate: {
    fontSize: 12,
    color: colors.muted,
  },
  timelineNote: {
    fontSize: 14,
    color: colors.text,
    marginTop: spacing.xs,
    lineHeight: 20,
  },
  actionsContainer: {
    backgroundColor: 'white',
    borderRadius: radii.md,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  actionsTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.md,
  },
  actions: {
    gap: spacing.md,
  },
  actionBtn: {
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
  },
  actionBtnDisabled: {
    opacity: 0.6,
  },
  actionIcon: {
    marginRight: spacing.xs,
  },
  actionText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 16,
  },
  chatButton: {
    position: 'absolute',
    right: spacing.lg,
    top: spacing.lg,
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 99,
    gap: spacing.xs,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
    zIndex: 10,
  },
  chatButtonText: {
    color: 'white',
    fontWeight: '700',
    fontSize: 14,
  },
});
