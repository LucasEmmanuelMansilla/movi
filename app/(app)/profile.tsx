import { ScrollView, StyleSheet, View } from 'react-native';
import { useProfileScreenLogic } from '../../src/hooks/useProfileScreenLogic';
import { 
  ProfileLoadingState, 
  ProfileErrorState, 
  ProfileHeader, 
  DriverWalletBanner, 
  BusinessPaymentsBanner,
  PersonalInfoFields,
  DriverInfoFields,
  BusinessInfoFields,
  ProfileActions
} from '../../src/components/profile/ProfileComponents';
import { MercadoPagoConnect } from '../../src/components/mercadopago/MercadoPagoConnect';
import CustomAlert from '../../src/components/ui/CustomAlert';
import { colors, spacing } from '../../src/ui/theme';

/**
 * Pantalla de Perfil de Usuario
 * Permite gestionar la información personal, datos del vehículo (para conductores) 
 * y configuración de pagos.
 */
export default function ProfileScreen() {
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
    alertRef,
    hasChanges,
    showAlert,
    closeAlert,
    handleSave,
    handleLogout,
  } = useProfileScreenLogic();

  if (loading) {
    return <ProfileLoadingState />;
  }

  if (!profile) {
    return <ProfileErrorState onRetry={() => loadProfile()} />;
  }

  const isDriver = profile.role === 'driver';
  const isBusiness = profile.role === 'business';

  return (
    <ScrollView 
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      <ProfileHeader 
        avatarUri={avatarUri}
        onAvatarChange={setAvatarUri}
        isDriver={isDriver}
        onShowAlert={showAlert}
        onCloseAlert={closeAlert}
      />

      {isDriver && <DriverWalletBanner />}
      {isBusiness && <BusinessPaymentsBanner />}

      <PersonalInfoFields 
        formData={formData}
        errors={errors}
        updateField={updateField}
      />

      {isDriver && (
        <>
          <DriverInfoFields 
            formData={formData}
            errors={errors}
            updateField={updateField}
          />
          <MercadoPagoConnect />
        </>
      )}

      {isBusiness && (
        <BusinessInfoFields 
          formData={formData}
          errors={errors}
          updateField={updateField}
        />
      )}

      <ProfileActions 
        saving={saving}
        hasChanges={hasChanges}
        onSave={handleSave}
        onLogout={handleLogout}
      />

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
});
