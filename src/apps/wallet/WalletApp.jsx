import { Routes, Route, Navigate, Outlet } from "react-router-dom";
import AppShell from "../../components/layout/AppShell";
import { WALLET_NAV_ITEMS } from "./navConfig";
import OverviewPage from "./features/overview/OverviewPage";
import WalletsPage  from "./features/wallets/WalletsPage";
import RatesPage    from "./features/rates/RatesPage";

function WalletLayout() {
  return (
    <AppShell navItems={WALLET_NAV_ITEMS} title="Wallet">
      <Outlet />
    </AppShell>
  );
}

export default function WalletApp() {
  return (
    <Routes>
      <Route element={<WalletLayout />}>
        <Route index          element={<OverviewPage />} />
        <Route path="wallets" element={<WalletsPage />} />
        <Route path="rates"   element={<RatesPage />} />
        <Route path="*"       element={<Navigate to="/wallet" replace />} />
      </Route>
    </Routes>
  );
}
