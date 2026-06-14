import { useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { BarChart } from "@mui/x-charts/BarChart";
import { Link as RouterLink } from "react-router-dom";
import PageHeader from "../../../../components/common/PageHeader";
import PlanVsActualList from "../../components/PlanVsActualList";
import { supabase } from "../../../../lib/supabase";
import { useAuth } from "../../../../hooks/useAuth";
import { useCategories } from "../../hooks/useCategories";
import { useCurrency } from "../../hooks/useCurrency";
import { buildPlanVsActualRows } from "../../lib/planVsActual";
import {
  convertFromIDR,
  convertToIDR,
  currentPeriod,
  formatCurrency,
  formatPeriodRange,
  formatPeriodShort,
  periodKey,
  periodRange,
  periodsBetween,
  previousPeriod,
} from "../../lib/format";

function todayString() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

function CategoryAmountRow({ category, amount, step, onChange }) {
  return (
    <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ py: 0.5 }}>
      <Typography variant="body2">{category.name}</Typography>
      <TextField
        type="number"
        size="small"
        value={amount}
        onChange={onChange}
        slotProps={{ input: { inputProps: { min: 0, step } } }}
        sx={{ width: 160 }}
      />
    </Stack>
  );
}

export default function BudgetPage() {
  const { user } = useAuth();
  const { categories, incomeCategories, expenseCategories, loading: categoriesLoading } = useCategories();
  const { currency, rate, format, loading: currencyLoading } = useCurrency();
  const theme = useTheme();
  const step = currency === "IDR" ? "1000" : "0.01";

  // --- Monthly plan editor ---
  const [planMonth, setPlanMonth] = useState(currentPeriod());
  const [amounts, setAmounts] = useState({});
  const [planLoading, setPlanLoading] = useState(true);
  const [planError, setPlanError] = useState(null);
  const [planMessage, setPlanMessage] = useState(null);
  const [copyMessage, setCopyMessage] = useState(null);
  const [saving, setSaving] = useState(false);
  const [copying, setCopying] = useState(false);

  useEffect(() => {
    if (currencyLoading) return;
    let active = true;

    supabase
      .from("budget_items")
      .select("category_id, amount")
      .eq("month", periodKey(planMonth))
      .then(({ data, error }) => {
        if (!active) return;

        if (error) {
          setPlanError(error.message);
        } else {
          const next = {};
          for (const item of data) {
            next[item.category_id] = String(convertFromIDR(Number(item.amount), currency, rate));
          }
          setAmounts(next);
          setPlanError(null);
        }

        setPlanMessage(null);
        setCopyMessage(null);
        setPlanLoading(false);
      });

    return () => {
      active = false;
    };
  }, [planMonth, currency, rate, currencyLoading]);

  const handleAmountChange = (categoryId, value) => {
    setAmounts((prev) => ({ ...prev, [categoryId]: value }));
  };

  const handleSavePlan = async () => {
    setSaving(true);
    setPlanError(null);
    setPlanMessage(null);

    const rows = categories.map((category) => ({
      user_id: user.id,
      category_id: category.id,
      month: periodKey(planMonth),
      amount: convertToIDR(Number(amounts[category.id] || 0), currency, rate),
    }));

    const { error } = await supabase
      .from("budget_items")
      .upsert(rows, { onConflict: "user_id,category_id,month" });

    setSaving(false);

    if (error) setPlanError(error.message);
    else setPlanMessage("Budget saved.");
  };

  const handleCopyFromPrevious = async () => {
    setCopying(true);
    setPlanError(null);
    setPlanMessage(null);
    setCopyMessage(null);

    const prevPeriod = previousPeriod(planMonth);
    const { data, error } = await supabase
      .from("budget_items")
      .select("category_id, amount")
      .eq("month", periodKey(prevPeriod));

    setCopying(false);

    if (error) {
      setPlanError(error.message);
      return;
    }

    if (!data || data.length === 0) {
      setCopyMessage(`No budget found for ${formatPeriodShort(prevPeriod)}.`);
      return;
    }

    const next = {};
    for (const item of data) {
      next[item.category_id] = String(convertFromIDR(Number(item.amount), currency, rate));
    }
    setAmounts((prev) => ({ ...prev, ...next }));
    setCopyMessage(`Copied budget from ${formatPeriodShort(prevPeriod)}. Review and Save to keep it.`);
  };

  const totalIncome = incomeCategories.reduce(
    (sum, category) => sum + Number(amounts[category.id] || 0),
    0,
  );
  const totalExpense = expenseCategories.reduce(
    (sum, category) => sum + Number(amounts[category.id] || 0),
    0,
  );
  const netPlanned = totalIncome - totalExpense;

  // --- Accumulated budget (date range) ---
  const [fromMonth, setFromMonth] = useState(currentPeriod());
  const [toMonth, setToMonth] = useState(currentPeriod());
  const [rangeTotals, setRangeTotals] = useState([]);
  const [rangeLoading, setRangeLoading] = useState(true);
  const [rangeError, setRangeError] = useState(null);

  useEffect(() => {
    let active = true;

    supabase
      .from("budget_items")
      .select("category_id, amount")
      .gte("month", periodKey(fromMonth))
      .lte("month", periodKey(toMonth))
      .then(({ data, error }) => {
        if (!active) return;

        if (error) {
          setRangeError(error.message);
        } else {
          const sums = new Map();
          for (const item of data) {
            sums.set(item.category_id, (sums.get(item.category_id) ?? 0) + Number(item.amount));
          }
          setRangeTotals(Array.from(sums.entries()));
          setRangeError(null);
        }

        setRangeLoading(false);
      });

    return () => {
      active = false;
    };
  }, [fromMonth, toMonth]);

  const rangeRows = rangeTotals
    .map(([categoryId, total]) => {
      const category = categories.find((item) => item.id === categoryId);
      return category ? { ...category, total } : null;
    })
    .filter(Boolean)
    .sort((a, b) =>
      a.type === b.type ? a.name.localeCompare(b.name) : a.type.localeCompare(b.type),
    );

  const rangeIncomeTotal = rangeRows
    .filter((row) => row.type === "income")
    .reduce((sum, row) => sum + row.total, 0);
  const rangeExpenseTotal = rangeRows
    .filter((row) => row.type === "expense")
    .reduce((sum, row) => sum + row.total, 0);
  const rangeNetTotal = rangeIncomeTotal - rangeExpenseTotal;

  // --- History: budget vs actual for a single period ---
  const [historyPeriod, setHistoryPeriod] = useState(previousPeriod(currentPeriod()));
  const [historyBudgetItems, setHistoryBudgetItems] = useState([]);
  const [historyTransactions, setHistoryTransactions] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [historyError, setHistoryError] = useState(null);

  useEffect(() => {
    let active = true;
    const { start, end } = periodRange(historyPeriod);

    Promise.all([
      supabase.from("budget_items").select("category_id, amount").eq("month", periodKey(historyPeriod)),
      supabase
        .from("transactions")
        .select("category_id, type, amount, occurred_on")
        .gte("occurred_on", start)
        .lte("occurred_on", end),
    ]).then(([budgetRes, txRes]) => {
      if (!active) return;

      if (budgetRes.error) {
        setHistoryError(budgetRes.error.message);
      } else if (txRes.error) {
        setHistoryError(txRes.error.message);
      } else {
        setHistoryBudgetItems(budgetRes.data ?? []);
        setHistoryTransactions(txRes.data ?? []);
        setHistoryError(null);
      }

      setHistoryLoading(false);
    });

    return () => {
      active = false;
    };
  }, [historyPeriod]);

  const historyResult = buildPlanVsActualRows(categories, historyBudgetItems, historyTransactions);

  // --- Savings simulation ---
  const [savingsFrom, setSavingsFrom] = useState(currentPeriod());
  const [savingsTo, setSavingsTo] = useState(currentPeriod());
  const [savingsTransactions, setSavingsTransactions] = useState([]);
  const [savingsBudgetItems, setSavingsBudgetItems] = useState([]);
  const [savingsLoading, setSavingsLoading] = useState(true);
  const [savingsError, setSavingsError] = useState(null);

  const savingsPeriods = periodsBetween(savingsFrom, savingsTo);

  useEffect(() => {
    let active = true;

    const periods = periodsBetween(savingsFrom, savingsTo);
    const { start } = periodRange(periods[0]);
    const { end } = periodRange(periods[periods.length - 1]);

    Promise.all([
      supabase
        .from("transactions")
        .select("type, amount, occurred_on")
        .gte("occurred_on", start)
        .lte("occurred_on", end),
      supabase
        .from("budget_items")
        .select("category_id, amount, month")
        .gte("month", periodKey(periods[0]))
        .lte("month", periodKey(periods[periods.length - 1])),
    ]).then(([txRes, budgetRes]) => {
      if (!active) return;

      if (txRes.error) {
        setSavingsError(txRes.error.message);
      } else if (budgetRes.error) {
        setSavingsError(budgetRes.error.message);
      } else {
        setSavingsTransactions(txRes.data ?? []);
        setSavingsBudgetItems(budgetRes.data ?? []);
        setSavingsError(null);
      }

      setSavingsLoading(false);
    });

    return () => {
      active = false;
    };
  }, [savingsFrom, savingsTo]);

  const categoryTypeById = new Map(categories.map((category) => [category.id, category.type]));
  const today = todayString();

  const savingsRowsWithoutCumulative = savingsPeriods.map((period) => {
    const { start, end } = periodRange(period);
    const isRealized = end < today;

    let net;
    if (isRealized) {
      const periodTransactions = savingsTransactions.filter(
        (transaction) => transaction.occurred_on >= start && transaction.occurred_on <= end,
      );
      const income = periodTransactions
        .filter((transaction) => transaction.type === "income")
        .reduce((sum, transaction) => sum + Number(transaction.amount), 0);
      const expense = periodTransactions
        .filter((transaction) => transaction.type === "expense")
        .reduce((sum, transaction) => sum + Number(transaction.amount), 0);
      net = income - expense;
    } else {
      const periodItems = savingsBudgetItems.filter((item) => item.month === periodKey(period));
      const income = periodItems
        .filter((item) => categoryTypeById.get(item.category_id) === "income")
        .reduce((sum, item) => sum + Number(item.amount), 0);
      const expense = periodItems
        .filter((item) => categoryTypeById.get(item.category_id) === "expense")
        .reduce((sum, item) => sum + Number(item.amount), 0);
      net = income - expense;
    }

    return { period, isRealized, net };
  });

  const savingsRows = savingsRowsWithoutCumulative.reduce((acc, row) => {
    const previousCumulative = acc.length > 0 ? acc[acc.length - 1].cumulative : 0;
    return [...acc, { ...row, cumulative: previousCumulative + row.net }];
  }, []);

  const chartDataset = savingsRows.map((row) => ({
    period: formatPeriodShort(row.period),
    realized: row.isRealized ? convertFromIDR(row.net, currency, rate) : null,
    projected: row.isRealized ? null : convertFromIDR(row.net, currency, rate),
  }));

  const projectedTotal = savingsRows.length > 0 ? savingsRows[savingsRows.length - 1].cumulative : 0;

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      <PageHeader
        title="Budget"
        subtitle="Plan your monthly budget and review totals over time."
        action={
          <Button component={RouterLink} to="/finance/categories" size="small">
            Manage categories
          </Button>
        }
      />

      <Box sx={{ mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          Monthly plan
        </Typography>

        <TextField
          type="month"
          label="Month"
          value={planMonth}
          onChange={(event) => setPlanMonth(event.target.value)}
          size="small"
          slotProps={{ inputLabel: { shrink: true } }}
          sx={{ mb: 0.5 }}
        />
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {formatPeriodRange(planMonth)}
        </Typography>

        {planError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {planError}
          </Alert>
        )}
        {planMessage && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {planMessage}
          </Alert>
        )}
        {copyMessage && (
          <Alert severity="info" sx={{ mb: 2 }}>
            {copyMessage}
          </Alert>
        )}

        {planLoading || categoriesLoading || currencyLoading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 1 }}>
              Income
            </Typography>
            {incomeCategories.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                No income categories yet.
              </Typography>
            ) : (
              incomeCategories.map((category) => (
                <CategoryAmountRow
                  key={category.id}
                  category={category}
                  amount={amounts[category.id] ?? "0"}
                  step={step}
                  onChange={(event) => handleAmountChange(category.id, event.target.value)}
                />
              ))
            )}

            <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 2 }}>
              Expense
            </Typography>
            {expenseCategories.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                No expense categories yet.
              </Typography>
            ) : (
              expenseCategories.map((category) => (
                <CategoryAmountRow
                  key={category.id}
                  category={category}
                  amount={amounts[category.id] ?? "0"}
                  step={step}
                  onChange={(event) => handleAmountChange(category.id, event.target.value)}
                />
              ))
            )}

            <Divider sx={{ my: 2 }} />

            <Stack spacing={0.5} sx={{ mb: 2 }}>
              <Stack direction="row" justifyContent="space-between">
                <Typography variant="body2">Total planned income</Typography>
                <Typography variant="body2">{formatCurrency(totalIncome, currency)}</Typography>
              </Stack>
              <Stack direction="row" justifyContent="space-between">
                <Typography variant="body2">Total planned expense</Typography>
                <Typography variant="body2">{formatCurrency(totalExpense, currency)}</Typography>
              </Stack>
              <Stack direction="row" justifyContent="space-between">
                <Typography variant="subtitle2">Net planned</Typography>
                <Typography
                  variant="subtitle2"
                  color={netPlanned >= 0 ? "success.main" : "error.main"}
                >
                  {formatCurrency(netPlanned, currency)}
                </Typography>
              </Stack>
            </Stack>

            <Stack direction="row" spacing={2}>
              <Button variant="contained" onClick={handleSavePlan} disabled={saving}>
                {saving ? <CircularProgress size={24} /> : "Save"}
              </Button>
              <Button variant="outlined" onClick={handleCopyFromPrevious} disabled={copying}>
                {copying ? <CircularProgress size={24} /> : "Copy from previous period"}
              </Button>
            </Stack>
          </>
        )}
      </Box>

      <Divider sx={{ mb: 4 }} />

      <Box sx={{ mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          Accumulated budget
        </Typography>

        <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
          <TextField
            type="month"
            label="From"
            value={fromMonth}
            onChange={(event) => setFromMonth(event.target.value)}
            size="small"
            slotProps={{ inputLabel: { shrink: true } }}
          />
          <TextField
            type="month"
            label="To"
            value={toMonth}
            onChange={(event) => setToMonth(event.target.value)}
            size="small"
            slotProps={{ inputLabel: { shrink: true } }}
          />
        </Stack>

        {rangeError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {rangeError}
          </Alert>
        )}

        {rangeLoading || currencyLoading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
            <CircularProgress />
          </Box>
        ) : rangeRows.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            No budget data for this range.
          </Typography>
        ) : (
          <>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Category</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell align="right">Total</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {rangeRows.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>{row.name}</TableCell>
                    <TableCell sx={{ textTransform: "capitalize" }}>{row.type}</TableCell>
                    <TableCell align="right">{format(row.total)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            <Stack spacing={0.5} sx={{ mt: 2 }}>
              <Stack direction="row" justifyContent="space-between">
                <Typography variant="body2">Total income</Typography>
                <Typography variant="body2">{format(rangeIncomeTotal)}</Typography>
              </Stack>
              <Stack direction="row" justifyContent="space-between">
                <Typography variant="body2">Total expense</Typography>
                <Typography variant="body2">{format(rangeExpenseTotal)}</Typography>
              </Stack>
              <Stack direction="row" justifyContent="space-between">
                <Typography variant="subtitle2">Net</Typography>
                <Typography
                  variant="subtitle2"
                  color={rangeNetTotal >= 0 ? "success.main" : "error.main"}
                >
                  {format(rangeNetTotal)}
                </Typography>
              </Stack>
            </Stack>
          </>
        )}
      </Box>

      <Divider sx={{ mb: 4 }} />

      <Box sx={{ mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          History — budget vs actual
        </Typography>

        <TextField
          type="month"
          label="Period"
          value={historyPeriod}
          onChange={(event) => setHistoryPeriod(event.target.value)}
          size="small"
          slotProps={{ inputLabel: { shrink: true } }}
          sx={{ mb: 0.5 }}
        />
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {formatPeriodRange(historyPeriod)}
        </Typography>

        {historyError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {historyError}
          </Alert>
        )}

        {historyLoading || categoriesLoading || currencyLoading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <PlanVsActualList
            rows={historyResult.rows}
            totalPlannedIncome={historyResult.totalPlannedIncome}
            totalActualIncome={historyResult.totalActualIncome}
            totalPlannedExpense={historyResult.totalPlannedExpense}
            totalActualExpense={historyResult.totalActualExpense}
            format={format}
            emptyMessage="No budget or transactions for this period."
          />
        )}
      </Box>

      <Divider sx={{ mb: 4 }} />

      <Box>
        <Typography variant="h6" gutterBottom>
          Savings simulation
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Mixes actual results for periods that have ended with your plan for the current and
          future periods.
        </Typography>

        <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
          <TextField
            type="month"
            label="From"
            value={savingsFrom}
            onChange={(event) => setSavingsFrom(event.target.value)}
            size="small"
            slotProps={{ inputLabel: { shrink: true } }}
          />
          <TextField
            type="month"
            label="To"
            value={savingsTo}
            onChange={(event) => setSavingsTo(event.target.value)}
            size="small"
            slotProps={{ inputLabel: { shrink: true } }}
          />
        </Stack>

        {savingsError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {savingsError}
          </Alert>
        )}

        {savingsLoading || categoriesLoading || currencyLoading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            <BarChart
              dataset={chartDataset}
              xAxis={[{ scaleType: "band", dataKey: "period" }]}
              series={[
                {
                  dataKey: "realized",
                  label: "Realized (actual)",
                  color: theme.palette.success.main,
                  valueFormatter: (value) => (value == null ? "" : formatCurrency(value, currency)),
                },
                {
                  dataKey: "projected",
                  label: "Projected (planned)",
                  color: theme.palette.grey[500],
                  valueFormatter: (value) => (value == null ? "" : formatCurrency(value, currency)),
                },
              ]}
              height={300}
              sx={{ mb: 2 }}
            />

            <Table size="small" sx={{ mb: 2 }}>
              <TableHead>
                <TableRow>
                  <TableCell>Period</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Net</TableCell>
                  <TableCell align="right">Running total</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {savingsRows.map((row) => (
                  <TableRow key={row.period}>
                    <TableCell>{formatPeriodShort(row.period)}</TableCell>
                    <TableCell>
                      <Chip
                        label={row.isRealized ? "Actual" : "Planned"}
                        size="small"
                        color={row.isRealized ? "success" : "default"}
                      />
                    </TableCell>
                    <TableCell
                      align="right"
                      sx={{ color: row.net >= 0 ? "success.main" : "error.main" }}
                    >
                      {format(row.net)}
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600 }}>
                      {format(row.cumulative)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            <Typography variant="subtitle2">
              Projected total for this range:{" "}
              <Typography
                component="span"
                variant="subtitle2"
                fontWeight={700}
                color={projectedTotal >= 0 ? "success.main" : "error.main"}
              >
                {format(projectedTotal)}
              </Typography>
            </Typography>
          </>
        )}
      </Box>
    </Box>
  );
}
