import React, { useEffect } from 'react';
import { Platform, LogBox } from 'react-native';

LogBox.ignoreLogs([
  'Non-serializable values were found in the navigation state',
  'Require cycle:',
  'Warning: componentWillMount',
  'Warning: componentWillReceiveProps',
  'Warning: componentWillUpdate',
  'VirtualizedLists should never be nested',
  'Each child in a list should have a unique',
]);
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import * as NavigationBar from 'expo-navigation-bar';
import { AuthProvider } from './src/context/AuthContext';
import { AppProvider } from './src/context/AppContext';
import { SettingsProvider, useSettings } from './src/context/SettingsContext';
import AppNavigator from './src/navigation/AppNavigator';

function Root() {
  const { isDark, colors } = useSettings();

  useEffect(() => {
    if (Platform.OS === 'android') {
      NavigationBar.setBackgroundColorAsync(colors.background);
      NavigationBar.setButtonStyleAsync(isDark ? 'light' : 'dark');
    }
  }, [isDark, colors]);

  return (
    <>
      <AppNavigator />
      <StatusBar style={isDark ? 'light' : 'dark'} backgroundColor={colors.background} />
    </>
  );
}

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <SettingsProvider>
          <AuthProvider>
            <AppProvider>
              <Root />
            </AppProvider>
          </AuthProvider>
        </SettingsProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
