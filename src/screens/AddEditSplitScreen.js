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
import DatePickerModal from '../components/DatePickerModal';
import * as splitsApi from '../api/splits';
import * as walletsApi from '../api/wallets';

export default function AddEditSplitScreen({ navigation, route }) {
  const { split } = route.params || {};
  const isEdit = !!split;
  const { categories } = useApp();
  const { colors, currency } = useSettings();

  const [title, setTitle] = useState(split?.title || '');
  const [totalAmount, setTotalAmount] = useState(split ? String(split.totalAmount) : '');
  const [walletId, setWalletId] = useState(split?.wallet?._id || '');
  const [categoryId, setCategoryId] = useState(split?.category?._id || '');
  const [date, setDate] = useState(split?.date ? new Date(split.date) : new Date());
  const [note, setNote] = useState(split?.note || '');
  const [participants, setParticipants] = useState(
    split?.participants?.map((p) => ({ ...p, share: String(p.share) })) || [{ name: '', contact: '', share: '' }]
  );
  const [wallets, setWallets] = useState([]);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [settling, setSettling] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    navigation.setOptions({ title: isEdit ? 'Split Details' : 'New Split' });
  }, [isEdit, navigation]);

  useEffect(() => {
    walletsApi.getWallets()
      .then((data) => setWallets(data.wallets || []))
      .catch(() => {});
  }, []);

  const selectedWallet = wallets.find((w) => w._id === walletId);
  const selectedCategory = categories.find((c) => c._id === categoryId);

  const addParticipant = () => {
    setParticipants((prev) => [...prev, { name: '', contact: '', share: '' }]);
  };

  const updateParticipant = (index, field, value) => {
    setParticipants((prev) =>
      prev.map((p, i) => i === index ? { ...p, [field]: value } : p)
    );
  };

  const removeParticipant = (index) => {
    if (participants.length <= 1) return;
    setParticipants((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSettle = async (participantId) => {
    setSettling(participantId);
    try {
      const updated = await splitsApi.settleParticipant(split._id, participantId);
      navigation.setParams({ split: updated });
      Alert.alert('Settled', 'Participant marked as paid.');
      navigation.goBack();
    } catch (err) {
      Alert.alert('Error', err.message);
    } finally {
      setSettling(null);
    }
  };

  const handleSave = async () => {
    if (!title.trim()) return Alert.alert('Validation', 'Enter a title.');
    const amt = parseFloat(totalAmount);
    if (!amt || amt <= 0) return Alert.alert('Validation', 'Enter a valid total amount.');
    const validParticipants = participants.filter((p) => p.name.trim());
    if (validParticipants.length === 0) return Alert.alert('Validation', 'Add at least one participant.');

    setSaving(true);
    try {
      const data = {
        title: title.trim(),
        totalAmount: amt,
        wallet: walletId || undefined,
        category: categoryId || undefined,
        date: date.toISOString(),
        note: note.trim() || undefined,
        participants: validParticipants.map((p) => ({
          name: p.name.trim(),
          contact: p.contact?.trim() || undefined,
          share: parseFloat(p.share) || 0,
        })),
      };
      isEdit
        ? await splitsApi.updateSplit(split._id, data)
        : await splitsApi.createSplit(data);
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
        <Text style={[styles.label, { color: colors.textLight }]}>Title</Text>
        <View style={[styles.inputRow, { backgroundColor: colors.card }]}>
          <Ionicons name="create-outline" size={18} color={colors.textMuted} />
          <TextInput
            style={[styles.input, { color: colors.text }]}
            value={title}
            onChangeText={setTitle}
            placeholder="e.g. Dinner at restaurant"
            placeholderTextColor={colors.textMuted}
          />
        </View>

        <Text style={[styles.label, { color: colors.textLight }]}>Total Amount</Text>
        <View style={[styles.inputRow, { backgroundColor: colors.card }]}>
          <Ionicons name="cash-outline" size={18} color={colors.textMuted} />
          <TextInput
            style={[styles.input, { color: colors.text }]}
            value={totalAmount}
            onChangeText={setTotalAmount}
            placeholder="0.00"
            placeholderTextColor={colors.textMuted}
            keyboardType="decimal-pad"
          />
        </View>

        <Text style={[styles.label, { color: colors.textLight }]}>Date</Text>
        <TouchableOpacity
          style={[styles.inputRow, { backgroundColor: colors.card }]}
          onPress={() => setShowDatePicker(true)}
        >
          <Ionicons name="calendar-outline" size={18} color={colors.textMuted} />
          <Text style={[styles.input, { flex: 1, color: colors.text }]}>
            {date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
          </Text>
        </TouchableOpacity>

        <Text style={[styles.label, { color: colors.textLight }]}>Wallet (optional)</Text>
        <TouchableOpacity
          style={[styles.inputRow, { backgroundColor: colors.card }]}
          onPress={() => setShowWalletModal(true)}
        >
          <Ionicons name="wallet-outline" size={18} color={colors.textMuted} />
          <Text style={[styles.input, { flex: 1, color: selectedWallet ? colors.text : colors.textMuted }]}>
            {selectedWallet ? selectedWallet.name : 'Select wallet'}
          </Text>
          {selectedWallet ? (
            <TouchableOpacity onPress={() => setWalletId('')}>
              <Ionicons name="close-circle" size={18} color={colors.textMuted} />
            </TouchableOpacity>
          ) : (
            <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
          )}
        </TouchableOpacity>

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

        {/* Participants */}
        <View style={styles.participantHeader}>
          <Text style={[styles.label, { color: colors.textLight, marginTop: 0 }]}>Participants</Text>
          {!isEdit && (
            <TouchableOpacity onPress={addParticipant}>
              <Text style={{ fontSize: 13, color: colors.primary, fontWeight: '600' }}>+ Add Person</Text>
            </TouchableOpacity>
          )}
        </View>

        {participants.map((p, i) => (
          <View
            key={i}
            style={[
              styles.participantCard,
              {
                backgroundColor: colors.card,
                borderColor: isEdit && p.isPaid ? colors.income : colors.border,
              },
            ]}
          >
            <View style={styles.participantRow}>
              <View style={{ flex: 1 }}>
                {isEdit ? (
                  <View style={styles.editParticipant}>
                    <Text style={[styles.pName, { color: colors.text }]}>{p.name}</Text>
                    <Text style={[styles.pShare, { color: colors.textMuted }]}>
                      Share: {formatCurrency(p.share, currency)}
                    </Text>
                  </View>
                ) : (
                  <>
                    <TextInput
                      style={[styles.pInput, { color: colors.text, borderBottomColor: colors.border }]}
                      value={p.name}
                      onChangeText={(v) => updateParticipant(i, 'name', v)}
                      placeholder="Name"
                      placeholderTextColor={colors.textMuted}
                    />
                    <TextInput
                      style={[styles.pInput, { color: colors.text, borderBottomColor: colors.border }]}
                      value={p.contact}
                      onChangeText={(v) => updateParticipant(i, 'contact', v)}
                      placeholder="Contact (optional)"
                      placeholderTextColor={colors.textMuted}
                      keyboardType="phone-pad"
                    />
                    <TextInput
                      style={[styles.pInput, { color: colors.text, borderBottomColor: colors.border }]}
                      value={p.share}
                      onChangeText={(v) => updateParticipant(i, 'share', v)}
                      placeholder="Share amount"
                      placeholderTextColor={colors.textMuted}
                      keyboardType="decimal-pad"
                    />
                  </>
                )}
              </View>

              {isEdit ? (
                <View style={styles.settleArea}>
                  {p.isPaid ? (
                    <View style={[styles.paidBadge, { backgroundColor: colors.income + '20' }]}>
                      <Ionicons name="checkmark-circle" size={16} color={colors.income} />
                      <Text style={{ fontSize: 12, color: colors.income, fontWeight: '700' }}>Paid</Text>
                    </View>
                  ) : (
                    <TouchableOpacity
                      style={[styles.settleBtn, { backgroundColor: colors.primary }]}
                      onPress={() => handleSettle(p._id)}
                      disabled={settling === p._id}
                    >
                      {settling === p._id
                        ? <ActivityIndicator size="small" color="#fff" />
                        : <Text style={{ fontSize: 12, color: '#fff', fontWeight: '700' }}>Settle</Text>}
                    </TouchableOpacity>
                  )}
                </View>
              ) : (
                participants.length > 1 && (
                  <TouchableOpacity onPress={() => removeParticipant(i)}>
                    <Ionicons name="remove-circle" size={22} color={colors.danger} />
                  </TouchableOpacity>
                )
              )}
            </View>
          </View>
        ))}

        {!isEdit && (
          <TouchableOpacity
            style={[styles.addPersonBtn, { borderColor: colors.primary }]}
            onPress={addParticipant}
          >
            <Ionicons name="person-add-outline" size={16} color={colors.primary} />
            <Text style={{ fontSize: 14, color: colors.primary, fontWeight: '600' }}>Add Another Person</Text>
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
                <Text style={styles.saveBtnText}>{isEdit ? 'Update' : 'Create'} Split</Text>
              </>
            )}
        </TouchableOpacity>
      </ScrollView>

      <DatePickerModal
        visible={showDatePicker}
        value={date}
        onConfirm={(d) => { setDate(d); setShowDatePicker(false); }}
        onCancel={() => setShowDatePicker(false)}
      />

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
                  style={[styles.listOption, { borderBottomColor: colors.border }]}
                  onPress={() => { setWalletId(w._id); setShowWalletModal(false); }}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 15, fontWeight: '600', color: colors.text }}>{w.name}</Text>
                    <Text style={{ fontSize: 12, color: colors.textMuted }}>
                      {formatCurrency(w.balance, currency)}
                    </Text>
                  </View>
                  {walletId === w._id && <Ionicons name="checkmark-circle" size={20} color={colors.primary} />}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

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
  participantHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginTop: spacing.md, marginBottom: spacing.xs,
  },
  participantCard: {
    borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.sm,
    borderWidth: 1.5, ...shadows.small,
  },
  participantRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  editParticipant: { gap: 2 },
  pName: { fontSize: 14, fontWeight: '600' },
  pShare: { fontSize: 12 },
  pInput: {
    fontSize: 14, paddingVertical: spacing.xs,
    borderBottomWidth: 1, marginBottom: spacing.xs,
  },
  settleArea: { alignItems: 'flex-end' },
  settleBtn: {
    paddingHorizontal: spacing.md, paddingVertical: 6, borderRadius: radius.sm,
  },
  paidBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: radius.sm,
  },
  addPersonBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: spacing.sm, borderWidth: 1.5, borderRadius: radius.md,
    height: 48, marginBottom: spacing.sm, borderStyle: 'dashed',
  },
  saveBtn: {
    borderRadius: radius.md, height: 56, flexDirection: 'row',
    alignItems: 'center', justifyContent: 'center', gap: spacing.sm,
    marginTop: spacing.sm, ...shadows.large,
  },
  saveBtnText: { fontSize: 16, fontWeight: '700', color: '#fff' },
  modalOverlay: { flex: 1, justifyContent: 'flex-end' },
  modalSheet: { borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl, maxHeight: '80%' },
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: spacing.md, borderBottomWidth: 1,
  },
  listOption: {
    flexDirection: 'row', alignItems: 'center', padding: spacing.md,
    borderBottomWidth: 1, gap: spacing.md,
  },
  catItem: {
    width: '30%', alignItems: 'center', padding: spacing.sm,
    borderRadius: radius.md, borderWidth: 2,
  },
  catIcon: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center', marginBottom: 4 },
});
