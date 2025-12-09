import { useEffect, useRef, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { Link, useLocalSearchParams, useRouter } from 'expo-router';
import { signInWithEmail } from '../../src/features/auth/service';
import { useAuthStore } from '../../src/store/useAuthStore';
import CustomAlert from '../../src/components/ui/CustomAlert';
import { MaterialIcons } from '@expo/vector-icons';
import { getAuthFlow } from '../../src/utils/getAuthFlow';

export default function Login() {
  const alertRef = useRef<any>(null);

  const flowType = getAuthFlow();


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
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();
  const params = useLocalSearchParams();;
  const { session, role, user, loadSession } = useAuthStore()

  // If email is passed as param (from welcome modal), pre-fill it
  const initialEmail = params?.email as string || '';
  if (initialEmail && !email) {
    setEmail(initialEmail);
  }

  const onSubmit = async () => {
    if (!email || !password) {
      showAlert('Error', 'Por favor ingresa tu correo y contraseña');
      return;
    }

    try {
      setLoading(true);
      await signInWithEmail(email.trim(), password);
      await loadSession();
      
      // Redirigir según el rol después de cargar la sesión
      const currentRole = useAuthStore.getState().role;
      if (currentRole === 'driver') {
        router.replace('/available');
      } else if (currentRole === 'business') {
        router.replace('/publish');
      }
    } catch (e: any) {
      let errorMessage = e.details?.error || 'No fue posible iniciar sesión';

      // Handle specific error cases
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

  // Si hay una sesión activa, redirigir según el rol
  useEffect(() => {
    if (session && role) {
      if (role === 'driver') {
        router.replace('/available');
      } else if (role === 'business') {
        router.replace('/publish');
      }
    }
  }, [session, role, user, router]);

  // Si el email se pasa como parámetro, rellenarlo
  useEffect(() => {
    const initialEmail = params?.email as string;
    if (initialEmail && !email) {
      setEmail(initialEmail);
    }
  }, [params?.email, email]);

  useEffect(() => {
    Alert.alert('flowType', flowType)
  }, [flowType])

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
    >
      <View style={styles.innerContainer}>
        <Text style={styles.title}>Iniciar sesión</Text>

        <TextInput
          style={styles.input}
          placeholder="Email"
          autoCapitalize="none"
          keyboardType="email-address"
          autoComplete="email"
          value={email}
          onChangeText={setEmail}
          editable={!loading}
          placeholderTextColor={'#6B7280'}
        />
        <View>
          <TextInput
            style={styles.input}
            placeholder="Contraseña"
            secureTextEntry={!showPassword}
            autoComplete="password"
            value={password}
            onChangeText={setPassword}
            editable={!loading}
            onSubmitEditing={onSubmit}
            returnKeyType="go"
            placeholderTextColor={'#6B7280'}
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

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={onSubmit}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading ? 'Ingresando...' : 'Ingresar'}
          </Text>
        </TouchableOpacity>

        <View style={styles.footer}>
          <Text style={styles.footerText}>¿No tienes una cuenta? </Text>
          <Link href="/(auth)/register" style={styles.link}>
            Regístrate
          </Link>
        </View>

        {/* <Link href="/forgot-password" style={[styles.link, styles.forgotPassword]}>
          ¿Olvidaste tu contraseña?
        </Link> */}
        <CustomAlert ref={alertRef} />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  innerContainer: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#053959',
    marginBottom: 32,
    textAlign: 'center'
  },
  input: {
    backgroundColor: 'white',
    borderColor: '#E5E7EB',
    borderWidth: 1,
    borderRadius: 10,
    padding: 16,
    marginBottom: 16,
    fontSize: 16,
    color: '#000',
  },
  button: {
    backgroundColor: '#09c577',
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
    marginBottom: 16,
  },
  footerText: {
    color: '#6B7280',
  },
  link: {
    color: '#09c577',
    fontWeight: '600',
  },
  forgotPassword: {
    textAlign: 'center',
    marginTop: 8,
  },
  eyeIcon: {
    position: 'absolute',
    right: 16,
    top: 16,
  },
});
