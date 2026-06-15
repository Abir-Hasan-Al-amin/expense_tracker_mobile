import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { lightColors, darkColors } from '../theme';

export const CURRENCIES = [
  { code: 'USD', symbol: '$', label: 'US Dollar' },
  { code: 'BDT', symbol: '৳', label: 'Bangladeshi Taka' },
  { code: 'EUR', symbol: '€', label: 'Euro' },
  { code: 'GBP', symbol: '£', label: 'British Pound' },
  { code: 'INR', symbol: '₹', label: 'Indian Rupee' },
  { code: 'JPY', symbol: '¥', label: 'Japanese Yen' },
  { code: 'CAD', symbol: '$', label: 'Canadian Dollar' },
  { code: 'AUD', symbol: '$', label: 'Australian Dollar' },
];

const SettingsContext = createContext(null);

export function SettingsProvider({ children }) {
  const [isDark, setIsDark] = useState(false);
  const [currency, setCurrencyState] = useState('USD');

  useEffect(() => {
    (async () => {
      try {
        const [theme, cur] = await Promise.all([
          AsyncStorage.getItem('theme'),
          AsyncStorage.getItem('currency'),
        ]);
        if (theme === 'dark') setIsDark(true);
        if (cur) setCurrencyState(cur);
      } catch {
        // Storage unavailable — use defaults
      }
    })();
  }, []);

  const toggleTheme = async () => {
    const next = !isDark;
    setIsDark(next);
    await AsyncStorage.setItem('theme', next ? 'dark' : 'light');
  };

  const setCurrency = async (code) => {
    setCurrencyState(code);
    await AsyncStorage.setItem('currency', code);
  };

  const colors = isDark ? darkColors : lightColors;
  const currencyInfo = CURRENCIES.find((c) => c.code === currency) || CURRENCIES[0];

  return (
    <SettingsContext.Provider value={{ colors, isDark, toggleTheme, currency, currencyInfo, setCurrency }}>
      {children}
    </SettingsContext.Provider>
  );
}

export const useSettings = () => {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings must be used within SettingsProvider');
  return ctx;
};
