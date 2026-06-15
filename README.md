# Expense Tracker Mobile

A React Native / Expo mobile app for tracking personal income and expenses. Supports categories, recurring transactions, monthly statistics, budgets, CSV export, and JSON backup/restore.

## Features

- **Dashboard** — balance summary, income/expense totals, budget alerts, recent transactions
- **Transactions** — full list with search, type filter, category filter, date range, sort, and CSV export
- **Statistics** — monthly pie chart (by category) and 6-month expense trend bar chart
- **Categories** — create, edit, and delete custom categories with icon and color picker
- **Profile** — change password, currency selector, dark mode toggle, backup/restore, and data deletion
- **Recurring transactions** — daily, weekly, or monthly auto-creation processed on Dashboard focus
- **Dark mode** — full theme support persisted across sessions

## Tech Stack

| Layer | Library |
| --- | --- |
| Framework | Expo ~54 / React Native 0.81 |
| Navigation | React Navigation 6 (bottom tabs + native stack) |
| HTTP | Axios (JWT token via AsyncStorage interceptor) |
| Charts | react-native-chart-kit + react-native-svg |
| Storage | AsyncStorage (auth token, settings) |
| Build | EAS Build |

## Project Structure

```text
src/
  api/          # Axios API modules (auth, expenses, categories, budgets)
  components/   # Shared UI (ExpenseItem, DatePickerModal, EmptyState)
  context/      # React context (AppContext, AuthContext, SettingsContext)
  navigation/   # AppNavigator (tab + stack)
  screens/      # Dashboard, Transactions, AddEditExpense, Statistics, Categories, Profile
  theme/        # Colors, spacing, radius, shadows
  utils/        # Currency formatting
```

## Getting Started

### Prerequisites

- Node.js 18+
- Expo CLI (`npm install -g expo-cli`)
- A running backend API (see `.env.example`)

### Install

```bash
npm install
```

### Environment

Create a `.env` file at the project root:

```text
EXPO_PUBLIC_API_URL=https://your-backend-url/api
```

### Run

```bash
# Start Expo dev server
npm start

# Run on Android
npm run android

# Run on iOS
npm run ios
```

## Build (EAS)

```bash
eas build --platform android
eas build --platform ios
```

## API Endpoints Expected

| Method | Path | Description |
| --- | --- | --- |
| POST | `/auth/login` | Login |
| POST | `/auth/register` | Register |
| POST | `/auth/change-password` | Change password |
| GET | `/expenses` | List expenses (params: limit, sort, order, type, category, startDate, endDate) |
| POST | `/expenses` | Create expense |
| PUT | `/expenses/:id` | Update expense |
| DELETE | `/expenses/:id` | Delete expense |
| DELETE | `/expenses/all` | Delete all expenses |
| GET | `/expenses/stats` | Monthly stats (params: month, year) |
| GET | `/expenses/export` | Export all as JSON |
| POST | `/expenses/bulk-import` | Bulk import (mode: merge/replace) |
| POST | `/expenses/process-recurring` | Process due recurring transactions |
| GET | `/categories` | List categories |
| POST | `/categories` | Create category |
| PUT | `/categories/:id` | Update category |
| DELETE | `/categories/:id` | Delete category |
| DELETE | `/categories/all` | Delete all categories |
| POST | `/categories/seed` | Seed default categories |
| GET | `/budgets` | List budgets (params: month, year) |
