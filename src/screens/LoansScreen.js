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
import * as loansApi from '../api/loans';

const STATUS_STYLES = {
  active: { color: '#6C5CE7', bg: '#6C5CE720', label: 'Active' },
  partially_paid: { color: '#FDCB6E', bg: '#FDCB6E20', label: 'Partial' },
  settled: { color: '#00B894', bg: '#00B89420', label: 'Settled' },
};

export default function LoansScreen({ navigation }) {
  const { colors, currency } = useSettings();
  const [loans, setLoans] = useState([]);
  const [totals, setTotals] = useState({ borrowed: 0, lent: 0 });
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('all');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await loansApi.getLoans();
      setLoans(data.loans || []);
      setTotals({ borrowed: data.totalBorrowed || 0, lent: data.totalLent || 0 });
    } catch (err) {
      Alert.alert('Error', err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const handleDelete = (loan) => {
    Alert.alert('Delete Loan', `Delete loan with ${loan.personName}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: async () => {
          try {
            await loansApi.deleteLoan(loan._id);
            load();
          } catch (err) {
            Alert.alert('Error', err.message);
          }
        },
      },
    ]);
  };

  const filtered = activeTab === 'all' ? loans : loans.filter((l) => l.type === activeTab);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top']}>
      <View style={styles.header}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
          {navigation.canGoBack() && (
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
              <Ionicons name="chevron-back" size={22} color={colors.primary} />
            </TouchableOpacity>
          )}
          <View>
            <Text style={[styles.title, { color: colors.text }]}>Loans</Text>
            <Text style={[styles.subtitle, { color: colors.textMuted }]}>
              Owed: {formatCurrency(totals.borrowed, currency)}  ·  Lent: {formatCurrency(totals.lent, currency)}
            </Text>
          </View>
        </View>
        <TouchableOpacity
          style={[styles.addBtn, { backgroundColor: colors.primary }]}
          onPress={() => navigation.navigate('AddEditLoan')}
        >
          <Ionicons name="add" size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={[styles.tabs, { backgroundColor: colors.card }]}>
        {[
          { key: 'all', label: 'All' },
          { key: 'borrowed', label: 'Borrowed' },
          { key: 'lent', label: 'Lent' },
        ].map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, activeTab === tab.key && { backgroundColor: colors.primary }]}
            onPress={() => setActiveTab(tab.key)}
          >
            <Text style={[styles.tabText, { color: activeTab === tab.key ? '#fff' : colors.textMuted }]}>
              {tab.label}
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
            <Ionicons name="receipt-outline" size={56} color={colors.textMuted} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>No loans</Text>
            <Text style={[styles.emptySubtitle, { color: colors.textMuted }]}>Tap + to add a loan</Text>
          </View>
        ) : (
          filtered.map((loan) => {
            const status = STATUS_STYLES[loan.status] || STATUS_STYLES.active;
            const isBorrowed = loan.type === 'borrowed';
            const typeColor = isBorrowed ? colors.expense : colors.income;
            const progress = loan.amount > 0 ? (loan.amount - loan.remainingAmount) / loan.amount : 0;
            return (
              <TouchableOpacity
                key={loan._id}
                style={[styles.card, { backgroundColor: colors.card }]}
                onPress={() => navigation.navigate('AddEditLoan', { loan })}
                activeOpacity={0.8}
              >
                <View style={styles.cardTop}>
                  <View style={styles.cardLeft}>
                    <View style={[styles.personIcon, { backgroundColor: typeColor + '20' }]}>
                      <Text style={{ fontSize: 18 }}>
                        {isBorrowed ? '📥' : '📤'}
                      </Text>
                    </View>
                    <View>
                      <Text style={[styles.personName, { color: colors.text }]}>{loan.personName}</Text>
                      <Text style={[styles.loanType, { color: typeColor }]}>
                        {isBorrowed ? 'You owe' : 'They owe you'}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.cardRight}>
                    <Text style={[styles.amount, { color: typeColor }]}>
                      {formatCurrency(loan.remainingAmount, currency)}
                    </Text>
                    <View style={[styles.statusBadge, { backgroundColor: status.bg }]}>
                      <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
                    </View>
                  </View>
                </View>

                {loan.amount > 0 && (
                  <View style={{ marginTop: spacing.sm }}>
                    <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
                      <View style={[styles.progressFill, { width: `${progress * 100}%`, backgroundColor: typeColor }]} />
                    </View>
                    <Text style={{ fontSize: 11, color: colors.textMuted, marginTop: 4 }}>
                      {formatCurrency(loan.amount - loan.remainingAmount, currency)} of {formatCurrency(loan.amount, currency)} paid
                    </Text>
                  </View>
                )}

                {loan.dueDate && (
                  <View style={styles.dueRow}>
                    <Ionicons name="calendar-outline" size={12} color={colors.textMuted} />
                    <Text style={{ fontSize: 11, color: colors.textMuted }}>
                      Due: {new Date(loan.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </Text>
                  </View>
                )}

                <TouchableOpacity
                  style={styles.deleteBtn}
                  onPress={() => handleDelete(loan)}
                  hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}
                >
                  <Ionicons name="trash-outline" size={14} color={colors.danger} />
                </TouchableOpacity>
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
  subtitle: { fontSize: 13, marginTop: 2 },
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
  tabText: { fontSize: 13, fontWeight: '600' },
  card: { borderRadius: radius.lg, padding: spacing.md, marginBottom: spacing.sm, ...shadows.small },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  cardLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, flex: 1 },
  cardRight: { alignItems: 'flex-end', gap: 4 },
  personIcon: { width: 42, height: 42, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  personName: { fontSize: 15, fontWeight: '600' },
  loanType: { fontSize: 12, marginTop: 2 },
  amount: { fontSize: 16, fontWeight: '700' },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  statusText: { fontSize: 11, fontWeight: '700' },
  progressBar: { height: 4, borderRadius: 2, overflow: 'hidden' },
  progressFill: { height: 4, borderRadius: 2 },
  dueRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6 },
  deleteBtn: { position: 'absolute', top: spacing.md, right: spacing.md },
  empty: { alignItems: 'center', paddingTop: 80, gap: spacing.sm },
  emptyTitle: { fontSize: 18, fontWeight: '600' },
  emptySubtitle: { fontSize: 14 },
});
