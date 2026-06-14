import { Routes, Route, Outlet, Navigate } from "react-router-dom";
import AppShell from "../../components/layout/AppShell";
import { INVESTMENT_NAV_ITEMS } from "./navConfig";
import DashboardPage from "./features/dashboard/DashboardPage";
import PlanSheetDetailPage from "./features/sheets/PlanSheetDetailPage";
import ReportsPage from "./features/reports/ReportsPage";

function InvestmentLayout() {
  return (
    <AppShell navItems={INVESTMENT_NAV_ITEMS} title="Investment">
      <Outlet />
    </AppShell>
  );
}

// Add new <Route> elements inside the layout as Investment features grow.
// The matching nav item also needs an entry in navConfig.js.
export default function InvestmentApp() {
  return (
    <Routes>
      <Route element={<InvestmentLayout />}>
        <Route index element={<DashboardPage />} />
        <Route path="sheets/:id" element={<PlanSheetDetailPage />} />
        <Route path="reports" element={<ReportsPage />} />
        <Route path="*" element={<Navigate to="/investment" replace />} />
      </Route>
    </Routes>
  );
}
