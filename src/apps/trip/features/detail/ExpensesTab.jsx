import { useState, useMemo } from "react";
import {
  Accordion, AccordionDetails, AccordionSummary,
  Box, Button, Card, CardContent, Chip, Dialog, DialogActions,
  DialogContent, DialogTitle, Divider, IconButton, LinearProgress,
  MenuItem, Stack, TextField, ToggleButton, ToggleButtonGroup, Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import { useNavigate } from "react-router-dom";
import { EXPENSE_CATEGORIES, formatCurrency } from "../../utils/tripUtils";
import { today } from "../../../health/utils/dates";

function ExpenseDialog({ open, onClose, onSave, currency, initial }) {
  const [description, setDescription] = useState(initial?.description ?? "");
  const [category, setCategory]       = useState(initial?.category ?? "other");
  const [amount, setAmount]           = useState(initial?.amount ?? "");
  const [type, setType]               = useState(initial?.type ?? "actual");
  const [date, setDate]               = useState(initial?.date ?? today());
  const [notes, setNotes]             = useState(initial?.notes ?? "");

  function handleSave() {
    onSave({
      description: description.trim(),
      category,
      amount: amount !== "" ? Number(amount) : 0,
      type,
      date,
      notes: notes.trim(),
    });
    onClose();
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>{initial ? "Edit Expense" : "Add Expense"}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <ToggleButtonGroup value={type} exclusive onChange={(_, v) => v && setType(v)} size="small" fullWidth>
            <ToggleButton value="planned">Planned</ToggleButton>
            <ToggleButton value="actual">Actual</ToggleButton>
          </ToggleButtonGroup>

          <TextField label="Description" value={description} onChange={(e) => setDescription(e.target.value)} required fullWidth />
          <TextField select label="Category" value={category} onChange={(e) => setCategory(e.target.value)} fullWidth>
            {EXPENSE_CATEGORIES.map((c) => (
              <MenuItem key={c.id} value={c.id}>{c.icon} {c.label}</MenuItem>
            ))}
          </TextField>
          <TextField
            label={`Amount (${currency})`}
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            inputProps={{ min: 0 }}
            required
            fullWidth
          />
          <TextField label="Date" type="date" value={date} onChange={(e) => setDate(e.target.value)} InputLabelProps={{ shrink: true }} fullWidth />
          <TextField label="Notes" value={notes} onChange={(e) => setNotes(e.target.value)} multiline rows={2} fullWidth />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={handleSave} disabled={!description.trim() || amount === ""}>Save</Button>
      </DialogActions>
    </Dialog>
  );
}

export default function ExpensesTab({ trip, onChange, onEdit }) {
  const navigate = useNavigate();
  const [filter, setFilter] = useState("all"); // all | planned | actual
  const [dialogState, setDialogState] = useState(null); // null | { expense? }

  const expenses = trip.expenses ?? [];

  const planned = useMemo(() => expenses.filter((e) => e.type === "planned").reduce((s, e) => s + (e.amount ?? 0), 0), [expenses]);
  const actual  = useMemo(() => expenses.filter((e) => e.type === "actual").reduce((s, e) => s + (e.amount ?? 0), 0), [expenses]);
  const budget  = trip.plannedBudget ?? planned;
  const diff    = budget - actual;
  const pct     = budget > 0 ? Math.min((actual / budget) * 100, 100) : 0;

  const byCategory = useMemo(() => {
    const map = {};
    expenses.filter((e) => e.type === "actual").forEach((e) => {
      map[e.category] = (map[e.category] ?? 0) + (e.amount ?? 0);
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [expenses]);

  const visible = filter === "all" ? expenses : expenses.filter((e) => e.type === filter);
  const sorted  = [...visible].sort((a, b) => (b.date ?? "").localeCompare(a.date ?? ""));

  function addExpense(data) {
    onChange({ expenses: [...expenses, { id: crypto.randomUUID(), ...data }] });
  }

  function deleteExpense(id) {
    onChange({ expenses: expenses.filter((e) => e.id !== id) });
  }

  function getCat(id) { return EXPENSE_CATEGORIES.find((c) => c.id === id) ?? EXPENSE_CATEGORIES.at(-1); }

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      {/* Budget help */}
      <Accordion
        disableGutters
        elevation={0}
        sx={{
          mb: 2,
          border: "1px solid",
          borderColor: "info.main",
          borderRadius: "8px !important",
          "&:before": { display: "none" },
        }}
      >
        <AccordionSummary
          expandIcon={<ExpandMoreIcon />}
          sx={{ minHeight: 40, "& .MuiAccordionSummary-content": { my: 1 } }}
        >
          <Stack direction="row" spacing={1} alignItems="center">
            <InfoOutlinedIcon fontSize="small" color="info" />
            <Typography variant="body2" fontWeight={600} color="info.main">How to manage budget</Typography>
          </Stack>
        </AccordionSummary>
        <AccordionDetails sx={{ pt: 0 }}>
          <Stack spacing={1.5}>
            <Box>
              <Typography variant="body2" fontWeight={600}>1. Set overall budget</Typography>
              <Typography variant="caption" color="text.secondary" display="block">
                Tap the ✏️ pencil icon at the top of the page to edit the trip and set your total planned budget cap.
              </Typography>
              {onEdit && (
                <Button size="small" sx={{ mt: 0.5, px: 0 }} onClick={onEdit}>
                  Edit trip settings →
                </Button>
              )}
            </Box>
            <Box>
              <Typography variant="body2" fontWeight={600}>2. Add planned expenses</Typography>
              <Typography variant="caption" color="text.secondary" display="block">
                Use "Add" below and choose <strong>Planned</strong> to allocate your budget by category before the trip.
              </Typography>
            </Box>
            <Box>
              <Typography variant="body2" fontWeight={600}>3. Log actual expenses</Typography>
              <Typography variant="caption" color="text.secondary" display="block">
                Choose <strong>Actual</strong> as you spend to compare against your plan in real time.
              </Typography>
            </Box>
          </Stack>
        </AccordionDetails>
      </Accordion>

      {/* Summary */}
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Typography variant="subtitle2" gutterBottom>Budget vs Actual</Typography>
          <Stack direction="row" spacing={2} mb={1.5}>
            <Box sx={{ flex: 1 }}>
              <Typography variant="caption" color="text.secondary">Budget</Typography>
              <Typography variant="h6" fontWeight={700}>{formatCurrency(budget, trip.currency)}</Typography>
            </Box>
            <Box sx={{ flex: 1 }}>
              <Typography variant="caption" color="text.secondary">Spent</Typography>
              <Typography variant="h6" fontWeight={700} color={actual > budget && budget > 0 ? "error.main" : "text.primary"}>
                {formatCurrency(actual, trip.currency)}
              </Typography>
            </Box>
            <Box sx={{ flex: 1 }}>
              <Typography variant="caption" color="text.secondary">{diff >= 0 ? "Remaining" : "Over"}</Typography>
              <Typography variant="h6" fontWeight={700} color={diff >= 0 ? "success.main" : "error.main"}>
                {formatCurrency(Math.abs(diff), trip.currency)}
              </Typography>
            </Box>
          </Stack>
          {budget > 0 && (
            <LinearProgress variant="determinate" value={pct} color={pct > 100 ? "error" : pct > 80 ? "warning" : "primary"} sx={{ borderRadius: 1, height: 6 }} />
          )}
        </CardContent>
      </Card>

      {/* Category breakdown */}
      {byCategory.length > 0 && (
        <Card sx={{ mb: 2 }}>
          <CardContent>
            <Typography variant="subtitle2" gutterBottom>By Category (actual)</Typography>
            <Stack spacing={1}>
              {byCategory.map(([catId, total]) => {
                const cat = getCat(catId);
                const pctOfActual = actual > 0 ? (total / actual) * 100 : 0;
                return (
                  <Box key={catId}>
                    <Stack direction="row" justifyContent="space-between" mb={0.25}>
                      <Typography variant="caption">{cat.icon} {cat.label}</Typography>
                      <Typography variant="caption">{formatCurrency(total, trip.currency)} · {Math.round(pctOfActual)}%</Typography>
                    </Stack>
                    <LinearProgress variant="determinate" value={pctOfActual} sx={{ borderRadius: 1, height: 4 }} />
                  </Box>
                );
              })}
            </Stack>
          </CardContent>
        </Card>
      )}

      {/* Finance link */}
      {trip.financeCategory && (
        <Card sx={{ mb: 2 }}>
          <CardContent>
            <Stack direction="row" alignItems="center" justifyContent="space-between">
              <Box>
                <Typography variant="subtitle2">Finance Link</Typography>
                <Typography variant="caption" color="text.secondary">Category: {trip.financeCategory}</Typography>
              </Box>
              <Button size="small" endIcon={<OpenInNewIcon fontSize="small" />} onClick={() => navigate("/finance/transactions")}>
                View
              </Button>
            </Stack>
          </CardContent>
        </Card>
      )}

      {/* List */}
      <Stack direction="row" alignItems="center" justifyContent="space-between" mb={1.5}>
        <ToggleButtonGroup value={filter} exclusive onChange={(_, v) => v && setFilter(v)} size="small">
          <ToggleButton value="all">All</ToggleButton>
          <ToggleButton value="planned">Planned</ToggleButton>
          <ToggleButton value="actual">Actual</ToggleButton>
        </ToggleButtonGroup>
        <Button size="small" startIcon={<AddIcon />} onClick={() => setDialogState({})}>Add</Button>
      </Stack>

      {sorted.length === 0 ? (
        <Card>
          <CardContent sx={{ textAlign: "center", py: 3 }}>
            <Typography color="text.secondary">No expenses yet.</Typography>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <Stack divider={<Divider />}>
            {sorted.map((exp) => {
              const cat = getCat(exp.category);
              return (
                <Stack key={exp.id} direction="row" alignItems="center" justifyContent="space-between" sx={{ px: 2, py: 1.25 }} gap={1}>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Typography fontSize={16}>{cat.icon}</Typography>
                      <Typography variant="body2" fontWeight={600} noWrap>{exp.description}</Typography>
                      <Chip
                        label={exp.type}
                        size="small"
                        color={exp.type === "actual" ? "primary" : "default"}
                        variant="outlined"
                      />
                    </Stack>
                    <Typography variant="caption" color="text.secondary">
                      {exp.date}{exp.notes ? ` · ${exp.notes}` : ""}
                    </Typography>
                  </Box>
                  <Stack direction="row" alignItems="center" spacing={0.5} sx={{ flexShrink: 0 }}>
                    <Typography variant="body2" fontWeight={700}>{formatCurrency(exp.amount, trip.currency)}</Typography>
                    <IconButton size="small" onClick={() => deleteExpense(exp.id)}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Stack>
                </Stack>
              );
            })}
          </Stack>
        </Card>
      )}

      {dialogState !== null && (
        <ExpenseDialog
          open
          onClose={() => setDialogState(null)}
          currency={trip.currency}
          onSave={(data) => { addExpense(data); setDialogState(null); }}
        />
      )}
    </Box>
  );
}
