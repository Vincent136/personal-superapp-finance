import { Routes, Route, Navigate, Outlet } from "react-router-dom";
import AppShell from "../../components/layout/AppShell";
import { HEALTH_NAV_ITEMS } from "./navConfig";
import CardioPage from "./features/cardio/CardioPage";
import SleepPage from "./features/sleep/SleepPage";
import BodyPage from "./features/body/BodyPage";
import JournalPage from "./features/journal/JournalPage";
import PoopPage from "./features/poop/PoopPage";
import MealPage from "./features/meal/MealPage";
import DrinkPage from "./features/drink/DrinkPage";

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
        <Route index          element={<Navigate to="/health/cardio" replace />} />
        <Route path="cardio"  element={<CardioPage />} />
        <Route path="sleep"   element={<SleepPage />} />
        <Route path="meals"   element={<MealPage />} />
        <Route path="drinks"  element={<DrinkPage />} />
        <Route path="body"    element={<BodyPage />} />
        <Route path="poop"    element={<PoopPage />} />
        <Route path="journal" element={<JournalPage />} />
        <Route path="*"       element={<Navigate to="/health/cardio" replace />} />
      </Route>
    </Routes>
  );
}
