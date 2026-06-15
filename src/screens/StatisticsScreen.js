import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { PieChart, BarChart } from 'react-native-chart-kit';
import { useApp } from '../context/AppContext';
import { useSettings } from '../context/SettingsContext';
import { spacing, radius, shadows } from '../theme';
import { formatCurrency } from '../utils/format';

const { width } = Dimensions.get('window');
const CHART_WIDTH = width - spacing.md * 2;
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

export default function StatisticsScreen({ navigation }) {
  const { stats, fetchStats } = useApp();
  const { colors, currency } = useSettings();
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const loadStats = useCallback(() => {
    fetchStats({ month: selectedMonth + 1, year: selectedYear });
  }, [fetchStats, selectedMonth, selectedYear]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', loadStats);
    return unsubscribe;
  }, [navigation, loadStats]);

  useEffect(() => { loadStats(); }, [selectedMonth, selectedYear]);

  const prevMonth = () => {
    if (selectedMonth === 0) { setSelectedMonth(11); setSelectedYear((y) => y - 1); }
    else setSelectedMonth((m) => m - 1);
  };

  const nextMonth = () => {
    const now = new Date();
    if (selectedYear === now.getFullYear() && selectedMonth === now.getMonth()) return;
    if (selectedMonth === 11) { setSelectedMonth(0); setSelectedYear((y) => y + 1); }
    else setSelectedMonth((m) => m + 1);
  };

  const isCurrentMonth = selectedMonth === new Date().getMonth() && selectedYear === new Date().getFullYear();

  const pieData = stats?.categoryBreakdown?.slice(0, 6).map((item, index) => ({
    name: item.category?.name || 'Unknown',
    amount: item.total,
    color: item.category?.color || `hsl(${index * 60}, 70%, 50%)`,
    legendFontColor: colors.text,
    legendFontSize: 12,
  })) || [];

  const hasMonthlyData = stats?.monthlyData && stats.monthlyData.length > 0;
  const barData = {
    labels: hasMonthlyData ? stats.monthlyData.map((m) => m.month) : ['—'],
    datasets: [{ data: hasMonthlyData ? stats.monthlyData.map((m) => m.expense || 0) : [0] }],
  };

  const chartConfig = {
    backgroundColor: colors.card,
    backgroundGradientFrom: colors.card,
    backgroundGradientTo: colors.card,
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(255, 107, 107, ${opacity})`,
    labelColor: () => colors.textLight,
    barPercentage: 0.6,
    propsForBackgroundLines: { strokeDasharray: '', stroke: colors.border },
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top']}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Statistics</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
        {/* Month Selector */}
        <View style={styles.monthSelector}>
          <TouchableOpacity style={[styles.monthBtn, { backgroundColor: colors.card }]} onPress={prevMonth}>
            <Ionicons name="chevron-back" size={20} color={colors.primary} />
          </TouchableOpacity>
          <Text style={[styles.monthText, { color: colors.text }]}>{MONTHS[selectedMonth]} {selectedYear}</Text>
          <TouchableOpacity style={[styles.monthBtn, { backgroundColor: colors.card }, isCurrentMonth && { opacity: 0.4 }]} onPress={nextMonth} disabled={isCurrentMonth}>
            <Ionicons name="chevron-forward" size={20} color={isCurrentMonth ? colors.textMuted : colors.primary} />
          </TouchableOpacity>
        </View>

        {/* Summary */}
        <View style={styles.summaryRow}>
          {[
            { label: 'Income', value: stats?.totalIncome || 0, color: colors.income, icon: 'arrow-down-circle' },
            { label: 'Expenses', value: stats?.totalExpense || 0, color: colors.expense, icon: 'arrow-up-circle' },
          ].map(({ label, value, color, icon }) => (
            <View key={label} style={[styles.summaryCard, { backgroundColor: colors.card, borderLeftColor: color }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginBottom: 6 }}>
                <Ionicons name={icon} size={18} color={color} />
                <Text style={{ fontSize: 12, fontWeight: '600', color: colors.textLight }}>{label}</Text>
              </View>
              <Text style={{ fontSize: 18, fontWeight: '700', color }}>{formatCurrency(value, currency)}</Text>
            </View>
          ))}
        </View>

        {/* Net Balance */}
        <View style={[styles.netCard, { backgroundColor: colors.card }]}>
          <Text style={{ fontSize: 16, fontWeight: '600', color: colors.text }}>Net Balance</Text>
          <Text style={{ fontSize: 20, fontWeight: '800', color: (stats?.balance || 0) >= 0 ? colors.income : colors.expense }}>
            {(stats?.balance || 0) >= 0 ? '+' : ''}{formatCurrency(stats?.balance || 0, currency)}
          </Text>
        </View>

        {/* Pie Chart */}
        <View style={[styles.chartCard, { backgroundColor: colors.card }]}>
          <Text style={[styles.chartTitle, { color: colors.text }]}>Expenses by Category</Text>
          {pieData.length > 0 ? (
            <>
              <PieChart data={pieData} width={CHART_WIDTH} height={180} chartConfig={{ color: (opacity = 1) => `rgba(108,92,231,${opacity})` }} accessor="amount" backgroundColor="transparent" paddingLeft="15" hasLegend={false} center={[10, 0]} />
              <View style={{ marginTop: spacing.md }}>
                {pieData.map((item, i) => (
                  <View key={item.name || String(i)} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm }}>
                    <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: item.color, marginRight: spacing.sm }} />
                    <Text style={{ flex: 1, fontSize: 14, color: colors.text }}>{item.name}</Text>
                    <Text style={{ fontSize: 14, fontWeight: '600', color: colors.text }}>{formatCurrency(item.amount, currency)}</Text>
                  </View>
                ))}
              </View>
            </>
          ) : (
            <View style={{ alignItems: 'center', paddingVertical: spacing.xl, gap: spacing.sm }}>
              <Ionicons name="pie-chart-outline" size={40} color={colors.textMuted} />
              <Text style={{ fontSize: 14, color: colors.textMuted }}>No expenses this month</Text>
            </View>
          )}
        </View>

        {/* Bar Chart */}
        {stats?.monthlyData && stats.monthlyData.length > 0 && (
          <View style={[styles.chartCard, { backgroundColor: colors.card }]}>
            <Text style={[styles.chartTitle, { color: colors.text }]}>6-Month Expense Trend</Text>
            <BarChart data={barData} width={CHART_WIDTH - spacing.md} height={200} yAxisLabel="" yAxisSuffix="" chartConfig={chartConfig} style={{ borderRadius: radius.md, marginTop: spacing.sm }} showValuesOnTopOfBars={false} withInnerLines />
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: spacing.md, paddingTop: spacing.md, paddingBottom: spacing.sm },
  title: { fontSize: 28, fontWeight: '700' },
  monthSelector: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: spacing.sm, gap: spacing.lg, marginBottom: spacing.sm },
  monthBtn: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center', ...shadows.small },
  monthText: { fontSize: 18, fontWeight: '600', minWidth: 160, textAlign: 'center' },
  summaryRow: { flexDirection: 'row', paddingHorizontal: spacing.md, gap: spacing.sm, marginBottom: spacing.sm },
  summaryCard: { flex: 1, borderRadius: radius.md, padding: spacing.md, borderLeftWidth: 4, ...shadows.small },
  netCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderRadius: radius.md, paddingHorizontal: spacing.md, paddingVertical: spacing.sm + 4, marginHorizontal: spacing.md, marginBottom: spacing.md, ...shadows.small },
  chartCard: { borderRadius: radius.lg, padding: spacing.md, marginHorizontal: spacing.md, marginBottom: spacing.md, ...shadows.small },
  chartTitle: { fontSize: 16, fontWeight: '600', marginBottom: spacing.sm },
});
