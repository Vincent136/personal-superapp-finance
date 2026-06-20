import { Routes, Route } from "react-router-dom";
import ProtectedRoute from "../components/auth/ProtectedRoute";
import AdminRoute from "../components/auth/AdminRoute";
import LoginPage from "../features/auth/LoginPage";
import AppLauncherPage from "../features/launcher/AppLauncherPage";
import ProfilePage from "../features/profile/ProfilePage";
import AdminPage from "../features/admin/AdminPage";
import NotFoundPage from "../features/not-found/NotFoundPage";
import FinanceApp from "../apps/finance/FinanceApp";
import InvestmentApp from "../apps/investment/InvestmentApp";
import HealthApp from "../apps/health/HealthApp";
import TripApp from "../apps/trip/TripApp";
import WalletApp from "../apps/wallet/WalletApp";

// Add new apps under src/apps/<id>/ (with their own routes + navConfig),
// register them in appsConfig.js, and add a top-level "/<id>/*" route here.
export default function Router() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<ProtectedRoute />}>
        <Route path="/" element={<AppLauncherPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route element={<AdminRoute />}>
          <Route path="/admin" element={<AdminPage />} />
        </Route>
        <Route path="/finance/*" element={<FinanceApp />} />
        <Route path="/investment/*" element={<InvestmentApp />} />
        <Route path="/health/*" element={<HealthApp />} />
        <Route path="/trip/*"   element={<TripApp />} />
        <Route path="/wallet/*" element={<WalletApp />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
