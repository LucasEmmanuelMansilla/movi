import React from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { Link } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, spacing, radii } from '../../ui/theme';

// --- Login Header ---
export const LoginHeader = () => (
  <Text style={styles.title}>Iniciar sesión</Text>
);

// --- Login Form Fields ---
interface LoginFormFieldsProps {
  email: string;
  setEmail: (text: string) => void;
  password: string;
  setPassword: (text: string) => void;
  loading: boolean;
  showPassword: boolean;
  setShowPassword: (show: boolean) => void;
  onSubmit: () => void;
}

export const LoginFormFields: React.FC<LoginFormFieldsProps> = ({
  email,
  setEmail,
  password,
  setPassword,
  loading,
  showPassword,
  setShowPassword,
  onSubmit,
}) => (
  <>
    <TextInput
      style={styles.input}
      placeholder="Email"
      autoCapitalize="none"
      keyboardType="email-address"
      autoComplete="email"
      value={email}
      onChangeText={setEmail}
      editable={!loading}
      placeholderTextColor={colors.muted}
    />
    <View style={styles.passwordContainer}>
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
        placeholderTextColor={colors.muted}
      />
      <TouchableOpacity
        style={styles.eyeIcon}
        onPress={() => setShowPassword(!showPassword)}
      >
        <MaterialIcons
          name={showPassword ? 'visibility-off' : 'visibility'}
          size={24}
          color={colors.muted}
        />
      </TouchableOpacity>
    </View>
  </>
);

// --- Login Actions ---
interface LoginActionsProps {
  loading: boolean;
  onPress: () => void;
}

export const LoginActions: React.FC<LoginActionsProps> = ({ loading, onPress }) => (
  <>
    <TouchableOpacity
      style={[styles.button, loading && styles.buttonDisabled]}
      onPress={onPress}
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
  </>
);

const styles = StyleSheet.create({
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.primary,
    marginBottom: 32,
    textAlign: 'center'
  },
  input: {
    backgroundColor: 'white',
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radii.md,
    padding: 16,
    marginBottom: 16,
    fontSize: 16,
    color: '#000',
    width: '100%',
  },
  passwordContainer: {
    width: '100%',
  },
  button: {
    backgroundColor: colors.accent,
    padding: 16,
    borderRadius: radii.md,
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
    color: colors.muted,
  },
  link: {
    color: colors.accent,
    fontWeight: '600',
  },
  eyeIcon: {
    position: 'absolute',
    right: 16,
    top: 16,
  },
});
