export const lightColors = {
  primary: '#6C5CE7',
  primaryLight: '#A29BFE',
  secondary: '#00B894',
  income: '#00B894',
  incomeLight: '#55EFC4',
  expense: '#FF6B6B',
  expenseLight: '#FFA07A',
  background: '#F0F2F5',
  card: '#FFFFFF',
  text: '#2D3436',
  textLight: '#636E72',
  textMuted: '#B2BEC3',
  border: '#E0E0E0',
  white: '#FFFFFF',
  danger: '#FF6B6B',
  warning: '#FDCB6E',
  overlay: 'rgba(0,0,0,0.5)',
};

export const darkColors = {
  primary: '#A29BFE',
  primaryLight: '#6C5CE7',
  secondary: '#00B894',
  income: '#00B894',
  incomeLight: '#55EFC4',
  expense: '#FF6B6B',
  expenseLight: '#FFA07A',
  background: '#0D0D1A',
  card: '#1A1A2E',
  text: '#FFFFFF',
  textLight: '#B2BEC3',
  textMuted: '#636E72',
  border: '#2D2D44',
  white: '#FFFFFF',
  danger: '#FF6B6B',
  warning: '#FDCB6E',
  overlay: 'rgba(0,0,0,0.75)',
};

// kept for any legacy static imports
export const colors = lightColors;

export const spacing = {
  xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48,
};

export const radius = {
  sm: 8, md: 12, lg: 16, xl: 24, full: 9999,
};

export const shadows = {
  small: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  medium: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 6,
  },
  large: {
    shadowColor: '#6C5CE7',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 10,
  },
};

export const typography = {
  h1: { fontSize: 28, fontWeight: '700' },
  h2: { fontSize: 22, fontWeight: '700' },
  h3: { fontSize: 18, fontWeight: '600' },
  h4: { fontSize: 16, fontWeight: '600' },
  body: { fontSize: 14, fontWeight: '400' },
  bodySmall: { fontSize: 12, fontWeight: '400' },
  caption: { fontSize: 11, fontWeight: '400' },
};
