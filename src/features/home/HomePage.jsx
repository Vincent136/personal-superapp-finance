import { useEffect, useState } from "react";
import {
  Alert,
  Box,
  Card,
  CardContent,
  CircularProgress,
  Divider,
  LinearProgress,
  Stack,
  Typography,
} from "@mui/material";
import PageHeader from "../../components/common/PageHeader";
import { supabase } from "../../lib/supabase";
import { useCategories } from "../../hooks/useCategories";
import { useCurrency } from "../../hooks/useCurrency";
import { useProfile } from "../../hooks/useProfile";
import { currentMonthString, daysInMonth, endOfMonth, monthToDate } from "../../lib/format";

export default function HomePage() {
  const { profile, loading: profileLoading } = useProfile();
  const { categories, loading: categoriesLoading } = useCategories();
  const { format, loading: currencyLoading } = useCurrency();

  const [budgetItems, setBudgetItems] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [error, setError] = useState(null);

  const month = currentMonthString();

  useEffect(() => {
    let active = true;

    Promise.all([
      supabase
        .from("budget_items")
        .select("category_id, amount")
        .eq("month", monthToDate(month)),
      supabase.from("transactions").select("category_id, type, amount, occurred_on"),
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
  }, [month]);

  if (profileLoading || categoriesLoading || dataLoading || currencyLoading) {
    return (
      <Box sx={{ p: { xs: 2, md: 3 }, display: "flex", justifyContent: "center", py: 6 }}>
        <CircularProgress />
      </Box>
    );
  }

  const totalIncome = transactions
    .filter((transaction) => transaction.type === "income")
    .reduce((sum, transaction) => sum + Number(transaction.amount), 0);
  const totalExpense = transactions
    .filter((transaction) => transaction.type === "expense")
    .reduce((sum, transaction) => sum + Number(transaction.amount), 0);
  const balance = Number(profile?.initial_capital ?? 0) + totalIncome - totalExpense;

  const monthStart = monthToDate(month);
  const monthEnd = endOfMonth(month);
  const monthTransactions = transactions.filter(
    (transaction) => transaction.occurred_on >= monthStart && transaction.occurred_on <= monthEnd,
  );

  const plannedByCategory = new Map(
    budgetItems.map((item) => [item.category_id, Number(item.amount)]),
  );
  const actualByCategory = new Map();
  for (const transaction of monthTransactions) {
    actualByCategory.set(
      transaction.category_id,
      (actualByCategory.get(transaction.category_id) ?? 0) + Number(transaction.amount),
    );
  }

  const totalPlannedExpense = categories
    .filter((category) => category.type === "expense")
    .reduce((sum, category) => sum + (plannedByCategory.get(category.id) ?? 0), 0);
  const dailyBudget = totalPlannedExpense / daysInMonth(month);

  const rows = categories
    .map((category) => ({
      ...category,
      planned: plannedByCategory.get(category.id) ?? 0,
      actual: actualByCategory.get(category.id) ?? 0,
    }))
    .filter((row) => row.planned > 0 || row.actual > 0)
    .sort((a, b) =>
      a.type === b.type ? a.name.localeCompare(b.name) : a.type.localeCompare(b.type),
    );

  const totalPlannedIncome = rows
    .filter((row) => row.type === "income")
    .reduce((sum, row) => sum + row.planned, 0);
  const totalActualIncome = rows
    .filter((row) => row.type === "income")
    .reduce((sum, row) => sum + row.actual, 0);
  const totalActualExpense = rows
    .filter((row) => row.type === "expense")
    .reduce((sum, row) => sum + row.actual, 0);

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      <PageHeader title="Home" subtitle="Your finances at a glance." />

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
          gap: 2,
          mb: 3,
        }}
      >
        <Card>
          <CardContent>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Balance
            </Typography>
            <Typography variant="h5" fontWeight={700}>
              {format(balance)}
            </Typography>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Daily budget (this month)
            </Typography>
            <Typography variant="h5" fontWeight={700}>
              {format(dailyBudget)}
            </Typography>
          </CardContent>
        </Card>
      </Box>

      <Typography variant="h6" gutterBottom>
        Plan vs actual — this month
      </Typography>

      {rows.length === 0 ? (
        <Typography variant="body2" color="text.secondary">
          No budget or transactions for this month yet.
        </Typography>
      ) : (
        <Stack spacing={2}>
          {rows.map((row) => {
            const remaining = row.planned - row.actual;
            const isOver = remaining < 0;
            const overIsBad = row.type === "expense";
            const progress =
              row.planned > 0 ? Math.min((row.actual / row.planned) * 100, 100) : row.actual > 0 ? 100 : 0;
            const remainingColor = isOver
              ? overIsBad
                ? "error.main"
                : "success.main"
              : "text.secondary";
            const remainingLabel = isOver
              ? `${row.type === "income" ? "Exceeded by" : "Over by"} ${format(Math.abs(remaining))}`
              : `Remaining ${format(remaining)}`;

            return (
              <Box key={row.id}>
                <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.5 }}>
                  <Typography variant="body2" fontWeight={600}>
                    {row.name}
                  </Typography>
                  <Typography variant="body2" color={remainingColor}>
                    {remainingLabel}
                  </Typography>
                </Stack>
                <LinearProgress
                  variant="determinate"
                  value={progress}
                  color={isOver && overIsBad ? "error" : "primary"}
                  sx={{ mb: 0.5 }}
                />
                <Stack direction="row" justifyContent="space-between">
                  <Typography variant="caption" color="text.secondary">
                    Actual {format(row.actual)}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Planned {format(row.planned)}
                  </Typography>
                </Stack>
              </Box>
            );
          })}

          <Divider />

          <Stack direction="row" justifyContent="space-between">
            <Typography variant="subtitle2">Income — actual / planned</Typography>
            <Typography variant="subtitle2">
              {format(totalActualIncome)} / {format(totalPlannedIncome)}
            </Typography>
          </Stack>
          <Stack direction="row" justifyContent="space-between">
            <Typography variant="subtitle2">Expense — actual / planned</Typography>
            <Typography variant="subtitle2">
              {format(totalActualExpense)} / {format(totalPlannedExpense)}
            </Typography>
          </Stack>
        </Stack>
      )}
    </Box>
  );
}
