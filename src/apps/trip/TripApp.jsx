import { Routes, Route, Navigate, Outlet } from "react-router-dom";
import AppShell from "../../components/layout/AppShell";
import { TRIP_NAV_ITEMS } from "./navConfig";
import TripListPage from "./features/list/TripListPage";
import TripDetailPage from "./features/detail/TripDetailPage";
import BudgetOverviewPage from "./features/budget/BudgetOverviewPage";

function TripLayout() {
  return (
    <AppShell navItems={TRIP_NAV_ITEMS} title="Trips">
      <Outlet />
    </AppShell>
  );
}

export default function TripApp() {
  return (
    <Routes>
      <Route element={<TripLayout />}>
        <Route index element={<TripListPage />} />
        <Route path="budget" element={<BudgetOverviewPage />} />
        <Route path=":id" element={<TripDetailPage />} />
        <Route path="*" element={<Navigate to="/trip" replace />} />
      </Route>
    </Routes>
  );
}
