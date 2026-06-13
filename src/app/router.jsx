import { Routes, Route, Outlet } from "react-router-dom";
import AppShell from "../components/layout/AppShell";
import ProtectedRoute from "../components/auth/ProtectedRoute";
import AdminRoute from "../components/auth/AdminRoute";
import LoginPage from "../features/auth/LoginPage";
import HomePage from "../features/home/HomePage";
import TransactionsPage from "../features/transactions/TransactionsPage";
import BudgetPage from "../features/budget/BudgetPage";
import CategoriesPage from "../features/categories/CategoriesPage";
import ProfilePage from "../features/profile/ProfilePage";
import AdminPage from "../features/admin/AdminPage";
import NotFoundPage from "../features/not-found/NotFoundPage";

function AppLayout() {
  return (
    <AppShell>
      <Outlet />
    </AppShell>
  );
}

// Add new <Route> elements inside the protected layout as features grow.
// The matching nav item also needs an entry in src/app/navConfig.js.
export default function Router() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/"             element={<HomePage />}         />
          <Route path="/transactions" element={<TransactionsPage />} />
          <Route path="/budget"       element={<BudgetPage />}       />
          <Route path="/categories"   element={<CategoriesPage />}   />
          <Route path="/profile"      element={<ProfilePage />}      />
          <Route element={<AdminRoute />}>
            <Route path="/admin" element={<AdminPage />} />
          </Route>
          <Route path="*"             element={<NotFoundPage />}     />
        </Route>
      </Route>
    </Routes>
  );
}
