import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView,
  Alert, ActivityIndicator, Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSettings } from '../context/SettingsContext';
import { spacing, radius, shadows } from '../theme';
import { formatCurrency } from '../utils/format';
import DatePickerModal from '../components/DatePickerModal';
import * as loansApi from '../api/loans';
import * as walletsApi from '../api/wallets';

const LOAN_TYPES = [
  { value: 'borrowed', label: 'Borrowed', desc: 'You owe someone', icon: '📥', color: '#FF6B6B' },
  { value: 'lent', label: 'Lent', desc: 'Someone owes you', icon: '📤', color: '#00B894' },
];

export default function AddEditLoanScreen({ navigation, route }) {
  const { loan } = route.params || {};
  const isEdit = !!loan;
  const { colors, currency } = useSettings();

  const [type, setType] = useState(loan?.type || 'borrowed');
  const [personName, setPersonName] = useState(loan?.personName || '');
  const [personContact, setPersonContact] = useState(loan?.personContact || '');
  const [amount, setAmount] = useState(loan ? String(loan.amount) : '');
  const [dueDate, setDueDate] = useState(loan?.dueDate ? new Date(loan.dueDate) : null);
  const [walletId, setWalletId] = useState(loan?.wallet?._id || '');
  const [note, setNote] = useState(loan?.note || '');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [showRepayWalletModal, setShowRepayWalletModal] = useState(false);
  const [showRepayModal, setShowRepayModal] = useState(false);
  const [wallets, setWallets] = useState([]);
  const [repayAmount, setRepayAmount] = useState('');
  const [repayWalletId, setRepayWalletId] = useState('');
  const [repayNote, setRepayNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [repaying, setRepaying] = useState(false);

  useEffect(() => {
    navigation.setOptions({ title: isEdit ? 'Edit Loan' : 'New Loan' });
  }, [isEdit, navigation]);

  useEffect(() => {
    walletsApi.getWallets()
      .then((data) => setWallets(data.wallets || []))
      .catch(() => {});
  }, []);

  const selectedWallet = wallets.find((w) => w._id === walletId);
  const selectedRepayWallet = wallets.find((w) => w._id === repayWalletId);

  const handleSave = async () => {
    if (!personName.trim()) return Alert.alert('Validation', 'Enter the person\'s name.');
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) return Alert.alert('Validation', 'Enter a valid amount.');
    setSaving(true);
    try {
      const data = {
        personName: personName.trim(),
        personContact: personContact.trim() || undefined,
        dueDate: dueDate?.toISOString() || undefined,
        note: note.trim() || undefined,
      };
      if (isEdit) {
        await loansApi.updateLoan(loan._id, data);
      } else {
        await loansApi.createLoan({
          ...data,
          type,
          amount: amt,
          wallet: walletId || undefined,
        });
      }
      navigation.goBack();
    } catch (err) {
      Alert.alert('Error', err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleRepay = async () => {
    const amt = parseFloat(repayAmount);
    if (!amt || amt <= 0) return Alert.alert('Validation', 'Enter a valid repayment amount.');
    setRepaying(true);
    try {
      await loansApi.repayLoan(loan._id, {
        amount: amt,
        wallet: repayWalletId || undefined,
        note: repayNote.trim() || undefined,
      });
      setShowRepayModal(false);
      setRepayAmount('');
      setRepayWalletId('');
      setRepayNote('');
      navigation.goBack();
    } catch (err) {
      Alert.alert('Error', err.message);
    } finally {
      setRepaying(false);
    }
  };

  const accentColor = type === 'borrowed' ? '#FF6B6B' : '#00B894';

  return (
    <>
      <ScrollView
        style={{ flex: 1, backgroundColor: colors.background }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: spacing.md, paddingBottom: 60 }}
      >
        {/* Type selector (create only) */}
        {!isEdit && (
          <>
            <Text style={[styles.label, { color: colors.textLight }]}>Loan Type</Text>
            <View style={styles.typeRow}>
              {LOAN_TYPES.map((t) => (
                <TouchableOpacity
                  key={t.value}
                  style={[
                    styles.typeCard,
                    {
                      backgroundColor: type === t.value ? t.color + '15' : colors.card,
                      borderColor: type === t.value ? t.color : colors.border,
                    },
                  ]}
                  onPress={() => setType(t.value)}
                >
                  <Text style={{ fontSize: 24 }}>{t.icon}</Text>
                  <Text style={[styles.typeLabel, { color: type === t.value ? t.color : colors.text }]}>
                    {t.label}
                  </Text>
                  <Text style={{ fontSize: 11, color: colors.textMuted, textAlign: 'center' }}>{t.desc}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}

        {/* Person Name */}
        <Text style={[styles.label, { color: colors.textLight }]}>Person's Name</Text>
        <View style={[styles.inputRow, { backgroundColor: colors.card }]}>
          <Ionicons name="person-outline" size={18} color={colors.textMuted} />
          <TextInput
            style={[styles.input, { color: colors.text }]}
            value={personName}
            onChangeText={setPersonName}
            placeholder="e.g. John"
            placeholderTextColor={colors.textMuted}
          />
        </View>

        {/* Contact */}
        <Text style={[styles.label, { color: colors.textLight }]}>Contact (optional)</Text>
        <View style={[styles.inputRow, { backgroundColor: colors.card }]}>
          <Ionicons name="call-outline" size={18} color={colors.textMuted} />
          <TextInput
            style={[styles.input, { color: colors.text }]}
            value={personContact}
            onChangeText={setPersonContact}
            placeholder="Phone number"
            placeholderTextColor={colors.textMuted}
            keyboardType="phone-pad"
          />
        </View>

        {/* Amount (create only) */}
        {!isEdit && (
          <>
            <Text style={[styles.label, { color: colors.textLight }]}>Amount</Text>
            <View style={[styles.inputRow, { backgroundColor: colors.card }]}>
              <Ionicons name="cash-outline" size={18} color={colors.textMuted} />
              <TextInput
                style={[styles.input, { color: colors.text }]}
                value={amount}
                onChangeText={setAmount}
                placeholder="0.00"
                placeholderTextColor={colors.textMuted}
                keyboardType="decimal-pad"
              />
            </View>
          </>
        )}

        {/* Due Date */}
        <Text style={[styles.label, { color: colors.textLight }]}>Due Date (optional)</Text>
        <TouchableOpacity
          style={[styles.inputRow, { backgroundColor: colors.card }]}
          onPress={() => setShowDatePicker(true)}
        >
          <Ionicons name="calendar-outline" size={18} color={colors.textMuted} />
          <Text style={[styles.input, { flex: 1, color: dueDate ? colors.text : colors.textMuted }]}>
            {dueDate
              ? dueDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
              : 'Select date'}
          </Text>
          {dueDate && (
            <TouchableOpacity onPress={() => setDueDate(null)}>
              <Ionicons name="close-circle" size={18} color={colors.textMuted} />
            </TouchableOpacity>
          )}
        </TouchableOpacity>

        {/* Wallet (create only) */}
        {!isEdit && (
          <>
            <Text style={[styles.label, { color: colors.textLight }]}>Wallet (optional)</Text>
            <TouchableOpacity
              style={[styles.inputRow, { backgroundColor: colors.card }]}
              onPress={() => setShowWalletModal(true)}
            >
              <Ionicons name="wallet-outline" size={18} color={colors.textMuted} />
              <Text style={[styles.input, { flex: 1, color: selectedWallet ? colors.text : colors.textMuted }]}>
                {selectedWallet ? selectedWallet.name : 'Select wallet (auto-adjusts balance)'}
              </Text>
              {selectedWallet && (
                <TouchableOpacity onPress={() => setWalletId('')}>
                  <Ionicons name="close-circle" size={18} color={colors.textMuted} />
                </TouchableOpacity>
              )}
            </TouchableOpacity>
          </>
        )}

        {/* Note */}
        <Text style={[styles.label, { color: colors.textLight }]}>Note (optional)</Text>
        <View style={[styles.inputRow, { backgroundColor: colors.card, alignItems: 'flex-start', paddingTop: spacing.sm }]}>
          <Ionicons name="document-text-outline" size={18} color={colors.textMuted} style={{ marginTop: 2 }} />
          <TextInput
            style={[styles.input, { flex: 1, height: 72, textAlignVertical: 'top', color: colors.text }]}
            value={note}
            onChangeText={setNote}
            placeholder="Add a note..."
            placeholderTextColor={colors.textMuted}
            multiline
          />
        </View>

        {/* Repayment history (edit mode) */}
        {isEdit && loan.repayments?.length > 0 && (
          <View style={{ marginTop: spacing.md }}>
            <Text style={[styles.label, { color: colors.textLight }]}>Repayment History</Text>
            {loan.repayments.map((r) => (
              <View key={r._id} style={[styles.repayItem, { backgroundColor: colors.card }]}>
                <Text style={{ fontSize: 14, fontWeight: '600', color: colors.income }}>
                  + {formatCurrency(r.amount, currency)}
                </Text>
                <Text style={{ fontSize: 12, color: colors.textMuted }}>
                  {new Date(r.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Save */}
        <TouchableOpacity
          style={[styles.saveBtn, { backgroundColor: accentColor }]}
          onPress={handleSave}
          disabled={saving}
          activeOpacity={0.85}
        >
          {saving
            ? <ActivityIndicator color="#fff" />
            : (
              <>
                <Ionicons name="checkmark-circle" size={20} color="#fff" />
                <Text style={styles.saveBtnText}>{isEdit ? 'Update' : 'Create'} Loan</Text>
              </>
            )}
        </TouchableOpacity>

        {/* Record Repayment (edit + unsettled) */}
        {isEdit && loan.status !== 'settled' && (
          <TouchableOpacity
            style={[styles.repayBtn, { borderColor: accentColor }]}
            onPress={() => setShowRepayModal(true)}
          >
            <Ionicons name="checkmark-done-outline" size={18} color={accentColor} />
            <Text style={{ fontSize: 15, fontWeight: '700', color: accentColor }}>Record Repayment</Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      <DatePickerModal
        visible={showDatePicker}
        value={dueDate || new Date()}
        onConfirm={(d) => { setDueDate(d); setShowDatePicker(false); }}
        onCancel={() => setShowDatePicker(false)}
      />

      {/* Wallet Picker Modal */}
      <Modal visible={showWalletModal} animationType="slide" transparent>
        <View style={[styles.modalOverlay, { backgroundColor: colors.overlay }]}>
          <View style={[styles.modalSheet, { backgroundColor: colors.card }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <Text style={{ fontSize: 18, fontWeight: '600', color: colors.text }}>Select Wallet</Text>
              <TouchableOpacity onPress={() => setShowWalletModal(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
            <ScrollView>
              {wallets.map((w) => (
                <TouchableOpacity
                  key={w._id}
                  style={[styles.walletOption, { borderBottomColor: colors.border }]}
                  onPress={() => { setWalletId(w._id); setShowWalletModal(false); }}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 15, fontWeight: '600', color: colors.text }}>{w.name}</Text>
                    <Text style={{ fontSize: 12, color: colors.textMuted }}>
                      Balance: {formatCurrency(w.balance, currency)}
                    </Text>
                  </View>
                  {walletId === w._id && <Ionicons name="checkmark-circle" size={20} color={colors.primary} />}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Repay Wallet Picker Modal */}
      <Modal visible={showRepayWalletModal} animationType="slide" transparent>
        <View style={[styles.modalOverlay, { backgroundColor: colors.overlay }]}>
          <View style={[styles.modalSheet, { backgroundColor: colors.card }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <Text style={{ fontSize: 18, fontWeight: '600', color: colors.text }}>Wallet for Repayment</Text>
              <TouchableOpacity onPress={() => setShowRepayWalletModal(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
            <ScrollView>
              {wallets.map((w) => (
                <TouchableOpacity
                  key={w._id}
                  style={[styles.walletOption, { borderBottomColor: colors.border }]}
                  onPress={() => { setRepayWalletId(w._id); setShowRepayWalletModal(false); }}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 15, fontWeight: '600', color: colors.text }}>{w.name}</Text>
                    <Text style={{ fontSize: 12, color: colors.textMuted }}>
                      Balance: {formatCurrency(w.balance, currency)}
                    </Text>
                  </View>
                  {repayWalletId === w._id && <Ionicons name="checkmark-circle" size={20} color={colors.primary} />}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Repay Modal */}
      <Modal visible={showRepayModal} animationType="slide" transparent>
        <View style={[styles.modalOverlay, { backgroundColor: colors.overlay }]}>
          <View style={[styles.modalSheet, { backgroundColor: colors.card }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <Text style={{ fontSize: 18, fontWeight: '600', color: colors.text }}>Record Repayment</Text>
              <TouchableOpacity onPress={() => setShowRepayModal(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
            <ScrollView contentContainerStyle={{ padding: spacing.md }}>
              {loan && (
                <View style={[styles.remainingInfo, { backgroundColor: colors.primary + '12' }]}>
                  <Text style={{ fontSize: 13, color: colors.primary }}>
                    Remaining: {formatCurrency(loan.remainingAmount, currency)}
                  </Text>
                </View>
              )}
              <Text style={[styles.label, { color: colors.textLight, marginTop: spacing.sm }]}>Amount</Text>
              <View style={[styles.inputRow, { backgroundColor: colors.background, borderWidth: 1.5, borderColor: colors.border }]}>
                <TextInput
                  style={[styles.input, { color: colors.text }]}
                  value={repayAmount}
                  onChangeText={setRepayAmount}
                  keyboardType="decimal-pad"
                  placeholder="0.00"
                  placeholderTextColor={colors.textMuted}
                />
              </View>

              <Text style={[styles.label, { color: colors.textLight }]}>Wallet (optional)</Text>
              <TouchableOpacity
                style={[styles.inputRow, { backgroundColor: colors.background, borderWidth: 1.5, borderColor: colors.border }]}
                onPress={() => setShowRepayWalletModal(true)}
              >
                <Ionicons name="wallet-outline" size={18} color={colors.textMuted} />
                <Text style={[styles.input, { flex: 1, color: selectedRepayWallet ? colors.text : colors.textMuted }]}>
                  {selectedRepayWallet ? selectedRepayWallet.name : 'Select wallet'}
                </Text>
                {selectedRepayWallet && (
                  <TouchableOpacity onPress={() => setRepayWalletId('')}>
                    <Ionicons name="close-circle" size={18} color={colors.textMuted} />
                  </TouchableOpacity>
                )}
              </TouchableOpacity>

              <Text style={[styles.label, { color: colors.textLight }]}>Note (optional)</Text>
              <View style={[styles.inputRow, { backgroundColor: colors.background, borderWidth: 1.5, borderColor: colors.border }]}>
                <TextInput
                  style={[styles.input, { color: colors.text }]}
                  value={repayNote}
                  onChangeText={setRepayNote}
                  placeholder="Add a note..."
                  placeholderTextColor={colors.textMuted}
                />
              </View>

              <TouchableOpacity
                style={[styles.saveBtn, { backgroundColor: accentColor, marginTop: spacing.lg }]}
                onPress={handleRepay}
                disabled={repaying}
              >
                {repaying
                  ? <ActivityIndicator color="#fff" />
                  : <Text style={styles.saveBtnText}>Save Repayment</Text>}
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
  typeRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.xs },
  typeCard: {
    flex: 1, alignItems: 'center', padding: spacing.md,
    borderRadius: radius.lg, borderWidth: 2, gap: 4,
  },
  typeLabel: { fontSize: 15, fontWeight: '700' },
  inputRow: {
    flexDirection: 'row', alignItems: 'center', borderRadius: radius.md,
    paddingHorizontal: spacing.md, minHeight: 52, gap: spacing.sm, ...shadows.small,
  },
  input: { flex: 1, fontSize: 15 },
  repayItem: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.sm, ...shadows.small,
  },
  saveBtn: {
    borderRadius: radius.md, height: 56, flexDirection: 'row',
    alignItems: 'center', justifyContent: 'center', gap: spacing.sm,
    marginTop: spacing.lg, ...shadows.large,
  },
  saveBtnText: { fontSize: 16, fontWeight: '700', color: '#fff' },
  repayBtn: {
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
  walletOption: {
    flexDirection: 'row', alignItems: 'center', padding: spacing.md,
    borderBottomWidth: 1, gap: spacing.md,
  },
  remainingInfo: { padding: spacing.md, borderRadius: radius.md, marginBottom: spacing.sm },
});
