import { Routes, Route } from "react-router-dom";
import AppShell from "../components/layout/AppShell";
import HomePage from "../features/home/HomePage";
import SearchPage from "../features/search/SearchPage";
import ProfilePage from "../features/profile/ProfilePage";
import NotFoundPage from "../features/not-found/NotFoundPage";

// Add new <Route> elements here as features grow.
// The matching nav item also needs an entry in src/app/navConfig.js.
export default function Router() {
  return (
    <AppShell>
      <Routes>
        <Route path="/"        element={<HomePage />}    />
        <Route path="/search"  element={<SearchPage />}  />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="*"        element={<NotFoundPage />} />
      </Routes>
    </AppShell>
  );
}
