import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, TextInput, Modal, Switch, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { useSettings, CURRENCIES } from '../context/SettingsContext';
import { spacing, radius, shadows } from '../theme';
import client from '../api/client';

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const { markDirty, resetCategories } = useApp();
  const { colors, isDark, toggleTheme, currency, setCurrency } = useSettings();

  const [showPwModal, setShowPwModal] = useState(false);
  const [showCurrencyModal, setShowCurrencyModal] = useState(false);
  const [showRestoreModal, setShowRestoreModal] = useState(false);
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [pwLoading, setPwLoading] = useState(false);
  const [backupLoading, setBackupLoading] = useState(false);
  const [restoreLoading, setRestoreLoading] = useState(false);
  const [restoreData, setRestoreData] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTransactions, setDeleteTransactions] = useState(false);
  const [deleteCategories, setDeleteCategories] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const handleChangePassword = async () => {
    if (!currentPw || !newPw || !confirmPw) return Alert.alert('Error', 'Fill in all fields.');
    if (newPw.length < 6) return Alert.alert('Error', 'New password must be at least 6 characters.');
    if (newPw !== confirmPw) return Alert.alert('Error', 'Passwords do not match.');
    setPwLoading(true);
    try {
      await client.post('/auth/change-password', { currentPassword: currentPw, newPassword: newPw });
      Alert.alert('Success', 'Password changed successfully.');
      setShowPwModal(false);
      setCurrentPw(''); setNewPw(''); setConfirmPw('');
    } catch (err) {
      Alert.alert('Error', err.message);
    } finally {
      setPwLoading(false);
    }
  };

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: logout },
    ]);
  };

  const handleBackup = async () => {
    try {
      setBackupLoading(true);
      const data = await client.get('/expenses/export');
      if (!data || !Array.isArray(data.transactions)) {
        throw new Error('Received invalid data from server.');
      }
      const payload = {
        version: '1.0',
        exportedAt: data.exportedAt || new Date().toISOString(),
        count: data.transactions.length,
        transactions: data.transactions,
      };
      const json = JSON.stringify(payload, null, 2);
      const filename = `expense-backup-${new Date().toISOString().slice(0, 10)}.json`;
      const path = FileSystem.documentDirectory + filename;
      await FileSystem.writeAsStringAsync(path, json, { encoding: 'utf8' });
      await Sharing.shareAsync(path, { mimeType: 'application/json', dialogTitle: 'Save Backup File' });
    } catch (err) {
      Alert.alert('Backup Failed', err.message);
    } finally {
      setBackupLoading(false);
    }
  };

  const handlePickRestore = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: '*/*', copyToCacheDirectory: true });
      if (result.canceled) return;
      const file = result.assets[0];

      let content;
      try {
        const tempPath = FileSystem.cacheDirectory + 'restore_temp.json';
        await FileSystem.copyAsync({ from: file.uri, to: tempPath });
        content = await FileSystem.readAsStringAsync(tempPath, { encoding: 'utf8' });
      } catch {
        try {
          const response = await fetch(file.uri);
          content = await response.text();
        } catch {
          content = await FileSystem.readAsStringAsync(file.uri);
        }
      }

      let data;
      try {
        data = JSON.parse(content);
      } catch {
        return Alert.alert('Invalid File', 'The selected file is not valid JSON. Please pick the .json backup file exported from this app.');
      }

      if (!data || !data.transactions || !Array.isArray(data.transactions)) {
        return Alert.alert('Invalid File', 'This does not appear to be a valid backup file. Please pick a .json file exported from this app.');
      }
      setRestoreData({ ...data, mode: 'merge' });
      setShowRestoreModal(true);
    } catch (e) {
      Alert.alert('Error', 'Could not read the file. Make sure it is a valid JSON backup file.');
    }
  };

  const handleConfirmRestore = async () => {
    if (restoreData.mode === 'replace') {
      Alert.alert(
        '⚠️ Confirm Replace',
        'This will permanently erase ALL your current transactions and replace them with the backup. This cannot be undone.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Yes, Replace', style: 'destructive', onPress: doRestore },
        ]
      );
    } else {
      doRestore();
    }
  };

  const doRestore = async () => {
    try {
      setRestoreLoading(true);
      const res = await client.post('/expenses/bulk-import', {
        mode: restoreData.mode,
        transactions: restoreData.transactions,
      });
      markDirty(); // expenses and stats are now stale
      setShowRestoreModal(false);
      setRestoreData(null);
      Alert.alert('Restore Complete', `Successfully imported ${res.imported} transactions.${res.skipped > 0 ? `\n${res.skipped} skipped due to errors.` : ''}`);
    } catch (err) {
      Alert.alert('Restore Failed', err.message);
    } finally {
      setRestoreLoading(false);
    }
  };

  const handleDeleteConfirm = () => {
    if (!deleteTransactions && !deleteCategories)
      return Alert.alert('Nothing selected', 'Please select at least one item to delete.');
    const what = [deleteTransactions && 'all transactions', deleteCategories && 'all categories'].filter(Boolean).join(' and ');
    Alert.alert(
      'Are you sure?',
      `This will permanently delete ${what}. This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: doDelete },
      ]
    );
  };

  const doDelete = async () => {
    const didDeleteTransactions = deleteTransactions;
    const didDeleteCategories = deleteCategories;
    try {
      setDeleteLoading(true);
      const tasks = [];
      if (didDeleteTransactions) tasks.push(client.delete('/expenses/all'));
      if (didDeleteCategories) tasks.push(client.delete('/categories/all'));
      await Promise.all(tasks);
      // Sync in-memory state so screens show fresh data immediately
      if (didDeleteTransactions) markDirty();
      if (didDeleteCategories) resetCategories();
      setShowDeleteModal(false);
      setDeleteTransactions(false);
      setDeleteCategories(false);
      const what = [didDeleteTransactions && 'Transactions', didDeleteCategories && 'Categories'].filter(Boolean).join(' & ');
      Alert.alert('Deleted', `${what} have been permanently deleted.`);
    } catch (err) {
      Alert.alert('Delete Failed', err.message);
    } finally {
      setDeleteLoading(false);
    }
  };

  const Row = ({ icon, label, value, onPress, rightElement, iconColor }) => (
    <TouchableOpacity style={[styles.row, { backgroundColor: colors.card }]} onPress={onPress} activeOpacity={onPress ? 0.7 : 1}>
      <View style={[styles.rowIcon, { backgroundColor: (iconColor || colors.primary) + '18' }]}>
        <Ionicons name={icon} size={20} color={iconColor || colors.primary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.rowLabel, { color: colors.text }]}>{label}</Text>
        {value ? <Text style={[styles.rowValue, { color: colors.textMuted }]}>{value}</Text> : null}
      </View>
      {rightElement || (onPress && <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />)}
    </TouchableOpacity>
  );

  const ModeOption = ({ mode, title, description, icon, accent }) => {
    const selected = restoreData?.mode === mode;
    return (
      <TouchableOpacity
        style={[styles.modeCard, { borderColor: selected ? accent : colors.border, backgroundColor: selected ? accent + '12' : colors.background }]}
        onPress={() => setRestoreData(prev => ({ ...prev, mode }))}
        activeOpacity={0.8}
      >
        <View style={[styles.modeIconBox, { backgroundColor: accent + '20' }]}>
          <Ionicons name={icon} size={22} color={accent} />
        </View>
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text style={{ fontSize: 15, fontWeight: '700', color: colors.text }}>{title}</Text>
            {selected && <Ionicons name="checkmark-circle" size={16} color={accent} />}
          </View>
          <Text style={{ fontSize: 12, color: colors.textMuted, marginTop: 3, lineHeight: 17 }}>{description}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Profile Header */}
        <View style={[styles.profileHeader, { backgroundColor: colors.primary }]}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{user?.username?.[0]?.toUpperCase() || 'U'}</Text>
          </View>
          <Text style={styles.username}>{user?.username}</Text>
          <Text style={styles.memberLabel}>Expense Tracker Member</Text>
        </View>

        {/* Appearance */}
        <Text style={[styles.sectionLabel, { color: colors.textLight }]}>Appearance</Text>
        <View style={styles.group}>
          <Row icon="moon-outline" label="Dark Mode" value={isDark ? 'On' : 'Off'} rightElement={<Switch value={isDark} onValueChange={toggleTheme} trackColor={{ false: colors.border, true: colors.primaryLight }} thumbColor={isDark ? colors.primary : '#f0f0f0'} />} iconColor={isDark ? colors.primary : colors.textMuted} />
        </View>

        {/* Preferences */}
        <Text style={[styles.sectionLabel, { color: colors.textLight }]}>Preferences</Text>
        <View style={styles.group}>
          <Row icon="cash-outline" label="Currency" value={`${currency} – ${CURRENCIES.find(c => c.code === currency)?.label}`} onPress={() => setShowCurrencyModal(true)} />
        </View>

        {/* Account */}
        <Text style={[styles.sectionLabel, { color: colors.textLight }]}>Account</Text>
        <View style={styles.group}>
          <Row icon="person-outline" label="Username" value={user?.username} />
          <View style={[styles.separator, { backgroundColor: colors.border }]} />
          <Row icon="lock-closed-outline" label="Change Password" onPress={() => setShowPwModal(true)} />
        </View>

        {/* Data Backup & Restore */}
        <Text style={[styles.sectionLabel, { color: colors.textLight }]}>Data</Text>
        <View style={styles.group}>
          <Row
            icon="cloud-download-outline"
            label="Export Backup"
            value="Download all transactions as a file"
            iconColor="#00B894"
            onPress={handleBackup}
            rightElement={backupLoading
              ? <ActivityIndicator size="small" color={colors.primary} />
              : <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />}
          />
          <View style={[styles.separator, { backgroundColor: colors.border }]} />
          <Row
            icon="cloud-upload-outline"
            label="Restore from Backup"
            value="Import transactions from a backup file"
            iconColor="#6C5CE7"
            onPress={handlePickRestore}
          />
        </View>

        {/* Danger Zone */}
        <Text style={[styles.sectionLabel, { color: colors.danger }]}>Danger Zone</Text>
        <View style={[styles.group, { borderWidth: 1, borderColor: colors.danger + '30' }]}>
          <Row
            icon="trash-outline"
            label="Delete My Data"
            value="Permanently remove transactions or categories"
            iconColor={colors.danger}
            onPress={() => { setDeleteTransactions(false); setDeleteCategories(false); setShowDeleteModal(true); }}
          />
        </View>

        {/* Logout */}
        <TouchableOpacity style={[styles.logoutBtn, { backgroundColor: colors.danger + '15', borderColor: colors.danger }]} onPress={handleLogout} activeOpacity={0.8}>
          <Ionicons name="log-out-outline" size={20} color={colors.danger} />
          <Text style={{ fontSize: 15, fontWeight: '700', color: colors.danger }}>Logout</Text>
        </TouchableOpacity>

        <Text style={[styles.version, { color: colors.textMuted }]}>Expense Tracker v1.0.0</Text>
      </ScrollView>

      {/* Change Password Modal */}
      <Modal visible={showPwModal} animationType="slide" transparent>
        <View style={[styles.modalOverlay, { backgroundColor: colors.overlay }]}>
          <View style={[styles.modalSheet, { backgroundColor: colors.card }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <Text style={{ fontSize: 18, fontWeight: '600', color: colors.text }}>Change Password</Text>
              <TouchableOpacity onPress={() => setShowPwModal(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
            <View style={{ padding: spacing.md }}>
              {[
                { label: 'Current Password', value: currentPw, setter: setCurrentPw },
                { label: 'New Password', value: newPw, setter: setNewPw },
                { label: 'Confirm New Password', value: confirmPw, setter: setConfirmPw },
              ].map(({ label, value, setter }) => (
                <View key={label}>
                  <Text style={[styles.pwLabel, { color: colors.textLight }]}>{label}</Text>
                  <TextInput style={[styles.pwInput, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]} value={value} onChangeText={setter} secureTextEntry autoCapitalize="none" placeholder="••••••" placeholderTextColor={colors.textMuted} />
                </View>
              ))}
              <TouchableOpacity style={[styles.pwSaveBtn, { backgroundColor: colors.primary }]} onPress={handleChangePassword} disabled={pwLoading}>
                {pwLoading ? <ActivityIndicator color="#fff" /> : <Text style={{ color: '#fff', fontSize: 15, fontWeight: '700' }}>Update Password</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Currency Modal */}
      <Modal visible={showCurrencyModal} animationType="slide" transparent>
        <View style={[styles.modalOverlay, { backgroundColor: colors.overlay }]}>
          <View style={[styles.modalSheet, { backgroundColor: colors.card }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <Text style={{ fontSize: 18, fontWeight: '600', color: colors.text }}>Select Currency</Text>
              <TouchableOpacity onPress={() => setShowCurrencyModal(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
            <ScrollView>
              {CURRENCIES.map((c) => (
                <TouchableOpacity key={c.code} style={[styles.currencyRow, { borderBottomColor: colors.border, backgroundColor: currency === c.code ? colors.primary + '10' : 'transparent' }]} onPress={() => { setCurrency(c.code); setShowCurrencyModal(false); }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 15, fontWeight: '600', color: colors.text }}>{c.label}</Text>
                    <Text style={{ fontSize: 12, color: colors.textMuted }}>{c.code} · {c.symbol}</Text>
                  </View>
                  {currency === c.code && <Ionicons name="checkmark-circle" size={20} color={colors.primary} />}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Restore Preview Modal */}
      <Modal visible={showRestoreModal} animationType="slide" transparent>
        <View style={[styles.modalOverlay, { backgroundColor: colors.overlay }]}>
          <View style={[styles.modalSheet, { backgroundColor: colors.card }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <Text style={{ fontSize: 18, fontWeight: '600', color: colors.text }}>Restore Backup</Text>
              <TouchableOpacity onPress={() => { setShowRestoreModal(false); setRestoreData(null); }}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={{ padding: spacing.md }}>
              {/* Backup info card */}
              <View style={[styles.infoCard, { backgroundColor: colors.primary + '12', borderColor: colors.primary + '30' }]}>
                <Ionicons name="document-text-outline" size={28} color={colors.primary} style={{ marginBottom: 8 }} />
                <Text style={{ fontSize: 22, fontWeight: '800', color: colors.primary }}>{restoreData?.count}</Text>
                <Text style={{ fontSize: 13, fontWeight: '600', color: colors.text, marginTop: 2 }}>Transactions Found</Text>
                <Text style={{ fontSize: 11, color: colors.textMuted, marginTop: 4 }}>
                  Exported on {restoreData?.exportedAt ? new Date(restoreData.exportedAt).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' }) : '—'}
                </Text>
              </View>

              {/* Mode selection */}
              <Text style={[styles.pwLabel, { color: colors.textLight, marginTop: spacing.lg }]}>Choose how to restore</Text>

              <ModeOption
                mode="merge"
                title="Merge"
                icon="git-merge-outline"
                accent="#00B894"
                description="Add these transactions alongside your existing ones. Your current data stays safe — nothing gets deleted."
              />

              <View style={{ height: spacing.sm }} />

              <ModeOption
                mode="replace"
                title="Replace"
                icon="refresh-outline"
                accent={colors.danger}
                description="Erase ALL your current transactions and replace them with this backup. This cannot be undone — use with caution."
              />

              {/* Warning for replace */}
              {restoreData?.mode === 'replace' && (
                <View style={[styles.warningBox, { backgroundColor: colors.danger + '12', borderColor: colors.danger + '40' }]}>
                  <Ionicons name="warning-outline" size={16} color={colors.danger} />
                  <Text style={{ fontSize: 12, color: colors.danger, flex: 1, lineHeight: 17 }}>
                    All existing transactions will be permanently deleted before importing the backup.
                  </Text>
                </View>
              )}

              <TouchableOpacity
                style={[styles.pwSaveBtn, { backgroundColor: restoreData?.mode === 'replace' ? colors.danger : colors.primary, marginTop: spacing.lg }]}
                onPress={handleConfirmRestore}
                disabled={restoreLoading}
              >
                {restoreLoading
                  ? <ActivityIndicator color="#fff" />
                  : <Text style={{ color: '#fff', fontSize: 15, fontWeight: '700' }}>
                      {restoreData?.mode === 'replace' ? 'Replace & Restore' : 'Merge & Restore'}
                    </Text>
                }
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Delete Data Modal */}
      <Modal visible={showDeleteModal} animationType="slide" transparent>
        <View style={[styles.modalOverlay, { backgroundColor: colors.overlay }]}>
          <View style={[styles.modalSheet, { backgroundColor: colors.card }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <Text style={{ fontSize: 18, fontWeight: '600', color: colors.text }}>Delete My Data</Text>
              <TouchableOpacity onPress={() => setShowDeleteModal(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={{ padding: spacing.md }}>
              {/* Info banner */}
              <View style={[styles.warningBox, { backgroundColor: colors.danger + '12', borderColor: colors.danger + '40', marginBottom: spacing.lg }]}>
                <Ionicons name="warning-outline" size={18} color={colors.danger} />
                <Text style={{ fontSize: 13, color: colors.danger, flex: 1, lineHeight: 18 }}>
                  Deleted data cannot be recovered. We recommend exporting a backup first before deleting.
                </Text>
              </View>

              <Text style={[styles.pwLabel, { color: colors.textLight, marginTop: 0 }]}>Select what to delete</Text>

              {/* Transactions toggle */}
              <TouchableOpacity
                style={[styles.deleteOption, { borderColor: deleteTransactions ? colors.danger : colors.border, backgroundColor: deleteTransactions ? colors.danger + '08' : colors.background }]}
                onPress={() => setDeleteTransactions(v => !v)}
                activeOpacity={0.8}
              >
                <View style={[styles.modeIconBox, { backgroundColor: colors.danger + '15' }]}>
                  <Ionicons name="swap-vertical-outline" size={22} color={colors.danger} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 15, fontWeight: '700', color: colors.text }}>All Transactions</Text>
                  <Text style={{ fontSize: 12, color: colors.textMuted, marginTop: 3 }}>Every income and expense entry will be removed</Text>
                </View>
                <View style={[styles.checkbox, { borderColor: deleteTransactions ? colors.danger : colors.border, backgroundColor: deleteTransactions ? colors.danger : 'transparent' }]}>
                  {deleteTransactions && <Ionicons name="checkmark" size={14} color="#fff" />}
                </View>
              </TouchableOpacity>

              <View style={{ height: spacing.sm }} />

              {/* Categories toggle */}
              <TouchableOpacity
                style={[styles.deleteOption, { borderColor: deleteCategories ? colors.danger : colors.border, backgroundColor: deleteCategories ? colors.danger + '08' : colors.background }]}
                onPress={() => setDeleteCategories(v => !v)}
                activeOpacity={0.8}
              >
                <View style={[styles.modeIconBox, { backgroundColor: colors.danger + '15' }]}>
                  <Ionicons name="grid-outline" size={22} color={colors.danger} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 15, fontWeight: '700', color: colors.text }}>All Categories</Text>
                  <Text style={{ fontSize: 12, color: colors.textMuted, marginTop: 3 }}>Every custom category will be permanently removed</Text>
                </View>
                <View style={[styles.checkbox, { borderColor: deleteCategories ? colors.danger : colors.border, backgroundColor: deleteCategories ? colors.danger : 'transparent' }]}>
                  {deleteCategories && <Ionicons name="checkmark" size={14} color="#fff" />}
                </View>
              </TouchableOpacity>

              {/* Summary of selection */}
              {(deleteTransactions || deleteCategories) && (
                <View style={[styles.warningBox, { backgroundColor: colors.danger + '10', borderColor: colors.danger + '30', marginTop: spacing.md }]}>
                  <Ionicons name="information-circle-outline" size={16} color={colors.danger} />
                  <Text style={{ fontSize: 12, color: colors.danger, flex: 1, lineHeight: 17 }}>
                    You are about to delete {[deleteTransactions && 'all transactions', deleteCategories && 'all categories'].filter(Boolean).join(' and ')}. This is permanent.
                  </Text>
                </View>
              )}

              <TouchableOpacity
                style={[styles.pwSaveBtn, { backgroundColor: (deleteTransactions || deleteCategories) ? colors.danger : colors.border, marginTop: spacing.lg }]}
                onPress={handleDeleteConfirm}
                disabled={deleteLoading || (!deleteTransactions && !deleteCategories)}
              >
                {deleteLoading
                  ? <ActivityIndicator color="#fff" />
                  : <Text style={{ color: '#fff', fontSize: 15, fontWeight: '700' }}>Delete Selected Data</Text>
                }
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  profileHeader: { alignItems: 'center', paddingVertical: spacing.xl, paddingHorizontal: spacing.md },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(255,255,255,0.25)', justifyContent: 'center', alignItems: 'center', marginBottom: spacing.md },
  avatarText: { fontSize: 32, fontWeight: '800', color: '#fff' },
  username: { fontSize: 22, fontWeight: '700', color: '#fff', marginBottom: 4 },
  memberLabel: { fontSize: 13, color: 'rgba(255,255,255,0.75)' },
  sectionLabel: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8, marginHorizontal: spacing.md, marginTop: spacing.lg, marginBottom: spacing.xs },
  group: { marginHorizontal: spacing.md, borderRadius: radius.lg, overflow: 'hidden', ...shadows.small },
  row: { flexDirection: 'row', alignItems: 'center', padding: spacing.md, gap: spacing.md },
  rowIcon: { width: 38, height: 38, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  rowLabel: { fontSize: 15, fontWeight: '600' },
  rowValue: { fontSize: 12, marginTop: 2 },
  separator: { height: 1, marginLeft: spacing.md + 38 + spacing.md },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, margin: spacing.md, marginTop: spacing.lg, height: 52, borderRadius: radius.md, borderWidth: 1.5 },
  version: { textAlign: 'center', fontSize: 12, marginBottom: spacing.xl },
  modalOverlay: { flex: 1, justifyContent: 'flex-end' },
  modalSheet: { borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl, maxHeight: '85%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: spacing.md, borderBottomWidth: 1 },
  pwLabel: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: spacing.xs, marginTop: spacing.md },
  pwInput: { borderRadius: radius.md, padding: spacing.md, fontSize: 15, borderWidth: 1.5 },
  pwSaveBtn: { borderRadius: radius.md, height: 52, justifyContent: 'center', alignItems: 'center', marginTop: spacing.lg },
  currencyRow: { flexDirection: 'row', alignItems: 'center', padding: spacing.md, borderBottomWidth: 1 },
  infoCard: { alignItems: 'center', padding: spacing.lg, borderRadius: radius.lg, borderWidth: 1 },
  modeCard: { flexDirection: 'row', alignItems: 'flex-start', padding: spacing.md, borderRadius: radius.lg, borderWidth: 2, gap: spacing.md },
  modeIconBox: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center', flexShrink: 0 },
  warningBox: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm, padding: spacing.md, borderRadius: radius.md, borderWidth: 1, marginTop: spacing.sm },
  deleteOption: { flexDirection: 'row', alignItems: 'center', padding: spacing.md, borderRadius: radius.lg, borderWidth: 2, gap: spacing.md },
  checkbox: { width: 24, height: 24, borderRadius: 6, borderWidth: 2, justifyContent: 'center', alignItems: 'center', flexShrink: 0 },
});
