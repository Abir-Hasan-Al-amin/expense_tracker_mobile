import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert, ActivityIndicator, Modal, Switch } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { useSettings } from '../context/SettingsContext';
import { spacing, radius, shadows } from '../theme';
import DatePickerModal from '../components/DatePickerModal';

const TYPES = ['expense', 'income'];
const FREQUENCIES = ['daily', 'weekly', 'monthly'];

export default function AddEditExpenseScreen({ navigation, route }) {
  const { expense } = route.params || {};
  const isEdit = !!expense;
  const { categories, fetchCategories, addExpense, editExpense, removeExpense } = useApp();
  const { colors, currencyInfo } = useSettings();

  useEffect(() => { fetchCategories(); }, [fetchCategories]);

  const [type, setType] = useState(expense?.type || 'expense');
  const [title, setTitle] = useState(expense?.title || '');
  const [amount, setAmount] = useState(expense ? String(expense.amount) : '');
  const [category, setCategory] = useState(expense?.category || null);
  const [date, setDate] = useState(expense ? new Date(expense.date) : new Date());
  const [note, setNote] = useState(expense?.note || '');
  const [isRecurring, setIsRecurring] = useState(expense?.isRecurring || false);
  const [frequency, setFrequency] = useState(expense?.recurringFrequency || 'monthly');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleDelete = useCallback(() => {
    Alert.alert('Delete Transaction', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try { await removeExpense(expense._id); navigation.goBack(); }
        catch (err) { Alert.alert('Error', err.message); }
      }},
    ]);
  }, [expense?._id, removeExpense, navigation]);

  useEffect(() => {
    navigation.setOptions({
      title: isEdit ? 'Edit Transaction' : 'Add Transaction',
      headerRight: isEdit ? () => (
        <TouchableOpacity onPress={handleDelete} style={{ marginRight: 4 }}>
          <Ionicons name="trash-outline" size={22} color="#fff" />
        </TouchableOpacity>
      ) : undefined,
    });
  }, [isEdit, navigation, handleDelete]);

  const filteredCategories = categories.filter((c) => c.type === 'both' || c.type === type);
  const accentColor = type === 'income' ? colors.income : colors.expense;

  const handleSave = async () => {
    if (!title.trim()) return Alert.alert('Validation', 'Please enter a title.');
    const parsedAmount = parseFloat(amount);
    if (!amount || isNaN(parsedAmount) || parsedAmount <= 0) return Alert.alert('Validation', 'Please enter a valid amount.');
    if (!category) return Alert.alert('Validation', 'Please select a category.');
    setSaving(true);
    try {
      const data = { title: title.trim(), amount: parsedAmount, type, category: category._id, date: date.toISOString(), note: note.trim(), isRecurring, recurringFrequency: isRecurring ? frequency : null };
      isEdit ? await editExpense(expense._id, data) : await addExpense(data);
      navigation.goBack();
    } catch (err) { Alert.alert('Error', err.message); }
    finally { setSaving(false); }
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.background }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
      {/* Type Toggle */}
      <View style={[styles.typeToggle, { backgroundColor: colors.card }]}>
        {TYPES.map((t) => (
          <TouchableOpacity key={t} style={[styles.typeBtn, type === t && { backgroundColor: t === 'income' ? colors.income : colors.expense }]} onPress={() => { setType(t); setCategory(null); }}>
            <Ionicons name={t === 'income' ? 'arrow-down' : 'arrow-up'} size={15} color={type === t ? '#fff' : colors.textLight} />
            <Text style={[styles.typeBtnText, { color: type === t ? '#fff' : colors.textLight }]}>{t === 'income' ? 'Income' : 'Expense'}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Amount */}
      <View style={styles.amountRow}>
        <Text style={[styles.currencySymbol, { color: accentColor }]}>{currencyInfo.symbol}</Text>
        <TextInput style={[styles.amountInput, { color: accentColor }]} value={amount} onChangeText={setAmount} keyboardType="decimal-pad" placeholder="0.00" placeholderTextColor={colors.border} autoFocus={!isEdit} />
      </View>

      <View style={{ paddingHorizontal: spacing.md, paddingBottom: spacing.xxl }}>
        {/* Title */}
        <Text style={[styles.label, { color: colors.textLight }]}>Title</Text>
        <View style={[styles.inputRow, { backgroundColor: colors.card }]}>
          <Ionicons name="create-outline" size={18} color={colors.textMuted} />
          <TextInput style={[styles.input, { color: colors.text }]} value={title} onChangeText={setTitle} placeholder="e.g. Lunch, Salary..." placeholderTextColor={colors.textMuted} />
        </View>

        {/* Category */}
        <Text style={[styles.label, { color: colors.textLight }]}>Category</Text>
        <TouchableOpacity style={[styles.inputRow, { backgroundColor: colors.card }]} onPress={() => setShowCategoryModal(true)}>
          {category ? (
            <><View style={[styles.catDot, { backgroundColor: category.color }]} /><Text style={[styles.input, { flex: 1, color: colors.text }]}>{category.name}</Text></>
          ) : (
            <><Ionicons name="grid-outline" size={18} color={colors.textMuted} /><Text style={[styles.input, { flex: 1, color: colors.textMuted }]}>Select category</Text></>
          )}
          <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
        </TouchableOpacity>

        {/* Date */}
        <Text style={[styles.label, { color: colors.textLight }]}>Date</Text>
        <TouchableOpacity style={[styles.inputRow, { backgroundColor: colors.card }]} onPress={() => setShowDatePicker(true)}>
          <Ionicons name="calendar-outline" size={18} color={colors.textMuted} />
          <Text style={[styles.input, { flex: 1, color: colors.text }]}>{date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</Text>
          <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
        </TouchableOpacity>

        {/* Note */}
        <Text style={[styles.label, { color: colors.textLight }]}>Note (optional)</Text>
        <View style={[styles.inputRow, { backgroundColor: colors.card, alignItems: 'flex-start', paddingTop: spacing.sm }]}>
          <Ionicons name="document-text-outline" size={18} color={colors.textMuted} style={{ marginTop: 2 }} />
          <TextInput style={[styles.input, { flex: 1, height: 80, textAlignVertical: 'top', color: colors.text }]} value={note} onChangeText={setNote} placeholder="Add a note..." placeholderTextColor={colors.textMuted} multiline numberOfLines={3} />
        </View>

        {/* Recurring */}
        <View style={[styles.recurringRow, { backgroundColor: colors.card }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
            <Ionicons name="repeat" size={20} color={isRecurring ? colors.primary : colors.textMuted} />
            <View>
              <Text style={{ fontSize: 15, fontWeight: '600', color: colors.text }}>Repeat Transaction</Text>
              <Text style={{ fontSize: 11, color: colors.textMuted }}>Auto-create on schedule</Text>
            </View>
          </View>
          <Switch value={isRecurring} onValueChange={setIsRecurring} trackColor={{ false: colors.border, true: colors.primaryLight }} thumbColor={isRecurring ? colors.primary : '#f0f0f0'} />
        </View>

        {isRecurring && (
          <View style={{ flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md }}>
            {FREQUENCIES.map((f) => (
              <TouchableOpacity key={f} style={[styles.freqBtn, { backgroundColor: frequency === f ? colors.primary : colors.card, borderColor: frequency === f ? colors.primary : colors.border }]} onPress={() => setFrequency(f)}>
                <Text style={{ fontSize: 13, fontWeight: '600', color: frequency === f ? '#fff' : colors.textLight, textTransform: 'capitalize' }}>{f}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Save */}
        <TouchableOpacity style={[styles.saveBtn, { backgroundColor: accentColor }]} onPress={handleSave} disabled={saving} activeOpacity={0.85}>
          {saving ? <ActivityIndicator color="#fff" /> : (
            <><Ionicons name="checkmark-circle" size={20} color="#fff" /><Text style={styles.saveBtnText}>{isEdit ? 'Update' : 'Save'} Transaction</Text></>
          )}
        </TouchableOpacity>
      </View>

      <DatePickerModal visible={showDatePicker} value={date} onConfirm={(d) => { setDate(d); setShowDatePicker(false); }} onCancel={() => setShowDatePicker(false)} />

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
                {filteredCategories.length === 0 ? (
                  <Text style={{ fontSize: 14, color: colors.textMuted, padding: spacing.xl, width: '100%', textAlign: 'center' }}>No categories for this type.</Text>
                ) : filteredCategories.map((cat) => (
                  <TouchableOpacity key={cat._id} style={[styles.catItem, { borderColor: category?._id === cat._id ? colors.primary : 'transparent', backgroundColor: category?._id === cat._id ? colors.primary + '10' : colors.background }]} onPress={() => { setCategory(cat); setShowCategoryModal(false); }}>
                    <View style={[styles.catIcon, { backgroundColor: cat.color + '25' }]}>
                      <Ionicons name={cat.icon} size={24} color={cat.color} />
                    </View>
                    <Text style={{ fontSize: 11, fontWeight: '600', color: colors.text, textAlign: 'center' }} numberOfLines={1}>{cat.name}</Text>
                    {category?._id === cat._id && <Ionicons name="checkmark-circle" size={16} color={colors.primary} style={{ position: 'absolute', top: 4, right: 4 }} />}
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  typeToggle: { flexDirection: 'row', margin: spacing.md, borderRadius: radius.md, padding: 4, ...shadows.small },
  typeBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: spacing.sm + 2, borderRadius: radius.sm, gap: 6 },
  typeBtnText: { fontSize: 14, fontWeight: '600' },
  amountRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: spacing.lg },
  currencySymbol: { fontSize: 32, fontWeight: '700', marginRight: 4 },
  amountInput: { fontSize: 52, fontWeight: '800', minWidth: 80, textAlign: 'center' },
  label: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: spacing.xs, marginTop: spacing.md },
  inputRow: { flexDirection: 'row', alignItems: 'center', borderRadius: radius.md, paddingHorizontal: spacing.md, minHeight: 52, gap: spacing.sm, ...shadows.small, marginBottom: spacing.xs },
  input: { flex: 1, fontSize: 15 },
  catDot: { width: 12, height: 12, borderRadius: 6 },
  recurringRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderRadius: radius.md, padding: spacing.md, ...shadows.small, marginTop: spacing.md, marginBottom: spacing.sm },
  freqBtn: { flex: 1, paddingVertical: spacing.sm, borderRadius: radius.md, alignItems: 'center', borderWidth: 1.5 },
  saveBtn: { borderRadius: radius.md, height: 56, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, marginTop: spacing.md, ...shadows.large },
  saveBtnText: { fontSize: 16, fontWeight: '700', color: '#fff' },
  modalOverlay: { flex: 1, justifyContent: 'flex-end' },
  modalSheet: { borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl, paddingBottom: 40, maxHeight: '80%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: spacing.md, borderBottomWidth: 1 },
  catItem: { width: '30%', alignItems: 'center', padding: spacing.sm, borderRadius: radius.md, borderWidth: 2 },
  catIcon: { width: 52, height: 52, borderRadius: 26, justifyContent: 'center', alignItems: 'center', marginBottom: 6 },
});
