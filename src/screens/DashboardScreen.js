import React, { useEffect, useCallback, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import { spacing, radius, shadows } from '../theme';
import { formatCurrency } from '../utils/format';
import ExpenseItem from '../components/ExpenseItem';
import EmptyState from '../components/EmptyState';
import * as budgetApi from '../api/budgets';
import client from '../api/client';

// Process recurring at most once per calendar day across all re-renders
let recurringCalledDate = null;

const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Good Morning';
  if (h < 17) return 'Good Afternoon';
  return 'Good Evening';
};

export default function DashboardScreen({ navigation }) {
  const { expenses, stats, loading, fetchExpenses, fetchStats, markDirty } = useApp();
  const { user } = useAuth();
  const { colors, currency } = useSettings();
  const [budgets, setBudgets] = useState([]);

  const loadData = useCallback(() => {
    const now = new Date();
    const today = now.toDateString();
    // Trigger recurring once per day; if it runs, force a fresh expense fetch
    if (recurringCalledDate !== today) {
      recurringCalledDate = today;
      client.post('/expenses/process-recurring')
        .then((res) => { if (res?.created?.length > 0) markDirty(); })
        .catch(() => {});
      fetchExpenses({ limit: 10 }, true); // force: recurring may add entries
    } else {
      fetchExpenses({ limit: 10 });
    }
    fetchStats({ month: now.getMonth() + 1, year: now.getFullYear() });
    budgetApi.getBudgets({ month: now.getMonth() + 1, year: now.getFullYear() }).then(setBudgets).catch(() => {});
  }, [fetchExpenses, fetchStats, markDirty]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', loadData);
    return unsubscribe;
  }, [navigation, loadData]);

  const currentMonth = new Date().toLocaleString('default', { month: 'long', year: 'numeric' });
  const alertBudgets = budgets.filter((b) => b.amount > 0 && b.spent / b.amount >= 0.8);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} refreshControl={<RefreshControl refreshing={loading} onRefresh={loadData} tintColor={colors.primary} />}>
        <LinearGradient colors={['#6C5CE7', '#A29BFE']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.header}>
          <View style={styles.headerTop}>
            <View>
              <Text style={styles.greeting}>{getGreeting()}, {user?.username} 👋</Text>
              <Text style={styles.month}>{currentMonth}</Text>
            </View>
            <TouchableOpacity style={styles.settingsBtn} onPress={() => navigation.navigate('Profile')}>
              <Ionicons name="settings-outline" size={22} color="#fff" />
            </TouchableOpacity>
          </View>

          <View style={[styles.balanceCard, { backgroundColor: colors.card }]}>
            <Text style={[styles.balanceLabel, { color: colors.textLight }]}>Total Balance</Text>
            <Text style={[styles.balanceAmount, { color: colors.text }]}>{formatCurrency(stats?.balance || 0, currency)}</Text>
            <View style={styles.summaryRow}>
              <View style={styles.summaryItem}>
                <View style={[styles.summaryIcon, { backgroundColor: 'rgba(0,184,148,0.15)' }]}>
                  <Ionicons name="arrow-down" size={16} color={colors.income} />
                </View>
                <View>
                  <Text style={[styles.summaryLabel, { color: colors.textLight }]}>Income</Text>
                  <Text style={[styles.summaryAmount, { color: colors.income }]}>{formatCurrency(stats?.totalIncome || 0, currency)}</Text>
                </View>
              </View>
              <View style={[styles.divider, { backgroundColor: colors.border }]} />
              <View style={styles.summaryItem}>
                <View style={[styles.summaryIcon, { backgroundColor: 'rgba(255,107,107,0.15)' }]}>
                  <Ionicons name="arrow-up" size={16} color={colors.expense} />
                </View>
                <View>
                  <Text style={[styles.summaryLabel, { color: colors.textLight }]}>Expenses</Text>
                  <Text style={[styles.summaryAmount, { color: colors.expense }]}>{formatCurrency(stats?.totalExpense || 0, currency)}</Text>
                </View>
              </View>
            </View>
          </View>
        </LinearGradient>

        {/* Add Button */}
        <View style={[styles.addBtnWrapper]}>
          <TouchableOpacity style={[styles.addBtn, { backgroundColor: colors.primary }]} onPress={() => navigation.navigate('AddEditExpense')} activeOpacity={0.85}>
            <Ionicons name="add-circle" size={22} color="#fff" />
            <Text style={styles.addBtnText}>Add Transaction</Text>
          </TouchableOpacity>
        </View>

        {/* Budget Alerts */}
        {alertBudgets.length > 0 && (
          <View style={{ paddingHorizontal: spacing.md, marginTop: spacing.md }}>
            <Text style={[styles.sectionTitle, { color: colors.text, marginBottom: spacing.sm }]}>⚠️ Budget Alerts</Text>
            {alertBudgets.map((b) => {
              const pct = Math.min(b.spent / b.amount, 1);
              const isOver = b.spent > b.amount;
              const barColor = isOver ? colors.expense : colors.warning;
              return (
                <View key={b._id} style={[styles.budgetCard, { backgroundColor: colors.card }]}>
                  <View style={styles.budgetTop}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <View style={[styles.budgetDot, { backgroundColor: b.category?.color || colors.primary }]} />
                      <Text style={[styles.budgetName, { color: colors.text }]}>{b.category?.name}</Text>
                    </View>
                    <Text style={{ fontSize: 12, fontWeight: '700', color: barColor }}>
                      {formatCurrency(b.spent, currency)} / {formatCurrency(b.amount, currency)}
                    </Text>
                  </View>
                  <View style={[styles.budgetBar, { backgroundColor: colors.border }]}>
                    <View style={[styles.budgetFill, { width: `${pct * 100}%`, backgroundColor: barColor }]} />
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* Recent Transactions */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Recent Transactions</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Transactions')}>
              <Text style={{ fontSize: 13, color: colors.primary, fontWeight: '600' }}>See All</Text>
            </TouchableOpacity>
          </View>
          {loading && expenses.length === 0 ? (
            <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.xl }} />
          ) : expenses.length === 0 ? (
            <EmptyState icon="receipt-outline" title="No transactions yet" subtitle="Tap 'Add Transaction' to get started" />
          ) : (
            expenses.slice(0, 5).map((expense) => (
              <ExpenseItem key={expense._id} expense={expense} onPress={() => navigation.navigate('AddEditExpense', { expense })} />
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: spacing.md, paddingBottom: spacing.xl + 16 },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: spacing.md, marginBottom: spacing.lg },
  greeting: { fontSize: 20, fontWeight: '700', color: '#fff' },
  month: { fontSize: 13, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
  settingsBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
  balanceCard: { borderRadius: radius.xl, padding: spacing.lg, marginTop: spacing.sm, ...shadows.medium },
  balanceLabel: { fontSize: 13, marginBottom: 4 },
  balanceAmount: { fontSize: 34, fontWeight: '800', marginBottom: spacing.md },
  summaryRow: { flexDirection: 'row', alignItems: 'center' },
  summaryItem: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  summaryIcon: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  summaryLabel: { fontSize: 12 },
  summaryAmount: { fontSize: 15, fontWeight: '700' },
  divider: { width: 1, height: 40, marginHorizontal: spacing.md },
  addBtnWrapper: { paddingHorizontal: spacing.md, marginTop: -12 },
  addBtn: { borderRadius: radius.md, padding: spacing.md, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: spacing.sm, ...shadows.large },
  addBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  section: { paddingHorizontal: spacing.md, paddingTop: spacing.lg, paddingBottom: spacing.xl },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
  sectionTitle: { fontSize: 18, fontWeight: '600' },
  budgetCard: { borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.sm, ...shadows.small },
  budgetTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  budgetDot: { width: 10, height: 10, borderRadius: 5 },
  budgetName: { fontSize: 14, fontWeight: '600' },
  budgetBar: { height: 6, borderRadius: 3, overflow: 'hidden' },
  budgetFill: { height: 6, borderRadius: 3 },
});
