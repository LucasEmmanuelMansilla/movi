import { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet, Text } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { supabase } from '../../src/lib/supabase';
import { api } from '../../src/lib/api';
import { useAuthStore } from '../../src/store/useAuthStore';
import { WelcomeModal } from '../../src/components/WelcomeModal';

export default function AuthCallback() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [showWelcome, setShowWelcome] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { applySession, setRole } = useAuthStore();

  useEffect(() => {
    handleAuthCallback();
  }, []);

  const handleAuthCallback = async () => {
    try {
      // Verificar si hay parámetros de acceso en la URL (desde el deep link)
      const accessToken = params?.access_token as string;
      const refreshToken = params?.refresh_token as string;
      const type = params?.type as string;

      if (accessToken && refreshToken) {
        // Establecer la sesión con los tokens recibidos
        const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });

        if (sessionError) throw sessionError;

        if (sessionData.session) {
          // Obtener los datos del usuario desde Supabase (incluyendo user_metadata)
          const { data: userData, error: userError } = await supabase.auth.getUser();

          if (userError) throw userError;

          const user = userData.user;
          
          // Extraer el rol de user_metadata - es crítico que esto funcione correctamente
          const roleFromMetadata = user?.user_metadata?.role as 'driver' | 'business' | undefined;
          const fullName = user?.user_metadata?.full_name as string | undefined;

          console.log(`📧 Callback - Usuario: ${user.email}, Rol en metadata: ${roleFromMetadata || 'N/A'}, Nombre: ${fullName || 'N/A'}`);
          console.log(`📧 Callback - user_metadata completo:`, JSON.stringify(user?.user_metadata || {}));

          // Si no hay rol en metadata, intentar obtenerlo del perfil existente
          let role: 'driver' | 'business' = roleFromMetadata || 'business';
          
          if (!roleFromMetadata) {
            console.warn(`⚠️ No se encontró rol en user_metadata para ${user.email}, usando 'business' por defecto`);
          } else {
            console.log(`✅ Rol encontrado en user_metadata: ${roleFromMetadata}`);
          }

          // Hacer el intercambio de tokens para guardar los datos en la tabla profiles
          try {
            console.log(`🔄 Callback - Haciendo exchange con rol: ${role}, nombre: ${fullName || 'N/A'}`);
            
            const res = await api<{ token: string; role: 'driver' | 'business'; user: any }>(
              `/auth/exchange`,
              {
                method: 'POST',
                body: JSON.stringify({
                  access_token: sessionData.session.access_token,
                  role: role, // Pasar el rol explícitamente
                  full_name: fullName,
                }),
              }
            );

            console.log(`✅ Callback - Exchange completado. Rol recibido del servidor: ${res.role}`);

            // Guardar la sesión y el rol
            await applySession(sessionData.session);
            setRole(res.role);

            // Mostrar el modal de bienvenida
            setShowWelcome(true);
            setIsLoading(false);
          } catch (exchangeError: any) {
            console.error('Error en exchange:', exchangeError);
            // Aún así, guardar la sesión si el exchange falla
            await applySession(sessionData.session);
            setRole(role);
            setShowWelcome(true);
            setIsLoading(false);
          }
        } else {
          throw new Error('No se pudo establecer la sesión');
        }
      } else {
        // Si no hay tokens en la URL, verificar si hay una sesión activa
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          await applySession(session);
        }
        setShowWelcome(true);
        setIsLoading(false);
      }
    } catch (err: any) {
      console.error('Error en callback de autenticación:', err);
      setError(err.message || 'Error al procesar la autenticación');
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#09c577" />
        <Text style={styles.loadingText}>Procesando autenticación...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>{error}</Text>
        <Text style={styles.linkText} onPress={() => router.replace('/(auth)/login')}>
          Volver al inicio de sesión
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <WelcomeModal
        visible={showWelcome}
        onClose={() => {
          setShowWelcome(false);
          router.replace('/(auth)/login');
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 24,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
  },
  errorText: {
    fontSize: 16,
    color: '#EF4444',
    textAlign: 'center',
    marginBottom: 16,
  },
  linkText: {
    fontSize: 16,
    color: '#09c577',
    textDecorationLine: 'underline',
  },
});
