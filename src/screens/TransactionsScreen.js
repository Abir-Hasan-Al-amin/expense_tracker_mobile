import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, RefreshControl, Modal, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { useApp } from '../context/AppContext';
import { useSettings } from '../context/SettingsContext';
import { spacing, radius, shadows } from '../theme';
import { formatCurrency } from '../utils/format';
import ExpenseItem from '../components/ExpenseItem';
import EmptyState from '../components/EmptyState';
import DatePickerModal from '../components/DatePickerModal';

const TYPE_FILTERS = ['All', 'Income', 'Expense'];
const SORT_OPTIONS = [
  { label: 'Newest First', value: 'date', order: 'desc' },
  { label: 'Oldest First', value: 'date', order: 'asc' },
  { label: 'Highest Amount', value: 'amount', order: 'desc' },
  { label: 'Lowest Amount', value: 'amount', order: 'asc' },
];

export default function TransactionsScreen({ navigation }) {
  const { expenses, categories, loading, fetchExpenses } = useApp();
  const { colors, currency } = useSettings();
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');
  const [sortIndex, setSortIndex] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [showFilter, setShowFilter] = useState(false);
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);

  const sort = SORT_OPTIONS[sortIndex];

  const buildParams = useCallback(() => {
    const params = { sort: sort.value, order: sort.order };
    if (activeFilter !== 'All') params.type = activeFilter.toLowerCase();
    if (selectedCategory) params.category = selectedCategory._id;
    if (startDate) params.startDate = startDate.toISOString();
    if (endDate) { const e = new Date(endDate); e.setHours(23,59,59,999); params.endDate = e.toISOString(); }
    return params;
  }, [activeFilter, selectedCategory, startDate, endDate, sort]);

  const loadData = useCallback(() => {
    fetchExpenses(buildParams());
  }, [fetchExpenses, buildParams]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', loadData);
    return unsubscribe;
  }, [navigation, loadData]);

  useEffect(() => { loadData(); }, [activeFilter, selectedCategory, startDate, endDate, sortIndex]);

  const filtered = expenses.filter((e) =>
    e.title.toLowerCase().includes(search.toLowerCase()) ||
    e.category?.name?.toLowerCase().includes(search.toLowerCase())
  );

  const grouped = filtered.reduce((acc, expense) => {
    const date = new Date(expense.date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
    if (!acc[date]) acc[date] = [];
    acc[date].push(expense);
    return acc;
  }, {});

  const sections = Object.entries(grouped).map(([date, items]) => ({
    date, items,
    total: items.reduce((sum, e) => sum + (e.type === 'income' ? e.amount : -e.amount), 0),
  }));

  const activeFiltersCount = [selectedCategory, startDate, endDate].filter(Boolean).length + (sortIndex > 0 ? 1 : 0);

  const exportCSV = async () => {
    try {
      if (!FileSystem.documentDirectory) {
        return Alert.alert('Export Failed', 'File storage is not available on this device.');
      }
      const esc = (s) => String(s ?? '').replace(/"/g, '""');
      const header = 'Date,Title,Type,Category,Amount,Note\n';
      const rows = filtered.map((e) => [
        new Date(e.date).toLocaleDateString(),
        `"${esc(e.title)}"`,
        e.type,
        `"${esc(e.category?.name)}"`,
        e.amount,
        `"${esc(e.note)}"`,
      ].join(',')).join('\n');
      const csv = header + rows;
      const path = FileSystem.documentDirectory + 'transactions.csv';
      await FileSystem.writeAsStringAsync(path, csv, { encoding: 'utf8' });
      await Sharing.shareAsync(path, { mimeType: 'text/csv', dialogTitle: 'Export Transactions' });
    } catch (err) {
      Alert.alert('Export Failed', err.message);
    }
  };

  const clearFilters = () => {
    setSelectedCategory(null);
    setStartDate(null);
    setEndDate(null);
    setSortIndex(0);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Transactions</Text>
        <View style={{ flexDirection: 'row', gap: spacing.sm }}>
          <TouchableOpacity style={[styles.iconBtn, { backgroundColor: colors.card }]} onPress={exportCSV}>
            <Ionicons name="download-outline" size={20} color={colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.iconBtn, { backgroundColor: activeFiltersCount > 0 ? colors.primary : colors.card }]} onPress={() => setShowFilter(true)}>
            <Ionicons name="options-outline" size={20} color={activeFiltersCount > 0 ? '#fff' : colors.primary} />
            {activeFiltersCount > 0 && <View style={styles.badge}><Text style={styles.badgeText}>{activeFiltersCount}</Text></View>}
          </TouchableOpacity>
          <TouchableOpacity style={[styles.iconBtn, { backgroundColor: colors.primary }]} onPress={() => navigation.navigate('AddEditExpense')}>
            <Ionicons name="add" size={22} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Search */}
      <View style={[styles.searchBar, { backgroundColor: colors.card }]}>
        <Ionicons name="search-outline" size={18} color={colors.textMuted} />
        <TextInput style={[styles.searchInput, { color: colors.text }]} placeholder="Search transactions..." placeholderTextColor={colors.textMuted} value={search} onChangeText={setSearch} />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Ionicons name="close-circle" size={18} color={colors.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      {/* Type Filter */}
      <View style={styles.filters}>
        {TYPE_FILTERS.map((f) => (
          <TouchableOpacity key={f} style={[styles.filterTab, { backgroundColor: activeFilter === f ? colors.primary : colors.card, borderColor: activeFilter === f ? colors.primary : colors.border }]} onPress={() => setActiveFilter(f)}>
            <Text style={[styles.filterText, { color: activeFilter === f ? '#fff' : colors.textLight }]}>{f}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Active filter chips */}
      {(startDate || endDate || selectedCategory) && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ paddingHorizontal: spacing.md, marginBottom: spacing.xs }}>
          {startDate && <View style={[styles.chip, { backgroundColor: colors.primaryLight + '30', borderColor: colors.primary }]}><Text style={{ fontSize: 11, color: colors.primary }}>From: {startDate.toLocaleDateString()}</Text></View>}
          {endDate && <View style={[styles.chip, { backgroundColor: colors.primaryLight + '30', borderColor: colors.primary }]}><Text style={{ fontSize: 11, color: colors.primary }}>To: {endDate.toLocaleDateString()}</Text></View>}
          {selectedCategory && <View style={[styles.chip, { backgroundColor: selectedCategory.color + '20', borderColor: selectedCategory.color }]}><Text style={{ fontSize: 11, color: selectedCategory.color }}>{selectedCategory.name}</Text></View>}
          <TouchableOpacity style={[styles.chip, { backgroundColor: colors.danger + '15', borderColor: colors.danger }]} onPress={clearFilters}><Text style={{ fontSize: 11, color: colors.danger }}>Clear all</Text></TouchableOpacity>
        </ScrollView>
      )}

      {sections.length === 0 ? (
        <EmptyState icon="receipt-outline" title="No transactions found" subtitle={search ? 'Try a different search term' : 'Add your first transaction'} />
      ) : (
        <FlatList
          data={sections}
          keyExtractor={(item) => item.date}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: spacing.md, paddingBottom: 20 }}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={loadData} tintColor={colors.primary} />}
          renderItem={({ item: section }) => (
            <View style={{ marginBottom: spacing.sm }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.xs, marginTop: spacing.sm }}>
                <Text style={{ fontSize: 12, fontWeight: '600', color: colors.textLight }}>{section.date}</Text>
                <Text style={{ fontSize: 12, fontWeight: '700', color: section.total >= 0 ? colors.income : colors.expense }}>
                  {section.total >= 0 ? '+' : ''}{formatCurrency(section.total, currency)}
                </Text>
              </View>
              {section.items.map((expense) => (
                <ExpenseItem key={expense._id} expense={expense} onPress={() => navigation.navigate('AddEditExpense', { expense })} />
              ))}
            </View>
          )}
        />
      )}

      {/* Filter Sheet */}
      <Modal visible={showFilter} animationType="slide" transparent>
        <View style={[styles.modalOverlay, { backgroundColor: colors.overlay }]}>
          <View style={[styles.filterSheet, { backgroundColor: colors.card }]}>
            <View style={[styles.sheetHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.sheetTitle, { color: colors.text }]}>Filter & Sort</Text>
              <TouchableOpacity onPress={() => setShowFilter(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
            <ScrollView contentContainerStyle={{ padding: spacing.md }}>
              <Text style={[styles.filterLabel, { color: colors.textLight }]}>Sort By</Text>
              {SORT_OPTIONS.map((opt, i) => (
                <TouchableOpacity key={opt.label} style={[styles.sortOption, { backgroundColor: sortIndex === i ? colors.primary + '15' : colors.background, borderColor: sortIndex === i ? colors.primary : colors.border }]} onPress={() => setSortIndex(i)}>
                  <Text style={{ fontSize: 14, color: sortIndex === i ? colors.primary : colors.text, fontWeight: sortIndex === i ? '700' : '400' }}>{opt.label}</Text>
                  {sortIndex === i && <Ionicons name="checkmark" size={16} color={colors.primary} />}
                </TouchableOpacity>
              ))}

              <Text style={[styles.filterLabel, { color: colors.textLight, marginTop: spacing.md }]}>Date Range</Text>
              <View style={{ flexDirection: 'row', gap: spacing.sm }}>
                <TouchableOpacity style={[styles.dateBtn, { backgroundColor: colors.background, borderColor: colors.border, flex: 1 }]} onPress={() => setShowStartPicker(true)}>
                  <Ionicons name="calendar-outline" size={16} color={colors.textMuted} />
                  <Text style={{ fontSize: 13, color: startDate ? colors.text : colors.textMuted }}>{startDate ? startDate.toLocaleDateString() : 'From date'}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.dateBtn, { backgroundColor: colors.background, borderColor: colors.border, flex: 1 }]} onPress={() => setShowEndPicker(true)}>
                  <Ionicons name="calendar-outline" size={16} color={colors.textMuted} />
                  <Text style={{ fontSize: 13, color: endDate ? colors.text : colors.textMuted }}>{endDate ? endDate.toLocaleDateString() : 'To date'}</Text>
                </TouchableOpacity>
              </View>

              <Text style={[styles.filterLabel, { color: colors.textLight, marginTop: spacing.md }]}>Category</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
                <TouchableOpacity style={[styles.catChip, { backgroundColor: !selectedCategory ? colors.primary : colors.background, borderColor: !selectedCategory ? colors.primary : colors.border }]} onPress={() => setSelectedCategory(null)}>
                  <Text style={{ fontSize: 12, fontWeight: '600', color: !selectedCategory ? '#fff' : colors.textLight }}>All</Text>
                </TouchableOpacity>
                {categories.map((cat) => (
                  <TouchableOpacity key={cat._id} style={[styles.catChip, { backgroundColor: selectedCategory?._id === cat._id ? cat.color + '25' : colors.background, borderColor: selectedCategory?._id === cat._id ? cat.color : colors.border }]} onPress={() => setSelectedCategory(cat)}>
                    <Ionicons name={cat.icon} size={12} color={cat.color} />
                    <Text style={{ fontSize: 12, fontWeight: '600', color: selectedCategory?._id === cat._id ? cat.color : colors.textLight }}>{cat.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.lg }}>
                <TouchableOpacity style={[styles.applyBtn, { backgroundColor: colors.background, borderColor: colors.border, borderWidth: 1 }]} onPress={clearFilters}>
                  <Text style={{ color: colors.textLight, fontWeight: '600' }}>Clear</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.applyBtn, { backgroundColor: colors.primary, flex: 2 }]} onPress={() => setShowFilter(false)}>
                  <Text style={{ color: '#fff', fontWeight: '700' }}>Apply</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {showStartPicker && <DatePickerModal visible allowFuture={false} value={startDate || new Date()} onConfirm={(d) => { setStartDate(d); setShowStartPicker(false); setShowFilter(true); }} onCancel={() => { setShowStartPicker(false); setShowFilter(true); }} />}
      {showEndPicker && <DatePickerModal visible allowFuture={false} value={endDate || new Date()} onConfirm={(d) => { setEndDate(d); setShowEndPicker(false); setShowFilter(true); }} onCancel={() => { setShowEndPicker(false); setShowFilter(true); }} />}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing.md, paddingTop: spacing.md, paddingBottom: spacing.sm },
  title: { fontSize: 28, fontWeight: '700' },
  iconBtn: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', ...shadows.small },
  badge: { position: 'absolute', top: -4, right: -4, backgroundColor: '#FF6B6B', borderRadius: 8, width: 16, height: 16, justifyContent: 'center', alignItems: 'center' },
  badgeText: { fontSize: 9, color: '#fff', fontWeight: '700' },
  searchBar: { flexDirection: 'row', alignItems: 'center', borderRadius: radius.md, marginHorizontal: spacing.md, marginBottom: spacing.sm, paddingHorizontal: spacing.md, height: 46, gap: spacing.sm, ...shadows.small },
  searchInput: { flex: 1, fontSize: 14 },
  filters: { flexDirection: 'row', paddingHorizontal: spacing.md, gap: spacing.sm, marginBottom: spacing.sm },
  filterTab: { paddingHorizontal: spacing.md, paddingVertical: 6, borderRadius: radius.full, borderWidth: 1.5 },
  filterText: { fontSize: 13, fontWeight: '600' },
  chip: { paddingHorizontal: spacing.sm, paddingVertical: 4, borderRadius: radius.full, borderWidth: 1, marginRight: spacing.xs },
  modalOverlay: { flex: 1, justifyContent: 'flex-end' },
  filterSheet: { borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl, maxHeight: '85%' },
  sheetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: spacing.md, borderBottomWidth: 1 },
  sheetTitle: { fontSize: 18, fontWeight: '600' },
  filterLabel: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: spacing.sm },
  sortOption: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: spacing.sm + 2, borderRadius: radius.md, borderWidth: 1.5, marginBottom: spacing.sm },
  dateBtn: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, padding: spacing.sm, borderRadius: radius.md, borderWidth: 1.5 },
  catChip: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: spacing.sm, paddingVertical: 6, borderRadius: radius.full, borderWidth: 1.5 },
  applyBtn: { flex: 1, height: 50, borderRadius: radius.md, justifyContent: 'center', alignItems: 'center' },
});
