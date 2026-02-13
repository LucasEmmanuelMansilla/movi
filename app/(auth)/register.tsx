import React from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { Link } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useRegisterLogic } from '../../src/hooks/auth/useRegisterLogic';
import { 
  RegisterHeader, 
  PasswordRequirements, 
  RoleSelector 
} from '../../src/components/auth/RegisterComponents';
import CustomAlert from '../../src/components/ui/CustomAlert';
import { colors, radii } from '../../src/ui/theme';

/**
 * Pantalla de Registro de Usuario
 * Permite a los nuevos usuarios crear una cuenta como conductor o negocio.
 */
export default function Register() {
  const {
    email, setEmail,
    password, handlePasswordChange,
    confirmPassword, handleConfirmPasswordChange,
    fullName, setFullName,
    role, setRole,
    privacyAccepted, setPrivacyAccepted,
    loading,
    showPassword, setShowPassword,
    showConfirmPassword, setShowConfirmPassword,
    passwordError,
    onSubmit,
    alertRef,
    isFormValid,
  } = useRegisterLogic();

  return (
    <ScrollView 
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      <RegisterHeader />

      <TextInput
        style={styles.input}
        placeholder="Nombre completo (Cómo aparece en el DNI)"
        value={fullName}
        onChangeText={setFullName}
        autoCapitalize="words"
        placeholderTextColor={colors.muted}
      />

      <TextInput
        style={styles.input}
        placeholder="Email"
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
        placeholderTextColor={colors.muted}
      />

      <View style={styles.passwordContainer}>
        <TextInput
          style={[styles.input, styles.passwordInput]}
          placeholder="Contraseña"
          secureTextEntry={!showPassword}
          value={password}
          onChangeText={handlePasswordChange}
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

      <View style={styles.passwordContainer}>
        <TextInput
          style={[styles.input, styles.passwordInput]}
          placeholder="Confirmar contraseña"
          secureTextEntry={!showConfirmPassword}
          value={confirmPassword}
          onChangeText={handleConfirmPasswordChange}
          placeholderTextColor={colors.muted}
        />
        <TouchableOpacity
          style={styles.eyeIcon}
          onPress={() => setShowConfirmPassword(!showConfirmPassword)}
        >
          <MaterialIcons
            name={showConfirmPassword ? 'visibility-off' : 'visibility'}
            size={24}
            color={colors.muted}
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

      <PasswordRequirements password={password} />

      <View style={styles.privacySection}>
        <TouchableOpacity
          style={styles.checkboxRow}
          onPress={() => setPrivacyAccepted(!privacyAccepted)}
          activeOpacity={0.7}
        >
          <View style={[styles.checkbox, privacyAccepted && styles.checkboxChecked]}>
            {privacyAccepted && (
              <MaterialIcons name="check" size={18} color="white" />
            )}
          </View>
          <Text style={styles.checkboxLabel}>
            Acepto las{' '}
            <Text style={styles.privacyLink}>Políticas de Privacidad</Text>
            {' '}(obligatorio)
          </Text>
        </TouchableOpacity>
        <Link href="/(auth)/privacy" asChild>
          <TouchableOpacity>
            <Text style={styles.viewPolicyLink}>Ver políticas completas</Text>
          </TouchableOpacity>
        </Link>
      </View>

      <RoleSelector role={role} setRole={setRole} />

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
        <TouchableOpacity>
          <Text style={styles.link}>¿Ya tienes una cuenta? Inicia sesión</Text>
        </TouchableOpacity>
      </Link>
      
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
    padding: 24,
    justifyContent: 'center',
    paddingBottom: 40,
  },
  input: {
    backgroundColor: 'white',
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radii.sm,
    padding: 14,
    marginBottom: 16,
    fontSize: 16,
    color: colors.text,
  },
  passwordContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  passwordInput: {
    paddingRight: 50,
  },
  eyeIcon: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: colors.error,
    marginBottom: 8,
    fontSize: 12,
  },
  helperText: {
    color: colors.muted,
    marginBottom: 8,
    fontSize: 12,
  },
  privacySection: {
    marginBottom: 20,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.border,
    marginRight: 12,
    marginTop: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  checkboxLabel: {
    flex: 1,
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
  },
  privacyLink: {
    color: colors.primary,
    textDecorationLine: 'underline',
    fontWeight: '600',
  },
  viewPolicyLink: {
    fontSize: 13,
    color: colors.primary,
    textDecorationLine: 'underline',
    marginLeft: 36,
  },
  button: {
    backgroundColor: colors.accent,
    padding: 16,
    borderRadius: radii.md,
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
    color: colors.primary,
    marginTop: 24,
    textAlign: 'center',
    fontSize: 15,
    textDecorationLine: 'underline',
  },
});
