import { Redirect } from 'expo-router';
import { useAuthStore } from '../src/store/useAuthStore';
import { View, ActivityIndicator } from 'react-native';
import { useState, useEffect } from 'react';
import IdentityVerificationScreen from '../components/IdentifyVerificationScreen';
import PrivacyPolicyScreen from '../src/components/PrivacyPolicyScreen';
import { getMyProfile, acceptPrivacyPolicy, Profile } from '../src/features/profile/service';

type KYCStatus = 'approved' | 'declined' | 'in_review' | 'not_started' | null;

export default function Home() {
  const { user, role, status } = useAuthStore();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [kycStatus, setKycStatus] = useState<KYCStatus>(null);
  const [verificationComplete, setVerificationComplete] = useState(false);

  const isDriver = role === 'driver';

  // Cargar perfil cuando el usuario esté autenticado (para privacy y KYC)
  useEffect(() => {
    if (status === 'authenticated' && user && !profile && !loadingProfile) {
      loadProfile();
    }
  }, [status, user, profile, loadingProfile]);

  // Verificar estado KYC cuando se carga el perfil (solo para drivers)
  useEffect(() => {
    if (profile && isDriver) {
      const s = (profile.kyc_status as KYCStatus) || 'not_started';
      setKycStatus(s);
      if (s === 'approved' && !verificationComplete) {
        setVerificationComplete(true);
      }
    }
  }, [profile, isDriver, verificationComplete]);

  const handleAcceptPrivacyPolicy = async () => {
    await acceptPrivacyPolicy();
    const updated = await getMyProfile();
    setProfile(updated);
  };

  const loadProfile = async () => {
    setLoadingProfile(true);
    try {
      const profileData = await getMyProfile();
      setProfile(profileData);
      if (profileData.role === 'driver') {
        const s = (profileData.kyc_status as KYCStatus) || 'not_started';
        setKycStatus(s);
      } else {
        setKycStatus(null);
      }
    } catch (error) {
      console.error('Error cargando perfil:', error);
      setKycStatus('not_started');
    } finally {
      setLoadingProfile(false);
    }
  };

  const handleVerificationComplete = async (approved: boolean) => {
    if (approved) {
      // Recargar el perfil para obtener el estado actualizado
      await loadProfile();
      setVerificationComplete(true);
    }
  };

  // Mostrar un indicador de carga mientras se verifica la sesión
  if (status === 'idle' || status === 'loading') {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#09c577" />
      </View>
    );
  }

  // Si no hay usuario, redirigir al login
  if (!user) {
    return <Redirect href="/(auth)/login" />;
  }

  // No resolver la UI hasta tener el rol del usuario
  if (role === null) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#09c577" />
      </View>
    );
  }

  // Cargar perfil para verificar privacidad (todos los usuarios)
  if (loadingProfile || profile === null) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#09c577" />
      </View>
    );
  }

  // OBLIGATORIO: Aceptar Políticas de Privacidad antes de usar la app
  const privacyAccepted = profile.privacy_policy_accepted === true;
  if (!privacyAccepted) {
    return (
      <PrivacyPolicyScreen
        requireAccept={true}
        showBackButton={false}
        onAccept={handleAcceptPrivacyPolicy}
      />
    );
  }

  // Si es driver, verificar KYC antes de permitir acceso
  if (isDriver) {
    if (kycStatus === null) {
      return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#09c577" />
        </View>
      );
    }

    // Si el KYC está aprobado, redirigir a la app
    if (kycStatus === 'approved' || verificationComplete) {
      return <Redirect href="/(app)/available" />;
    }

    // Si el KYC no está aprobado, mostrar la pantalla de verificación
    // Solo llegamos aquí si tenemos perfil cargado y kycStatus definido
    return (
      <IdentityVerificationScreen
        required={true}
        onVerificationComplete={handleVerificationComplete}
      />
    );
  }

  // Si hay usuario y no es driver (o es driver con KYC aprobado), redirigir según el rol
  if (role === 'driver') {
    return <Redirect href="/(app)/available" />;
  }
  
  // Por defecto (incluyendo business o si no hay rol definido), redirigir a la vista de negocio
  return <Redirect href="/(app)/publish" />;
}
