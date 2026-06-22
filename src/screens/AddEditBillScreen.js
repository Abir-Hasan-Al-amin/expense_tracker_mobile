import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView,
  Alert, ActivityIndicator, Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { useSettings } from '../context/SettingsContext';
import { spacing, radius, shadows } from '../theme';
import { formatCurrency } from '../utils/format';
import * as billsApi from '../api/bills';
import * as walletsApi from '../api/wallets';

export default function AddEditBillScreen({ navigation, route }) {
  const { bill } = route.params || {};
  const isEdit = !!bill;
  const { categories } = useApp();
  const { colors, currency } = useSettings();

  const [title, setTitle] = useState(bill?.title || '');
  const [amount, setAmount] = useState(bill ? String(bill.amount) : '');
  const [dueDay, setDueDay] = useState(bill ? String(bill.dueDay) : '');
  const [categoryId, setCategoryId] = useState(bill?.category?._id || '');
  const [walletId, setWalletId] = useState(bill?.wallet?._id || '');
  const [note, setNote] = useState(bill?.note || '');
  const [isActive, setIsActive] = useState(bill?.isActive !== false);
  const [wallets, setWallets] = useState([]);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    navigation.setOptions({ title: isEdit ? 'Edit Bill' : 'New Bill' });
  }, [isEdit, navigation]);

  useEffect(() => {
    walletsApi.getWallets()
      .then((data) => setWallets(data.wallets || []))
      .catch(() => {});
  }, []);

  const selectedCategory = categories.find((c) => c._id === categoryId);
  const selectedWallet = wallets.find((w) => w._id === walletId);

  const handleSave = async () => {
    if (!title.trim()) return Alert.alert('Validation', 'Enter a bill title.');
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) return Alert.alert('Validation', 'Enter a valid amount.');
    const day = parseInt(dueDay, 10);
    if (!day || day < 1 || day > 31) return Alert.alert('Validation', 'Enter a valid due day (1–31).');
    setSaving(true);
    try {
      const data = {
        title: title.trim(),
        amount: amt,
        dueDay: day,
        category: categoryId || undefined,
        wallet: walletId || undefined,
        note: note.trim() || undefined,
        isActive,
      };
      isEdit
        ? await billsApi.updateBill(bill._id, data)
        : await billsApi.createBill(data);
      navigation.goBack();
    } catch (err) {
      Alert.alert('Error', err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <ScrollView
        style={{ flex: 1, backgroundColor: colors.background }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: spacing.md, paddingBottom: 60 }}
      >
        <Text style={[styles.label, { color: colors.textLight }]}>Bill Title</Text>
        <View style={[styles.inputRow, { backgroundColor: colors.card }]}>
          <Ionicons name="receipt-outline" size={18} color={colors.textMuted} />
          <TextInput
            style={[styles.input, { color: colors.text }]}
            value={title}
            onChangeText={setTitle}
            placeholder="e.g. Electricity, Netflix..."
            placeholderTextColor={colors.textMuted}
          />
        </View>

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

        <Text style={[styles.label, { color: colors.textLight }]}>Due Day of Month</Text>
        <View style={[styles.inputRow, { backgroundColor: colors.card }]}>
          <Ionicons name="calendar-outline" size={18} color={colors.textMuted} />
          <TextInput
            style={[styles.input, { color: colors.text }]}
            value={dueDay}
            onChangeText={setDueDay}
            placeholder="e.g. 5 (for the 5th of each month)"
            placeholderTextColor={colors.textMuted}
            keyboardType="number-pad"
            maxLength={2}
          />
        </View>

        <Text style={[styles.label, { color: colors.textLight }]}>Category (optional)</Text>
        <TouchableOpacity
          style={[styles.inputRow, { backgroundColor: colors.card }]}
          onPress={() => setShowCategoryModal(true)}
        >
          {selectedCategory ? (
            <>
              <View style={[styles.catDot, { backgroundColor: selectedCategory.color }]} />
              <Text style={[styles.input, { flex: 1, color: colors.text }]}>{selectedCategory.name}</Text>
            </>
          ) : (
            <>
              <Ionicons name="grid-outline" size={18} color={colors.textMuted} />
              <Text style={[styles.input, { flex: 1, color: colors.textMuted }]}>Select category</Text>
            </>
          )}
          <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
        </TouchableOpacity>

        <Text style={[styles.label, { color: colors.textLight }]}>Wallet (optional)</Text>
        <TouchableOpacity
          style={[styles.inputRow, { backgroundColor: colors.card }]}
          onPress={() => setShowWalletModal(true)}
        >
          <Ionicons name="wallet-outline" size={18} color={colors.textMuted} />
          <Text style={[styles.input, { flex: 1, color: selectedWallet ? colors.text : colors.textMuted }]}>
            {selectedWallet
              ? `${selectedWallet.name} (${formatCurrency(selectedWallet.balance, currency)})`
              : 'Select wallet (deducted on pay)'}
          </Text>
          {selectedWallet ? (
            <TouchableOpacity onPress={() => setWalletId('')}>
              <Ionicons name="close-circle" size={18} color={colors.textMuted} />
            </TouchableOpacity>
          ) : (
            <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
          )}
        </TouchableOpacity>

        <Text style={[styles.label, { color: colors.textLight }]}>Note (optional)</Text>
        <View style={[styles.inputRow, { backgroundColor: colors.card }]}>
          <Ionicons name="document-text-outline" size={18} color={colors.textMuted} />
          <TextInput
            style={[styles.input, { color: colors.text }]}
            value={note}
            onChangeText={setNote}
            placeholder="Add a note..."
            placeholderTextColor={colors.textMuted}
          />
        </View>

        {isEdit && (
          <TouchableOpacity
            style={[styles.toggleRow, { backgroundColor: colors.card }]}
            onPress={() => setIsActive((v) => !v)}
            activeOpacity={0.8}
          >
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 15, fontWeight: '600', color: colors.text }}>Active Bill</Text>
              <Text style={{ fontSize: 12, color: colors.textMuted }}>Inactive bills are hidden from the list</Text>
            </View>
            <View style={[styles.toggle, { backgroundColor: isActive ? colors.income : colors.border }]}>
              <View style={[styles.toggleThumb, { transform: [{ translateX: isActive ? 20 : 2 }] }]} />
            </View>
          </TouchableOpacity>
        )}

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
                <Text style={styles.saveBtnText}>{isEdit ? 'Update' : 'Create'} Bill</Text>
              </>
            )}
        </TouchableOpacity>
      </ScrollView>

      {/* Category Modal */}
      <Modal visible={showCategoryModal} animationType="slide" transparent>
        <View style={[styles.modalOverlay, { backgroundColor: colors.overlay }]}>
          <View style={[styles.modalSheet, { backgroundColor: colors.card }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <Text style={{ fontSize: 18, fontWeight: '600', color: colors.text }}>Select Category</Text>
              <TouchableOpacity onPress={() => setShowCategoryModal(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
            <ScrollView>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', padding: spacing.md, gap: spacing.sm }}>
                {categories.map((cat) => (
                  <TouchableOpacity
                    key={cat._id}
                    style={[
                      styles.catItem,
                      {
                        borderColor: categoryId === cat._id ? colors.primary : 'transparent',
                        backgroundColor: categoryId === cat._id ? colors.primary + '10' : colors.background,
                      },
                    ]}
                    onPress={() => { setCategoryId(cat._id); setShowCategoryModal(false); }}
                  >
                    <View style={[styles.catIcon, { backgroundColor: cat.color + '25' }]}>
                      <Ionicons name={cat.icon} size={22} color={cat.color} />
                    </View>
                    <Text style={{ fontSize: 11, fontWeight: '600', color: colors.text, textAlign: 'center' }} numberOfLines={1}>
                      {cat.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Wallet Modal */}
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
    </>
  );
}

const styles = StyleSheet.create({
  label: {
    fontSize: 11, fontWeight: '700', textTransform: 'uppercase',
    letterSpacing: 0.8, marginBottom: spacing.xs, marginTop: spacing.md,
  },
  inputRow: {
    flexDirection: 'row', alignItems: 'center', borderRadius: radius.md,
    paddingHorizontal: spacing.md, minHeight: 52, gap: spacing.sm, ...shadows.small,
  },
  input: { flex: 1, fontSize: 15 },
  catDot: { width: 12, height: 12, borderRadius: 6 },
  toggleRow: {
    flexDirection: 'row', alignItems: 'center', borderRadius: radius.md,
    padding: spacing.md, marginTop: spacing.md, gap: spacing.md, ...shadows.small,
  },
  toggle: { width: 44, height: 26, borderRadius: 13, justifyContent: 'center' },
  toggleThumb: { width: 22, height: 22, borderRadius: 11, backgroundColor: '#fff' },
  saveBtn: {
    borderRadius: radius.md, height: 56, flexDirection: 'row',
    alignItems: 'center', justifyContent: 'center', gap: spacing.sm,
    marginTop: spacing.lg, ...shadows.large,
  },
  saveBtnText: { fontSize: 16, fontWeight: '700', color: '#fff' },
  modalOverlay: { flex: 1, justifyContent: 'flex-end' },
  modalSheet: { borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl, maxHeight: '80%' },
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: spacing.md, borderBottomWidth: 1,
  },
  catItem: {
    width: '30%', alignItems: 'center', padding: spacing.sm,
    borderRadius: radius.md, borderWidth: 2,
  },
  catIcon: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center', marginBottom: 4 },
  walletOption: {
    flexDirection: 'row', alignItems: 'center', padding: spacing.md,
    borderBottomWidth: 1, gap: spacing.md,
  },
});
