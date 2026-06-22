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
import * as splitsApi from '../api/splits';

export default function SplitsScreen({ navigation }) {
  const { colors, currency } = useSettings();
  const [splits, setSplits] = useState([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await splitsApi.getSplits();
      setSplits(Array.isArray(data) ? data : []);
    } catch (err) {
      Alert.alert('Error', err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const handleDelete = (split) => {
    Alert.alert('Delete Split', `Delete "${split.title}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: async () => {
          try {
            await splitsApi.deleteSplit(split._id);
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
          <Text style={[styles.title, { color: colors.text }]}>Split Expenses</Text>
        </View>
        <TouchableOpacity
          style={[styles.addBtn, { backgroundColor: colors.primary }]}
          onPress={() => navigation.navigate('AddEditSplit')}
        >
          <Ionicons name="add" size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: spacing.md, paddingBottom: 40 }}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={load} tintColor={colors.primary} />}
      >
        {splits.length === 0 && !loading ? (
          <View style={styles.empty}>
            <Ionicons name="people-outline" size={56} color={colors.textMuted} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>No split expenses</Text>
            <Text style={[styles.emptySubtitle, { color: colors.textMuted }]}>
              Tap + to split a bill with friends
            </Text>
          </View>
        ) : (
          splits.map((split) => {
            const outstanding = split.participants
              ?.filter((p) => !p.isPaid)
              .reduce((sum, p) => sum + p.share, 0) || 0;
            const paidCount = split.participants?.filter((p) => p.isPaid).length || 0;
            const total = split.participants?.length || 0;
            const isSettled = outstanding === 0 && total > 0;

            return (
              <TouchableOpacity
                key={split._id}
                style={[styles.card, { backgroundColor: colors.card }]}
                onPress={() => navigation.navigate('AddEditSplit', { split })}
                activeOpacity={0.8}
              >
                <View style={styles.cardTop}>
                  <View style={[styles.iconBox, { backgroundColor: colors.primary + '15' }]}>
                    <Ionicons name="people-outline" size={22} color={colors.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.splitTitle, { color: colors.text }]}>{split.title}</Text>
                    <Text style={[styles.splitDate, { color: colors.textMuted }]}>
                      {split.date
                        ? new Date(split.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                        : ''}
                    </Text>
                  </View>
                  <View style={styles.cardRight}>
                    <Text style={[styles.totalAmt, { color: colors.text }]}>
                      {formatCurrency(split.totalAmount, currency)}
                    </Text>
                    <View style={[
                      styles.badge,
                      { backgroundColor: isSettled ? colors.income + '20' : colors.warning + '20' },
                    ]}>
                      <Text style={{ fontSize: 11, fontWeight: '700', color: isSettled ? colors.income : colors.warning }}>
                        {isSettled ? 'Settled' : `${paidCount}/${total} paid`}
                      </Text>
                    </View>
                  </View>
                </View>

                {!isSettled && outstanding > 0 && (
                  <View style={[styles.outstandingRow, { borderTopColor: colors.border }]}>
                    <Ionicons name="alert-circle-outline" size={14} color={colors.warning} />
                    <Text style={{ fontSize: 12, color: colors.warning }}>
                      Outstanding: {formatCurrency(outstanding, currency)}
                    </Text>
                  </View>
                )}

                {/* Participants preview */}
                <View style={styles.participantsRow}>
                  {split.participants?.slice(0, 4).map((p, i) => (
                    <View
                      key={p._id || i}
                      style={[
                        styles.participantChip,
                        { backgroundColor: p.isPaid ? colors.income + '20' : colors.border },
                      ]}
                    >
                      <Text style={{ fontSize: 11, color: p.isPaid ? colors.income : colors.textMuted }}>
                        {p.name?.split(' ')[0]}
                      </Text>
                    </View>
                  ))}
                  {split.participants?.length > 4 && (
                    <Text style={{ fontSize: 11, color: colors.textMuted }}>+{split.participants.length - 4}</Text>
                  )}
                </View>

                <TouchableOpacity
                  style={styles.deleteBtn}
                  onPress={() => handleDelete(split)}
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
  addBtn: {
    width: 40, height: 40, borderRadius: 20,
    justifyContent: 'center', alignItems: 'center', ...shadows.medium,
  },
  backBtn: { padding: 2 },
  card: { borderRadius: radius.lg, padding: spacing.md, marginBottom: spacing.sm, ...shadows.small },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
  iconBox: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  splitTitle: { fontSize: 15, fontWeight: '600' },
  splitDate: { fontSize: 12, marginTop: 2 },
  cardRight: { alignItems: 'flex-end', gap: 4 },
  totalAmt: { fontSize: 16, fontWeight: '700' },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  outstandingRow: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    marginTop: spacing.sm, paddingTop: spacing.sm, borderTopWidth: 1,
  },
  participantsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: spacing.sm },
  participantChip: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  deleteBtn: { position: 'absolute', top: spacing.md, right: spacing.md },
  empty: { alignItems: 'center', paddingTop: 80, gap: spacing.sm },
  emptyTitle: { fontSize: 18, fontWeight: '600' },
  emptySubtitle: { fontSize: 14, textAlign: 'center' },
});
