import { useState, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { signUpWithEmail, resendConfirmationEmail } from '../../src/features/auth/service';
import CustomAlert from '../../src/components/ui/CustomAlert';

export default function Register() {
  const alertRef = useRef<any>(null);

  interface AlertButton {
    text: string;
    onPress?: () => void;
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

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<'driver' | 'business'>('business');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');

  // Password validation regex
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>/?]).{8,}$/;

  const validatePassword = (pass: string) => {
    if (!passwordRegex.test(pass)) {
      setPasswordError('La contraseña debe tener al menos 8 caracteres, una mayúscula, una minúscula, un número y un símbolo');
      return false;
    }
    if (confirmPassword && pass !== confirmPassword) {
      setPasswordError('Las contraseñas no coinciden');
      return false;
    }
    setPasswordError('');
    return true;
  };

  const handlePasswordChange = (text: string) => {
    setPassword(text);
    if (confirmPassword) {
      validatePasswords(text, confirmPassword);
    }
  };

  const isFormValid = () => {
    return (
      email.trim() !== '' &&
      fullName.trim() !== '' &&
      password !== '' &&
      confirmPassword !== '' &&
      password === confirmPassword &&
      passwordRegex.test(password)
    );
  };

  const validatePasswords = (pass: string, confirmPass: string) => {
    if (pass !== confirmPass) {
      setPasswordError('Las contraseñas no coinciden');
      return false;
    }
    if (!passwordRegex.test(pass)) {
      setPasswordError('La contraseña no cumple con los requisitos');
      return false;
    }
    setPasswordError('');
    return true;
  };

  const router = useRouter();

  const onSubmit = async () => {
    if (!email || !password || !fullName || !confirmPassword) {
      showAlert('Error', 'Por favor completa todos los campos');
      return;
    }

    if (!validatePassword(password) || password !== confirmPassword) {
      showAlert('Error', 'Por favor verifica que las contraseñas coincidan y cumplan con los requisitos');
      return;
    }

    try {
      setLoading(true);

      // Validar que el rol esté definido
      if (!role || (role !== 'driver' && role !== 'business')) {
        console.error('❌ Error: Rol inválido:', role);
        showAlert('Error', 'Por favor selecciona un tipo de cuenta');
        setLoading(false);
        return;
      }

      console.log(`📝 Registrando usuario con rol: ${role}, nombre: ${fullName.trim()}`);

      // Usar el servicio de autenticación que maneja correctamente el registro y el intercambio de tokens
      const result = await signUpWithEmail(
        email.trim(),
        password,
        role, // Asegurar que el rol se pasa correctamente
        fullName.trim() // Asegurar que el nombre se pasa correctamente
      );

      if (result.requiresConfirmation) {
        // Requiere confirmación por correo
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
        // Si no requiere confirmación, el servicio ya hizo el exchange y guardó los datos
        router.replace('/');
      }
    } catch (error: any) {
      console.error('Error en registro:', error);
      showAlert('Error', error.message || 'No fue posible crear la cuenta');
    } finally {
      setLoading(false);
    }
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

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Crear cuenta</Text>

      <TextInput
        style={styles.input}
        placeholder="Nombre completo (Cómo aparece en el DNI)"
        value={fullName}
        onChangeText={setFullName}
        autoCapitalize="words"
      />

      <TextInput
        style={styles.input}
        placeholder="Email"
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />

      <View style={styles.passwordContainer}>
        <TextInput
          style={[styles.input, styles.passwordInput]}
          placeholder="Contraseña"
          secureTextEntry={!showPassword}
          value={password}
          onChangeText={handlePasswordChange}
        />
        <TouchableOpacity
          style={styles.eyeIcon}
          onPress={() => setShowPassword(!showPassword)}
        >
          <MaterialIcons
            name={showPassword ? 'visibility-off' : 'visibility'}
            size={24}
            color="#6B7280"
          />
        </TouchableOpacity>
      </View>

      <View style={styles.passwordContainer}>
        <TextInput
          style={styles.input}
          placeholder="Confirmar contraseña"
          secureTextEntry={!showConfirmPassword}
          value={confirmPassword}
          onChangeText={(text) => {
            setConfirmPassword(text);
            validatePasswords(password, text);
          }}
        />
        <TouchableOpacity
          style={styles.eyeIcon}
          onPress={() => setShowConfirmPassword(!showConfirmPassword)}
        >
          <MaterialIcons
            name={showConfirmPassword ? 'visibility-off' : 'visibility'}
            size={24}
            color="#6B7280"
          />
        </TouchableOpacity>
      </View>

      {passwordError ? (
        <Text style={styles.errorText}>{passwordError}</Text>
      ) : (
        <Text style={styles.helperText}>
          La contraseña debe tener al menos 8 caracteres, incluyendo:
        </Text>
      )}
      <View style={styles.requirements}>
        <Text style={[styles.requirement, password.length >= 8 && styles.requirementMet]}>
          • Mínimo 8 caracteres
        </Text>
        <Text style={[styles.requirement, /[A-Z]/.test(password) && styles.requirementMet]}>
          • Al menos una mayúscula (A-Z)
        </Text>
        <Text style={[styles.requirement, /[a-z]/.test(password) && styles.requirementMet]}>
          • Al menos una minúscula (a-z)
        </Text>
        <Text style={[styles.requirement, /\d/.test(password) && styles.requirementMet]}>
          • Al menos un número (0-9)
        </Text>
        <Text style={[styles.requirement, /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>/?]/.test(password) && styles.requirementMet]}>
          • Al menos un símbolo especial (!@#$%^&*...)
        </Text>
      </View>

      <View style={styles.rolesRow}>
        <TouchableOpacity
          onPress={() => setRole('business')}
          style={[styles.roleBtn, role === 'business' && styles.roleSelected]}
        >
          <Text style={[styles.roleText, role === 'business' && styles.roleTextSel]}>
            Negocio
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setRole('driver')}
          style={[styles.roleBtn, role === 'driver' && styles.roleSelected]}
        >
          <Text style={[styles.roleText, role === 'driver' && styles.roleTextSel]}>
            Chofer
          </Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={[
          styles.button,
          (!isFormValid() || loading) && styles.buttonDisabled,
        ]}
        onPress={onSubmit}
        disabled={!isFormValid() || loading}
      >
        <Text style={styles.buttonText}>
          {loading ? 'Creando...' : 'Crear cuenta'}
        </Text>
      </TouchableOpacity>

      <Link href="/(auth)/login" asChild>
        <Text style={styles.link}>¿Ya tienes una cuenta? Inicia sesión</Text>
      </Link>
      <CustomAlert ref={alertRef} />
    </View>
  );
}

const styles = StyleSheet.create({
  passwordContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  passwordInput: {
    paddingRight: 50,
  },
  eyeIcon: {
    position: 'absolute',
    right: 15,
    top: 14,
    width: 44,
    justifyContent: 'flex-end',
    alignItems: 'flex-end',
  },
  requirements: {
    marginBottom: 16,
  },
  requirement: {
    color: '#6B7280',
    fontSize: 12,
    marginBottom: 4,
  },
  requirementMet: {
    color: '#09c577',
    fontWeight: '600',
  },
  errorText: {
    color: '#EF4444',
    marginBottom: 8,
    fontSize: 12,
  },
  helperText: {
    color: '#6B7280',
    marginBottom: 8,
    fontSize: 12,
  },
  container: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
    backgroundColor: '#F3F4F6',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#053959',
    marginBottom: 24,
    textAlign: 'center',
  },
  input: {
    backgroundColor: 'white',
    borderColor: '#E5E7EB',
    borderWidth: 1,
    borderRadius: 8,
    padding: 14,
    marginBottom: 16,
    fontSize: 16,
  },
  rolesRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    marginBottom: 24,
  },
  roleBtn: {
    flex: 1,
    paddingVertical: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  roleSelected: {
    borderColor: '#09c577',
    backgroundColor: 'rgba(9, 197, 119, 0.1)',
  },
  roleText: {
    color: '#6B7280',
    fontWeight: '500',
    fontSize: 16,
  },
  roleTextSel: {
    color: '#065F46',
    fontWeight: '600',
  },
  button: {
    backgroundColor: '#09c577',
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  buttonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 16,
  },
  link: {
    color: '#053959',
    marginTop: 24,
    textAlign: 'center',
    fontSize: 15,
    textDecorationLine: 'underline',
  },
});
