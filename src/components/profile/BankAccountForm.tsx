import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Input } from '../../ui/Input';
import { ProfileSection } from './ProfileSection';
import { colors, spacing } from '../../ui/theme';
import { Ionicons } from '@expo/vector-icons';

type BankAccountType = 'checking' | 'savings' | 'cbu' | 'cvu' | 'alias' | '';

interface BankAccountFormProps {
  formData: {
    bank_account_type: BankAccountType;
    bank_cbu: string;
    bank_cvu: string;
    bank_alias: string;
    bank_name: string;
    bank_account_number: string;
    bank_account_holder_name: string;
  };
  errors: Partial<Record<string, string>>;
  updateField: (field: string, value: string) => void;
}

export function BankAccountForm({ formData, errors, updateField }: BankAccountFormProps) {
  const accountTypes: { value: BankAccountType; label: string; icon: string }[] = [
    { value: 'cbu', label: 'CBU', icon: 'card-outline' },
    { value: 'cvu', label: 'CVU', icon: 'wallet-outline' },
    { value: 'alias', label: 'ALIAS', icon: 'at-outline' },
    { value: 'checking', label: 'Cuenta Corriente', icon: 'business-outline' },
    { value: 'savings', label: 'Caja de Ahorro', icon: 'save-outline' },
  ];

  const renderAccountTypeField = () => {
    return (
      <View style={styles.section}>
        <Text style={styles.label}>Tipo de cuenta *</Text>
        <View style={styles.typeContainer}>
          {accountTypes.map((type) => {
            const isSelected = formData.bank_account_type === type.value;
            return (
              <TouchableOpacity
                key={type.value}
                style={[styles.typeButton, isSelected && styles.typeButtonSelected]}
                onPress={() => updateField('bank_account_type', type.value)}
              >
                <Ionicons
                  name={type.icon as any}
                  size={20}
                  color={isSelected ? colors.accent : colors.muted}
                />
                <Text
                  style={[
                    styles.typeButtonText,
                    isSelected && styles.typeButtonTextSelected,
                  ]}
                >
                  {type.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
        {errors.bank_account_type && (
          <Text style={styles.errorText}>{errors.bank_account_type}</Text>
        )}
      </View>
    );
  };

  return (
    <ProfileSection title="Cuenta Bancaria" icon="wallet-outline">
      <Text style={styles.description}>
        Configura tu cuenta bancaria para recibir tus ganancias. Los datos se guardan de forma segura.
      </Text>

      {renderAccountTypeField()}

      {formData.bank_account_type === 'cbu' && (
        <Input
          label="CBU (22 dígitos)"
          value={formData.bank_cbu}
          onChangeText={(value) => updateField('bank_cbu', value.replace(/\D/g, ''))}
          placeholder="0000000000000000000000"
          keyboardType="numeric"
          maxLength={22}
          error={errors.bank_cbu}
        />
      )}

      {formData.bank_account_type === 'cvu' && (
        <Input
          label="CVU (22 dígitos)"
          value={formData.bank_cvu}
          onChangeText={(value) => updateField('bank_cvu', value.replace(/\D/g, ''))}
          placeholder="0000000000000000000000"
          keyboardType="numeric"
          maxLength={22}
          error={errors.bank_cvu}
        />
      )}

      {formData.bank_account_type === 'alias' && (
        <Input
          label="ALIAS"
          value={formData.bank_alias}
          onChangeText={(value) => updateField('bank_alias', value.toLowerCase().replace(/[^a-z0-9.]/g, ''))}
          placeholder="mi.alias.bancario"
          autoCapitalize="none"
          error={errors.bank_alias}
        />
      )}

      {(formData.bank_account_type === 'checking' || formData.bank_account_type === 'savings') && (
        <>
          <Input
            label="Nombre del banco"
            value={formData.bank_name}
            onChangeText={(value) => updateField('bank_name', value)}
            placeholder="Ej: Banco Nación, Banco Provincia..."
            error={errors.bank_name}
          />

          <Input
            label="Número de cuenta"
            value={formData.bank_account_number}
            onChangeText={(value) => updateField('bank_account_number', value)}
            placeholder="Número de cuenta bancaria"
            keyboardType="numeric"
            error={errors.bank_account_number}
          />
        </>
      )}

      {formData.bank_account_type && (
        <Input
          label="Nombre del titular"
          value={formData.bank_account_holder_name}
          onChangeText={(value) => updateField('bank_account_holder_name', value)}
          placeholder="Nombre completo del titular de la cuenta"
          error={errors.bank_account_holder_name}
        />
      )}

      {formData.bank_account_type && (
        <View style={styles.infoBox}>
          <Ionicons name="information-circle-outline" size={20} color={colors.accent} />
          <Text style={styles.infoText}>
            {formData.bank_account_type === 'cbu' || formData.bank_account_type === 'cvu'
              ? 'El CBU/CVU se usa para transferencias bancarias en Argentina.'
              : formData.bank_account_type === 'alias'
              ? 'El ALIAS es una forma más fácil de recibir transferencias.'
              : 'Asegúrate de que los datos sean correctos para recibir tus pagos.'}
          </Text>
        </View>
      )}
    </ProfileSection>
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: spacing.md,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  typeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  typeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
    gap: spacing.xs,
    minWidth: 100,
  },
  typeButtonSelected: {
    borderColor: colors.accent,
    backgroundColor: colors.accent + '10',
  },
  typeButtonText: {
    fontSize: 12,
    color: colors.muted,
    fontWeight: '500',
  },
  typeButtonTextSelected: {
    color: colors.accent,
    fontWeight: '600',
  },
  description: {
    fontSize: 14,
    color: colors.muted,
    marginBottom: spacing.md,
    lineHeight: 20,
  },
  errorText: {
    fontSize: 12,
    color: colors.error,
    marginTop: spacing.xs,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.accent + '10',
    padding: spacing.md,
    borderRadius: 8,
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    color: colors.text,
    lineHeight: 18,
  },
});

