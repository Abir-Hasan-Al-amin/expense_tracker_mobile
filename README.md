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

### 1. Install EAS CLI and log in

```bash
npm install -g eas-cli
eas login
```

### 2. Configure environment variable for builds

EAS builds run on Expo's cloud servers — your local `.env` file is not available there. You have two options:

#### Option A — Hardcode in `eas.json` (simpler, fine for non-secret URLs)

Add an `env` block to each build profile in `eas.json`:

```json
"preview": {
  "env": {
    "EXPO_PUBLIC_API_URL": "https://your-backend-url/api"
  }
},
"production": {
  "env": {
    "EXPO_PUBLIC_API_URL": "https://your-backend-url/api"
  }
}
```

#### Option B — EAS Secrets (recommended, keeps URL out of the repo)

```bash
eas secret:create --scope project --name EXPO_PUBLIC_API_URL --value https://your-backend-url/api
```

The secret is encrypted and injected automatically into every build — no changes to `eas.json` needed.

To list or delete secrets:

```bash
eas secret:list
eas secret:delete --name EXPO_PUBLIC_API_URL
```

### 3. Run the build

```bash
# Android APK (for direct install / testing)
eas build --platform android --profile preview

# Android App Bundle (for Play Store)
eas build --platform android --profile production

# iOS (requires Apple Developer account)
eas build --platform ios --profile production

# Both platforms at once
eas build --platform all --profile production
```

### 4. Download and install

After the build completes, EAS prints a download link. For Android APK (`preview` profile), you can also install directly:

```bash
eas build:run --platform android
```

### Build profiles summary

| Profile | Android output | Use case |
| --- | --- | --- |
| `development` | APK (dev client) | Local development with Expo dev client |
| `preview` | APK | Internal testing, direct install |
| `production` | AAB | Google Play Store submission |

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
