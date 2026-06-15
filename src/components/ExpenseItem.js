import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSettings } from '../context/SettingsContext';
import { spacing, radius, shadows } from '../theme';
import { formatCurrency } from '../utils/format';

export default function ExpenseItem({ expense, onPress }) {
  const { colors, currency } = useSettings();
  const isIncome = expense.type === 'income';
  const category = expense.category;

  return (
    <TouchableOpacity
      style={[styles.container, { backgroundColor: colors.card }]}
      onPress={onPress}
      activeOpacity={0.75}
    >
      <View style={[styles.iconBox, { backgroundColor: (category?.color || colors.primary) + '20' }]}>
        <Ionicons name={category?.icon || 'ellipsis-horizontal'} size={22} color={category?.color || colors.primary} />
      </View>
      <View style={styles.info}>
        <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>{expense.title}</Text>
        <View style={styles.metaRow}>
          <Text style={[styles.meta, { color: colors.textMuted }]}>
            {category?.name || 'Uncategorized'} · {expense.date ? new Date(expense.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—'}
          </Text>
          {expense.isRecurring && (
            <Ionicons name="repeat" size={12} color={colors.primary} style={{ marginLeft: 4 }} />
          )}
        </View>
      </View>
      <Text style={[styles.amount, { color: isIncome ? colors.income : colors.expense }]}>
        {isIncome ? '+' : '-'}{formatCurrency(expense.amount, currency)}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.sm,
    ...shadows.small,
  },
  iconBox: { width: 46, height: 46, borderRadius: 23, justifyContent: 'center', alignItems: 'center', marginRight: spacing.md },
  info: { flex: 1 },
  title: { fontSize: 16, fontWeight: '600', marginBottom: 2 },
  metaRow: { flexDirection: 'row', alignItems: 'center' },
  meta: { fontSize: 11 },
  amount: { fontSize: 15, fontWeight: '700' },
});
