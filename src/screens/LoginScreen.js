import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import { spacing, radius, shadows } from '../theme';

export default function LoginScreen({ navigation }) {
  const { login } = useAuth();
  const { colors } = useSettings();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) return Alert.alert('Error', 'Please enter username and password.');
    setLoading(true);
    try { await login(username.trim(), password); }
    catch (err) { Alert.alert('Login Failed', err.message); }
    finally { setLoading(false); }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top', 'bottom']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <View style={styles.logoWrap}>
            <View style={[styles.logoCircle, { backgroundColor: colors.primary }]}>
              <Ionicons name="wallet" size={40} color="#fff" />
            </View>
            <Text style={[styles.appName, { color: colors.text }]}>Expense Tracker</Text>
            <Text style={[styles.tagline, { color: colors.textMuted }]}>Track your money, own your future</Text>
          </View>

          <View style={[styles.card, { backgroundColor: colors.card }]}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>Welcome back</Text>
            <Text style={[styles.cardSub, { color: colors.textMuted }]}>Sign in to your account</Text>

            <Text style={[styles.label, { color: colors.textLight }]}>Username</Text>
            <View style={[styles.inputRow, { backgroundColor: colors.background, borderColor: colors.border }]}>
              <Ionicons name="person-outline" size={18} color={colors.textMuted} />
              <TextInput style={[styles.input, { color: colors.text }]} value={username} onChangeText={setUsername} placeholder="Enter your username" placeholderTextColor={colors.textMuted} autoCapitalize="none" autoCorrect={false} />
            </View>

            <Text style={[styles.label, { color: colors.textLight }]}>Password</Text>
            <View style={[styles.inputRow, { backgroundColor: colors.background, borderColor: colors.border }]}>
              <Ionicons name="lock-closed-outline" size={18} color={colors.textMuted} />
              <TextInput style={[styles.input, { color: colors.text }]} value={password} onChangeText={setPassword} placeholder="Enter your password" placeholderTextColor={colors.textMuted} secureTextEntry={!showPassword} autoCapitalize="none" />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={18} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={[styles.btn, { backgroundColor: colors.primary }]} onPress={handleLogin} disabled={loading} activeOpacity={0.85}>
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Sign In</Text>}
            </TouchableOpacity>
          </View>

          <View style={styles.footer}>
            <Text style={{ color: colors.textLight, fontSize: 14 }}>Don't have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Register')}>
              <Text style={{ color: colors.primary, fontSize: 14, fontWeight: '700' }}>Sign Up</Text>
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
