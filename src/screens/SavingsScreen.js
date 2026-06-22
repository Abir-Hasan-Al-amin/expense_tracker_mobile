import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  RefreshControl, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useSettings } from '../context/SettingsContext';
import { spacing, radius, shadows } from '../theme';
import { formatCurrency } from '../utils/format';
import * as savingsApi from '../api/savings';

const STATUS_COLORS = {
  active: '#6C5CE7',
  completed: '#00B894',
  cancelled: '#636E72',
};

export default function SavingsScreen({ navigation }) {
  const { colors, currency } = useSettings();
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeFilter, setActiveFilter] = useState('active');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await savingsApi.getSavings();
      setGoals(Array.isArray(data) ? data : []);
    } catch (err) {
      Alert.alert('Error', err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const handleDelete = (goal) => {
    Alert.alert('Delete Goal', `Delete "${goal.title}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: async () => {
          try {
            await savingsApi.deleteSavings(goal._id);
            load();
          } catch (err) {
            Alert.alert('Error', err.message);
          }
        },
      },
    ]);
  };

  const filtered = goals.filter((g) => g.status === activeFilter);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top']}>
      <View style={styles.header}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
          {navigation.canGoBack() && (
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
              <Ionicons name="chevron-back" size={22} color={colors.primary} />
            </TouchableOpacity>
          )}
          <Text style={[styles.title, { color: colors.text }]}>Savings Goals</Text>
        </View>
        <TouchableOpacity
          style={[styles.addBtn, { backgroundColor: colors.primary }]}
          onPress={() => navigation.navigate('AddEditSavings')}
        >
          <Ionicons name="add" size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Filter tabs */}
      <View style={[styles.tabs, { backgroundColor: colors.card }]}>
        {['active', 'completed', 'cancelled'].map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.tab, activeFilter === f && { backgroundColor: STATUS_COLORS[f] }]}
            onPress={() => setActiveFilter(f)}
          >
            <Text style={[styles.tabText, { color: activeFilter === f ? '#fff' : colors.textMuted, textTransform: 'capitalize' }]}>
              {f}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: spacing.md, paddingBottom: 40 }}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={load} tintColor={colors.primary} />}
      >
        {filtered.length === 0 && !loading ? (
          <View style={styles.empty}>
            <Text style={{ fontSize: 48 }}>🎯</Text>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>No savings goals</Text>
            <Text style={[styles.emptySubtitle, { color: colors.textMuted }]}>Tap + to create a goal</Text>
          </View>
        ) : (
          filtered.map((goal) => {
            const pct = goal.targetAmount > 0
              ? Math.min((goal.currentAmount / goal.targetAmount) * 100, 100)
              : 0;
            const statusColor = STATUS_COLORS[goal.status] || colors.primary;
            return (
              <TouchableOpacity
                key={goal._id}
                style={[styles.card, { backgroundColor: colors.card }]}
                onPress={() => navigation.navigate('AddEditSavings', { goal })}
                activeOpacity={0.8}
              >
                <View style={styles.cardTop}>
                  <View style={[styles.iconBox, { backgroundColor: statusColor + '15' }]}>
                    <Text style={{ fontSize: 24 }}>{goal.icon || '🎯'}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.goalTitle, { color: colors.text }]}>{goal.title}</Text>
                    <Text style={[styles.goalAmount, { color: colors.textMuted }]}>
                      {formatCurrency(goal.currentAmount, currency)} / {formatCurrency(goal.targetAmount, currency)}
                    </Text>
                  </View>
                  <View style={styles.rightCol}>
                    <Text style={[styles.pct, { color: statusColor }]}>{Math.round(pct)}%</Text>
                    <TouchableOpacity onPress={() => handleDelete(goal)}>
                      <Ionicons name="trash-outline" size={16} color={colors.danger} />
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={{ marginTop: spacing.sm }}>
                  <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
                    <View style={[styles.progressFill, { width: `${pct}%`, backgroundColor: statusColor }]} />
                  </View>
                </View>

                {goal.deadline && (
                  <View style={styles.deadlineRow}>
                    <Ionicons name="calendar-outline" size={12} color={colors.textMuted} />
                    <Text style={{ fontSize: 11, color: colors.textMuted }}>
                      Deadline: {new Date(goal.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: spacing.md, paddingTop: spacing.md, paddingBottom: spacing.sm,
  },
  title: { fontSize: 28, fontWeight: '700' },
  addBtn: {
    width: 40, height: 40, borderRadius: 20,
    justifyContent: 'center', alignItems: 'center', ...shadows.medium,
  },
  backBtn: { padding: 2 },
  tabs: {
    flexDirection: 'row', marginHorizontal: spacing.md, marginBottom: spacing.sm,
    borderRadius: radius.md, padding: 4, ...shadows.small,
  },
  tab: { flex: 1, paddingVertical: spacing.sm, borderRadius: radius.sm, alignItems: 'center' },
  tabText: { fontSize: 12, fontWeight: '600' },
  card: { borderRadius: radius.lg, padding: spacing.md, marginBottom: spacing.sm, ...shadows.small },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  iconBox: { width: 48, height: 48, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  goalTitle: { fontSize: 15, fontWeight: '600' },
  goalAmount: { fontSize: 13, marginTop: 2 },
  rightCol: { alignItems: 'flex-end', gap: spacing.sm },
  pct: { fontSize: 18, fontWeight: '800' },
  progressBar: { height: 6, borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: 6, borderRadius: 3 },
  deadlineRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6 },
  empty: { alignItems: 'center', paddingTop: 80, gap: spacing.sm },
  emptyTitle: { fontSize: 18, fontWeight: '600' },
  emptySubtitle: { fontSize: 14 },
});
