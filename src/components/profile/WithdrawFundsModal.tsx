import React, { useEffect, useMemo, useState } from 'react';
import { Modal, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { colors, radii, spacing } from '../../ui/theme';
import { Button } from '../../ui/Button';

const MIN_WITHDRAW_AMOUNT_ARS = 1000;

function parseAmount(input: string): number | null {
  const normalized = input.replace(',', '.').replace(/[^\d.]/g, '').trim();
  if (!normalized) return null;
  const n = Number.parseFloat(normalized);
  return Number.isFinite(n) ? n : null;
}

type Props = {
  visible: boolean;
  availableAmount: number;
  loading?: boolean;
  onClose: () => void;
  onConfirm: (amount: number) => void | Promise<void>;
};

export function WithdrawFundsModal({ visible, availableAmount, loading, onClose, onConfirm }: Props) {
  const [amountText, setAmountText] = useState('');

  useEffect(() => {
    if (!visible) setAmountText('');
  }, [visible]);

  const amount = useMemo(() => {
    const n = parseAmount(amountText);
    return n === null ? null : Math.round(n * 100) / 100;
  }, [amountText]);

  const validationError = useMemo(() => {
    if (!visible) return null;
    if (amountText.trim().length === 0) return 'Ingresá un monto a retirar.';
    if (amount === null) return 'El monto ingresado no es válido.';
    if (amount <= MIN_WITHDRAW_AMOUNT_ARS) return `El monto mínimo debe ser mayor a $${MIN_WITHDRAW_AMOUNT_ARS}.`;
    if (amount > availableAmount) return 'El monto supera tu saldo disponible.';
    return null;
  }, [visible, amountText, amount, availableAmount]);

  const canSubmit = !loading && validationError === null && amount !== null;

  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Text style={styles.title}>Retirar dinero</Text>
          <Text style={styles.subtitle}>
            Disponible: ${availableAmount.toLocaleString()}
          </Text>

          <Text style={styles.label}>Monto a retirar</Text>
          <TextInput
            value={amountText}
            onChangeText={setAmountText}
            placeholder="Ej: 1500"
            placeholderTextColor={colors.muted}
            keyboardType="numeric"
            autoFocus
            style={styles.input}
          />
          <Text style={styles.help}>Mínimo: más de ${MIN_WITHDRAW_AMOUNT_ARS}.</Text>
          {validationError ? <Text style={styles.error}>{validationError}</Text> : null}

          <View style={styles.actions}>
            <TouchableOpacity onPress={onClose} disabled={!!loading} style={styles.cancel}>
              <Text style={styles.cancelText}>Cancelar</Text>
            </TouchableOpacity>
            <Button
              title="Retirar"
              loading={loading}
              disabled={!canSubmit}
              onPress={() => {
                if (amount === null) return;
                void onConfirm(amount);
              }}
              style={styles.confirm}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: spacing.xl,
    justifyContent: 'center',
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: radii.lg,
    padding: spacing.lg,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
  },
  subtitle: {
    marginTop: spacing.sm,
    marginBottom: spacing.lg,
    color: colors.muted,
    textAlign: 'center',
  },
  label: {
    color: colors.text,
    marginBottom: spacing.xs,
    fontWeight: '600',
  },
  input: {
    backgroundColor: colors.white,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radii.md,
    padding: spacing.md,
    color: colors.text,
  },
  help: {
    marginTop: spacing.xs,
    color: colors.muted,
    fontSize: 12,
  },
  error: {
    marginTop: spacing.xs,
    color: colors.error,
    fontSize: 12,
  },
  actions: {
    marginTop: spacing.lg,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.md,
  },
  cancel: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.md,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.white,
    flex: 1,
    alignItems: 'center',
  },
  cancelText: {
    color: colors.text,
    fontWeight: '600',
  },
  confirm: {
    flex: 1,
  },
});

