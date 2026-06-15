import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSettings } from '../context/SettingsContext';
import { spacing, radius } from '../theme';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

export default function DatePickerModal({ visible, value, onConfirm, onCancel, allowFuture = false }) {
  const { colors } = useSettings();
  const today = new Date();
  const [viewYear, setViewYear] = useState(value.getFullYear());
  const [viewMonth, setViewMonth] = useState(value.getMonth());
  const [selected, setSelected] = useState(new Date(value));

  // Reset internal state each time the modal opens so a cancelled pick
  // doesn't persist into the next open
  useEffect(() => {
    if (visible) {
      setViewYear(value.getFullYear());
      setViewMonth(value.getMonth());
      setSelected(new Date(value));
    }
  }, [visible]); // eslint-disable-line react-hooks/exhaustive-deps

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  };

  const nextMonth = () => {
    if (!allowFuture) {
      const next = new Date(viewYear, viewMonth + 1, 1);
      if (next > today) return;
    }
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  };

  const buildCalendar = () => {
    const firstDay = new Date(viewYear, viewMonth, 1).getDay();
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const cells = [];
    for (let i = 0; i < firstDay; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(d);
    while (cells.length % 7 !== 0) cells.push(null);
    return cells;
  };

  const isSelected = (day) =>
    day && selected.getDate() === day && selected.getMonth() === viewMonth && selected.getFullYear() === viewYear;

  const isFuture = (day) => !allowFuture && day && new Date(viewYear, viewMonth, day) > today;

  const handleDayPress = (day) => {
    if (!day || isFuture(day)) return;
    setSelected(new Date(viewYear, viewMonth, day));
  };

  const isNextDisabled = () => !allowFuture && new Date(viewYear, viewMonth + 1, 1) > today;

  const cells = buildCalendar();

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onCancel}>
      <View style={[styles.overlay, { backgroundColor: colors.overlay }]}>
        <View style={[styles.sheet, { backgroundColor: colors.card }]}>
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <TouchableOpacity onPress={onCancel}>
              <Text style={{ fontSize: 15, fontWeight: '600', color: colors.expense }}>Cancel</Text>
            </TouchableOpacity>
            <Text style={{ fontSize: 16, fontWeight: '600', color: colors.text }}>Select Date</Text>
            <TouchableOpacity onPress={() => onConfirm(selected)}>
              <Text style={{ fontSize: 15, fontWeight: '600', color: colors.primary }}>Done</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.monthNav}>
            <TouchableOpacity style={[styles.navBtn, { backgroundColor: colors.background }]} onPress={prevMonth}>
              <Ionicons name="chevron-back" size={20} color={colors.primary} />
            </TouchableOpacity>
            <Text style={{ fontSize: 16, fontWeight: '600', color: colors.text, minWidth: 160, textAlign: 'center' }}>
              {MONTHS[viewMonth]} {viewYear}
            </Text>
            <TouchableOpacity style={[styles.navBtn, { backgroundColor: colors.background }, isNextDisabled() && { opacity: 0.4 }]} onPress={nextMonth} disabled={isNextDisabled()}>
              <Ionicons name="chevron-forward" size={20} color={isNextDisabled() ? colors.textMuted : colors.primary} />
            </TouchableOpacity>
          </View>

          <View style={styles.dayLabels}>
            {DAYS.map(d => <Text key={d} style={[styles.dayLabel, { color: colors.textMuted }]}>{d}</Text>)}
          </View>

          <View style={styles.grid}>
            {cells.map((day, idx) => (
              <TouchableOpacity
                key={idx}
                style={[styles.cell, isSelected(day) && { backgroundColor: colors.primary, borderRadius: 20 }, isFuture(day) && { opacity: 0.3 }]}
                onPress={() => handleDayPress(day)}
                disabled={!day || isFuture(day)}
              >
                {day ? (
                  <Text style={[styles.cellText, { color: isSelected(day) ? colors.white : colors.text }, isFuture(day) && { color: colors.textMuted }]}>
                    {day}
                  </Text>
                ) : null}
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.selectedRow}>
            <Ionicons name="calendar-outline" size={16} color={colors.primary} />
            <Text style={{ fontSize: 14, color: colors.primary, fontWeight: '600', marginLeft: 6 }}>
              {selected.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
            </Text>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end' },
  sheet: { borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl, paddingBottom: 32 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: spacing.md, borderBottomWidth: 1 },
  monthNav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  navBtn: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  dayLabels: { flexDirection: 'row', paddingHorizontal: spacing.md, marginBottom: 4 },
  dayLabel: { flex: 1, textAlign: 'center', fontSize: 11, fontWeight: '600' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: spacing.md },
  cell: { width: `${100 / 7}%`, height: 40, justifyContent: 'center', alignItems: 'center' },
  cellText: { fontSize: 14, fontWeight: '500' },
  selectedRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingTop: spacing.md, paddingHorizontal: spacing.md },
});
