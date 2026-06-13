import { useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
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
import { Link as RouterLink } from "react-router-dom";
import PageHeader from "../../components/common/PageHeader";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../hooks/useAuth";
import { useCategories } from "../../hooks/useCategories";
import { useCurrency } from "../../hooks/useCurrency";
import {
  convertFromIDR,
  convertToIDR,
  currentMonthString,
  formatCurrency,
  monthToDate,
} from "../../lib/format";

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
  const step = currency === "IDR" ? "1000" : "0.01";

  // --- Monthly plan editor ---
  const [planMonth, setPlanMonth] = useState(currentMonthString());
  const [amounts, setAmounts] = useState({});
  const [planLoading, setPlanLoading] = useState(true);
  const [planError, setPlanError] = useState(null);
  const [planMessage, setPlanMessage] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (currencyLoading) return;
    let active = true;

    supabase
      .from("budget_items")
      .select("category_id, amount")
      .eq("month", monthToDate(planMonth))
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
      month: monthToDate(planMonth),
      amount: convertToIDR(Number(amounts[category.id] || 0), currency, rate),
    }));

    const { error } = await supabase
      .from("budget_items")
      .upsert(rows, { onConflict: "user_id,category_id,month" });

    setSaving(false);

    if (error) setPlanError(error.message);
    else setPlanMessage("Budget saved.");
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
  const [fromMonth, setFromMonth] = useState(currentMonthString());
  const [toMonth, setToMonth] = useState(currentMonthString());
  const [rangeTotals, setRangeTotals] = useState([]);
  const [rangeLoading, setRangeLoading] = useState(true);
  const [rangeError, setRangeError] = useState(null);

  useEffect(() => {
    let active = true;

    supabase
      .from("budget_items")
      .select("category_id, amount")
      .gte("month", monthToDate(fromMonth))
      .lte("month", monthToDate(toMonth))
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

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      <PageHeader
        title="Budget"
        subtitle="Plan your monthly budget and review totals over time."
        action={
          <Button component={RouterLink} to="/categories" size="small">
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
          sx={{ mb: 2 }}
        />

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

            <Button variant="contained" onClick={handleSavePlan} disabled={saving}>
              {saving ? <CircularProgress size={24} /> : "Save"}
            </Button>
          </>
        )}
      </Box>

      <Divider sx={{ mb: 4 }} />

      <Box>
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
            </Stack>
          </>
        )}
      </Box>
    </Box>
  );
}
