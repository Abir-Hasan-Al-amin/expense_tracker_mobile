import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ActivityIndicator, View } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';

import DashboardScreen from '../screens/DashboardScreen';
import TransactionsScreen from '../screens/TransactionsScreen';
import StatisticsScreen from '../screens/StatisticsScreen';
import CategoriesScreen from '../screens/CategoriesScreen';
import ProfileScreen from '../screens/ProfileScreen';
import AddEditExpenseScreen from '../screens/AddEditExpenseScreen';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import MoreScreen from '../screens/MoreScreen';

// New feature screens
import WalletsScreen from '../screens/WalletsScreen';
import AddEditWalletScreen from '../screens/AddEditWalletScreen';
import LoansScreen from '../screens/LoansScreen';
import AddEditLoanScreen from '../screens/AddEditLoanScreen';
import SavingsScreen from '../screens/SavingsScreen';
import AddEditSavingsScreen from '../screens/AddEditSavingsScreen';
import BillsScreen from '../screens/BillsScreen';
import AddEditBillScreen from '../screens/AddEditBillScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import SplitsScreen from '../screens/SplitsScreen';
import AddEditSplitScreen from '../screens/AddEditSplitScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const TAB_ICONS = {
  Dashboard: { focused: 'home', outline: 'home-outline' },
  Transactions: { focused: 'list', outline: 'list-outline' },
  Wallets: { focused: 'wallet', outline: 'wallet-outline' },
  Statistics: { focused: 'bar-chart', outline: 'bar-chart-outline' },
  More: { focused: 'grid', outline: 'grid-outline' },
  Profile: { focused: 'person', outline: 'person-outline' },
};

function TabNavigator() {
  const insets = useSafeAreaInsets();
  const { colors } = useSettings();
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          const icons = TAB_ICONS[route.name];
          return <Ionicons name={focused ? icons.focused : icons.outline} size={size} color={color} />;
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          height: 60 + insets.bottom,
          paddingBottom: insets.bottom + 5,
          paddingTop: 5,
          backgroundColor: colors.card,
          borderTopColor: colors.border,
          borderTopWidth: 1,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
        headerShown: false,
      })}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="Transactions" component={TransactionsScreen} />
      <Tab.Screen name="Wallets" component={WalletsScreen} />
      <Tab.Screen name="Statistics" component={StatisticsScreen} />
      <Tab.Screen name="More" component={MoreScreen} />
    </Tab.Navigator>
  );
}

function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
    </Stack.Navigator>
  );
}

function AppStack() {
  const { colors } = useSettings();

  const modalOptions = (title) => ({
    title,
    presentation: 'modal',
    headerStyle: { backgroundColor: colors.primary },
    headerTintColor: '#fff',
    headerTitleStyle: { fontWeight: '700' },
    statusBarColor: colors.primary,
    statusBarStyle: 'light',
  });

  return (
    <Stack.Navigator>
      <Stack.Screen
        name="Main"
        component={TabNavigator}
        options={{ headerShown: false, statusBarColor: colors.background, statusBarStyle: 'dark' }}
      />
      <Stack.Screen
        name="AddEditExpense"
        component={AddEditExpenseScreen}
        options={modalOptions('Add Transaction')}
      />

      {/* Wallet screens */}
      <Stack.Screen
        name="AddEditWallet"
        component={AddEditWalletScreen}
        options={modalOptions('New Wallet')}
      />

      {/* Loan screens */}
      <Stack.Screen
        name="Loans"
        component={LoansScreen}
        options={{ headerShown: false, statusBarColor: colors.background, statusBarStyle: 'dark' }}
      />
      <Stack.Screen
        name="AddEditLoan"
        component={AddEditLoanScreen}
        options={modalOptions('New Loan')}
      />

      {/* Savings screens */}
      <Stack.Screen
        name="Savings"
        component={SavingsScreen}
        options={{ headerShown: false, statusBarColor: colors.background, statusBarStyle: 'dark' }}
      />
      <Stack.Screen
        name="AddEditSavings"
        component={AddEditSavingsScreen}
        options={modalOptions('New Savings Goal')}
      />

      {/* Bills screens */}
      <Stack.Screen
        name="Bills"
        component={BillsScreen}
        options={{ headerShown: false, statusBarColor: colors.background, statusBarStyle: 'dark' }}
      />
      <Stack.Screen
        name="AddEditBill"
        component={AddEditBillScreen}
        options={modalOptions('New Bill')}
      />

      {/* Notifications screen */}
      <Stack.Screen
        name="Notifications"
        component={NotificationsScreen}
        options={{ headerShown: false, statusBarColor: colors.background, statusBarStyle: 'dark' }}
      />

      {/* Split screens */}
      <Stack.Screen
        name="Splits"
        component={SplitsScreen}
        options={{ headerShown: false, statusBarColor: colors.background, statusBarStyle: 'dark' }}
      />
      <Stack.Screen
        name="AddEditSplit"
        component={AddEditSplitScreen}
        options={modalOptions('New Split')}
      />

      {/* Categories (now accessed from More) */}
      <Stack.Screen
        name="Categories"
        component={CategoriesScreen}
        options={{ headerShown: false, statusBarColor: colors.background, statusBarStyle: 'dark' }}
      />

      {/* Profile (still accessible via notification header button) */}
      <Stack.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ headerShown: false, statusBarColor: colors.background, statusBarStyle: 'dark' }}
      />
    </Stack.Navigator>
  );
}

export default function AppNavigator() {
  const { user, loading } = useAuth();
  const { colors } = useSettings();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {user ? <AppStack /> : <AuthStack />}
    </NavigationContainer>
  );
}
