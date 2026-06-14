import { Routes, Route, Outlet, Navigate } from "react-router-dom";
import AppShell from "../../components/layout/AppShell";
import { FINANCE_NAV_ITEMS } from "./navConfig";
import HomePage from "./features/home/HomePage";
import TransactionsPage from "./features/transactions/TransactionsPage";
import BudgetPage from "./features/budget/BudgetPage";
import CategoriesPage from "./features/categories/CategoriesPage";
import SettingsPage from "./features/settings/SettingsPage";

function FinanceLayout() {
  return (
    <AppShell navItems={FINANCE_NAV_ITEMS} title="Finance">
      <Outlet />
    </AppShell>
  );
}

// Add new <Route> elements inside the layout as Finance features grow.
// The matching nav item also needs an entry in navConfig.js.
export default function FinanceApp() {
  return (
    <Routes>
      <Route element={<FinanceLayout />}>
        <Route index element={<HomePage />} />
        <Route path="transactions" element={<TransactionsPage />} />
        <Route path="budget" element={<BudgetPage />} />
        <Route path="categories" element={<CategoriesPage />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="*" element={<Navigate to="/finance" replace />} />
      </Route>
    </Routes>
  );
}
