import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useSettings } from '../context/SettingsContext';
import { spacing, radius, shadows } from '../theme';
import * as notificationsApi from '../api/notifications';
import * as billsApi from '../api/bills';
import * as loansApi from '../api/loans';
import * as savingsApi from '../api/savings';
import * as splitsApi from '../api/splits';

const FEATURE_CARDS = [
  {
    key: 'Bills',
    label: 'Bills',
    icon: 'receipt-outline',
    color: '#E17055',
    desc: 'Track recurring bills',
  },
  {
    key: 'Loans',
    label: 'Loans',
    icon: 'people-outline',
    color: '#6C5CE7',
    desc: 'Borrowed & lent money',
  },
  {
    key: 'Savings',
    label: 'Savings Goals',
    icon: 'trending-up-outline',
    color: '#00B894',
    desc: 'Save toward goals',
  },
  {
    key: 'Splits',
    label: 'Split Expenses',
    icon: 'git-branch-outline',
    color: '#FDCB6E',
    desc: 'Split bills with friends',
  },
  {
    key: 'Notifications',
    label: 'Notifications',
    icon: 'notifications-outline',
    color: '#74B9FF',
    desc: 'Alerts & reminders',
  },
  {
    key: 'Categories',
    label: 'Categories',
    icon: 'grid-outline',
    color: '#A29BFE',
    desc: 'Manage categories',
  },
];

export default function MoreScreen({ navigation }) {
  const { colors } = useSettings();
  const [unread, setUnread] = useState(0);
  const [counts, setCounts] = useState({});

  useFocusEffect(useCallback(() => {
    Promise.all([
      notificationsApi.getNotifications({ limit: 1 }).catch(() => null),
      billsApi.getBills().catch(() => null),
      loansApi.getLoans().catch(() => null),
      savingsApi.getSavings({ status: 'active' }).catch(() => null),
      splitsApi.getSplits().catch(() => null),
    ]).then(([notifs, bills, loans, savings, splits]) => {
      setUnread(notifs?.unreadCount || 0);
      setCounts({
        Bills: bills?.bills?.length || 0,
        Loans: loans?.loans?.length || 0,
        Savings: (Array.isArray(savings) ? savings : []).length,
        Splits: (Array.isArray(splits) ? splits : []).length,
      });
    });
  }, []));

  const getBadge = (key) => {
    if (key === 'Notifications') return unread > 0 ? unread : null;
    const count = counts[key];
    return count > 0 ? count : null;
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top']}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>More</Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: spacing.md, paddingBottom: 40 }}
      >
        <View style={styles.grid}>
          {FEATURE_CARDS.map((card) => {
            const badge = getBadge(card.key);
            return (
              <TouchableOpacity
                key={card.key}
                style={[styles.card, { backgroundColor: colors.card }]}
                onPress={() => navigation.navigate(card.key)}
                activeOpacity={0.8}
              >
                <View style={[styles.iconWrap, { backgroundColor: card.color + '20' }]}>
                  <Ionicons name={card.icon} size={26} color={card.color} />
                  {badge != null && (
                    <View style={[styles.badge, { backgroundColor: card.color }]}>
                      <Text style={styles.badgeText}>{badge > 99 ? '99+' : badge}</Text>
                    </View>
                  )}
                </View>
                <Text style={[styles.cardLabel, { color: colors.text }]}>{card.label}</Text>
                <Text style={[styles.cardDesc, { color: colors.textMuted }]}>{card.desc}</Text>
                <Ionicons
                  name="chevron-forward"
                  size={14}
                  color={colors.textMuted}
                  style={styles.chevron}
                />
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: spacing.md, paddingTop: spacing.md, paddingBottom: spacing.sm,
  },
  title: { fontSize: 28, fontWeight: '700' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  card: {
    width: '47%', borderRadius: radius.lg, padding: spacing.md,
    ...shadows.small, position: 'relative',
  },
  iconWrap: {
    width: 52, height: 52, borderRadius: 14,
    justifyContent: 'center', alignItems: 'center',
    marginBottom: spacing.sm, position: 'relative',
  },
  badge: {
    position: 'absolute', top: -4, right: -4,
    minWidth: 18, height: 18, borderRadius: 9,
    justifyContent: 'center', alignItems: 'center', paddingHorizontal: 4,
  },
  badgeText: { fontSize: 10, fontWeight: '700', color: '#fff' },
  cardLabel: { fontSize: 15, fontWeight: '700', marginBottom: 2 },
  cardDesc: { fontSize: 12, lineHeight: 16 },
  chevron: { position: 'absolute', top: spacing.md, right: spacing.md },
});
