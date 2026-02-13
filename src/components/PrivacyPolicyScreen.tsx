import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Linking,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { PRIVACY_POLICY_SECTIONS } from '../constants/privacyPolicy';
import { colors, spacing } from '../ui/theme';
import { Button } from '../ui/Button';

/** URL de la página web para solicitar eliminación de datos. Configurar con EXPO_PUBLIC_LANDING_URL en .env */
const DATA_DELETION_PAGE_URL = (Constants.expoConfig?.extra?.landingUrl as string) || (process.env.EXPO_PUBLIC_LANDING_URL as string)
  ? `${((Constants.expoConfig?.extra?.landingUrl as string) || process.env.EXPO_PUBLIC_LANDING_URL || '').replace(/\/$/, '')}/eliminar-datos`
  : '';

type Props = {
  /** Si es true, muestra el botón "Acepto las Políticas" (pantalla bloqueante) */
  requireAccept?: boolean;
  /** Callback al aceptar. Solo se usa cuando requireAccept es true */
  onAccept?: () => Promise<void>;
  /** Si es true, muestra botón "Volver" en el header (para vista desde registro) */
  showBackButton?: boolean;
};

export default function PrivacyPolicyScreen({
  requireAccept = false,
  onAccept,
  showBackButton = true,
}: Props) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [accepting, setAccepting] = useState(false);

  const handleAccept = async () => {
    if (!onAccept) return;
    setAccepting(true);
    try {
      await onAccept();
    } finally {
      setAccepting(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        {showBackButton && !requireAccept && (
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Ionicons name="chevron-back" size={24} color={colors.text} />
            <Text style={styles.backText}>Volver</Text>
          </TouchableOpacity>
        )}
        <Text style={styles.title}>Política de Privacidad</Text>
        <Text style={styles.updated}>Última actualización: Febrero 2025</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {PRIVACY_POLICY_SECTIONS.map((section, index) => (
          <View key={index} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <Text style={styles.sectionContent}>{section.content}</Text>
          </View>
        ))}
        {DATA_DELETION_PAGE_URL ? (
          <View style={styles.section}>
            <Text style={styles.sectionContent}>
              Para solicitar la eliminación de tus datos puedes contactarnos desde la web:{' '}
              <Text
                style={styles.link}
                onPress={() => Linking.openURL(DATA_DELETION_PAGE_URL)}
              >
                Solicitar eliminación de datos
              </Text>
            </Text>
          </View>
        ) : null}
      </ScrollView>

      {requireAccept && (
        <View style={[styles.footer, { paddingBottom: Math.max(spacing.lg, insets.bottom) }]}>
          <Text style={styles.footerText}>
            Para utilizar la aplicación debes aceptar las Políticas de Privacidad.
          </Text>
          <Button
            title={accepting ? 'Aceptando...' : 'Acepto las Políticas de Privacidad'}
            onPress={handleAccept}
            loading={accepting}
            disabled={accepting}
            style={styles.acceptButton}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    backgroundColor: colors.white,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  backText: {
    fontSize: 16,
    color: colors.primary,
    marginLeft: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
  },
  updated: {
    fontSize: 13,
    color: colors.muted,
    marginTop: 4,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xl * 2,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  sectionContent: {
    fontSize: 15,
    lineHeight: 22,
    color: colors.muted,
  },
  link: {
    color: colors.primary,
    textDecorationLine: 'underline',
  },
  footer: {
    backgroundColor: colors.white,
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    marginBottom: spacing.lg,
  },
  footerText: {
    fontSize: 14,
    color: colors.muted,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  acceptButton: {
    marginTop: 0,
  },
});
