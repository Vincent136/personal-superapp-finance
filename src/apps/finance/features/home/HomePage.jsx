import { useEffect, useState } from "react";
import { Alert, Box, Button, Card, CardContent, CircularProgress, Divider, Stack, Typography } from "@mui/material";
import { useNavigate } from "react-router-dom";
import PageHeader from "../../../../components/common/PageHeader";
import PlanVsActualList from "../../components/PlanVsActualList";
import { supabase } from "../../../../lib/supabase";
import { useCategories } from "../../hooks/useCategories";
import { useCurrency } from "../../hooks/useCurrency";
import { useCurrencyConfig } from "../../../../hooks/useCurrencyConfig";
import { buildPlanVsActualRows } from "../../lib/planVsActual";
import {
  currentPeriod,
  daysUntilPayday,
  formatPayday,
  formatPeriodRange,
  periodKey,
  periodRange,
} from "../../lib/format";

export default function HomePage() {
  const navigate = useNavigate();
  const { categories, dailyBudgetCategories, loading: categoriesLoading } = useCategories();
  const { format, loading: currencyLoading } = useCurrency();
  const { currencies, wallets, toIDR, formatIDR, formatAmount } = useCurrencyConfig();

  const [budgetItems, setBudgetItems] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [error, setError] = useState(null);

  const period = currentPeriod();
  const { start, end } = periodRange(period);

  useEffect(() => {
    let active = true;

    Promise.all([
      supabase
        .from("budget_items")
        .select("category_id, amount, currency")
        .eq("month", periodKey(period)),
      supabase
        .from("transactions")
        .select("category_id, type, amount, currency, occurred_on")
        .gte("occurred_on", start)
        .lte("occurred_on", end),
    ]).then(([budgetRes, txRes]) => {
      if (!active) return;

      if (budgetRes.error) {
        setError(budgetRes.error.message);
      } else if (txRes.error) {
        setError(txRes.error.message);
      } else {
        setBudgetItems(budgetRes.data ?? []);
        setTransactions(txRes.data ?? []);
        setError(null);
      }

      setDataLoading(false);
    });

    return () => {
      active = false;
    };
  }, [period, start, end]);

  if (categoriesLoading || dataLoading || currencyLoading) {
    return (
      <Box sx={{ p: { xs: 2, md: 3 }, display: "flex", justifyContent: "center", py: 6 }}>
        <CircularProgress />
      </Box>
    );
  }

  const totalIncome = transactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + toIDR(Number(t.amount), t.currency ?? "IDR"), 0);
  const totalExpense = transactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + toIDR(Number(t.amount), t.currency ?? "IDR"), 0);
  const net = totalIncome - totalExpense;

  const dailyBudgetCategoryIds = new Set(dailyBudgetCategories.map((category) => category.id));
  const dailyBudgetPlanned = budgetItems
    .filter((item) => dailyBudgetCategoryIds.has(item.category_id))
    .reduce((sum, item) => sum + toIDR(Number(item.amount), item.currency ?? "IDR"), 0);
  const dailyBudgetActual = transactions
    .filter((t) => dailyBudgetCategoryIds.has(t.category_id))
    .reduce((sum, t) => sum + toIDR(Number(t.amount), t.currency ?? "IDR"), 0);
  const daysLeft = daysUntilPayday(period);
  const dailyBudget = (dailyBudgetPlanned - dailyBudgetActual) / daysLeft;

  const { rows, totalPlannedIncome, totalActualIncome, totalPlannedExpense, totalActualExpense } =
    buildPlanVsActualRows(categories, budgetItems, transactions, toIDR);

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      <PageHeader title="Home" subtitle={formatPeriodRange(period)} />

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Cash wallets by currency */}
      {currencies.some((c) => (wallets[c.code] ?? 0) > 0 || c.code === "IDR") && (
        <Card sx={{ mb: 3 }}>
          <CardContent sx={{ pb: "12px !important" }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
              <Typography variant="subtitle2" fontWeight={700}>Cash Wallets</Typography>
              <Button size="small" onClick={() => navigate("/wallet/wallets")}>Manage →</Button>
            </Stack>
            <Stack
              direction="row"
              spacing={0}
              divider={<Divider orientation="vertical" flexItem />}
              sx={{ overflowX: "auto" }}
            >
              {currencies
                .filter((c) => (wallets[c.code] ?? 0) > 0 || c.code === "IDR")
                .map((c) => {
                  const bal = wallets[c.code] ?? 0;
                  return (
                    <Box key={c.code} sx={{ flex: "0 0 auto", px: 2, textAlign: "center", minWidth: 90 }}>
                      <Typography variant="caption" color="text.secondary" display="block">
                        {c.flag} {c.code}
                      </Typography>
                      <Typography variant="body2" fontWeight={700} noWrap>
                        {formatAmount(bal, c.code)}
                      </Typography>
                      {c.code !== "IDR" && (
                        <Typography variant="caption" color="text.secondary" noWrap>
                          ≈ {formatIDR(toIDR(bal, c.code))}
                        </Typography>
                      )}
                    </Box>
                  );
                })}
            </Stack>
          </CardContent>
        </Card>
      )}

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr 1fr", sm: "repeat(3, 1fr)" },
          gap: 2,
          mb: 3,
        }}
      >
        <Card>
          <CardContent>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Income (this period)
            </Typography>
            <Typography variant="h5" fontWeight={700}>
              {format(totalIncome)}
            </Typography>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Expense (this period)
            </Typography>
            <Typography variant="h5" fontWeight={700}>
              {format(totalExpense)}
            </Typography>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Net (this period)
            </Typography>
            <Typography
              variant="h5"
              fontWeight={700}
              color={net >= 0 ? "success.main" : "error.main"}
            >
              {format(net)}
            </Typography>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Daily budget
            </Typography>
            <Typography variant="h5" fontWeight={700}>
              {format(dailyBudget)}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Food, groceries &amp; transport
            </Typography>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Days until payday
            </Typography>
            <Typography variant="h5" fontWeight={700}>
              {daysLeft} {daysLeft === 1 ? "day" : "days"}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Next payday {formatPayday(period)}
            </Typography>
          </CardContent>
        </Card>
      </Box>

      <Typography variant="h6" gutterBottom>
        Plan vs actual — this period
      </Typography>

      <PlanVsActualList
        rows={rows}
        totalPlannedIncome={totalPlannedIncome}
        totalActualIncome={totalActualIncome}
        totalPlannedExpense={totalPlannedExpense}
        totalActualExpense={totalActualExpense}
        format={format}
        emptyMessage="No budget or transactions for this period yet."
      />
    </Box>
  );
}
