import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing } from '../../ui/theme';

interface ProfileSectionProps {
  title: string;
  children: React.ReactNode;
  hint?: string;
}

export function ProfileSection({ title, children, hint }: ProfileSectionProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      {hint && <Text style={styles.hint}>{hint}</Text>}
      <View style={styles.content}>
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.xl,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  hint: {
    fontSize: 12,
    color: colors.muted,
    marginBottom: spacing.md,
  },
  content: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
});

