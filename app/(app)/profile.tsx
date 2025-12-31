import { useEffect, useState, useRef } from 'react';
import { ScrollView, View, Text, StyleSheet, ActivityIndicator, Switch, TouchableOpacity } from 'react-native';
import { signOutAll } from '../../src/features/profile/service';
import { Input } from '../../src/ui/Input';
import { Button } from '../../src/ui/Button';
import { router } from 'expo-router';
import { useProfileForm } from '../../src/hooks/useProfileForm';
import { AvatarPicker } from '../../src/components/profile/AvatarPicker';
import { ProfileSection } from '../../src/components/profile/ProfileSection';
import { BankAccountForm } from '../../src/components/profile/BankAccountForm';
import { imageToBase64 } from '../../src/utils/imageConverter';
import { colors, spacing } from '../../src/ui/theme';
import { Ionicons } from '@expo/vector-icons';
import CustomAlert from '../../src/components/ui/CustomAlert';

export default function ProfileScreen() {
  const alertRef = useRef<any>(null);

  const {
    profile,
    formData,
    errors,
    loading,
    saving,
    avatarUri,
    setAvatarUri,
    loadProfile,
    updateField,
    saveProfile,
  } = useProfileForm();

   

  const [hasChanges, setHasChanges] = useState(false);

  interface AlertButton {
    text: string;
    onPress?: () => void;
    style?: object;
    textStyle?: object;
  }

  const showAlert = (title: string, message: string, buttons: AlertButton[] = []) => {
    if (alertRef.current) {
      alertRef.current.show({
        title,
        message,
        buttons: buttons.length > 0 ? buttons : [{ text: 'Aceptar' }],
      });
    }
  };

  useEffect(() => {
    loadProfile().catch((e: any) => {
      showAlert('Error', e.message || 'No se pudo cargar el perfil');
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // Detectar cambios en el formulario
    if (profile) {
      const changed = 
        formData.full_name !== (profile.full_name || '') ||
        formData.phone !== (profile.phone || '') ||
        formData.email !== (profile.email || '') ||
        formData.address !== (profile.address || '') ||
        (profile.role === 'driver' && (
          formData.license_number !== (profile.license_number || '') ||
          formData.vehicle_type !== (profile.vehicle_type || '') ||
          formData.vehicle_plate !== (profile.vehicle_plate || '') ||
          formData.is_available !== (profile.is_available ?? true) ||
          formData.bank_account_type !== (profile.bank_account_type || '') ||
          formData.bank_cbu !== (profile.bank_cbu || '') ||
          formData.bank_cvu !== (profile.bank_cvu || '') ||
          formData.bank_alias !== (profile.bank_alias || '') ||
          formData.bank_name !== (profile.bank_name || '') ||
          formData.bank_account_number !== (profile.bank_account_number || '') ||
          formData.bank_account_holder_name !== (profile.bank_account_holder_name || '')
        )) ||
        (profile.role === 'business' && (
          formData.business_name !== (profile.business_name || '') ||
          formData.business_address !== (profile.business_address || '')
        ));
      setHasChanges(changed);
    }
  }, [formData, profile]);

  const handleSave = async () => {
    try {
      let avatarBase64: string | undefined;
      if (avatarUri && avatarUri.startsWith('file://')) {
        avatarBase64 = await imageToBase64(avatarUri);
      }

      const success = await saveProfile(avatarBase64);
      if (success) {
        showAlert('Éxito', 'Perfil actualizado correctamente');
        setHasChanges(false);
      }
    } catch (e: any) {
      showAlert('Error', e.message || 'No se pudo actualizar el perfil');
    }
  };

  const handleLogout = () => {
    showAlert(
      'Cerrar sesión',
      '¿Estás seguro de que deseas cerrar sesión?',
      [
        { 
          text: 'Cancelar',
          onPress: () => {
            if (alertRef.current) {
              alertRef.current.hide();
            }
          },
        },
        {
          text: 'Cerrar sesión',
          onPress: async () => {
            if (alertRef.current) {
              alertRef.current.hide();
            }
            await signOutAll();
            router.push('/login');
          },
          style: { backgroundColor: '#EF4444' },
          textStyle: { color: '#fff' },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.accent} />
        <Text style={styles.loadingText}>Cargando perfil...</Text>
      </View>
    );
  }

  if (!profile) {
    return (
      <View style={styles.centerContainer}>
        <Ionicons name="alert-circle-outline" size={48} color={colors.muted} />
        <Text style={styles.errorText}>No se pudo cargar el perfil</Text>
        <Button title="Reintentar" onPress={() => loadProfile()} style={{ marginTop: spacing.md }} />
      </View>
    );
  }

  const isDriver = profile.role === 'driver';
  const isBusiness = profile.role === 'business';

  return (
    <ScrollView 
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      {/* Header con Avatar */}
      <View style={styles.header}>
        <AvatarPicker 
          avatarUri={avatarUri} 
          onAvatarChange={setAvatarUri}
          onShowAlert={showAlert}
          onCloseAlert={() => {
            if (alertRef.current) {
              alertRef.current.hide();
            }
          }}
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

      {/* Información Personal */}
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

      {/* Información específica por rol */}
      {isDriver && (
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
      )}

      {/* Formulario de cuenta bancaria (solo para drivers) */}
      {isDriver && (
        <BankAccountForm
          formData={{
            bank_account_type: formData.bank_account_type,
            bank_cbu: formData.bank_cbu,
            bank_cvu: formData.bank_cvu,
            bank_alias: formData.bank_alias,
            bank_name: formData.bank_name,
            bank_account_number: formData.bank_account_number,
            bank_account_holder_name: formData.bank_account_holder_name,
          }}
          errors={errors}
          updateField={updateField}
        />
      )}

      {isBusiness && (
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
      )}

      {/* Botones de acción */}
      <View style={styles.actionsContainer}>
        <Button
          title={saving ? 'Guardando...' : 'Guardar cambios'}
          onPress={handleSave}
          loading={saving}
          disabled={!hasChanges || saving}
          style={styles.saveButton}
        />
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
          activeOpacity={0.7}
        >
          <Ionicons name="log-out-outline" size={20} color={colors.text} />
          <Text style={styles.logoutText}>Cerrar sesión</Text>
        </TouchableOpacity>
      </View>

      <View style={{ height: spacing.xl }} />
      <CustomAlert ref={alertRef} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  contentContainer: {
    padding: spacing.lg,
  },
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
