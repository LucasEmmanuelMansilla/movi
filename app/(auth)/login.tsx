import React from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { useLoginLogic } from '../../src/hooks/auth/useLoginLogic';
import { 
  LoginHeader, 
  LoginFormFields, 
  LoginActions 
} from '../../src/components/auth/LoginComponents';
import CustomAlert from '../../src/components/ui/CustomAlert';
import { colors } from '../../src/ui/theme';

/**
 * Pantalla de Inicio de Sesión
 * Permite a los usuarios acceder a su cuenta según su rol (conductor o negocio).
 */
export default function Login() {
  const {
    email,
    setEmail,
    password,
    setPassword,
    loading,
    showPassword,
    setShowPassword,
    onSubmit,
    alertRef,
  } = useLoginLogic();

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
    >
      <View style={styles.innerContainer}>
        <LoginHeader />

        <LoginFormFields 
          email={email}
          setEmail={setEmail}
          password={password}
          setPassword={setPassword}
          loading={loading}
          showPassword={showPassword}
          setShowPassword={setShowPassword}
          onSubmit={onSubmit}
        />

        <LoginActions 
          loading={loading}
          onPress={onSubmit}
        />

        <CustomAlert ref={alertRef} />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  innerContainer: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
});
