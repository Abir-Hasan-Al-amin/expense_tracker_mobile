import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  ScrollView, Alert, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSettings } from '../context/SettingsContext';
import { spacing, radius, shadows } from '../theme';
import * as walletsApi from '../api/wallets';

const WALLET_TYPES = [
  { value: 'cash', label: 'Cash', icon: 'cash-outline', color: '#00B894' },
  { value: 'bank', label: 'Bank', icon: 'business-outline', color: '#6C5CE7' },
  { value: 'credit_card', label: 'Credit Card', icon: 'card-outline', color: '#E17055' },
  { value: 'savings', label: 'Savings', icon: 'save-outline', color: '#FDCB6E' },
  { value: 'other', label: 'Other', icon: 'wallet-outline', color: '#74B9FF' },
];

const PRESET_COLORS = [
  '#6C5CE7', '#00B894', '#E17055', '#FDCB6E', '#74B9FF',
  '#A29BFE', '#55EFC4', '#FF7675', '#FD79A8', '#0984E3',
];

export default function AddEditWalletScreen({ navigation, route }) {
  const { wallet } = route.params || {};
  const isEdit = !!wallet;
  const { colors } = useSettings();

  const [name, setName] = useState(wallet?.name || '');
  const [type, setType] = useState(wallet?.type || 'bank');
  const [balance, setBalance] = useState(wallet ? String(wallet.balance) : '');
  const [currency, setCurrency] = useState(wallet?.currency || 'USD');
  const [color, setColor] = useState(wallet?.color || '#6C5CE7');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    navigation.setOptions({ title: isEdit ? 'Edit Wallet' : 'New Wallet' });
  }, [isEdit, navigation]);

  const handleSave = async () => {
    if (!name.trim()) return Alert.alert('Validation', 'Enter a wallet name.');
    const balanceNum = parseFloat(balance || '0');
    setSaving(true);
    try {
      const data = {
        name: name.trim(),
        type,
        balance: isEdit ? undefined : balanceNum,
        currency: currency.trim().toUpperCase() || 'USD',
        color,
      };
      if (isEdit) delete data.balance;
      isEdit
        ? await walletsApi.updateWallet(wallet._id, data)
        : await walletsApi.createWallet({ ...data, balance: balanceNum });
      navigation.goBack();
    } catch (err) {
      Alert.alert('Error', err.message);
    } finally {
      setSaving(false);
    }
  };

  const selectedType = WALLET_TYPES.find((t) => t.value === type);

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ padding: spacing.md, paddingBottom: 60 }}
    >
      {/* Wallet Type */}
      <Text style={[styles.label, { color: colors.textLight }]}>Wallet Type</Text>
      <View style={styles.typeGrid}>
        {WALLET_TYPES.map((t) => {
          const selected = type === t.value;
          return (
            <TouchableOpacity
              key={t.value}
              style={[
                styles.typeItem,
                {
                  backgroundColor: selected ? t.color + '20' : colors.card,
                  borderColor: selected ? t.color : colors.border,
                },
              ]}
              onPress={() => setType(t.value)}
            >
              <View style={[styles.typeIcon, { backgroundColor: t.color + '25' }]}>
                <Ionicons name={t.icon} size={22} color={t.color} />
              </View>
              <Text style={[styles.typeLabel, { color: selected ? t.color : colors.text }]}>
                {t.label}
              </Text>
              {selected && (
                <Ionicons
                  name="checkmark-circle"
                  size={14}
                  color={t.color}
                  style={{ position: 'absolute', top: 6, right: 6 }}
                />
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Name */}
      <Text style={[styles.label, { color: colors.textLight }]}>Name</Text>
      <View style={[styles.inputRow, { backgroundColor: colors.card }]}>
        <Ionicons name="create-outline" size={18} color={colors.textMuted} />
        <TextInput
          style={[styles.input, { color: colors.text }]}
          value={name}
          onChangeText={setName}
          placeholder={`e.g. My ${selectedType?.label || 'Wallet'}`}
          placeholderTextColor={colors.textMuted}
        />
      </View>

      {/* Initial Balance (create only) */}
      {!isEdit && (
        <>
          <Text style={[styles.label, { color: colors.textLight }]}>Initial Balance</Text>
          <View style={[styles.inputRow, { backgroundColor: colors.card }]}>
            <Ionicons name="cash-outline" size={18} color={colors.textMuted} />
            <TextInput
              style={[styles.input, { color: colors.text }]}
              value={balance}
              onChangeText={setBalance}
              keyboardType="decimal-pad"
              placeholder="0.00"
              placeholderTextColor={colors.textMuted}
            />
          </View>
        </>
      )}

      {/* Currency */}
      <Text style={[styles.label, { color: colors.textLight }]}>Currency</Text>
      <View style={[styles.inputRow, { backgroundColor: colors.card }]}>
        <Ionicons name="globe-outline" size={18} color={colors.textMuted} />
        <TextInput
          style={[styles.input, { color: colors.text }]}
          value={currency}
          onChangeText={setCurrency}
          placeholder="USD"
          placeholderTextColor={colors.textMuted}
          autoCapitalize="characters"
          maxLength={3}
        />
      </View>

      {/* Color */}
      <Text style={[styles.label, { color: colors.textLight }]}>Color</Text>
      <View style={styles.colorGrid}>
        {PRESET_COLORS.map((c) => (
          <TouchableOpacity
            key={c}
            style={[styles.colorDot, { backgroundColor: c, borderWidth: color === c ? 3 : 0, borderColor: '#fff' }]}
            onPress={() => setColor(c)}
          >
            {color === c && <Ionicons name="checkmark" size={14} color="#fff" />}
          </TouchableOpacity>
        ))}
      </View>

      {/* Save */}
      <TouchableOpacity
        style={[styles.saveBtn, { backgroundColor: colors.primary }]}
        onPress={handleSave}
        disabled={saving}
        activeOpacity={0.85}
      >
        {saving
          ? <ActivityIndicator color="#fff" />
          : (
            <>
              <Ionicons name="checkmark-circle" size={20} color="#fff" />
              <Text style={styles.saveBtnText}>{isEdit ? 'Update' : 'Create'} Wallet</Text>
            </>
          )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  label: {
    fontSize: 11, fontWeight: '700', textTransform: 'uppercase',
    letterSpacing: 0.8, marginBottom: spacing.xs, marginTop: spacing.md,
  },
  typeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  typeItem: {
    width: '18%', alignItems: 'center', padding: spacing.sm,
    borderRadius: radius.md, borderWidth: 2, gap: 4, minWidth: 60,
  },
  typeIcon: { width: 42, height: 42, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  typeLabel: { fontSize: 11, fontWeight: '600', textAlign: 'center' },
  inputRow: {
    flexDirection: 'row', alignItems: 'center', borderRadius: radius.md,
    paddingHorizontal: spacing.md, height: 52, gap: spacing.sm, ...shadows.small,
  },
  input: { flex: 1, fontSize: 15 },
  colorGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.sm },
  colorDot: {
    width: 36, height: 36, borderRadius: 18,
    justifyContent: 'center', alignItems: 'center',
  },
  saveBtn: {
    borderRadius: radius.md, height: 56, flexDirection: 'row',
    alignItems: 'center', justifyContent: 'center', gap: spacing.sm,
    marginTop: spacing.lg, ...shadows.large,
  },
  saveBtnText: { fontSize: 16, fontWeight: '700', color: '#fff' },
});
