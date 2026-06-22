import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView,
  Alert, ActivityIndicator, Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSettings } from '../context/SettingsContext';
import { spacing, radius, shadows } from '../theme';
import { formatCurrency } from '../utils/format';
import DatePickerModal from '../components/DatePickerModal';
import * as savingsApi from '../api/savings';
import * as walletsApi from '../api/wallets';

const ICONS = ['🎯', '💻', '🚗', '🏠', '✈️', '💍', '📱', '🎮', '👗', '📚', '🏋️', '🎓', '💰', '🏦', '🎁'];

const STATUS_OPTIONS = [
  { value: 'active', label: 'Active', color: '#6C5CE7' },
  { value: 'completed', label: 'Completed', color: '#00B894' },
  { value: 'cancelled', label: 'Cancelled', color: '#636E72' },
];

export default function AddEditSavingsScreen({ navigation, route }) {
  const { goal } = route.params || {};
  const isEdit = !!goal;
  const { colors, currency } = useSettings();

  const [title, setTitle] = useState(goal?.title || '');
  const [targetAmount, setTargetAmount] = useState(goal ? String(goal.targetAmount) : '');
  const [deadline, setDeadline] = useState(goal?.deadline ? new Date(goal.deadline) : null);
  const [icon, setIcon] = useState(goal?.icon || '🎯');
  const [status, setStatus] = useState(goal?.status || 'active');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showIconPicker, setShowIconPicker] = useState(false);
  const [showContributeModal, setShowContributeModal] = useState(false);
  const [wallets, setWallets] = useState([]);
  const [contribAmount, setContribAmount] = useState('');
  const [contribWalletId, setContribWalletId] = useState('');
  const [contribNote, setContribNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [contributing, setContributing] = useState(false);

  useEffect(() => {
    navigation.setOptions({ title: isEdit ? 'Edit Goal' : 'New Savings Goal' });
  }, [isEdit, navigation]);

  useEffect(() => {
    walletsApi.getWallets()
      .then((data) => setWallets(data.wallets || []))
      .catch(() => {});
  }, []);

  const selectedWallet = wallets.find((w) => w._id === contribWalletId);

  const handleSave = async () => {
    if (!title.trim()) return Alert.alert('Validation', 'Enter a goal title.');
    const target = parseFloat(targetAmount);
    if (!target || target <= 0) return Alert.alert('Validation', 'Enter a valid target amount.');
    setSaving(true);
    try {
      const data = {
        title: title.trim(),
        targetAmount: target,
        deadline: deadline?.toISOString() || undefined,
        icon,
        status: isEdit ? status : undefined,
      };
      isEdit
        ? await savingsApi.updateSavings(goal._id, data)
        : await savingsApi.createSavings(data);
      navigation.goBack();
    } catch (err) {
      Alert.alert('Error', err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleContribute = async () => {
    const amt = parseFloat(contribAmount);
    if (!amt || amt <= 0) return Alert.alert('Validation', 'Enter a valid amount.');
    setContributing(true);
    try {
      await savingsApi.contributeSavings(goal._id, {
        amount: amt,
        wallet: contribWalletId || undefined,
        note: contribNote.trim() || undefined,
      });
      setShowContributeModal(false);
      setContribAmount('');
      setContribWalletId('');
      setContribNote('');
      navigation.goBack();
    } catch (err) {
      Alert.alert('Error', err.message);
    } finally {
      setContributing(false);
    }
  };

  const pct = isEdit && goal.targetAmount > 0
    ? Math.min((goal.currentAmount / goal.targetAmount) * 100, 100)
    : 0;

  return (
    <>
      <ScrollView
        style={{ flex: 1, backgroundColor: colors.background }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: spacing.md, paddingBottom: 60 }}
      >
        {/* Progress preview (edit only) */}
        {isEdit && (
          <View style={[styles.progressCard, { backgroundColor: colors.card }]}>
            <Text style={{ fontSize: 32 }}>{icon}</Text>
            <View style={{ flex: 1 }}>
              <Text style={[styles.progressTitle, { color: colors.text }]}>{goal.title}</Text>
              <Text style={{ fontSize: 13, color: colors.textMuted }}>
                {formatCurrency(goal.currentAmount, currency)} / {formatCurrency(goal.targetAmount, currency)}
              </Text>
              <View style={[styles.progressBar, { backgroundColor: colors.border, marginTop: 8 }]}>
                <View style={[styles.progressFill, { width: `${pct}%`, backgroundColor: colors.primary }]} />
              </View>
            </View>
            <Text style={{ fontSize: 22, fontWeight: '800', color: colors.primary }}>{Math.round(pct)}%</Text>
          </View>
        )}

        {/* Icon */}
        <Text style={[styles.label, { color: colors.textLight }]}>Icon</Text>
        <TouchableOpacity
          style={[styles.iconSelector, { backgroundColor: colors.card }]}
          onPress={() => setShowIconPicker(true)}
        >
          <Text style={{ fontSize: 28 }}>{icon}</Text>
          <Text style={{ fontSize: 14, color: colors.textMuted, marginLeft: spacing.sm }}>Tap to change</Text>
          <Ionicons name="chevron-forward" size={16} color={colors.textMuted} style={{ marginLeft: 'auto' }} />
        </TouchableOpacity>

        {/* Title */}
        <Text style={[styles.label, { color: colors.textLight }]}>Goal Title</Text>
        <View style={[styles.inputRow, { backgroundColor: colors.card }]}>
          <Ionicons name="flag-outline" size={18} color={colors.textMuted} />
          <TextInput
            style={[styles.input, { color: colors.text }]}
            value={title}
            onChangeText={setTitle}
            placeholder="e.g. New Laptop, Vacation..."
            placeholderTextColor={colors.textMuted}
          />
        </View>

        {/* Target */}
        <Text style={[styles.label, { color: colors.textLight }]}>Target Amount</Text>
        <View style={[styles.inputRow, { backgroundColor: colors.card }]}>
          <Ionicons name="cash-outline" size={18} color={colors.textMuted} />
          <TextInput
            style={[styles.input, { color: colors.text }]}
            value={targetAmount}
            onChangeText={setTargetAmount}
            placeholder="0.00"
            placeholderTextColor={colors.textMuted}
            keyboardType="decimal-pad"
          />
        </View>

        {/* Deadline */}
        <Text style={[styles.label, { color: colors.textLight }]}>Deadline (optional)</Text>
        <TouchableOpacity
          style={[styles.inputRow, { backgroundColor: colors.card }]}
          onPress={() => setShowDatePicker(true)}
        >
          <Ionicons name="calendar-outline" size={18} color={colors.textMuted} />
          <Text style={[styles.input, { flex: 1, color: deadline ? colors.text : colors.textMuted }]}>
            {deadline
              ? deadline.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
              : 'Set a deadline'}
          </Text>
          {deadline && (
            <TouchableOpacity onPress={() => setDeadline(null)}>
              <Ionicons name="close-circle" size={18} color={colors.textMuted} />
            </TouchableOpacity>
          )}
        </TouchableOpacity>

        {/* Status (edit only) */}
        {isEdit && (
          <>
            <Text style={[styles.label, { color: colors.textLight }]}>Status</Text>
            <View style={styles.statusRow}>
              {STATUS_OPTIONS.map((s) => (
                <TouchableOpacity
                  key={s.value}
                  style={[
                    styles.statusBtn,
                    {
                      backgroundColor: status === s.value ? s.color + '20' : colors.card,
                      borderColor: status === s.value ? s.color : colors.border,
                    },
                  ]}
                  onPress={() => setStatus(s.value)}
                >
                  <Text style={[styles.statusLabel, { color: status === s.value ? s.color : colors.textLight }]}>
                    {s.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}

        {/* Contribution history (edit only) */}
        {isEdit && goal.contributions?.length > 0 && (
          <View style={{ marginTop: spacing.md }}>
            <Text style={[styles.label, { color: colors.textLight }]}>Contributions</Text>
            {goal.contributions.slice(0, 5).map((c) => (
              <View key={c._id} style={[styles.contribItem, { backgroundColor: colors.card }]}>
                <Text style={{ fontSize: 14, fontWeight: '600', color: colors.income }}>
                  + {formatCurrency(c.amount, currency)}
                </Text>
                <Text style={{ fontSize: 12, color: colors.textMuted }}>
                  {new Date(c.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Save */}
        <TouchableOpacity
          style={[styles.saveBtn, { backgroundColor: colors.primary }]}
          onPress={handleSave}
          disabled={saving}
        >
          {saving
            ? <ActivityIndicator color="#fff" />
            : (
              <>
                <Ionicons name="checkmark-circle" size={20} color="#fff" />
                <Text style={styles.saveBtnText}>{isEdit ? 'Update' : 'Create'} Goal</Text>
              </>
            )}
        </TouchableOpacity>

        {/* Contribute (active goals only) */}
        {isEdit && goal.status === 'active' && (
          <TouchableOpacity
            style={[styles.contribBtn, { borderColor: colors.income }]}
            onPress={() => setShowContributeModal(true)}
          >
            <Ionicons name="add-circle-outline" size={18} color={colors.income} />
            <Text style={{ fontSize: 15, fontWeight: '700', color: colors.income }}>Add Contribution</Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      <DatePickerModal
        visible={showDatePicker}
        value={deadline || new Date()}
        onConfirm={(d) => { setDeadline(d); setShowDatePicker(false); }}
        onCancel={() => setShowDatePicker(false)}
      />

      {/* Icon Picker Modal */}
      <Modal visible={showIconPicker} animationType="slide" transparent>
        <View style={[styles.modalOverlay, { backgroundColor: colors.overlay }]}>
          <View style={[styles.modalSheet, { backgroundColor: colors.card }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <Text style={{ fontSize: 18, fontWeight: '600', color: colors.text }}>Choose Icon</Text>
              <TouchableOpacity onPress={() => setShowIconPicker(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', padding: spacing.md, gap: spacing.sm }}>
              {ICONS.map((ic) => (
                <TouchableOpacity
                  key={ic}
                  style={[
                    styles.iconItem,
                    {
                      backgroundColor: icon === ic ? colors.primary + '20' : colors.background,
                      borderColor: icon === ic ? colors.primary : colors.border,
                    },
                  ]}
                  onPress={() => { setIcon(ic); setShowIconPicker(false); }}
                >
                  <Text style={{ fontSize: 28 }}>{ic}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </Modal>

      {/* Contribute Modal */}
      <Modal visible={showContributeModal} animationType="slide" transparent>
        <View style={[styles.modalOverlay, { backgroundColor: colors.overlay }]}>
          <View style={[styles.modalSheet, { backgroundColor: colors.card }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <Text style={{ fontSize: 18, fontWeight: '600', color: colors.text }}>Add Contribution</Text>
              <TouchableOpacity onPress={() => setShowContributeModal(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
            <ScrollView contentContainerStyle={{ padding: spacing.md }}>
              <Text style={[styles.label, { color: colors.textLight, marginTop: 0 }]}>Amount</Text>
              <View style={[styles.inputRow, { backgroundColor: colors.background, borderWidth: 1.5, borderColor: colors.border }]}>
                <TextInput
                  style={[styles.input, { color: colors.text }]}
                  value={contribAmount}
                  onChangeText={setContribAmount}
                  keyboardType="decimal-pad"
                  placeholder="0.00"
                  placeholderTextColor={colors.textMuted}
                />
              </View>

              <Text style={[styles.label, { color: colors.textLight }]}>Wallet (optional)</Text>
              {wallets.map((w) => (
                <TouchableOpacity
                  key={w._id}
                  style={[
                    styles.walletOption,
                    {
                      borderColor: contribWalletId === w._id ? colors.income : colors.border,
                      backgroundColor: contribWalletId === w._id ? colors.income + '10' : colors.background,
                    },
                  ]}
                  onPress={() => setContribWalletId(contribWalletId === w._id ? '' : w._id)}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 14, fontWeight: '600', color: colors.text }}>{w.name}</Text>
                    <Text style={{ fontSize: 12, color: colors.textMuted }}>
                      {formatCurrency(w.balance, currency)}
                    </Text>
                  </View>
                  {contribWalletId === w._id && (
                    <Ionicons name="checkmark-circle" size={18} color={colors.income} />
                  )}
                </TouchableOpacity>
              ))}

              <Text style={[styles.label, { color: colors.textLight }]}>Note (optional)</Text>
              <View style={[styles.inputRow, { backgroundColor: colors.background, borderWidth: 1.5, borderColor: colors.border }]}>
                <TextInput
                  style={[styles.input, { color: colors.text }]}
                  value={contribNote}
                  onChangeText={setContribNote}
                  placeholder="Add a note..."
                  placeholderTextColor={colors.textMuted}
                />
              </View>

              <TouchableOpacity
                style={[styles.saveBtn, { backgroundColor: colors.income, marginTop: spacing.lg }]}
                onPress={handleContribute}
                disabled={contributing}
              >
                {contributing
                  ? <ActivityIndicator color="#fff" />
                  : <Text style={styles.saveBtnText}>Save Contribution</Text>}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  label: {
    fontSize: 11, fontWeight: '700', textTransform: 'uppercase',
    letterSpacing: 0.8, marginBottom: spacing.xs, marginTop: spacing.md,
  },
  progressCard: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    borderRadius: radius.lg, padding: spacing.md, marginBottom: spacing.sm, ...shadows.small,
  },
  progressTitle: { fontSize: 15, fontWeight: '600' },
  progressBar: { height: 6, borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: 6, borderRadius: 3 },
  iconSelector: {
    flexDirection: 'row', alignItems: 'center', borderRadius: radius.md,
    padding: spacing.md, ...shadows.small,
  },
  inputRow: {
    flexDirection: 'row', alignItems: 'center', borderRadius: radius.md,
    paddingHorizontal: spacing.md, minHeight: 52, gap: spacing.sm, ...shadows.small,
  },
  input: { flex: 1, fontSize: 15 },
  statusRow: { flexDirection: 'row', gap: spacing.sm },
  statusBtn: { flex: 1, padding: spacing.sm, borderRadius: radius.md, borderWidth: 2, alignItems: 'center' },
  statusLabel: { fontSize: 13, fontWeight: '700' },
  contribItem: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.sm, ...shadows.small,
  },
  saveBtn: {
    borderRadius: radius.md, height: 56, flexDirection: 'row',
    alignItems: 'center', justifyContent: 'center', gap: spacing.sm,
    marginTop: spacing.lg, ...shadows.large,
  },
  saveBtnText: { fontSize: 16, fontWeight: '700', color: '#fff' },
  contribBtn: {
    borderRadius: radius.md, height: 52, flexDirection: 'row',
    alignItems: 'center', justifyContent: 'center', gap: spacing.sm,
    marginTop: spacing.sm, borderWidth: 2,
  },
  modalOverlay: { flex: 1, justifyContent: 'flex-end' },
  modalSheet: { borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl, maxHeight: '85%' },
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: spacing.md, borderBottomWidth: 1,
  },
  iconItem: {
    width: 56, height: 56, borderRadius: 14,
    justifyContent: 'center', alignItems: 'center', borderWidth: 2,
  },
  walletOption: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    padding: spacing.md, borderRadius: radius.md, borderWidth: 1.5, marginBottom: spacing.sm,
  },
});
