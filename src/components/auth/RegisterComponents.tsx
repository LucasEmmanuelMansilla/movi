import React from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, spacing, radii } from '../../ui/theme';

// --- Register Header ---
export const RegisterHeader = () => (
  <Text style={styles.title}>Crear cuenta</Text>
);

// --- Password Requirements ---
export const PasswordRequirements = ({ password }: { password: string }) => (
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
);

// --- Role Selector ---
interface RoleSelectorProps {
  role: 'driver' | 'business';
  setRole: (role: 'driver' | 'business') => void;
}

export const RoleSelector: React.FC<RoleSelectorProps> = ({ role, setRole }) => (
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
);

const styles = StyleSheet.create({
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.primary,
    marginBottom: 24,
    textAlign: 'center',
  },
  requirements: {
    marginBottom: 16,
  },
  requirement: {
    color: colors.muted,
    fontSize: 12,
    marginBottom: 4,
  },
  requirementMet: {
    color: colors.accent,
    fontWeight: '600',
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
    borderColor: colors.border,
    borderRadius: radii.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  roleSelected: {
    borderColor: colors.accent,
    backgroundColor: 'rgba(9, 197, 119, 0.1)',
  },
  roleText: {
    color: colors.muted,
    fontWeight: '500',
    fontSize: 16,
  },
  roleTextSel: {
    color: '#065F46',
    fontWeight: '600',
  },
});
