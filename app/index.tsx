import { Redirect } from 'expo-router';
import { useAuthStore } from '../src/store/useAuthStore';
import { View, ActivityIndicator } from 'react-native';
import { useState, useEffect } from 'react';
import IdentityVerificationScreen from '../components/IdentifyVerificationScreen';
import { getMyProfile, Profile } from '../src/features/profile/service';

type KYCStatus = 'approved' | 'declined' | 'in_review' | 'not_started' | null;

export default function Home() {
  const { user, role, status } = useAuthStore();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [kycStatus, setKycStatus] = useState<KYCStatus>(null);
  const [verificationComplete, setVerificationComplete] = useState(false);

  const isDriver = role === 'driver';

  // Cargar perfil cuando el usuario esté autenticado y sea driver
  useEffect(() => {
    if (status === 'authenticated' && user && isDriver && !profile && !loadingProfile) {
      loadProfile();
    }
  }, [status, user, isDriver, profile, loadingProfile]);

  // Verificar estado KYC cuando se carga el perfil
  useEffect(() => {
    if (profile && isDriver) {
      const status = (profile.kyc_status as KYCStatus) || 'not_started';
      setKycStatus(status);
      
      // Si se completó la verificación y ahora está aprobado, marcar como completo
      if (status === 'approved' && !verificationComplete) {
        setVerificationComplete(true);
      }
    }
  }, [profile, isDriver, verificationComplete]);

  const loadProfile = async () => {
    setLoadingProfile(true);
    try {
      const profileData = await getMyProfile();
      setProfile(profileData);
      const status = (profileData.kyc_status as KYCStatus) || 'not_started';
      setKycStatus(status);
    } catch (error) {
      console.error('Error cargando perfil para verificación KYC:', error);
      // Si hay error, asumir que no está verificado para ser más seguro
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

  // No resolver la UI hasta tener el rol del usuario (evitar mostrar "Publicar" a un Driver)
  if (role === null) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#09c577" />
      </View>
    );
  }

  // Si es driver, verificar KYC antes de permitir acceso
  if (isDriver) {
    // Mostrar carga mientras se obtiene el perfil o mientras kycStatus es null
    // NO mostrar nada hasta que tengamos el perfil cargado y el estado KYC determinado
    if (loadingProfile || profile === null || kycStatus === null) {
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
