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
│   ├── common/
│   │   └── PageHeader.jsx   # Reusable page title / subtitle / action bar
│   └── layout/
│       ├── AppShell.jsx     # Responsive wrapper (BottomNav ↔ SideNav)
│       ├── BottomNav.jsx    # Mobile bottom navigation
│       └── SideNav.jsx      # Desktop/tablet sidebar navigation
│
├── features/            # One folder per page / domain
│   ├── home/
│   │   └── HomePage.jsx
│   ├── search/
│   │   └── SearchPage.jsx
│   ├── profile/
│   │   └── ProfilePage.jsx
│   └── not-found/
│       └── NotFoundPage.jsx
│
└── hooks/
    └── useBreakpoint.js  # { isMobile, isTablet, isDesktop }
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
