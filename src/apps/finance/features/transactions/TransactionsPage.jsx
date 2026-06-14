import { useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  IconButton,
  List,
  ListItem,
  ListItemText,
  MenuItem,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import PageHeader from "../../../../components/common/PageHeader";
import { supabase } from "../../../../lib/supabase";
import { useAuth } from "../../../../hooks/useAuth";
import { useCategories } from "../../hooks/useCategories";
import { useCurrency } from "../../hooks/useCurrency";
import { convertToIDR, currentPeriod, formatPeriodRange, periodRange } from "../../lib/format";

function todayString() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

export default function TransactionsPage() {
  const { user } = useAuth();
  const { incomeCategories, expenseCategories, loading: categoriesLoading } = useCategories();
  const { currency, rate, format, loading: currencyLoading } = useCurrency();

  // --- Entry form ---
  const [type, setType] = useState("expense");
  const [categoryId, setCategoryId] = useState("");
  const [amount, setAmount] = useState("");
  const [occurredOn, setOccurredOn] = useState(todayString());
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);

  const categoryOptions = type === "income" ? incomeCategories : expenseCategories;

  const handleTypeChange = (_event, value) => {
    if (!value) return;
    setType(value);
    setCategoryId("");
  };

  // --- Transaction list ---
  const [transactions, setTransactions] = useState([]);
  const [listMonth, setListMonth] = useState(currentPeriod());
  const [listLoading, setListLoading] = useState(true);
  const [listError, setListError] = useState(null);

  const loadTransactions = async (period) => {
    const { start, end } = periodRange(period);
    const { data, error } = await supabase
      .from("transactions")
      .select("id, type, amount, occurred_on, note, categories(name)")
      .gte("occurred_on", start)
      .lte("occurred_on", end)
      .order("occurred_on", { ascending: false })
      .order("created_at", { ascending: false });

    if (error) setListError(error.message);
    else {
      setTransactions(data ?? []);
      setListError(null);
    }
  };

  useEffect(() => {
    let active = true;
    const { start, end } = periodRange(listMonth);

    supabase
      .from("transactions")
      .select("id, type, amount, occurred_on, note, categories(name)")
      .gte("occurred_on", start)
      .lte("occurred_on", end)
      .order("occurred_on", { ascending: false })
      .order("created_at", { ascending: false })
      .then(({ data, error }) => {
        if (!active) return;

        if (error) {
          setListError(error.message);
        } else {
          setTransactions(data ?? []);
          setListError(null);
        }

        setListLoading(false);
      });

    return () => {
      active = false;
    };
  }, [listMonth]);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!categoryId || !amount) {
      setFormError("Please choose a category and enter an amount.");
      return;
    }

    setSubmitting(true);
    setFormError(null);

    const { error } = await supabase.from("transactions").insert({
      user_id: user.id,
      category_id: categoryId,
      type,
      amount: convertToIDR(Number(amount), currency, rate),
      occurred_on: occurredOn,
      note: note.trim() || null,
    });

    setSubmitting(false);

    if (error) {
      setFormError(error.message);
      return;
    }

    setAmount("");
    setNote("");
    await loadTransactions(listMonth);
  };

  const handleDelete = async (id) => {
    setListError(null);

    const { error } = await supabase.from("transactions").delete().eq("id", id);

    if (error) {
      setListError(error.message);
      return;
    }

    await loadTransactions(listMonth);
  };

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      <PageHeader title="Transactions" subtitle="Record your income and expenses." />

      <Box component="form" onSubmit={handleSubmit} sx={{ mb: 4 }}>
        {formError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {formError}
          </Alert>
        )}

        <Stack spacing={2}>
          <ToggleButtonGroup value={type} exclusive onChange={handleTypeChange} size="small">
            <ToggleButton value="expense">Expense</ToggleButton>
            <ToggleButton value="income">Income</ToggleButton>
          </ToggleButtonGroup>

          {!categoriesLoading && categoryOptions.length === 0 ? (
            <Alert severity="info">
              No {type} categories yet. Add one from the Budget page first.
            </Alert>
          ) : (
            <TextField
              select
              label="Category"
              value={categoryId}
              onChange={(event) => setCategoryId(event.target.value)}
              size="small"
              fullWidth
              required
            >
              {categoryOptions.map((category) => (
                <MenuItem key={category.id} value={category.id}>
                  {category.name}
                </MenuItem>
              ))}
            </TextField>
          )}

          <TextField
            type="number"
            label={`Amount (${currency})`}
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            size="small"
            fullWidth
            required
            slotProps={{ input: { inputProps: { min: 0, step: currency === "IDR" ? "1000" : "0.01" } } }}
          />

          <TextField
            type="date"
            label="Date"
            value={occurredOn}
            onChange={(event) => setOccurredOn(event.target.value)}
            size="small"
            fullWidth
            slotProps={{ inputLabel: { shrink: true } }}
          />

          <TextField
            label="Note (optional)"
            value={note}
            onChange={(event) => setNote(event.target.value)}
            size="small"
            fullWidth
          />

          <Button type="submit" variant="contained" disabled={submitting || currencyLoading}>
            {submitting ? <CircularProgress size={24} /> : "Add transaction"}
          </Button>
        </Stack>
      </Box>

      <Divider sx={{ mb: 3 }} />

      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 0.5 }}>
        <Typography variant="h6">History</Typography>
        <TextField
          type="month"
          label="Month"
          value={listMonth}
          onChange={(event) => setListMonth(event.target.value)}
          size="small"
          slotProps={{ inputLabel: { shrink: true } }}
        />
      </Stack>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        {formatPeriodRange(listMonth)}
      </Typography>

      {listError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {listError}
        </Alert>
      )}

      {listLoading || currencyLoading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
          <CircularProgress />
        </Box>
      ) : transactions.length === 0 ? (
        <Typography variant="body2" color="text.secondary">
          No transactions for this period yet.
        </Typography>
      ) : (
        <List disablePadding>
          {transactions.map((transaction) => (
            <ListItem
              key={transaction.id}
              divider
              secondaryAction={
                <IconButton
                  edge="end"
                  aria-label="delete"
                  onClick={() => handleDelete(transaction.id)}
                >
                  <DeleteIcon />
                </IconButton>
              }
            >
              <ListItemText
                primary={
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Typography variant="body2">
                      {transaction.categories?.name ?? "—"}
                    </Typography>
                    <Chip
                      label={transaction.type}
                      size="small"
                      color={transaction.type === "income" ? "success" : "error"}
                      sx={{ textTransform: "capitalize" }}
                    />
                  </Stack>
                }
                secondary={
                  transaction.note
                    ? `${transaction.occurred_on} · ${transaction.note}`
                    : transaction.occurred_on
                }
              />
              <Typography
                variant="body2"
                sx={{
                  mr: 6,
                  fontWeight: 600,
                  color: transaction.type === "income" ? "success.main" : "error.main",
                }}
              >
                {transaction.type === "income" ? "+" : "-"}
                {format(transaction.amount)}
              </Typography>
            </ListItem>
          ))}
        </List>
      )}
    </Box>
  );
}
