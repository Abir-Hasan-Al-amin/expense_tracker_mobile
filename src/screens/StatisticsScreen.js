import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { PieChart, BarChart } from 'react-native-chart-kit';
import { useSettings } from '../context/SettingsContext';
import { spacing, radius, shadows } from '../theme';
import { formatCurrency } from '../utils/format';
import * as analyticsApi from '../api/analytics';

const { width } = Dimensions.get('window');
const CHART_WIDTH = width - spacing.md * 2;
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

export default function StatisticsScreen({ navigation }) {
  const { colors, currency } = useSettings();
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [summary, setSummary] = useState(null);
  const [breakdown, setBreakdown] = useState([]);
  const [trends, setTrends] = useState([]);
  const [netWorth, setNetWorth] = useState(null);
  const [loading, setLoading] = useState(false);

  const loadStats = useCallback(async () => {
    setLoading(true);
    const params = { month: selectedMonth + 1, year: selectedYear };
    try {
      const [sum, cats, trendData] = await Promise.all([
        analyticsApi.getSummary(params),
        analyticsApi.getCategoryBreakdown(params),
        analyticsApi.getTrends(params),
      ]);
      setSummary(sum);
      setBreakdown(cats?.breakdown || []);
      setTrends(trendData?.trends || []);
    } catch {
      // keep stale data on error
    } finally {
      setLoading(false);
    }
  }, [selectedMonth, selectedYear]);

  const loadNetWorth = useCallback(async () => {
    try {
      const data = await analyticsApi.getNetWorth();
      setNetWorth(data);
    } catch {}
  }, []);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadStats();
      loadNetWorth();
    });
    return unsubscribe;
  }, [navigation, loadStats, loadNetWorth]);

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

  const isCurrentMonth =
    selectedMonth === new Date().getMonth() && selectedYear === new Date().getFullYear();

  // Pie chart data from /analytics/categories
  const pieData = breakdown.slice(0, 6).map((item, index) => ({
    name: item.category?.name || 'Unknown',
    amount: item.total,
    color: item.category?.color || `hsl(${index * 60}, 70%, 50%)`,
    legendFontColor: colors.text,
    legendFontSize: 12,
  }));

  // Bar chart data from /analytics/trends (weekly buckets for readability)
  const hasBarData = trends.length > 0;
  // Show weekly totals (4 bars: week 1-4)
  const weeklyExpense = [0, 0, 0, 0];
  const weeklyIncome = [0, 0, 0, 0];
  trends.forEach(({ day, expense, income }) => {
    const week = Math.min(Math.floor((day - 1) / 7), 3);
    weeklyExpense[week] += expense || 0;
    weeklyIncome[week] += income || 0;
  });
  const barData = {
    labels: ['Wk 1', 'Wk 2', 'Wk 3', 'Wk 4'],
    datasets: [{ data: hasBarData ? weeklyExpense : [0, 0, 0, 0] }],
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
        {loading && <ActivityIndicator size="small" color={colors.primary} />}
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
        {/* Month Selector */}
        <View style={styles.monthSelector}>
          <TouchableOpacity style={[styles.monthBtn, { backgroundColor: colors.card }]} onPress={prevMonth}>
            <Ionicons name="chevron-back" size={20} color={colors.primary} />
          </TouchableOpacity>
          <Text style={[styles.monthText, { color: colors.text }]}>
            {MONTHS[selectedMonth]} {selectedYear}
          </Text>
          <TouchableOpacity
            style={[styles.monthBtn, { backgroundColor: colors.card }, isCurrentMonth && { opacity: 0.4 }]}
            onPress={nextMonth}
            disabled={isCurrentMonth}
          >
            <Ionicons name="chevron-forward" size={20} color={isCurrentMonth ? colors.textMuted : colors.primary} />
          </TouchableOpacity>
        </View>

        {/* Summary cards */}
        <View style={styles.summaryRow}>
          {[
            { label: 'Income', value: summary?.totalIncome || 0, color: colors.income, icon: 'arrow-down-circle' },
            { label: 'Expenses', value: summary?.totalExpense || 0, color: colors.expense, icon: 'arrow-up-circle' },
          ].map(({ label, value, color, icon }) => (
            <View key={label} style={[styles.summaryCard, { backgroundColor: colors.card, borderLeftColor: color }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginBottom: 6 }}>
                <Ionicons name={icon} size={18} color={color} />
                <Text style={{ fontSize: 12, fontWeight: '600', color: colors.textLight }}>{label}</Text>
              </View>
              <Text style={{ fontSize: 18, fontWeight: '700', color }}>
                {formatCurrency(value, currency)}
              </Text>
              <Text style={{ fontSize: 11, color: colors.textMuted, marginTop: 2 }}>
                {label === 'Income' ? `${summary?.incomeCount || 0} entries` : `${summary?.expenseCount || 0} entries`}
              </Text>
            </View>
          ))}
        </View>

        {/* Net Balance */}
        <View style={[styles.netCard, { backgroundColor: colors.card }]}>
          <Text style={{ fontSize: 16, fontWeight: '600', color: colors.text }}>Monthly Net</Text>
          <Text style={{
            fontSize: 20, fontWeight: '800',
            color: (summary?.balance || 0) >= 0 ? colors.income : colors.expense,
          }}>
            {(summary?.balance || 0) >= 0 ? '+' : ''}{formatCurrency(summary?.balance || 0, currency)}
          </Text>
        </View>

        {/* Pie Chart — category breakdown */}
        <View style={[styles.chartCard, { backgroundColor: colors.card }]}>
          <Text style={[styles.chartTitle, { color: colors.text }]}>Expenses by Category</Text>
          {pieData.length > 0 ? (
            <>
              <PieChart
                data={pieData}
                width={CHART_WIDTH}
                height={180}
                chartConfig={{ color: (opacity = 1) => `rgba(108,92,231,${opacity})` }}
                accessor="amount"
                backgroundColor="transparent"
                paddingLeft="15"
                hasLegend={false}
                center={[10, 0]}
              />
              <View style={{ marginTop: spacing.md }}>
                {breakdown.slice(0, 6).map((item, i) => (
                  <View key={item.category?._id || String(i)} style={styles.legendRow}>
                    <View style={[styles.legendDot, { backgroundColor: item.category?.color || `hsl(${i * 60}, 70%, 50%)` }]} />
                    <Text style={{ flex: 1, fontSize: 14, color: colors.text }}>{item.category?.name || 'Unknown'}</Text>
                    <Text style={{ fontSize: 12, color: colors.textMuted }}>{item.percentage}%</Text>
                    <Text style={{ fontSize: 14, fontWeight: '600', color: colors.text, marginLeft: spacing.sm }}>
                      {formatCurrency(item.total, currency)}
                    </Text>
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

        {/* Bar Chart — weekly expense trend */}
        {hasBarData && (
          <View style={[styles.chartCard, { backgroundColor: colors.card }]}>
            <Text style={[styles.chartTitle, { color: colors.text }]}>Weekly Expense Trend</Text>
            <BarChart
              data={barData}
              width={CHART_WIDTH - spacing.md}
              height={180}
              yAxisLabel=""
              yAxisSuffix=""
              chartConfig={chartConfig}
              style={{ borderRadius: radius.md, marginTop: spacing.sm }}
              showValuesOnTopOfBars={false}
              withInnerLines
            />
          </View>
        )}

        {/* Net Worth Snapshot */}
        {netWorth && (
          <View style={[styles.chartCard, { backgroundColor: colors.card }]}>
            <Text style={[styles.chartTitle, { color: colors.text }]}>Net Worth Snapshot</Text>
            <View style={[styles.netWorthTotal, { backgroundColor: colors.primary + '12' }]}>
              <Text style={{ fontSize: 13, color: colors.primary }}>Total Net Worth</Text>
              <Text style={{ fontSize: 26, fontWeight: '800', color: colors.primary }}>
                {formatCurrency(netWorth.netWorth || 0, currency)}
              </Text>
            </View>
            {[
              { label: 'Wallet Balance', value: netWorth.totalWalletBalance, icon: 'wallet-outline', color: colors.income },
              { label: 'Total Savings', value: netWorth.totalSavings, icon: 'trending-up-outline', color: '#6C5CE7' },
              { label: 'Total Lent', value: netWorth.totalLent, icon: 'arrow-forward-outline', color: '#FDCB6E' },
              { label: 'Total Owed', value: netWorth.totalOwed, icon: 'arrow-back-outline', color: colors.expense, negative: true },
            ].map(({ label, value, icon, color, negative }) => (
              <View key={label} style={styles.netWorthRow}>
                <View style={[styles.netWorthIcon, { backgroundColor: color + '20' }]}>
                  <Ionicons name={icon} size={16} color={color} />
                </View>
                <Text style={{ flex: 1, fontSize: 14, color: colors.text }}>{label}</Text>
                <Text style={{ fontSize: 14, fontWeight: '600', color: negative ? colors.expense : color }}>
                  {negative ? '−' : '+'}{formatCurrency(value || 0, currency)}
                </Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: spacing.md, paddingTop: spacing.md, paddingBottom: spacing.sm,
  },
  title: { fontSize: 28, fontWeight: '700' },
  monthSelector: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: spacing.sm, gap: spacing.lg, marginBottom: spacing.sm,
  },
  monthBtn: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center', ...shadows.small },
  monthText: { fontSize: 18, fontWeight: '600', minWidth: 160, textAlign: 'center' },
  summaryRow: { flexDirection: 'row', paddingHorizontal: spacing.md, gap: spacing.sm, marginBottom: spacing.sm },
  summaryCard: { flex: 1, borderRadius: radius.md, padding: spacing.md, borderLeftWidth: 4, ...shadows.small },
  netCard: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    borderRadius: radius.md, paddingHorizontal: spacing.md, paddingVertical: spacing.sm + 4,
    marginHorizontal: spacing.md, marginBottom: spacing.md, ...shadows.small,
  },
  chartCard: { borderRadius: radius.lg, padding: spacing.md, marginHorizontal: spacing.md, marginBottom: spacing.md, ...shadows.small },
  chartTitle: { fontSize: 16, fontWeight: '600', marginBottom: spacing.sm },
  legendRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm },
  legendDot: { width: 10, height: 10, borderRadius: 5, marginRight: spacing.sm },
  netWorthTotal: { borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.md, alignItems: 'center', gap: 4 },
  netWorthRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.sm, gap: spacing.md },
  netWorthIcon: { width: 32, height: 32, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
});
