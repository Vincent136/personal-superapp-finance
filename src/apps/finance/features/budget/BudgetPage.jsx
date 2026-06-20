import { useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Divider,
  IconButton,
  LinearProgress,
  MenuItem,
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
import { Link as RouterLink, useNavigate } from "react-router-dom";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import { useCurrencyConfig } from "../../../../hooks/useCurrencyConfig";
import PageHeader from "../../../../components/common/PageHeader";
import PlanVsActualList from "../../components/PlanVsActualList";
import { supabase } from "../../../../lib/supabase";
import { useAuth } from "../../../../hooks/useAuth";
import { useCategories } from "../../hooks/useCategories";
import { useCurrency } from "../../hooks/useCurrency";
import { buildPlanVsActualRows } from "../../lib/planVsActual";
import {
  convertFromIDR,
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

function CategoryAmountRow({
  category,
  amount,
  currency,
  currencies,
  toIDR,
  formatIDR,
  onAmountChange,
  onCurrencyChange,
}) {
  const step = currency === "IDR" ? "1000" : currency === "JPY" ? "1" : "0.01";
  const idrEquiv =
    currency !== "IDR" && Number(amount) > 0
      ? formatIDR(toIDR(Number(amount), currency))
      : null;

  return (
    <Stack
      direction="row"
      alignItems="flex-start"
      justifyContent="space-between"
      sx={{ py: 0.5 }}
      gap={1}
    >
      <Typography variant="body2" sx={{ flex: 1, pt: 1 }}>
        {category.name}
      </Typography>
      <Stack direction="row" spacing={1} alignItems="flex-start">
        <TextField
          select
          size="small"
          value={currency}
          onChange={(e) => onCurrencyChange(e.target.value)}
          sx={{ width: 88 }}
        >
          {currencies.map((c) => (
            <MenuItem key={c.code} value={c.code}>
              {c.code}
            </MenuItem>
          ))}
        </TextField>
        <Box>
          <TextField
            type="number"
            size="small"
            value={amount}
            onChange={(e) => onAmountChange(e.target.value)}
            slotProps={{ input: { inputProps: { min: 0, step } } }}
            sx={{ width: 140 }}
          />
          {idrEquiv && (
            <Typography variant="caption" color="text.secondary" display="block" mt={0.25}>
              ≈ {idrEquiv}
            </Typography>
          )}
        </Box>
      </Stack>
    </Stack>
  );
}

function TripBudgetSection() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toIDR, formatIDR } = useCurrencyConfig();
  const [linked, setLinked] = useState([]);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("trips")
      .select("id, title, status, data")
      .eq("user_id", user.id)
      .then(({ data }) => {
        const trips = (data ?? []).map((r) => ({ id: r.id, title: r.title, status: r.status, ...r.data }));
        setLinked(trips.filter((t) => t.financeCategory));
      });
  }, [user]);

  if (linked.length === 0) return null;

  return (
    <Box sx={{ mb: 4 }}>
      <Typography variant="h6" gutterBottom>
        Trip Linked Budgets
      </Typography>
      <Alert severity="info" icon={false} sx={{ mb: 2, py: 0.5 }}>
        Read-only — manage these in the{" "}
        <RouterLink to="/trip/budget" style={{ color: "inherit" }}>
          Trip app
        </RouterLink>
        . Amounts converted to IDR using your Wallet rates.
      </Alert>
      <Stack spacing={1.5}>
        {linked.map((trip) => {
          const cur = trip.currency ?? "IDR";
          const planned = toIDR(trip.plannedBudget ?? 0, cur);
          const spent = toIDR(
            (trip.expenses ?? [])
              .filter((e) => e.type === "actual")
              .reduce((s, e) => s + (e.amount ?? 0), 0),
            cur,
          );
          const remaining = planned - spent;
          const pct = planned > 0 ? Math.min((spent / planned) * 100, 100) : 0;
          const over = spent > planned && planned > 0;

          return (
            <Card key={trip.id} variant="outlined">
              <CardContent sx={{ pb: "12px !important" }}>
                <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                  <Box sx={{ flex: 1 }}>
                    <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" gap={0.5}>
                      <Typography variant="subtitle2" fontWeight={700}>
                        {trip.title}
                      </Typography>
                      <Chip label="Trip" size="small" color="info" variant="outlined" />
                      <Chip label={trip.financeCategory} size="small" variant="outlined" />
                    </Stack>
                    {trip.destination && (
                      <Typography variant="caption" color="text.secondary">
                        📍 {trip.destination}
                      </Typography>
                    )}
                  </Box>
                  <IconButton size="small" onClick={() => navigate(`/trip/${trip.id}`)}>
                    <OpenInNewIcon fontSize="small" />
                  </IconButton>
                </Stack>

                <Stack direction="row" spacing={3} mt={1}>
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Planned
                    </Typography>
                    <Typography variant="body2" fontWeight={600}>
                      {formatIDR(planned)}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Spent
                    </Typography>
                    <Typography
                      variant="body2"
                      fontWeight={600}
                      color={over ? "error.main" : "text.primary"}
                    >
                      {formatIDR(spent)}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      {over ? "Over" : "Remaining"}
                    </Typography>
                    <Typography
                      variant="body2"
                      fontWeight={600}
                      color={remaining >= 0 ? "success.main" : "error.main"}
                    >
                      {formatIDR(Math.abs(remaining))}
                    </Typography>
                  </Box>
                </Stack>

                {planned > 0 && (
                  <LinearProgress
                    variant="determinate"
                    value={pct}
                    color={over ? "error" : pct > 80 ? "warning" : "primary"}
                    sx={{ mt: 1, borderRadius: 1, height: 4 }}
                  />
                )}
              </CardContent>
            </Card>
          );
        })}
      </Stack>
    </Box>
  );
}

export default function BudgetPage() {
  const { user } = useAuth();
  const { categories, incomeCategories, expenseCategories, loading: categoriesLoading } =
    useCategories();
  const { currency, rate, format, loading: currencyLoading } = useCurrency();
  const { currencies, toIDR, fromIDR, formatIDR, formatAmount } = useCurrencyConfig();
  const theme = useTheme();

  // --- Monthly plan editor ---
  const [planMonth, setPlanMonth] = useState(currentPeriod());
  const [amounts, setAmounts] = useState({});
  const [itemCurrencies, setItemCurrencies] = useState({});
  const [planLoading, setPlanLoading] = useState(true);
  const [planError, setPlanError] = useState(null);
  const [planMessage, setPlanMessage] = useState(null);
  const [copyMessage, setCopyMessage] = useState(null);
  const [saving, setSaving] = useState(false);
  const [copying, setCopying] = useState(false);

  useEffect(() => {
    let active = true;

    supabase
      .from("budget_items")
      .select("category_id, amount, currency")
      .eq("month", periodKey(planMonth))
      .then(({ data, error }) => {
        if (!active) return;

        if (error) {
          setPlanError(error.message);
        } else {
          const nextAmounts = {};
          const nextCurrencies = {};
          for (const item of data) {
            nextAmounts[item.category_id] = String(Number(item.amount));
            nextCurrencies[item.category_id] = item.currency ?? "IDR";
          }
          setAmounts(nextAmounts);
          setItemCurrencies(nextCurrencies);
          setPlanError(null);
        }

        setPlanMessage(null);
        setCopyMessage(null);
        setPlanLoading(false);
      });

    return () => {
      active = false;
    };
  }, [planMonth]);

  const handleAmountChange = (categoryId, value) => {
    setAmounts((prev) => ({ ...prev, [categoryId]: value }));
  };

  const handleCurrencyChange = (categoryId, newCurrency) => {
    const oldCurrency = itemCurrencies[categoryId] ?? "IDR";
    const oldAmount = Number(amounts[categoryId] || 0);

    if (oldCurrency !== newCurrency && oldAmount > 0) {
      const idrAmount = toIDR(oldAmount, oldCurrency);
      const converted = fromIDR(idrAmount, newCurrency);
      const rounded =
        newCurrency === "IDR"
          ? Math.round(converted / 1000) * 1000
          : newCurrency === "JPY"
          ? Math.round(converted)
          : Math.round(converted * 100) / 100;
      setAmounts((prev) => ({ ...prev, [categoryId]: String(rounded) }));
    }

    setItemCurrencies((prev) => ({ ...prev, [categoryId]: newCurrency }));
  };

  const handleSavePlan = async () => {
    setSaving(true);
    setPlanError(null);
    setPlanMessage(null);

    const rows = categories.map((cat) => ({
      user_id: user.id,
      category_id: cat.id,
      month: periodKey(planMonth),
      amount: Number(amounts[cat.id] || 0),
      currency: itemCurrencies[cat.id] ?? "IDR",
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
      .select("category_id, amount, currency")
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

    const nextAmounts = {};
    const nextCurrencies = {};
    for (const item of data) {
      nextAmounts[item.category_id] = String(Number(item.amount));
      nextCurrencies[item.category_id] = item.currency ?? "IDR";
    }
    setAmounts((prev) => ({ ...prev, ...nextAmounts }));
    setItemCurrencies((prev) => ({ ...prev, ...nextCurrencies }));
    setCopyMessage(
      `Copied budget from ${formatPeriodShort(prevPeriod)}. Review and Save to keep it.`,
    );
  };

  // Totals in IDR (each category's native amount converted to IDR)
  const totalIncomeIDR = incomeCategories.reduce(
    (sum, cat) => sum + toIDR(Number(amounts[cat.id] || 0), itemCurrencies[cat.id] ?? "IDR"),
    0,
  );
  const totalExpenseIDR = expenseCategories.reduce(
    (sum, cat) => sum + toIDR(Number(amounts[cat.id] || 0), itemCurrencies[cat.id] ?? "IDR"),
    0,
  );
  const netPlannedIDR = totalIncomeIDR - totalExpenseIDR;

  // Per-currency subtotals for the plan editor totals section
  const incomeByCurrency = {};
  for (const cat of incomeCategories) {
    const cur = itemCurrencies[cat.id] ?? "IDR";
    const amt = Number(amounts[cat.id] || 0);
    if (amt > 0) incomeByCurrency[cur] = (incomeByCurrency[cur] ?? 0) + amt;
  }
  const expenseByCurrency = {};
  for (const cat of expenseCategories) {
    const cur = itemCurrencies[cat.id] ?? "IDR";
    const amt = Number(amounts[cat.id] || 0);
    if (amt > 0) expenseByCurrency[cur] = (expenseByCurrency[cur] ?? 0) + amt;
  }
  const planCurrencies = [
    ...new Set([...Object.keys(incomeByCurrency), ...Object.keys(expenseByCurrency)]),
  ];

  // --- Accumulated budget (date range) ---
  const [fromMonth, setFromMonth] = useState(currentPeriod());
  const [toMonth, setToMonth] = useState(currentPeriod());
  const [rangeRawItems, setRangeRawItems] = useState([]);
  const [rangeLoading, setRangeLoading] = useState(true);
  const [rangeError, setRangeError] = useState(null);

  useEffect(() => {
    let active = true;

    supabase
      .from("budget_items")
      .select("category_id, amount, currency")
      .gte("month", periodKey(fromMonth))
      .lte("month", periodKey(toMonth))
      .then(({ data, error }) => {
        if (!active) return;

        if (error) {
          setRangeError(error.message);
        } else {
          setRangeRawItems(data ?? []);
          setRangeError(null);
        }

        setRangeLoading(false);
      });

    return () => {
      active = false;
    };
  }, [fromMonth, toMonth]);

  // Aggregate per-category totals in IDR
  const rangeSumsMap = new Map();
  for (const item of rangeRawItems) {
    const idrAmount = toIDR(Number(item.amount), item.currency ?? "IDR");
    rangeSumsMap.set(item.category_id, (rangeSumsMap.get(item.category_id) ?? 0) + idrAmount);
  }
  const rangeRows = Array.from(rangeSumsMap.entries())
    .map(([categoryId, total]) => {
      const cat = categories.find((c) => c.id === categoryId);
      return cat ? { ...cat, total } : null;
    })
    .filter(Boolean)
    .sort((a, b) =>
      a.type === b.type ? a.name.localeCompare(b.name) : a.type.localeCompare(b.type),
    );

  const rangeIncomeTotal = rangeRows
    .filter((r) => r.type === "income")
    .reduce((s, r) => s + r.total, 0);
  const rangeExpenseTotal = rangeRows
    .filter((r) => r.type === "expense")
    .reduce((s, r) => s + r.total, 0);
  const rangeNetTotal = rangeIncomeTotal - rangeExpenseTotal;

  // Per-currency breakdown for the accumulated budget section
  const rangeIncomeByCurrency = {};
  const rangeExpenseByCurrency = {};
  for (const item of rangeRawItems) {
    const cur = item.currency ?? "IDR";
    const amt = Number(item.amount);
    if (amt <= 0) continue;
    const cat = categories.find((c) => c.id === item.category_id);
    if (!cat) continue;
    if (cat.type === "income") {
      rangeIncomeByCurrency[cur] = (rangeIncomeByCurrency[cur] ?? 0) + amt;
    } else {
      rangeExpenseByCurrency[cur] = (rangeExpenseByCurrency[cur] ?? 0) + amt;
    }
  }
  const rangeCurrencies = [
    ...new Set([
      ...Object.keys(rangeIncomeByCurrency),
      ...Object.keys(rangeExpenseByCurrency),
    ]),
  ];

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
      supabase
        .from("budget_items")
        .select("category_id, amount, currency")
        .eq("month", periodKey(historyPeriod)),
      supabase
        .from("transactions")
        .select("category_id, type, amount, currency, occurred_on")
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

  const historyResult = buildPlanVsActualRows(
    categories,
    historyBudgetItems,
    historyTransactions,
    toIDR,
  );

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
        .select("type, amount, currency, occurred_on")
        .gte("occurred_on", start)
        .lte("occurred_on", end),
      supabase
        .from("budget_items")
        .select("category_id, amount, currency, month")
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

  const categoryTypeById = new Map(categories.map((cat) => [cat.id, cat.type]));
  const today = todayString();

  const savingsRowsWithoutCumulative = savingsPeriods.map((period) => {
    const { start, end } = periodRange(period);
    const isRealized = end < today;

    let net;
    if (isRealized) {
      const periodTransactions = savingsTransactions.filter(
        (t) => t.occurred_on >= start && t.occurred_on <= end,
      );
      const income = periodTransactions
        .filter((t) => t.type === "income")
        .reduce((sum, t) => sum + toIDR(Number(t.amount), t.currency ?? "IDR"), 0);
      const expense = periodTransactions
        .filter((t) => t.type === "expense")
        .reduce((sum, t) => sum + toIDR(Number(t.amount), t.currency ?? "IDR"), 0);
      net = income - expense;
    } else {
      const periodItems = savingsBudgetItems.filter((item) => item.month === periodKey(period));
      const income = periodItems
        .filter((item) => categoryTypeById.get(item.category_id) === "income")
        .reduce((sum, item) => sum + toIDR(Number(item.amount), item.currency ?? "IDR"), 0);
      const expense = periodItems
        .filter((item) => categoryTypeById.get(item.category_id) === "expense")
        .reduce((sum, item) => sum + toIDR(Number(item.amount), item.currency ?? "IDR"), 0);
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

        {planLoading || categoriesLoading ? (
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
                  currency={itemCurrencies[category.id] ?? "IDR"}
                  currencies={currencies}
                  toIDR={toIDR}
                  formatIDR={formatIDR}
                  onAmountChange={(value) => handleAmountChange(category.id, value)}
                  onCurrencyChange={(newCurrency) =>
                    handleCurrencyChange(category.id, newCurrency)
                  }
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
                  currency={itemCurrencies[category.id] ?? "IDR"}
                  currencies={currencies}
                  toIDR={toIDR}
                  formatIDR={formatIDR}
                  onAmountChange={(value) => handleAmountChange(category.id, value)}
                  onCurrencyChange={(newCurrency) =>
                    handleCurrencyChange(category.id, newCurrency)
                  }
                />
              ))
            )}

            <Divider sx={{ my: 2 }} />

            {/* Per-currency subtotals + IDR grand total */}
            <Table size="small" sx={{ mb: 1.5 }}>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ py: 0.5, pl: 0, fontWeight: 600 }}>Currency</TableCell>
                  <TableCell align="right" sx={{ py: 0.5, color: "success.main", fontWeight: 600 }}>
                    Income
                  </TableCell>
                  <TableCell align="right" sx={{ py: 0.5, pr: 0, color: "error.main", fontWeight: 600 }}>
                    Expense
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {planCurrencies.map((cur) => (
                  <TableRow key={cur}>
                    <TableCell sx={{ py: 0.5, pl: 0 }}>{cur}</TableCell>
                    <TableCell align="right" sx={{ py: 0.5 }}>
                      {incomeByCurrency[cur] != null
                        ? formatAmount(incomeByCurrency[cur], cur)
                        : "—"}
                    </TableCell>
                    <TableCell align="right" sx={{ py: 0.5, pr: 0 }}>
                      {expenseByCurrency[cur] != null
                        ? formatAmount(expenseByCurrency[cur], cur)
                        : "—"}
                    </TableCell>
                  </TableRow>
                ))}
                {planCurrencies.length > 1 && (
                  <TableRow sx={{ "& td": { borderTop: 1, borderColor: "divider" } }}>
                    <TableCell sx={{ py: 0.5, pl: 0, fontWeight: 600, fontSize: "0.75rem", color: "text.secondary" }}>
                      Total (IDR equiv.)
                    </TableCell>
                    <TableCell align="right" sx={{ py: 0.5, fontWeight: 600 }}>
                      {format(totalIncomeIDR)}
                    </TableCell>
                    <TableCell align="right" sx={{ py: 0.5, pr: 0, fontWeight: 600 }}>
                      {format(totalExpenseIDR)}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>

            <Stack direction="row" justifyContent="space-between" sx={{ mb: 2 }}>
              <Typography variant="subtitle2">Net planned</Typography>
              <Typography
                variant="subtitle2"
                color={netPlannedIDR >= 0 ? "success.main" : "error.main"}
              >
                {format(netPlannedIDR)}
              </Typography>
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
                  <TableCell align="right">Total (IDR)</TableCell>
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

            {/* Per-currency breakdown for the range */}
            {rangeCurrencies.length > 0 && (
              <Table size="small" sx={{ mt: 2, mb: 1 }}>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ py: 0.5, pl: 0, fontWeight: 600 }}>Currency</TableCell>
                    <TableCell align="right" sx={{ py: 0.5, color: "success.main", fontWeight: 600 }}>
                      Income
                    </TableCell>
                    <TableCell align="right" sx={{ py: 0.5, pr: 0, color: "error.main", fontWeight: 600 }}>
                      Expense
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {rangeCurrencies.map((cur) => (
                    <TableRow key={cur}>
                      <TableCell sx={{ py: 0.5, pl: 0 }}>{cur}</TableCell>
                      <TableCell align="right" sx={{ py: 0.5 }}>
                        {rangeIncomeByCurrency[cur] != null
                          ? formatAmount(rangeIncomeByCurrency[cur], cur)
                          : "—"}
                      </TableCell>
                      <TableCell align="right" sx={{ py: 0.5, pr: 0 }}>
                        {rangeExpenseByCurrency[cur] != null
                          ? formatAmount(rangeExpenseByCurrency[cur], cur)
                          : "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                  {rangeCurrencies.length > 1 && (
                    <TableRow sx={{ "& td": { borderTop: 1, borderColor: "divider" } }}>
                      <TableCell sx={{ py: 0.5, pl: 0, fontWeight: 600, fontSize: "0.75rem", color: "text.secondary" }}>
                        Total (IDR equiv.)
                      </TableCell>
                      <TableCell align="right" sx={{ py: 0.5, fontWeight: 600 }}>
                        {format(rangeIncomeTotal)}
                      </TableCell>
                      <TableCell align="right" sx={{ py: 0.5, pr: 0, fontWeight: 600 }}>
                        {format(rangeExpenseTotal)}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}

            <Stack direction="row" justifyContent="space-between">
              <Typography variant="subtitle2">Net</Typography>
              <Typography
                variant="subtitle2"
                color={rangeNetTotal >= 0 ? "success.main" : "error.main"}
              >
                {format(rangeNetTotal)}
              </Typography>
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
          Mixes actual results for periods that have ended with your plan for the current and future
          periods.
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
                  valueFormatter: (value) =>
                    value == null ? "" : formatCurrency(value, currency),
                },
                {
                  dataKey: "projected",
                  label: "Projected (planned)",
                  color: theme.palette.grey[500],
                  valueFormatter: (value) =>
                    value == null ? "" : formatCurrency(value, currency),
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

      <Divider sx={{ mb: 4 }} />
      <TripBudgetSection />
    </Box>
  );
}
