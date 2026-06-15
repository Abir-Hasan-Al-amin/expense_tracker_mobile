import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import { spacing, radius, shadows } from '../theme';

export default function RegisterScreen({ navigation }) {
  const { register } = useAuth();
  const { colors } = useSettings();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!username.trim() || !password.trim() || !confirm.trim()) return Alert.alert('Error', 'Please fill in all fields.');
    if (password.length < 6) return Alert.alert('Error', 'Password must be at least 6 characters.');
    if (password !== confirm) return Alert.alert('Error', 'Passwords do not match.');
    setLoading(true);
    try { await register(username.trim(), password); }
    catch (err) { Alert.alert('Registration Failed', err.message); }
    finally { setLoading(false); }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top', 'bottom']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <View style={styles.logoWrap}>
            <View style={[styles.logoCircle, { backgroundColor: colors.secondary }]}>
              <Ionicons name="wallet" size={40} color="#fff" />
            </View>
            <Text style={[styles.appName, { color: colors.text }]}>Expense Tracker</Text>
            <Text style={[styles.tagline, { color: colors.textMuted }]}>Start managing your finances today</Text>
          </View>

          <View style={[styles.card, { backgroundColor: colors.card }]}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>Create account</Text>
            <Text style={[styles.cardSub, { color: colors.textMuted }]}>Sign up to get started</Text>

            {[
              { label: 'Username', value: username, setter: setUsername, placeholder: 'Choose a username', icon: 'person-outline', secure: false },
              { label: 'Password', value: password, setter: setPassword, placeholder: 'Min. 6 characters', icon: 'lock-closed-outline', secure: !showPassword },
              { label: 'Confirm Password', value: confirm, setter: setConfirm, placeholder: 'Re-enter your password', icon: 'lock-closed-outline', secure: !showPassword },
            ].map(({ label, value, setter, placeholder, icon, secure }) => (
              <View key={label}>
                <Text style={[styles.label, { color: colors.textLight }]}>{label}</Text>
                <View style={[styles.inputRow, { backgroundColor: colors.background, borderColor: colors.border }]}>
                  <Ionicons name={icon} size={18} color={colors.textMuted} />
                  <TextInput style={[styles.input, { color: colors.text }]} value={value} onChangeText={setter} placeholder={placeholder} placeholderTextColor={colors.textMuted} secureTextEntry={secure} autoCapitalize="none" />
                  {label === 'Password' && (
                    <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                      <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={18} color={colors.textMuted} />
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            ))}

            <TouchableOpacity style={[styles.btn, { backgroundColor: colors.secondary }]} onPress={handleRegister} disabled={loading} activeOpacity={0.85}>
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Create Account</Text>}
            </TouchableOpacity>
          </View>

          <View style={styles.footer}>
            <Text style={{ color: colors.textLight, fontSize: 14 }}>Already have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={{ color: colors.secondary, fontSize: 14, fontWeight: '700' }}>Sign In</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, justifyContent: 'center', padding: spacing.lg },
  logoWrap: { alignItems: 'center', marginBottom: spacing.xl },
  logoCircle: { width: 80, height: 80, borderRadius: 40, justifyContent: 'center', alignItems: 'center', marginBottom: spacing.md, ...shadows.large },
  appName: { fontSize: 26, fontWeight: '800', marginBottom: 4 },
  tagline: { fontSize: 12 },
  card: { borderRadius: radius.xl, padding: spacing.lg, ...shadows.medium, marginBottom: spacing.lg },
  cardTitle: { fontSize: 22, fontWeight: '700', marginBottom: 4 },
  cardSub: { fontSize: 12, marginBottom: spacing.lg },
  label: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: spacing.xs, marginTop: spacing.sm },
  inputRow: { flexDirection: 'row', alignItems: 'center', borderRadius: radius.md, paddingHorizontal: spacing.md, height: 52, gap: spacing.sm, borderWidth: 1.5, marginBottom: spacing.xs },
  input: { flex: 1, fontSize: 15 },
  btn: { borderRadius: radius.md, height: 56, justifyContent: 'center', alignItems: 'center', marginTop: spacing.md, ...shadows.large },
  btnText: { fontSize: 16, fontWeight: '700', color: '#fff' },
  footer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
});
