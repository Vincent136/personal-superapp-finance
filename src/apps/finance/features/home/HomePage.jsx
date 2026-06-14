import { useEffect, useState } from "react";
import { Alert, Box, Card, CardContent, CircularProgress, Typography } from "@mui/material";
import PageHeader from "../../../../components/common/PageHeader";
import PlanVsActualList from "../../components/PlanVsActualList";
import { supabase } from "../../../../lib/supabase";
import { useCategories } from "../../hooks/useCategories";
import { useCurrency } from "../../hooks/useCurrency";
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
  const { categories, dailyBudgetCategories, loading: categoriesLoading } = useCategories();
  const { format, loading: currencyLoading } = useCurrency();

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
        .select("category_id, amount")
        .eq("month", periodKey(period)),
      supabase
        .from("transactions")
        .select("category_id, type, amount, occurred_on")
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
    .filter((transaction) => transaction.type === "income")
    .reduce((sum, transaction) => sum + Number(transaction.amount), 0);
  const totalExpense = transactions
    .filter((transaction) => transaction.type === "expense")
    .reduce((sum, transaction) => sum + Number(transaction.amount), 0);
  const net = totalIncome - totalExpense;

  const plannedByCategory = new Map(
    budgetItems.map((item) => [item.category_id, Number(item.amount)]),
  );
  const dailyBudgetCategoryIds = new Set(dailyBudgetCategories.map((category) => category.id));
  const dailyBudgetPlanned = dailyBudgetCategories.reduce(
    (sum, category) => sum + (plannedByCategory.get(category.id) ?? 0),
    0,
  );
  const dailyBudgetActual = transactions
    .filter((transaction) => dailyBudgetCategoryIds.has(transaction.category_id))
    .reduce((sum, transaction) => sum + Number(transaction.amount), 0);
  const daysLeft = daysUntilPayday(period);
  const dailyBudget = (dailyBudgetPlanned - dailyBudgetActual) / daysLeft;

  const { rows, totalPlannedIncome, totalActualIncome, totalPlannedExpense, totalActualExpense } =
    buildPlanVsActualRows(categories, budgetItems, transactions);

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      <PageHeader title="Home" subtitle={formatPeriodRange(period)} />

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
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
