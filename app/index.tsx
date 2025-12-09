import { Redirect } from 'expo-router';
import { useAuthStore } from '../src/store/useAuthStore';
import { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';

export default function Home() {
  const { user, role, isLoading, loadSession } = useAuthStore();

  // Cargar la sesión al montar el componente (SOLO UNA VEZ)
  useEffect(() => {
    loadSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Array vacío para ejecutar SOLO una vez al montar

  // Mostrar un indicador de carga mientras se verifica la sesión
  if (isLoading) {
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

  // Si hay usuario, redirigir según el rol
  if (role === 'driver') {
    return <Redirect href="/available" />;
  }
  
  if (role === 'business') {
    return <Redirect href="/publish" />;
  }
  
  // Por defecto, redirigir a la vista de negocio si no hay rol definido
  return <Redirect href="/available" />;
}
