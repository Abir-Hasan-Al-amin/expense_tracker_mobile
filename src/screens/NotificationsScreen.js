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
import * as notificationsApi from '../api/notifications';

const NOTIF_ICONS = {
  loan_due: { icon: 'time-outline', color: '#E17055' },
  loan_settled: { icon: 'checkmark-circle-outline', color: '#00B894' },
  goal_milestone: { icon: 'trophy-outline', color: '#FDCB6E' },
  goal_completed: { icon: 'star-outline', color: '#00B894' },
  bill_due: { icon: 'receipt-outline', color: '#E17055' },
  bill_overdue: { icon: 'alert-circle-outline', color: '#FF6B6B' },
  budget_exceeded: { icon: 'trending-up-outline', color: '#FF6B6B' },
  transfer: { icon: 'swap-horizontal-outline', color: '#6C5CE7' },
};

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function NotificationsScreen({ navigation }) {
  const { colors } = useSettings();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await notificationsApi.getNotifications({ limit: 100 });
      setNotifications(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
    } catch (err) {
      Alert.alert('Error', err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const handleMarkAllRead = async () => {
    try {
      await notificationsApi.markAllRead();
      load();
    } catch (err) {
      Alert.alert('Error', err.message);
    }
  };

  const handleMarkRead = async (notif) => {
    if (notif.isRead) return;
    try {
      await notificationsApi.markRead(notif._id);
      setNotifications((prev) =>
        prev.map((n) => n._id === notif._id ? { ...n, isRead: true } : n)
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch {
      // ignore
    }
  };

  const handleDelete = async (id) => {
    try {
      await notificationsApi.deleteNotification(id);
      setNotifications((prev) => prev.filter((n) => n._id !== id));
    } catch (err) {
      Alert.alert('Error', err.message);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top']}>
      <View style={styles.header}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
          {navigation.canGoBack() && (
            <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 2 }}>
              <Ionicons name="chevron-back" size={22} color={colors.primary} />
            </TouchableOpacity>
          )}
          <View>
            <Text style={[styles.title, { color: colors.text }]}>Notifications</Text>
            {unreadCount > 0 && (
              <Text style={[styles.subtitle, { color: colors.textMuted }]}>
                {unreadCount} unread
              </Text>
            )}
          </View>
        </View>
        {unreadCount > 0 && (
          <TouchableOpacity
            style={[styles.markAllBtn, { backgroundColor: colors.primary + '15' }]}
            onPress={handleMarkAllRead}
          >
            <Ionicons name="checkmark-done-outline" size={16} color={colors.primary} />
            <Text style={{ fontSize: 12, color: colors.primary, fontWeight: '600' }}>Mark all read</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: spacing.md, paddingBottom: 40 }}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={load} tintColor={colors.primary} />}
      >
        {notifications.length === 0 && !loading ? (
          <View style={styles.empty}>
            <Ionicons name="notifications-off-outline" size={56} color={colors.textMuted} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>No notifications</Text>
            <Text style={[styles.emptySubtitle, { color: colors.textMuted }]}>You're all caught up!</Text>
          </View>
        ) : (
          notifications.map((notif) => {
            const style = NOTIF_ICONS[notif.type] || { icon: 'notifications-outline', color: colors.primary };
            return (
              <TouchableOpacity
                key={notif._id}
                style={[
                  styles.card,
                  {
                    backgroundColor: notif.isRead ? colors.card : colors.primary + '08',
                    borderLeftColor: notif.isRead ? colors.border : style.color,
                  },
                ]}
                onPress={() => handleMarkRead(notif)}
                activeOpacity={0.8}
              >
                <View style={[styles.iconBox, { backgroundColor: style.color + '20' }]}>
                  <Ionicons name={style.icon} size={20} color={style.color} />
                </View>
                <View style={{ flex: 1 }}>
                  <View style={styles.notifTop}>
                    <Text style={[styles.notifTitle, { color: colors.text }]} numberOfLines={1}>
                      {notif.title}
                    </Text>
                    {!notif.isRead && (
                      <View style={[styles.dot, { backgroundColor: style.color }]} />
                    )}
                  </View>
                  <Text style={[styles.notifMsg, { color: colors.textMuted }]} numberOfLines={2}>
                    {notif.message}
                  </Text>
                  <Text style={[styles.notifTime, { color: colors.textMuted }]}>
                    {timeAgo(notif.createdAt)}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => handleDelete(notif._id)}
                  hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}
                >
                  <Ionicons name="close" size={16} color={colors.textMuted} />
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
  markAllBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: radius.md,
  },
  card: {
    flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md,
    borderRadius: radius.lg, padding: spacing.md, marginBottom: spacing.sm,
    borderLeftWidth: 3, ...shadows.small,
  },
  iconBox: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center', flexShrink: 0 },
  notifTop: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  dot: { width: 8, height: 8, borderRadius: 4 },
  notifTitle: { fontSize: 14, fontWeight: '600', flex: 1 },
  notifMsg: { fontSize: 13, marginTop: 2, lineHeight: 18 },
  notifTime: { fontSize: 11, marginTop: 4 },
  empty: { alignItems: 'center', paddingTop: 80, gap: spacing.sm },
  emptyTitle: { fontSize: 18, fontWeight: '600' },
  emptySubtitle: { fontSize: 14 },
});
