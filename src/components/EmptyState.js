import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSettings } from '../context/SettingsContext';
import { spacing } from '../theme';

export default function EmptyState({ icon, title, subtitle }) {
  const { colors } = useSettings();
  return (
    <View style={styles.container}>
      <Ionicons name={icon} size={64} color={colors.textMuted} />
      <Text style={[styles.title, { color: colors.textLight }]}>{title}</Text>
      {subtitle ? <Text style={[styles.subtitle, { color: colors.textMuted }]}>{subtitle}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', paddingVertical: spacing.xxl, paddingHorizontal: spacing.xl },
  title: { fontSize: 16, fontWeight: '600', marginTop: spacing.md, textAlign: 'center' },
  subtitle: { fontSize: 14, marginTop: spacing.xs, textAlign: 'center' },
});
