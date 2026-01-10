import { useState, useRef, useCallback } from 'react';
import { useRouter } from 'expo-router';
import { signUpWithEmail, resendConfirmationEmail } from '../../features/auth/service';

export interface AlertButton {
  text: string;
  onPress?: () => void;
}

export const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>/?]).{8,}$/;

export function useRegisterLogic() {
  const alertRef = useRef<any>(null);
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<'driver' | 'business'>('business');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');

  const showAlert = (title: string, message: string, buttons: AlertButton[] = []) => {
    if (alertRef.current) {
      alertRef.current.show({
        title,
        message,
        buttons: buttons.length > 0 ? buttons : [{ text: 'Aceptar' }],
      });
    }
  };

  const validatePasswords = useCallback((pass: string, confirmPass: string) => {
    if (confirmPass && pass !== confirmPass) {
      setPasswordError('Las contraseñas no coinciden');
      return false;
    }
    if (pass && !PASSWORD_REGEX.test(pass)) {
      setPasswordError('La contraseña no cumple con los requisitos');
      return false;
    }
    setPasswordError('');
    return true;
  }, []);

  const handlePasswordChange = (text: string) => {
    setPassword(text);
    validatePasswords(text, confirmPassword);
  };

  const handleConfirmPasswordChange = (text: string) => {
    setConfirmPassword(text);
    validatePasswords(password, text);
  };

  const isFormValid = () => {
    return (
      email.trim() !== '' &&
      fullName.trim() !== '' &&
      password !== '' &&
      confirmPassword !== '' &&
      password === confirmPassword &&
      PASSWORD_REGEX.test(password)
    );
  };

  const handleResendConfirmation = async (emailToResend: string) => {
    try {
      await resendConfirmationEmail(emailToResend.trim());
      showAlert(
        'Correo reenviado',
        'Hemos enviado un nuevo enlace de confirmación a tu correo electrónico.'
      );
    } catch (error: any) {
      console.error('Error al reenviar correo:', error);
      showAlert('Error', error.message || 'No se pudo reenviar el correo de confirmación');
    }
  };

  const onSubmit = async () => {
    if (!email || !password || !fullName || !confirmPassword) {
      showAlert('Error', 'Por favor completa todos los campos');
      return;
    }

    if (password !== confirmPassword || !PASSWORD_REGEX.test(password)) {
      showAlert('Error', 'Por favor verifica que las contraseñas coincidan y cumplan con los requisitos');
      return;
    }

    try {
      setLoading(true);

      const result = await signUpWithEmail(
        email.trim(),
        password,
        role,
        fullName.trim()
      );

      if (result.requiresConfirmation) {
        showAlert(
          'Verifica tu correo',
          'Hemos enviado un enlace de confirmación a tu correo electrónico. ' +
          'Por favor revisa tu bandeja de entrada y haz clic en el enlace para activar tu cuenta.',
          [
            {
              text: 'Aceptar',
              onPress: () => router.replace('/(auth)/login'),
            },
            {
              text: 'Reenviar correo',
              onPress: () => handleResendConfirmation(email),
            },
          ]
        );
      } else {
        router.replace('/');
      }
    } catch (error: any) {
      console.error('Error en registro:', error);
      showAlert('Error', error.message || 'No fue posible crear la cuenta');
    } finally {
      setLoading(false);
    }
  };

  return {
    email, setEmail,
    password, handlePasswordChange,
    confirmPassword, handleConfirmPasswordChange,
    fullName, setFullName,
    role, setRole,
    loading,
    showPassword, setShowPassword,
    showConfirmPassword, setShowConfirmPassword,
    passwordError,
    onSubmit,
    alertRef,
    isFormValid,
  };
}
