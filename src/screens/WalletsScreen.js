import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  RefreshControl, Alert, Modal, TextInput, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useSettings } from '../context/SettingsContext';
import { spacing, radius, shadows } from '../theme';
import { formatCurrency } from '../utils/format';
import * as walletsApi from '../api/wallets';

const WALLET_TYPE_ICONS = {
  cash: 'cash-outline',
  bank: 'business-outline',
  credit_card: 'card-outline',
  savings: 'save-outline',
  other: 'wallet-outline',
};

const WALLET_TYPE_COLORS = {
  cash: '#00B894',
  bank: '#6C5CE7',
  credit_card: '#E17055',
  savings: '#FDCB6E',
  other: '#74B9FF',
};

export default function WalletsScreen({ navigation }) {
  const { colors, currency } = useSettings();
  const [wallets, setWallets] = useState([]);
  const [totalBalance, setTotalBalance] = useState(0);
  const [loading, setLoading] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [fromWallet, setFromWallet] = useState(null);
  const [toWalletId, setToWalletId] = useState('');
  const [transferAmount, setTransferAmount] = useState('');
  const [transferNote, setTransferNote] = useState('');
  const [transferring, setTransferring] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await walletsApi.getWallets();
      setWallets(data.wallets || []);
      setTotalBalance(data.totalBalance || 0);
    } catch (err) {
      Alert.alert('Error', err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const handleDelete = (wallet) => {
    Alert.alert('Delete Wallet', `Delete "${wallet.name}"? This cannot be undone.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: async () => {
          try {
            await walletsApi.deleteWallet(wallet._id);
            load();
          } catch (err) {
            Alert.alert('Error', err.message);
          }
        },
      },
    ]);
  };

  const openTransfer = (wallet) => {
    setFromWallet(wallet);
    setToWalletId('');
    setTransferAmount('');
    setTransferNote('');
    setShowTransferModal(true);
  };

  const handleTransfer = async () => {
    if (!toWalletId) return Alert.alert('Validation', 'Select a destination wallet.');
    const amt = parseFloat(transferAmount);
    if (!amt || amt <= 0) return Alert.alert('Validation', 'Enter a valid amount.');
    setTransferring(true);
    try {
      await walletsApi.transferWallet(fromWallet._id, {
        toWalletId,
        amount: amt,
        note: transferNote.trim() || undefined,
      });
      setShowTransferModal(false);
      load();
      Alert.alert('Success', 'Transfer completed.');
    } catch (err) {
      Alert.alert('Error', err.message);
    } finally {
      setTransferring(false);
    }
  };

  const otherWallets = wallets.filter((w) => w._id !== fromWallet?._id);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={[styles.title, { color: colors.text }]}>Wallets</Text>
          <Text style={[styles.subtitle, { color: colors.textMuted }]}>
            Total: {formatCurrency(totalBalance, currency)}
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.addBtn, { backgroundColor: colors.primary }]}
          onPress={() => navigation.navigate('AddEditWallet')}
        >
          <Ionicons name="add" size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: spacing.md, paddingBottom: 40 }}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={load} tintColor={colors.primary} />}
      >
        {wallets.length === 0 && !loading ? (
          <View style={styles.empty}>
            <Ionicons name="wallet-outline" size={56} color={colors.textMuted} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>No wallets yet</Text>
            <Text style={[styles.emptySubtitle, { color: colors.textMuted }]}>
              Tap + to add your first wallet
            </Text>
          </View>
        ) : (
          wallets.map((wallet) => {
            const typeColor = WALLET_TYPE_COLORS[wallet.type] || colors.primary;
            return (
              <View key={wallet._id} style={[styles.card, { backgroundColor: colors.card }]}>
                <View style={styles.cardLeft}>
                  <View style={[styles.iconBox, { backgroundColor: typeColor + '20' }]}>
                    <Ionicons
                      name={WALLET_TYPE_ICONS[wallet.type] || 'wallet-outline'}
                      size={24}
                      color={typeColor}
                    />
                  </View>
                  <View>
                    <Text style={[styles.walletName, { color: colors.text }]}>{wallet.name}</Text>
                    <Text style={[styles.walletType, { color: colors.textMuted }]}>
                      {wallet.type?.replace('_', ' ')}
                    </Text>
                  </View>
                </View>
                <View style={styles.cardRight}>
                  <Text style={[styles.balance, { color: typeColor }]}>
                    {formatCurrency(wallet.balance, currency)}
                  </Text>
                  <View style={styles.actions}>
                    <TouchableOpacity
                      style={[styles.actionBtn, { backgroundColor: colors.primary + '15' }]}
                      onPress={() => openTransfer(wallet)}
                    >
                      <Ionicons name="swap-horizontal" size={15} color={colors.primary} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.actionBtn, { backgroundColor: colors.primary + '15' }]}
                      onPress={() => navigation.navigate('AddEditWallet', { wallet })}
                    >
                      <Ionicons name="pencil" size={15} color={colors.primary} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.actionBtn, { backgroundColor: colors.danger + '15' }]}
                      onPress={() => handleDelete(wallet)}
                    >
                      <Ionicons name="trash-outline" size={15} color={colors.danger} />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      {/* Transfer Modal */}
      <Modal visible={showTransferModal} animationType="slide" transparent>
        <View style={[styles.modalOverlay, { backgroundColor: colors.overlay }]}>
          <View style={[styles.modalSheet, { backgroundColor: colors.card }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <Text style={{ fontSize: 18, fontWeight: '600', color: colors.text }}>
                Transfer from {fromWallet?.name}
              </Text>
              <TouchableOpacity onPress={() => setShowTransferModal(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
            <ScrollView contentContainerStyle={{ padding: spacing.md }}>
              <Text style={[styles.fieldLabel, { color: colors.textLight }]}>To Wallet</Text>
              {otherWallets.map((w) => (
                <TouchableOpacity
                  key={w._id}
                  style={[
                    styles.walletOption,
                    {
                      borderColor: toWalletId === w._id ? colors.primary : colors.border,
                      backgroundColor: toWalletId === w._id ? colors.primary + '10' : colors.background,
                    },
                  ]}
                  onPress={() => setToWalletId(w._id)}
                >
                  <Ionicons
                    name={WALLET_TYPE_ICONS[w.type] || 'wallet-outline'}
                    size={18}
                    color={toWalletId === w._id ? colors.primary : colors.textMuted}
                  />
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 14, fontWeight: '600', color: colors.text }}>{w.name}</Text>
                    <Text style={{ fontSize: 12, color: colors.textMuted }}>
                      Balance: {formatCurrency(w.balance, currency)}
                    </Text>
                  </View>
                  {toWalletId === w._id && (
                    <Ionicons name="checkmark-circle" size={18} color={colors.primary} />
                  )}
                </TouchableOpacity>
              ))}

              <Text style={[styles.fieldLabel, { color: colors.textLight }]}>Amount</Text>
              <View style={[styles.inputRow, { backgroundColor: colors.background, borderColor: colors.border }]}>
                <TextInput
                  style={[styles.input, { color: colors.text }]}
                  value={transferAmount}
                  onChangeText={setTransferAmount}
                  keyboardType="decimal-pad"
                  placeholder="0.00"
                  placeholderTextColor={colors.textMuted}
                />
              </View>

              <Text style={[styles.fieldLabel, { color: colors.textLight }]}>Note (optional)</Text>
              <View style={[styles.inputRow, { backgroundColor: colors.background, borderColor: colors.border }]}>
                <TextInput
                  style={[styles.input, { color: colors.text }]}
                  value={transferNote}
                  onChangeText={setTransferNote}
                  placeholder="e.g. Moving savings"
                  placeholderTextColor={colors.textMuted}
                />
              </View>

              <TouchableOpacity
                style={[styles.confirmBtn, { backgroundColor: colors.primary }]}
                onPress={handleTransfer}
                disabled={transferring}
              >
                {transferring
                  ? <ActivityIndicator color="#fff" />
                  : <Text style={{ color: '#fff', fontSize: 15, fontWeight: '700' }}>Transfer</Text>}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
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
  card: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    borderRadius: radius.lg, padding: spacing.md, marginBottom: spacing.sm, ...shadows.small,
  },
  cardLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, flex: 1 },
  cardRight: { alignItems: 'flex-end', gap: 6 },
  iconBox: { width: 46, height: 46, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  walletName: { fontSize: 15, fontWeight: '600' },
  walletType: { fontSize: 12, textTransform: 'capitalize', marginTop: 2 },
  balance: { fontSize: 16, fontWeight: '700' },
  actions: { flexDirection: 'row', gap: 6 },
  actionBtn: { width: 30, height: 30, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  empty: { alignItems: 'center', paddingTop: 80, gap: spacing.sm },
  emptyTitle: { fontSize: 18, fontWeight: '600' },
  emptySubtitle: { fontSize: 14 },
  modalOverlay: { flex: 1, justifyContent: 'flex-end' },
  modalSheet: { borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl, maxHeight: '85%' },
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: spacing.md, borderBottomWidth: 1,
  },
  fieldLabel: {
    fontSize: 11, fontWeight: '700', textTransform: 'uppercase',
    letterSpacing: 0.8, marginBottom: spacing.xs, marginTop: spacing.md,
  },
  walletOption: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    padding: spacing.md, borderRadius: radius.md, borderWidth: 1.5, marginBottom: spacing.sm,
  },
  inputRow: {
    borderRadius: radius.md, paddingHorizontal: spacing.md,
    height: 52, borderWidth: 1.5, justifyContent: 'center',
  },
  input: { fontSize: 15 },
  confirmBtn: {
    borderRadius: radius.md, height: 52,
    justifyContent: 'center', alignItems: 'center', marginTop: spacing.lg,
  },
});
