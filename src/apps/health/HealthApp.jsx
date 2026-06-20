import { Routes, Route, Navigate, Outlet } from "react-router-dom";
import AppShell from "../../components/layout/AppShell";
import { HEALTH_NAV_ITEMS } from "./navConfig";
import CardioPage from "./features/cardio/CardioPage";
import SleepPage from "./features/sleep/SleepPage";
import BodyPage from "./features/body/BodyPage";
import JournalPage from "./features/journal/JournalPage";

function HealthLayout() {
  return (
    <AppShell navItems={HEALTH_NAV_ITEMS} title="Health">
      <Outlet />
    </AppShell>
  );
}

export default function HealthApp() {
  return (
    <Routes>
      <Route element={<HealthLayout />}>
        <Route index element={<Navigate to="/health/cardio" replace />} />
        <Route path="cardio"  element={<CardioPage />} />
        <Route path="sleep"   element={<SleepPage />} />
        <Route path="body"    element={<BodyPage />} />
        <Route path="journal" element={<JournalPage />} />
        <Route path="*"       element={<Navigate to="/health/cardio" replace />} />
      </Route>
    </Routes>
  );
}
