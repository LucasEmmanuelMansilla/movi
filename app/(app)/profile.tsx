import { useRef, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
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
import { BankAccountForm } from '../../src/components/profile/BankAccountForm';
import CustomAlert from '../../src/components/ui/CustomAlert';
import { colors, spacing } from '../../src/ui/theme';

/**
 * Pantalla de Perfil de Usuario
 * Permite gestionar la información personal, datos del vehículo (para conductores) 
 * y configuración de pagos.
 */
export default function ProfileScreen() {
  const scrollRef = useRef<ScrollView>(null);
  const [bankSectionY, setBankSectionY] = useState<number>(0);
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
    handleDeleteAccount,
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
      ref={scrollRef}
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

      {isDriver && (
        <DriverWalletBanner
          profile={profile}
          onRequestCompleteBankData={() => {
            if (scrollRef.current && bankSectionY >= 0) {
              scrollRef.current.scrollTo({ y: Math.max(0, bankSectionY - 20), animated: true });
            }
          }}
        />
      )}
      {isBusiness && <BusinessPaymentsBanner />}

      <PersonalInfoFields 
        formData={formData}
        errors={errors}
        updateField={updateField}
      />

      {isDriver && (
        <DriverInfoFields 
          formData={formData}
          errors={errors}
          updateField={updateField}
        />
      )}

      {isDriver && (
        <View onLayout={(e) => setBankSectionY(e.nativeEvent.layout.y)}>
          <BankAccountForm
            formData={formData}
            errors={errors}
            updateField={updateField}
          />
        </View>
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
        onDeleteAccount={handleDeleteAccount}
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
