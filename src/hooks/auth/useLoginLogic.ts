import { useState, useEffect, useRef } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { signInWithEmail } from '../../features/auth/service';
import { useAuthStore } from '../../store/useAuthStore';
import { getAuthFlow } from '../../utils/getAuthFlow';

export interface AlertButton {
  text: string;
  onPress?: () => void;
}

export function useLoginLogic() {
  const alertRef = useRef<any>(null);
  const router = useRouter();
  const params = useLocalSearchParams();
  const { session, role, user, bootstrap } = useAuthStore();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  const flowType = getAuthFlow();

  const showAlert = (title: string, message: string, buttons: AlertButton[] = []) => {
    if (alertRef.current) {
      alertRef.current.show({
        title,
        message,
        buttons: buttons.length > 0 ? buttons : [{ text: 'Aceptar' }],
      });
    }
  };

  // Pre-fill email from params
  useEffect(() => {
    const initialEmail = params?.email as string;
    if (initialEmail && !email) {
      setEmail(initialEmail);
    }
  }, [params?.email, email]);

  // Redirect if session is active
  useEffect(() => {
    if (session && role) {
      if (role === 'driver') {
        router.replace('/available');
      } else if (role === 'business') {
        router.replace('/publish');
      }
    }
  }, [session, role, user, router]);

  const onSubmit = async () => {
    if (!email || !password) {
      showAlert('Error', 'Por favor ingresa tu correo y contraseña');
      return;
    }

    try {
      setLoading(true);
      await signInWithEmail(email.trim(), password);
      await bootstrap();
      
      const currentRole = useAuthStore.getState().role;
      if (currentRole === 'driver') {
        router.replace('/available');
      } else if (currentRole === 'business') {
        router.replace('/publish');
      }
    } catch (e: any) {
      let errorMessage = e.details?.error || 'No fue posible iniciar sesión';

      if (e.message.includes('Invalid login credentials')) {
        errorMessage = 'Correo o contraseña incorrectos';
      } else if (e.message.includes('Email not confirmed')) {
        errorMessage = 'Por favor verifica tu correo electrónico antes de iniciar sesión';
      }
      
      showAlert('Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return {
    email,
    setEmail,
    password,
    setPassword,
    loading,
    showPassword,
    setShowPassword,
    onSubmit,
    alertRef,
    flowType,
  };
}
