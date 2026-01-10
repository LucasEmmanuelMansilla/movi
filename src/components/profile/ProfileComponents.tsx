import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, Switch } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { colors, spacing, radii } from '../../ui/theme';
import { AvatarPicker } from './AvatarPicker';
import { ProfileSection } from './ProfileSection';
import { Input } from '../../ui/Input';
import { Button } from '../../ui/Button';
import { ProfileFormData, ProfileFormErrors } from '../../hooks/useProfileForm';

// --- Loading State ---
export const ProfileLoadingState = () => (
  <View style={styles.centerContainer}>
    <ActivityIndicator size="large" color={colors.accent} />
    <Text style={styles.loadingText}>Cargando perfil...</Text>
  </View>
);

// --- Error State ---
export const ProfileErrorState = ({ onRetry }: { onRetry: () => void }) => (
  <View style={styles.centerContainer}>
    <Ionicons name="alert-circle-outline" size={48} color={colors.muted} />
    <Text style={styles.errorText}>No se pudo cargar el perfil</Text>
    <Button title="Reintentar" onPress={onRetry} style={{ marginTop: spacing.md }} />
  </View>
);

// --- Header ---
interface ProfileHeaderProps {
  avatarUri: string | null;
  onAvatarChange: (uri: string | null) => void;
  isDriver: boolean;
  onShowAlert: any;
  onCloseAlert: () => void;
}

export const ProfileHeader: React.FC<ProfileHeaderProps> = ({ 
  avatarUri, onAvatarChange, isDriver, onShowAlert, onCloseAlert 
}) => (
  <View style={styles.header}>
    <AvatarPicker 
      avatarUri={avatarUri} 
      onAvatarChange={onAvatarChange}
      onShowAlert={onShowAlert}
      onCloseAlert={onCloseAlert}
      size={120}
    />
    <View style={styles.roleBadge}>
      <Ionicons 
        name={isDriver ? "car" : "business"} 
        size={16} 
        color={colors.accent} 
      />
      <Text style={styles.roleText}>
        {isDriver ? 'Conductor' : 'Negocio'}
      </Text>
    </View>
  </View>
);

// --- Wallet Banners ---
export const DriverWalletBanner = () => (
  <TouchableOpacity 
    style={styles.walletCard}
    onPress={() => router.replace('/(app)/wallet')}
    activeOpacity={0.8}
  >
    <View style={styles.walletHeader}>
      <View style={styles.walletTitleContainer}>
        <Ionicons name="wallet-outline" size={20} color={colors.accent} />
        <Text style={styles.walletTitle}>Mi Billetera</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color={colors.muted} />
    </View>
    <Text style={styles.walletBalanceLabel}>Saldo acumulado</Text>
    <Text style={styles.walletBalance}>Ver mis ganancias</Text>
  </TouchableOpacity>
);

export const BusinessPaymentsBanner = () => (
  <TouchableOpacity 
    style={[styles.walletCard, { borderColor: colors.success }]}
    onPress={() => router.push('/(app)/admin-transfers')}
    activeOpacity={0.8}
  >
    <View style={styles.walletHeader}>
      <View style={styles.walletTitleContainer}>
        <Ionicons name="cash-outline" size={20} color={colors.success} />
        <Text style={styles.walletTitle}>Gestión de Pagos</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color={colors.muted} />
    </View>
    <Text style={styles.walletBalanceLabel}>Pendientes de pago</Text>
    <Text style={[styles.walletBalance, { color: colors.success }]}>Gestionar transferencias</Text>
  </TouchableOpacity>
);

// --- Form Fields ---
interface FormFieldsProps {
  formData: ProfileFormData;
  errors: ProfileFormErrors;
  updateField: (field: keyof ProfileFormData, value: string | boolean) => void;
}

export const PersonalInfoFields: React.FC<FormFieldsProps> = ({ formData, errors, updateField }) => (
  <ProfileSection title="Información Personal" hint="Datos básicos de tu cuenta">
    <Input
      label="Nombre completo (Como aparece en el DNI) *"
      value={formData.full_name}
      onChangeText={(text) => updateField('full_name', text)}
      placeholder="Tu nombre completo"
      error={errors.full_name}
    />
    <Input
      label="Teléfono"
      value={formData.phone}
      onChangeText={(text) => updateField('phone', text)}
      placeholder="+1234567890"
      keyboardType="phone-pad"
      error={errors.phone}
    />
    <Input
      label="Email"
      value={formData.email}
      onChangeText={(text) => updateField('email', text)}
      placeholder="tu@email.com"
      keyboardType="email-address"
      autoCapitalize="none"
      error={errors.email}
    />
    <Input
      label="Dirección"
      value={formData.address}
      onChangeText={(text) => updateField('address', text)}
      placeholder="Tu dirección"
      multiline
      numberOfLines={2}
      error={errors.address}
    />
  </ProfileSection>
);

export const DriverInfoFields: React.FC<FormFieldsProps> = ({ formData, errors, updateField }) => (
  <ProfileSection title="Información de Conductor" hint="Datos sobre tu vehículo y disponibilidad">
    <Input
      label="Número de licencia"
      value={formData.license_number}
      onChangeText={(text) => updateField('license_number', text)}
      placeholder="Número de licencia de conducir"
      error={errors.license_number}
    />
    <Input
      label="Tipo de vehículo"
      value={formData.vehicle_type}
      onChangeText={(text) => updateField('vehicle_type', text)}
      placeholder="Ej: Motocicleta, Auto, Camioneta"
      error={errors.vehicle_type}
    />
    <Input
      label="Placa del vehículo"
      value={formData.vehicle_plate}
      onChangeText={(text) => updateField('vehicle_plate', text)}
      placeholder="ABC-123"
      autoCapitalize="characters"
      error={errors.vehicle_plate}
    />
    <View style={styles.switchContainer}>
      <View style={styles.switchLabelContainer}>
        <Text style={styles.switchLabel}>Disponible para envíos</Text>
        <Text style={styles.switchHint}>Activa esto cuando estés disponible para recibir nuevos envíos</Text>
      </View>
      <Switch
        value={formData.is_available}
        onValueChange={(value) => updateField('is_available', value)}
        trackColor={{ false: colors.border, true: colors.accent }}
        thumbColor="white"
      />
    </View>
  </ProfileSection>
);

export const BusinessInfoFields: React.FC<FormFieldsProps> = ({ formData, errors, updateField }) => (
  <ProfileSection title="Información del Negocio" hint="Datos sobre tu empresa">
    <Input
      label="Nombre del negocio"
      value={formData.business_name}
      onChangeText={(text) => updateField('business_name', text)}
      placeholder="Nombre de tu empresa"
      error={errors.business_name}
    />
    <Input
      label="Dirección del negocio"
      value={formData.business_address}
      onChangeText={(text) => updateField('business_address', text)}
      placeholder="Dirección de tu negocio"
      multiline
      numberOfLines={2}
      error={errors.business_address}
    />
  </ProfileSection>
);

// --- Actions ---
interface ProfileActionsProps {
  saving: boolean;
  hasChanges: boolean;
  onSave: () => void;
  onLogout: () => void;
}

export const ProfileActions: React.FC<ProfileActionsProps> = ({ saving, hasChanges, onSave, onLogout }) => (
  <View style={styles.actionsContainer}>
    <Button
      title={saving ? 'Guardando...' : 'Guardar cambios'}
      onPress={onSave}
      loading={saving}
      disabled={!hasChanges || saving}
      style={styles.saveButton}
    />
    <TouchableOpacity
      style={styles.logoutButton}
      onPress={onLogout}
      activeOpacity={0.7}
    >
      <Ionicons name="log-out-outline" size={20} color={colors.text} />
      <Text style={styles.logoutText}>Cerrar sesión</Text>
    </TouchableOpacity>
  </View>
);

const styles = StyleSheet.create({
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  loadingText: {
    marginTop: spacing.md,
    color: colors.muted,
    fontSize: 14,
  },
  errorText: {
    marginTop: spacing.md,
    color: colors.text,
    fontSize: 16,
    textAlign: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 20,
    marginTop: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.xs,
  },
  roleText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.accent,
    textTransform: 'capitalize',
  },
  walletCard: {
    backgroundColor: 'white',
    padding: spacing.lg,
    borderRadius: 15,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  walletHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  walletTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  walletTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
  },
  walletBalanceLabel: {
    fontSize: 12,
    color: colors.muted,
  },
  walletBalance: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.accent,
    marginTop: 2,
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  switchLabelContainer: {
    flex: 1,
    marginRight: spacing.md,
  },
  switchLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  switchHint: {
    fontSize: 12,
    color: colors.muted,
  },
  actionsContainer: {
    marginTop: spacing.lg,
    gap: spacing.md,
  },
  saveButton: {
    marginBottom: spacing.xs,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.sm,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
});
