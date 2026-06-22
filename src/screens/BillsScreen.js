import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  RefreshControl, Alert, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useSettings } from '../context/SettingsContext';
import { spacing, radius, shadows } from '../theme';
import { formatCurrency } from '../utils/format';
import * as billsApi from '../api/bills';

function daysUntil(dateStr) {
  if (!dateStr) return null;
  const diff = new Date(dateStr) - new Date();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export default function BillsScreen({ navigation }) {
  const { colors, currency } = useSettings();
  const [bills, setBills] = useState([]);
  const [totalMonthly, setTotalMonthly] = useState(0);
  const [loading, setLoading] = useState(false);
  const [paying, setPaying] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await billsApi.getBills();
      setBills(data.bills || []);
      setTotalMonthly(data.totalMonthly || 0);
    } catch (err) {
      Alert.alert('Error', err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const handlePay = async (bill) => {
    setPaying(bill._id);
    try {
      await billsApi.payBill(bill._id);
      load();
    } catch (err) {
      Alert.alert('Error', err.message);
    } finally {
      setPaying(null);
    }
  };

  const handleUnpay = async (bill) => {
    Alert.alert('Undo Payment', 'Mark this bill as unpaid?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Undo', onPress: async () => {
          setPaying(bill._id);
          try {
            await billsApi.unpayBill(bill._id);
            load();
          } catch (err) {
            Alert.alert('Error', err.message);
          } finally {
            setPaying(null);
          }
        },
      },
    ]);
  };

  const handleDelete = (bill) => {
    Alert.alert('Delete Bill', `Delete "${bill.title}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: async () => {
          try {
            await billsApi.deleteBill(bill._id);
            load();
          } catch (err) {
            Alert.alert('Error', err.message);
          }
        },
      },
    ]);
  };

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
            <Text style={[styles.title, { color: colors.text }]}>Bills</Text>
            <Text style={[styles.subtitle, { color: colors.textMuted }]}>
              Monthly total: {formatCurrency(totalMonthly, currency)}
            </Text>
          </View>
        </View>
        <TouchableOpacity
          style={[styles.addBtn, { backgroundColor: colors.primary }]}
          onPress={() => navigation.navigate('AddEditBill')}
        >
          <Ionicons name="add" size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: spacing.md, paddingBottom: 40 }}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={load} tintColor={colors.primary} />}
      >
        {bills.length === 0 && !loading ? (
          <View style={styles.empty}>
            <Ionicons name="receipt-outline" size={56} color={colors.textMuted} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>No bills</Text>
            <Text style={[styles.emptySubtitle, { color: colors.textMuted }]}>Tap + to add a recurring bill</Text>
          </View>
        ) : (
          bills.map((bill) => {
            const days = daysUntil(bill.nextDueDate);
            const isOverdue = days !== null && days < 0;
            const isDueSoon = days !== null && days >= 0 && days <= 3;
            const urgentColor = isOverdue ? colors.danger : isDueSoon ? colors.warning : colors.textMuted;
            const catColor = bill.category?.color || colors.primary;

            return (
              <View key={bill._id} style={[styles.card, { backgroundColor: colors.card }]}>
                <View style={styles.cardTop}>
                  <View style={[styles.iconBox, { backgroundColor: catColor + '20' }]}>
                    <Ionicons name={bill.category?.icon || 'receipt-outline'} size={22} color={catColor} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.billTitle, { color: colors.text }]}>{bill.title}</Text>
                    {bill.nextDueDate && (
                      <Text style={[styles.dueText, { color: urgentColor }]}>
                        {isOverdue
                          ? `Overdue by ${Math.abs(days)} day${Math.abs(days) !== 1 ? 's' : ''}`
                          : days === 0
                          ? 'Due today'
                          : `Due in ${days} day${days !== 1 ? 's' : ''}`}
                      </Text>
                    )}
                  </View>
                  <View style={styles.cardRight}>
                    <Text style={[styles.amount, { color: colors.expense }]}>
                      {formatCurrency(bill.amount, currency)}
                    </Text>
                    <Text style={{ fontSize: 11, color: colors.textMuted }}>Day {bill.dueDay}</Text>
                  </View>
                </View>

                <View style={[styles.cardActions, { borderTopColor: colors.border }]}>
                  <TouchableOpacity
                    style={styles.actionLink}
                    onPress={() => navigation.navigate('AddEditBill', { bill })}
                  >
                    <Ionicons name="pencil-outline" size={14} color={colors.primary} />
                    <Text style={{ fontSize: 12, color: colors.primary, fontWeight: '600' }}>Edit</Text>
                  </TouchableOpacity>

                  {bill.isPaid ? (
                    <TouchableOpacity
                      style={[styles.payBtn, { backgroundColor: colors.border }]}
                      onPress={() => handleUnpay(bill)}
                      disabled={paying === bill._id}
                    >
                      {paying === bill._id
                        ? <ActivityIndicator size="small" color={colors.textMuted} />
                        : (
                          <>
                            <Ionicons name="checkmark" size={14} color={colors.textMuted} />
                            <Text style={{ fontSize: 12, color: colors.textMuted, fontWeight: '700' }}>Paid</Text>
                          </>
                        )}
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity
                      style={[styles.payBtn, { backgroundColor: colors.income }]}
                      onPress={() => handlePay(bill)}
                      disabled={paying === bill._id}
                    >
                      {paying === bill._id
                        ? <ActivityIndicator size="small" color="#fff" />
                        : (
                          <>
                            <Ionicons name="checkmark-circle-outline" size={14} color="#fff" />
                            <Text style={{ fontSize: 12, color: '#fff', fontWeight: '700' }}>Pay Now</Text>
                          </>
                        )}
                    </TouchableOpacity>
                  )}

                  <TouchableOpacity
                    style={styles.actionLink}
                    onPress={() => handleDelete(bill)}
                  >
                    <Ionicons name="trash-outline" size={14} color={colors.danger} />
                    <Text style={{ fontSize: 12, color: colors.danger, fontWeight: '600' }}>Delete</Text>
                  </TouchableOpacity>
                </View>
              </View>
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
  card: { borderRadius: radius.lg, padding: spacing.md, marginBottom: spacing.sm, ...shadows.small },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  iconBox: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  billTitle: { fontSize: 15, fontWeight: '600' },
  dueText: { fontSize: 12, marginTop: 2 },
  cardRight: { alignItems: 'flex-end' },
  amount: { fontSize: 16, fontWeight: '700' },
  cardActions: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginTop: spacing.sm, paddingTop: spacing.sm, borderTopWidth: 1,
  },
  actionLink: { flexDirection: 'row', alignItems: 'center', gap: 4, padding: 4 },
  payBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: spacing.md, paddingVertical: 6, borderRadius: radius.sm,
  },
  empty: { alignItems: 'center', paddingTop: 80, gap: spacing.sm },
  emptyTitle: { fontSize: 18, fontWeight: '600' },
  emptySubtitle: { fontSize: 14 },
});
