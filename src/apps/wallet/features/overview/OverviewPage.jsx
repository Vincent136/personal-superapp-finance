import { useEffect, useState } from "react";
import {
  Box, Button, Card, CardContent, Chip, CircularProgress,
  Divider, LinearProgress, Stack, Typography,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import PageHeader from "../../../../components/common/PageHeader";
import { supabase } from "../../../../lib/supabase";
import { useAuth } from "../../../../hooks/useAuth";
import { useCurrencyConfig } from "../../../../hooks/useCurrencyConfig";

function AssetCard({ label, idrAmount, formatIDR, children, action }) {
  return (
    <Card sx={{ mb: 1.5 }}>
      <CardContent>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
          <Box sx={{ flex: 1 }}>
            <Typography variant="caption" color="text.secondary">{label}</Typography>
            <Typography variant="h6" fontWeight={700}>{formatIDR(idrAmount)}</Typography>
            {children}
          </Box>
          {action}
        </Stack>
      </CardContent>
    </Card>
  );
}

export default function OverviewPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { currencies, wallets, toIDR, formatIDR, formatAmount } = useCurrencyConfig();

  const [invWallets, setInvWallets] = useState([]);
  const [invLoading, setInvLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("investment_wallets")
      .select("currency, balance")
      .eq("user_id", user.id)
      .then(({ data }) => {
        setInvWallets(data ?? []);
        setInvLoading(false);
      });
  }, [user]);

  const [trips, setTrips] = useState([]);
  useEffect(() => {
    if (!user) return;
    supabase
      .from("trips")
      .select("id, title, status, data")
      .eq("user_id", user.id)
      .then(({ data }) => {
        setTrips((data ?? []).map((r) => ({ id: r.id, title: r.title, status: r.status, ...r.data })));
      });
  }, [user]);

  const tripsWithBudget = trips.filter((t) => t.plannedBudget);

  const cashTotalIDR = currencies.reduce((sum, c) => {
    return sum + toIDR(wallets[c.code] ?? 0, c.code);
  }, 0);

  const invTotalIDR = invWallets.reduce((s, w) => s + toIDR(Number(w.balance), w.currency), 0);

  const tripPlannedIDR = tripsWithBudget.reduce((s, t) => s + toIDR(t.plannedBudget, t.currency ?? "IDR"), 0);
  const tripActualIDR  = tripsWithBudget.reduce((s, t) => {
    const spent = (t.expenses ?? [])
      .filter((e) => e.type === "actual")
      .reduce((ss, e) => ss + (e.amount ?? 0), 0);
    return s + toIDR(spent, t.currency ?? "IDR");
  }, 0);

  const grandTotal = cashTotalIDR + invTotalIDR;

  const activeCashCurrencies = currencies.filter((c) => (wallets[c.code] ?? 0) > 0 || c.code === "IDR");

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      <PageHeader title="Wallet Overview" subtitle="All assets converted to IDR" />

      {/* Grand total */}
      <Card sx={{ mb: 3, bgcolor: "primary.main", color: "primary.contrastText" }}>
        <CardContent>
          <Typography variant="caption" sx={{ opacity: 0.8 }}>Total assets</Typography>
          <Typography variant="h4" fontWeight={700}>{formatIDR(grandTotal)}</Typography>
          <Stack direction="row" spacing={3} mt={1.5}>
            <Box>
              <Typography variant="caption" sx={{ opacity: 0.7 }}>Cash</Typography>
              <Typography variant="subtitle2" fontWeight={600}>{formatIDR(cashTotalIDR)}</Typography>
            </Box>
            <Box>
              <Typography variant="caption" sx={{ opacity: 0.7 }}>Investment</Typography>
              <Typography variant="subtitle2" fontWeight={600}>{formatIDR(invTotalIDR)}</Typography>
            </Box>
          </Stack>
        </CardContent>
      </Card>

      {/* Cash wallets */}
      <Typography variant="subtitle2" color="text.secondary" gutterBottom>CASH WALLETS</Typography>
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Stack spacing={1.5} divider={<Divider />}>
            {activeCashCurrencies.map((c) => {
              const bal = wallets[c.code] ?? 0;
              const idr = toIDR(bal, c.code);
              return (
                <Stack key={c.code} direction="row" justifyContent="space-between" alignItems="center">
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Typography fontSize={20}>{c.flag}</Typography>
                    <Box>
                      <Typography variant="body2" fontWeight={600}>{c.code}</Typography>
                      <Typography variant="caption" color="text.secondary">{c.label}</Typography>
                    </Box>
                  </Stack>
                  <Box sx={{ textAlign: "right" }}>
                    <Typography variant="body2" fontWeight={700}>{formatAmount(bal, c.code)}</Typography>
                    {c.code !== "IDR" && (
                      <Typography variant="caption" color="text.secondary">≈ {formatIDR(idr)}</Typography>
                    )}
                  </Box>
                </Stack>
              );
            })}
          </Stack>
          <Button size="small" sx={{ mt: 1.5 }} onClick={() => navigate("/wallet/wallets")}>
            Edit wallets →
          </Button>
        </CardContent>
      </Card>

      {/* Investment capital */}
      <Typography variant="subtitle2" color="text.secondary" gutterBottom>INVESTMENT CAPITAL</Typography>
      <Card sx={{ mb: 3 }}>
        <CardContent>
          {invLoading ? (
            <CircularProgress size={20} />
          ) : invWallets.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              No investment wallets. Set them up in the Investment app.
            </Typography>
          ) : (
            <Stack spacing={1.5} divider={<Divider />}>
              {invWallets.map((w) => {
                const bal = Number(w.balance);
                const idr = toIDR(bal, w.currency);
                return (
                  <Stack key={w.currency} direction="row" justifyContent="space-between" alignItems="center">
                    <Typography variant="body2" fontWeight={600}>{w.currency}</Typography>
                    <Box sx={{ textAlign: "right" }}>
                      <Typography variant="body2" fontWeight={700}>{formatAmount(bal, w.currency)}</Typography>
                      {w.currency !== "IDR" && (
                        <Typography variant="caption" color="text.secondary">≈ {formatIDR(idr)}</Typography>
                      )}
                    </Box>
                  </Stack>
                );
              })}
            </Stack>
          )}
          <Button size="small" sx={{ mt: 1.5 }} onClick={() => navigate("/investment")}>
            Open Investment →
          </Button>
        </CardContent>
      </Card>

      {/* Trip budget summary */}
      {tripsWithBudget.length > 0 && (
        <>
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>TRIP BUDGETS</Typography>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Stack direction="row" spacing={3} mb={1.5}>
                <Box>
                  <Typography variant="caption" color="text.secondary">Total planned</Typography>
                  <Typography variant="subtitle1" fontWeight={700}>{formatIDR(tripPlannedIDR)}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">Total spent</Typography>
                  <Typography variant="subtitle1" fontWeight={700} color={tripActualIDR > tripPlannedIDR ? "error.main" : "text.primary"}>
                    {formatIDR(tripActualIDR)}
                  </Typography>
                </Box>
              </Stack>
              {tripPlannedIDR > 0 && (
                <LinearProgress
                  variant="determinate"
                  value={Math.min((tripActualIDR / tripPlannedIDR) * 100, 100)}
                  color={tripActualIDR > tripPlannedIDR ? "error" : "primary"}
                  sx={{ borderRadius: 1, height: 6, mb: 1.5 }}
                />
              )}
              <Stack spacing={1} divider={<Divider />}>
                {tripsWithBudget.map((t) => {
                  const planned = toIDR(t.plannedBudget, t.currency ?? "IDR");
                  const spent   = toIDR(
                    (t.expenses ?? []).filter((e) => e.type === "actual").reduce((s, e) => s + (e.amount ?? 0), 0),
                    t.currency ?? "IDR",
                  );
                  return (
                    <Stack key={t.id} direction="row" justifyContent="space-between" alignItems="center"
                      sx={{ cursor: "pointer" }} onClick={() => navigate(`/trip/${t.id}`)}>
                      <Box>
                        <Typography variant="body2" fontWeight={600}>{t.title}</Typography>
                        {t.financeCategory && (
                          <Chip label={t.financeCategory} size="small" variant="outlined" sx={{ mt: 0.25 }} />
                        )}
                      </Box>
                      <Box sx={{ textAlign: "right" }}>
                        <Typography variant="body2">{formatIDR(planned)}</Typography>
                        <Typography variant="caption" color={spent > planned ? "error.main" : "text.secondary"}>
                          spent {formatIDR(spent)}
                        </Typography>
                      </Box>
                    </Stack>
                  );
                })}
              </Stack>
              <Button size="small" sx={{ mt: 1.5 }} onClick={() => navigate("/trip/budget")}>
                View trip budgets →
              </Button>
            </CardContent>
          </Card>
        </>
      )}
    </Box>
  );
}
