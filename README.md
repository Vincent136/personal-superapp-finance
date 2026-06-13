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
- Admins see an **Admin Dashboard** link on the Profile page (`/admin`), where they can add or remove whitelisted emails and grant/revoke admin status.
- Non-admins are redirected away from `/admin`.
- `useAuth()` exposes `isAdmin` alongside `user`/`session`.

To whitelist additional people, sign in with an admin account and add their email via the Admin Dashboard before they sign up.

---

## Finance features

Core schema lives in `supabase/migrations/0003_finance_core.sql` (run after 0001 and 0002). It adds `initial_capital` to `profiles`, plus three per-user tables (`categories`, `budget_items`, `transactions`), all RLS-scoped to `auth.uid()`.

- **`src/features/categories/CategoriesPage.jsx`** (`/categories`) — CRUD for income/expense categories. Reached via "Manage categories" on the Budget page.
- **`src/features/budget/BudgetPage.jsx`** (`/budget`) — set a budget amount per category for a chosen month (independent per month), and view accumulated planned totals across a date range.
- **`src/features/transactions/TransactionsPage.jsx`** (`/transactions`) — record income/expense entries and browse them by month.
- **`src/features/home/HomePage.jsx`** (`/`) — dashboard: current balance (`initial_capital` + all-time income − expense), today's daily budget (this month's planned expenses ÷ days in month), and plan-vs-actual per category for the current month.
- **`src/features/profile/ProfilePage.jsx`** (`/profile`) — edit `initial_capital`, plus the Admin Dashboard link for admins.

Shared helpers:

- **`src/lib/format.js`** — `formatCurrency`, `CURRENCIES`, and month helpers (`currentMonthString`, `monthToDate`, `endOfMonth`, `daysInMonth`).
- **`src/hooks/useCategories.js`** — `{ categories, incomeCategories, expenseCategories, loading, reload }`.
- **`src/hooks/useProfile.js`** — `{ profile, loading, reload }`.

---

## Multi-currency support

All amounts are stored in the database in **IDR** (Indonesian Rupiah), the base currency. Each user can choose a personal display currency — **IDR** or **SGD** (Singapore Dollar) — and amounts are converted automatically for display and input using a shared exchange rate.

Schema lives in `supabase/migrations/0004_currency.sql` (run after 0001-0003). It adds:

- `profiles.currency` — the signed-in user's display currency (`'IDR'` or `'SGD'`, defaults to `'IDR'`).
- `public.currency_rates` — a singleton table (`id = 1`) holding `sgd_to_idr`, the current SGD → IDR rate. Readable by all authenticated users; only admins can update it.

- **`src/hooks/useCurrency.js`** — `{ currency, rate, loading, fromBase, toBase, format }`. `fromBase`/`toBase` convert amounts between IDR (storage) and the user's display currency; `format` converts and formats in one step.
- **`src/features/profile/ProfilePage.jsx`** — currency picker that updates `profiles.currency`.
- **`src/features/admin/AdminPage.jsx`** — "Currency rate" section where admins set `sgd_to_idr`.

All amount inputs/outputs across Budget, Transactions, and Home go through `useCurrency()`, so switching currency on the Profile page immediately changes how amounts are entered and displayed everywhere — the underlying IDR values in the database don't change.

---

## Project structure

```
src/
├── app/
│   ├── App.jsx          # Root: ThemeProvider + BrowserRouter
│   ├── router.jsx       # All route definitions
│   ├── navConfig.js     # ★ Navigation items (affects both BottomNav and SideNav)
│   └── theme.jsx        # MUI theme — colours, typography, component overrides
│
├── components/
│   ├── auth/
│   │   ├── ProtectedRoute.jsx # Redirects to /login if not authenticated
│   │   └── AdminRoute.jsx     # Redirects to / if not an admin
│   ├── common/
│   │   └── PageHeader.jsx   # Reusable page title / subtitle / action bar
│   └── layout/
│       ├── AppShell.jsx     # Responsive wrapper (BottomNav ↔ SideNav)
│       ├── BottomNav.jsx    # Mobile bottom navigation
│       └── SideNav.jsx      # Desktop/tablet sidebar navigation
│
├── contexts/
│   ├── authContext.js    # AuthContext (React context object)
│   └── AuthProvider.jsx  # AuthProvider — session state + signIn/signUp/signOut
│
├── features/            # One folder per page / domain
│   ├── admin/
│   │   └── AdminPage.jsx
│   ├── auth/
│   │   └── LoginPage.jsx
│   ├── home/
│   │   └── HomePage.jsx          # Dashboard: balance, daily budget, plan vs actual
│   ├── transactions/
│   │   └── TransactionsPage.jsx  # Record + browse income/expense entries
│   ├── budget/
│   │   └── BudgetPage.jsx        # Monthly plan editor + accumulated range view
│   ├── categories/
│   │   └── CategoriesPage.jsx    # CRUD income/expense categories
│   ├── profile/
│   │   └── ProfilePage.jsx
│   └── not-found/
│       └── NotFoundPage.jsx
│
├── hooks/
│   ├── useAuth.js        # Read session/user, call signIn/signUp/signOut
│   ├── useBreakpoint.js  # { isMobile, isTablet, isDesktop }
│   ├── useCategories.js  # { categories, incomeCategories, expenseCategories, loading, reload }
│   ├── useCurrency.js    # { currency, rate, loading, fromBase, toBase, format }
│   └── useProfile.js     # { profile, loading, reload }
│
└── lib/
    ├── supabase.js       # Configured Supabase client
    └── format.js         # formatCurrency, CURRENCIES, conversion + month helpers
```

---

## Responsive layout

| Viewport | Navigation | Breakpoint |
|---|---|---|
| Mobile | Fixed BottomNav | `< 900px` (MUI `md`) |
| Tablet / Desktop | Fixed SideNav (240 px) | `≥ 900px` |

The switch happens automatically inside `AppShell.jsx` — nothing else needs to change.

---

## How to add a new page

1. **Create the page** — `src/features/<name>/<Name>Page.jsx`

   ```jsx
   import { Box } from "@mui/material";
   import PageHeader from "../../components/common/PageHeader";

   export default function MyPage() {
     return (
       <Box sx={{ p: { xs: 2, md: 3 } }}>
         <PageHeader title="My Page" />
         {/* content */}
       </Box>
     );
   }
   ```

2. **Register the route** — `src/app/router.jsx`

   ```jsx
   import MyPage from "../features/my-page/MyPage";
   // ...
   <Route path="/my-page" element={<MyPage />} />
   ```

3. **Add the nav item** — `src/app/navConfig.js`

   ```js
   import MyIcon from "@mui/icons-material/MyIcon";
   // ...
   { label: "My Page", path: "/my-page", icon: MyIcon },
   ```

Both BottomNav (mobile) and SideNav (desktop) update automatically from `navConfig.js`.

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