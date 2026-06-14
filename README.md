# Mobile-First PWA Template

A Progressive Web App (PWA) starter built with **React 19 + Vite + MUI v7**.  
Mobile-first layout that adapts cleanly to tablet and desktop — no separate codepaths.

---

## Quick start

```bash
npm install
npm run dev
```

Open `http://localhost:5173` in your browser.

---

## Database (Supabase)

This app uses [Supabase](https://supabase.com) for its database and authentication.

### Setup

1. Create a project at [supabase.com](https://supabase.com/dashboard).
2. Copy `.env.example` to `.env`.
3. In your Supabase project, go to **Project Settings → API** and copy the **Project URL** and **anon/public key** into `.env`:

   ```
   VITE_SUPABASE_URL=https://your-project-ref.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   ```

4. Run the SQL migration(s) in `supabase/migrations/` — open **SQL Editor** in the Supabase dashboard, paste the contents of each file (in order), and run it. This creates the `profiles` table that's automatically populated when a user signs up.
5. Restart `npm run dev` — Vite only reads `.env` files on startup.

`.env` is gitignored and never committed. `.env.example` is the tracked template for required variables.

### Usage

Import the shared client from `src/lib/supabase.js`:

```js
import { supabase } from "../lib/supabase";

const { data, error } = await supabase.from("your_table").select("*");
```

---

## Authentication

Email/password auth is wired up via Supabase Auth.

- **`src/contexts/AuthProvider.jsx`** — `AuthProvider` tracks the current session and exposes `signIn`, `signUp`, `signOut`.
- **`src/hooks/useAuth.js`** — `useAuth()` hook to read session/user and call the auth methods from any component.
- **`src/features/auth/LoginPage.jsx`** — combined sign-in / sign-up page at `/login`.
- **`src/components/auth/ProtectedRoute.jsx`** — redirects unauthenticated users to `/login`; all routes in `router.jsx` are protected by default.

```js
import { useAuth } from "../hooks/useAuth";

const { user, signOut } = useAuth();
```

By default, Supabase requires email confirmation before a new account can sign in — disable this in **Authentication → Providers → Email** during local development if you want instant sign-in after sign-up.

---

## Email whitelist & admin dashboard

Sign-up is restricted to email addresses in the `public.email_whitelist` table (created by `supabase/migrations/0002_email_whitelist.sql`). This is enforced both in the UI and at the database level (a `before insert` trigger on `auth.users`), so it can't be bypassed by calling the Supabase API directly.

- The migration seeds `vincentchristian541@gmail.com` as the first whitelisted address and marks it as an **admin**.
- Admins see an **Admin Dashboard** option in the avatar menu on the App Launcher (and on the Profile page), linking to `/admin` — where they can add or remove whitelisted emails and grant/revoke admin status. This page lives at the super-app level, not inside any individual app.
- Non-admins are redirected away from `/admin`.
- `useAuth()` exposes `isAdmin` alongside `user`/`session`.

To whitelist additional people, sign in with an admin account and add their email via the Admin Dashboard before they sign up.

---

## Finance features

The **Finance app** is the first app inside the super app (see [Project structure](#project-structure)), mounted at `/finance`. Core schema lives in `supabase/migrations/0003_finance_core.sql` (run after 0001 and 0002), creating three per-user tables (`categories`, `budget_items`, `transactions`), all RLS-scoped to `auth.uid()`. `supabase/migrations/0005_finance_v2.sql` (run after 0004) drops the old `profiles.initial_capital` column and adds `categories.is_daily_budget`.

### Pay periods

The app thinks in **pay periods** rather than calendar months: a period runs from the **25th of the previous month to the 24th of the current month** (inclusive) — e.g. period `"2026-06"` covers 25 May – 24 Jun 2026, and payday is 25 Jun. `<input type="month">` pickers still use `"YYYY-MM"` values; `src/apps/finance/lib/format.js` provides `currentPeriod`, `periodKey`, `periodRange`, `daysUntilPayday`, `previousPeriod`/`nextPeriod`, `periodsBetween`, and `formatPeriodRange`/`formatPeriodShort`/`formatPayday` for converting between periods and real calendar dates.

- **`src/apps/finance/features/home/HomePage.jsx`** (`/finance`) — dashboard for the current pay period: actual income, expense, and net; a "daily budget" (remaining planned amount for the food/groceries/transport categories ÷ days left until the next payday); days left until payday; and plan-vs-actual per category.
- **`src/apps/finance/features/transactions/TransactionsPage.jsx`** (`/finance/transactions`) — record income/expense entries and browse them by pay period.
- **`src/apps/finance/features/budget/BudgetPage.jsx`** (`/finance/budget`) — set a budget per category for a chosen period (with a "Copy from previous period" shortcut), view accumulated planned totals (including net) across a range of periods, review budget-vs-actual history for any past period, and run a savings simulation that mixes actuals (for periods that have ended) with plans (for the current/future periods), visualized as a bar chart.
- **`src/apps/finance/features/categories/CategoriesPage.jsx`** (`/finance/categories`) — CRUD for income/expense categories. Expense categories have a "Daily budget" toggle (`categories.is_daily_budget`) marking the food/groceries/transport-style categories that count toward Home's daily budget. Reached via "Manage categories" on the Budget/Settings pages.
- **`src/apps/finance/features/settings/SettingsPage.jsx`** (`/finance/settings`) — pick the display currency for this app.

Shared within the Finance app (`src/apps/finance/`):

- **`lib/format.js`** — `formatCurrency`, `CURRENCIES`, currency conversion, and pay-period helpers (`currentPeriod`, `periodKey`, `periodRange`, `daysUntilPayday`, `previousPeriod`, `nextPeriod`, `periodsBetween`, `formatPeriodRange`, `formatPeriodShort`, `formatPayday`).
- **`lib/planVsActual.js`** — `buildPlanVsActualRows(categories, budgetItems, transactions)`, shared by Home and the Budget page's history section.
- **`components/PlanVsActualList.jsx`** — renders the per-category plan-vs-actual rows produced by `buildPlanVsActualRows`.
- **`hooks/useCategories.js`** — `{ categories, incomeCategories, expenseCategories, dailyBudgetCategories, loading, reload }`.
- **`hooks/useCurrency.js`** — see [Multi-currency support](#multi-currency-support).

Shared across the whole super app:

- **`src/hooks/useProfile.js`** — `{ profile, loading, reload }`.

---

## Multi-currency support

All amounts are stored in the database in **IDR** (Indonesian Rupiah), the base currency. Each user can choose a personal display currency — **IDR** or **SGD** (Singapore Dollar) — and amounts are converted automatically for display and input using a shared exchange rate.

Schema lives in `supabase/migrations/0004_currency.sql` (run after 0001-0003). It adds:

- `profiles.currency` — the signed-in user's display currency (`'IDR'` or `'SGD'`, defaults to `'IDR'`).
- `public.currency_rates` — a singleton table (`id = 1`) holding `sgd_to_idr`, the current SGD → IDR rate. Readable by all authenticated users; only admins can update it.

- **`src/apps/finance/hooks/useCurrency.js`** — `{ currency, rate, loading, fromBase, toBase, format }`. `fromBase`/`toBase` convert amounts between IDR (storage) and the user's display currency; `format` converts and formats in one step.
- **`src/apps/finance/features/settings/SettingsPage.jsx`** — currency picker that updates `profiles.currency`.
- **`src/features/admin/AdminPage.jsx`** — "Currency rate" section where admins set `sgd_to_idr`.

All amount inputs/outputs across Budget, Transactions, and Home go through `useCurrency()`, so switching currency on the Finance Settings page immediately changes how amounts are entered and displayed everywhere — the underlying IDR values in the database don't change.

---

## Project structure

This is a **super app**: a shared shell (login, app launcher, profile, admin)
that hosts one or more self-contained **apps** under `src/apps/<id>/`. After
logging in, the user picks an app from the launcher (`/`); each app owns its
own routes, navigation, pages, and feature-specific hooks/helpers.

```
src/
├── app/
│   ├── App.jsx          # Root: ThemeProvider + BrowserRouter
│   ├── router.jsx       # Top-level routes (super-app pages + one "/<id>/*" per app)
│   ├── appsConfig.js     # ★ Registry of installed apps, shown on the launcher
│   └── theme.jsx        # MUI theme — colours, typography, component overrides
│
├── components/
│   ├── auth/
│   │   ├── ProtectedRoute.jsx # Redirects to /login if not authenticated
│   │   └── AdminRoute.jsx     # Redirects to / if not an admin
│   ├── common/
│   │   └── PageHeader.jsx   # Reusable page title / subtitle / action bar
│   └── layout/
│       ├── AppShell.jsx     # Responsive wrapper (BottomNav ↔ SideNav), takes navItems + title
│       ├── BottomNav.jsx    # Mobile bottom navigation, renders the given items
│       └── SideNav.jsx      # Desktop/tablet sidebar navigation, renders the given items + title
│
├── contexts/
│   ├── authContext.js    # AuthContext (React context object)
│   └── AuthProvider.jsx  # AuthProvider — session state + signIn/signUp/signOut
│
├── features/             # Super-app level pages (shared shell, not part of any app)
│   ├── auth/
│   │   └── LoginPage.jsx       # Combined sign-in / sign-up at /login
│   ├── launcher/
│   │   └── AppLauncherPage.jsx # "/" — app picker grid + avatar menu (Profile/Admin/Sign out)
│   ├── profile/
│   │   └── ProfilePage.jsx     # "/profile" — account-level: email, sign out, admin link
│   ├── admin/
│   │   └── AdminPage.jsx       # "/admin" — email whitelist + currency rate (admins only)
│   └── not-found/
│       └── NotFoundPage.jsx
│
├── hooks/                # Shared across the whole super app
│   ├── useAuth.js        # Read session/user, call signIn/signUp/signOut
│   ├── useBreakpoint.js  # { isMobile, isTablet, isDesktop }
│   └── useProfile.js     # { profile, loading, reload }
│
├── lib/
│   └── supabase.js       # Configured Supabase client
│
└── apps/                  # One folder per installed app
    └── finance/
        ├── FinanceApp.jsx   # Nested <Routes> for /finance/*, wrapped in AppShell
        ├── navConfig.js     # Finance's own nav items (Apps, Home, Transactions, Budget, Settings)
        ├── components/
        │   └── PlanVsActualList.jsx # Renders buildPlanVsActualRows() output
        ├── features/
        │   ├── home/HomePage.jsx           # /finance — dashboard
        │   ├── transactions/TransactionsPage.jsx # /finance/transactions
        │   ├── budget/BudgetPage.jsx        # /finance/budget
        │   ├── categories/CategoriesPage.jsx # /finance/categories
        │   └── settings/SettingsPage.jsx     # /finance/settings — currency
        ├── hooks/
        │   ├── useCategories.js  # { categories, incomeCategories, expenseCategories, dailyBudgetCategories, loading, reload }
        │   └── useCurrency.js    # { currency, rate, loading, fromBase, toBase, format }
        └── lib/
            ├── format.js          # formatCurrency, CURRENCIES, conversion + pay-period helpers
            └── planVsActual.js     # buildPlanVsActualRows()
```

---

## Responsive layout

| Viewport | Navigation | Breakpoint |
|---|---|---|
| Mobile | Fixed BottomNav | `< 900px` (MUI `md`) |
| Tablet / Desktop | Fixed SideNav (240 px) | `≥ 900px` |

The switch happens automatically inside `AppShell.jsx` — nothing else needs to change.

---

## How to add a new page or app

### Add a page to an existing app

1. **Create the page** — `src/apps/<id>/features/<name>/<Name>Page.jsx`

   ```jsx
   import { Box } from "@mui/material";
   import PageHeader from "../../../../components/common/PageHeader";

   export default function MyPage() {
     return (
       <Box sx={{ p: { xs: 2, md: 3 } }}>
         <PageHeader title="My Page" />
         {/* content */}
       </Box>
     );
   }
   ```

2. **Register the route** — inside that app's `<Id>App.jsx`, e.g. `src/apps/finance/FinanceApp.jsx`:

   ```jsx
   import MyPage from "./features/my-page/MyPage";
   // ...
   <Route path="my-page" element={<MyPage />} />
   ```

3. **Add the nav item** — `src/apps/<id>/navConfig.js`:

   ```js
   import MyIcon from "@mui/icons-material/MyIcon";
   // ...
   { label: "My Page", path: "/<id>/my-page", icon: MyIcon },
   ```

`AppShell` (used by the app's `<Id>App.jsx`) passes these nav items to both BottomNav (mobile) and SideNav (desktop), which update automatically.

### Add a new app

1. Create `src/apps/<id>/` following the Finance app's shape: `<Id>App.jsx` (nested `<Routes>` wrapped in `AppShell`), `navConfig.js`, `features/`, and any app-specific `hooks/`/`lib/`.
2. Register it in `src/app/appsConfig.js` so it shows up as a card on the launcher (`/`):

   ```js
   import MyIcon from "@mui/icons-material/MyIcon";
   // ...
   { id: "my-app", label: "My App", description: "...", path: "/my-app", icon: MyIcon },
   ```

3. Add a top-level route in `src/app/router.jsx`, inside the `ProtectedRoute` block:

   ```jsx
   import MyApp from "../apps/my-app/MyApp";
   // ...
   <Route path="/my-app/*" element={<MyApp />} />
   ```

---

## How to change the brand colours

Open `src/app/theme.jsx` and edit the `BRAND` constant at the top:

```js
const BRAND = {
  primary:   "#1976d2",   // ← change this
  secondary: "#f50057",   // ← and this
};
```

Component-level style overrides (Card borders, Button shape, active states, etc.) live in the `components` block of the same file.

---

## Useful hooks

### `useBreakpoint`

```js
import { useBreakpoint } from "../hooks/useBreakpoint";

const { isMobile, isTablet, isDesktop } = useBreakpoint();
```

### `PageHeader` props

| Prop | Type | Description |
|---|---|---|
| `title` | `string` | Required. Main heading. |
| `subtitle` | `string` | Optional. Secondary line below title. |
| `action` | `ReactNode` | Optional. Rendered flush-right (e.g. a Button). |

---

## PWA configuration

Edit `vite.config.js` to update the app name, theme colour, and icons:

```js
manifest: {
  name: "Your App Name",
  short_name: "App",
  theme_color: "#1976d2",
  // ...
}
```

Replace `public/pwa-192x192.png` and `public/pwa-512x512.png` with your own icons.

---

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start dev server with HMR |
| `npm run build` | Production build |
| `npm run preview` | Preview production build locally |
| `npm run lint` | Run ESLint |