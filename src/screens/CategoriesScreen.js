import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Modal, TextInput, Alert, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { useSettings } from '../context/SettingsContext';
import { spacing, radius, shadows } from '../theme';

const ICON_OPTIONS = ['restaurant','car','home','medical','school','shirt','game-controller','fitness','airplane','musical-notes','cart','gift','phone-portrait','tv','laptop','cash','wallet','trending-up','briefcase','heart','people','paw','leaf','flash','wifi','bus','train','bicycle','cafe','fast-food','film','book','barbell','water','ellipsis-horizontal'];
const COLOR_OPTIONS = ['#6C5CE7','#00B894','#FF6B6B','#FDCB6E','#74B9FF','#E17055','#A29BFE','#55EFC4','#FFA07A','#81ECEC','#F368E0','#5F27CD','#01CBC6','#FF9F43','#EE5A24','#0652DD','#1289A7','#EC407A','#EA2027','#006266'];
const TYPES = ['expense', 'income', 'both'];

export default function CategoriesScreen({ navigation }) {
  const { categories, fetchCategories, addCategory, editCategory, removeCategory } = useApp();
  const { colors } = useSettings();
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [name, setName] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('ellipsis-horizontal');
  const [selectedColor, setSelectedColor] = useState('#6C5CE7');
  const [catType, setCatType] = useState('both');

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', fetchCategories);
    return unsubscribe;
  }, [navigation, fetchCategories]);

  const openAdd = () => { setEditing(null); setName(''); setSelectedIcon('ellipsis-horizontal'); setSelectedColor('#6C5CE7'); setCatType('both'); setShowModal(true); };
  const openEdit = (cat) => { setEditing(cat); setName(cat.name); setSelectedIcon(cat.icon); setSelectedColor(cat.color); setCatType(cat.type); setShowModal(true); };

  const handleSave = async () => {
    if (!name.trim()) return Alert.alert('Validation', 'Please enter a category name.');
    try {
      const data = { name: name.trim(), icon: selectedIcon, color: selectedColor, type: catType };
      editing ? await editCategory(editing._id, data) : await addCategory(data);
      setShowModal(false);
    } catch (err) { Alert.alert('Error', err.message); }
  };

  const handleDelete = (cat) => {
    Alert.alert('Delete Category', `Delete "${cat.name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => { try { await removeCategory(cat._id); } catch (err) { Alert.alert('Error', err.message); } } },
    ]);
  };

  const typeColor = { expense: colors.expense, income: colors.income, both: colors.primary };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top']}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Categories</Text>
        <TouchableOpacity style={[styles.addBtn, { backgroundColor: colors.primary }]} onPress={openAdd}>
          <Ionicons name="add" size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={categories}
        keyExtractor={(item) => item._id}
        contentContainerStyle={{ padding: spacing.md, gap: spacing.sm }}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <View style={[styles.row, { backgroundColor: colors.card }]}>
            <View style={[styles.iconBox, { backgroundColor: item.color + '20' }]}>
              <Ionicons name={item.icon} size={22} color={item.color} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.catName, { color: colors.text }]}>{item.name}</Text>
              <View style={[styles.typeBadge, { backgroundColor: typeColor[item.type] + '20' }]}>
                <Text style={[styles.typeText, { color: typeColor[item.type] }]}>{item.type}</Text>
              </View>
            </View>
            <View style={{ flexDirection: 'row', gap: spacing.xs }}>
              <TouchableOpacity style={[styles.actionBtn, { backgroundColor: colors.background }]} onPress={() => openEdit(item)}>
                <Ionicons name="pencil-outline" size={17} color={colors.primary} />
              </TouchableOpacity>
              <TouchableOpacity style={[styles.actionBtn, { backgroundColor: colors.background }]} onPress={() => handleDelete(item)}>
                <Ionicons name="trash-outline" size={17} color={colors.expense} />
              </TouchableOpacity>
            </View>
          </View>
        )}
        ListEmptyComponent={
          <View style={{ alignItems: 'center', paddingTop: 80, gap: spacing.sm }}>
            <Ionicons name="grid-outline" size={52} color={colors.textMuted} />
            <Text style={{ fontSize: 16, fontWeight: '600', color: colors.textLight }}>No categories yet</Text>
            <Text style={{ fontSize: 14, color: colors.textMuted }}>Tap + to add your first category</Text>
          </View>
        }
      />

      <Modal visible={showModal} animationType="slide" transparent>
        <View style={[styles.modalOverlay, { backgroundColor: colors.overlay }]}>
          <View style={[styles.modalSheet, { backgroundColor: colors.card }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <Text style={{ fontSize: 18, fontWeight: '600', color: colors.text }}>{editing ? 'Edit' : 'Add'} Category</Text>
              <TouchableOpacity onPress={() => setShowModal(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
            <ScrollView contentContainerStyle={{ padding: spacing.md, paddingBottom: 40 }}>
              <View style={{ alignItems: 'center', paddingVertical: spacing.lg }}>
                <View style={[styles.previewIcon, { backgroundColor: selectedColor + '25' }]}>
                  <Ionicons name={selectedIcon} size={36} color={selectedColor} />
                </View>
                <Text style={{ fontSize: 18, fontWeight: '600', color: colors.text }}>{name || 'Category Name'}</Text>
              </View>

              <Text style={[styles.fieldLabel, { color: colors.textLight }]}>Name</Text>
              <TextInput style={[styles.textInput, { backgroundColor: colors.background, color: colors.text }]} value={name} onChangeText={setName} placeholder="Category name" placeholderTextColor={colors.textMuted} />

              <Text style={[styles.fieldLabel, { color: colors.textLight }]}>Type</Text>
              <View style={{ flexDirection: 'row', gap: spacing.sm }}>
                {TYPES.map((t) => (
                  <TouchableOpacity key={t} style={[styles.typeChip, { backgroundColor: catType === t ? typeColor[t] + '15' : colors.background, borderColor: catType === t ? typeColor[t] : 'transparent' }]} onPress={() => setCatType(t)}>
                    <Text style={{ fontSize: 13, fontWeight: '600', color: catType === t ? typeColor[t] : colors.textLight }}>{t.charAt(0).toUpperCase() + t.slice(1)}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={[styles.fieldLabel, { color: colors.textLight }]}>Color</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
                {COLOR_OPTIONS.map((c) => (
                  <TouchableOpacity key={c} style={[styles.colorDot, { backgroundColor: c }, selectedColor === c && styles.colorDotSelected]} onPress={() => setSelectedColor(c)}>
                    {selectedColor === c && <Ionicons name="checkmark" size={14} color="#fff" />}
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={[styles.fieldLabel, { color: colors.textLight }]}>Icon</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs }}>
                {ICON_OPTIONS.map((ic) => (
                  <TouchableOpacity key={ic} style={[styles.iconOption, { backgroundColor: selectedIcon === ic ? selectedColor + '20' : colors.background, borderColor: selectedIcon === ic ? selectedColor : 'transparent' }]} onPress={() => setSelectedIcon(ic)}>
                    <Ionicons name={ic} size={22} color={selectedIcon === ic ? selectedColor : colors.textMuted} />
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity style={[styles.saveBtn, { backgroundColor: selectedColor }]} onPress={handleSave}>
                <Text style={{ color: '#fff', fontSize: 15, fontWeight: '700' }}>{editing ? 'Update' : 'Create'} Category</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing.md, paddingTop: spacing.md, paddingBottom: spacing.sm },
  title: { fontSize: 28, fontWeight: '700' },
  addBtn: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', borderRadius: radius.md, padding: spacing.md, ...shadows.small },
  iconBox: { width: 46, height: 46, borderRadius: 23, justifyContent: 'center', alignItems: 'center', marginRight: spacing.md },
  catName: { fontSize: 16, fontWeight: '600', marginBottom: 4 },
  typeBadge: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999 },
  typeText: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase' },
  actionBtn: { width: 34, height: 34, borderRadius: 17, justifyContent: 'center', alignItems: 'center' },
  modalOverlay: { flex: 1, justifyContent: 'flex-end' },
  modalSheet: { borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl, maxHeight: '92%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: spacing.md, borderBottomWidth: 1 },
  previewIcon: { width: 72, height: 72, borderRadius: 36, justifyContent: 'center', alignItems: 'center', marginBottom: spacing.sm },
  fieldLabel: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: spacing.sm, marginTop: spacing.md },
  textInput: { borderRadius: radius.md, padding: spacing.md, fontSize: 15 },
  typeChip: { flex: 1, paddingVertical: spacing.sm, borderRadius: radius.md, alignItems: 'center', borderWidth: 2 },
  colorDot: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: 'transparent' },
  colorDotSelected: { borderColor: '#fff', transform: [{ scale: 1.15 }] },
  iconOption: { width: 44, height: 44, borderRadius: radius.sm, justifyContent: 'center', alignItems: 'center', borderWidth: 1.5 },
  saveBtn: { borderRadius: radius.md, padding: spacing.md, alignItems: 'center', marginTop: spacing.lg, ...shadows.medium },
});
