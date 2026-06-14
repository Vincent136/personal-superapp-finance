import { useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import { useNavigate, useParams } from "react-router-dom";
import PageHeader from "../../../../components/common/PageHeader";
import { supabase } from "../../../../lib/supabase";
import { useAuth } from "../../../../hooks/useAuth";
import { formatCurrency } from "../../lib/currency";
import { computeProfitPercent, computeSheetTotals } from "../../lib/instruments";

const NUMERIC_FIELDS = ["amount_invested", "target_in", "target_out", "actual_in", "actual_out"];

function normalizeRow(row) {
  return {
    id: row.id,
    code: row.code ?? "",
    amount_invested: String(row.amount_invested ?? 0),
    target_in: row.target_in == null ? "" : String(row.target_in),
    target_out: row.target_out == null ? "" : String(row.target_out),
    actual_in: row.actual_in == null ? "" : String(row.actual_in),
    actual_out: row.actual_out == null ? "" : String(row.actual_out),
  };
}

export default function PlanSheetDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [sheet, setSheet] = useState(null);
  const [instruments, setInstruments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;

    Promise.all([
      supabase.from("investment_plan_sheets").select("id, name, currency").eq("id", id).single(),
      supabase
        .from("investment_instruments")
        .select("*")
        .eq("plan_sheet_id", id)
        .order("created_at", { ascending: true }),
    ]).then(([sheetRes, instrumentsRes]) => {
      if (!active) return;

      if (sheetRes.error) {
        setError(sheetRes.error.message);
      } else if (instrumentsRes.error) {
        setError(instrumentsRes.error.message);
      } else {
        setSheet(sheetRes.data);
        setInstruments((instrumentsRes.data ?? []).map(normalizeRow));
        setError(null);
      }

      setLoading(false);
    });

    return () => {
      active = false;
    };
  }, [id]);

  const handleFieldChange = (rowId, field, value) => {
    setInstruments((prev) =>
      prev.map((row) => (row.id === rowId ? { ...row, [field]: value } : row)),
    );
  };

  const handleFieldBlur = async (rowId, field) => {
    const row = instruments.find((item) => item.id === rowId);
    if (!row) return;

    const value = NUMERIC_FIELDS.includes(field)
      ? row[field] === ""
        ? null
        : Number(row[field])
      : row[field];

    const { error: updateError } = await supabase
      .from("investment_instruments")
      .update({ [field]: value, updated_at: new Date().toISOString() })
      .eq("id", rowId);

    if (updateError) setError(updateError.message);
  };

  const handleAddInstrument = async () => {
    setError(null);

    const { data, error: insertError } = await supabase
      .from("investment_instruments")
      .insert({ user_id: user.id, plan_sheet_id: id, code: "", amount_invested: 0 })
      .select()
      .single();

    if (insertError) {
      setError(insertError.message);
      return;
    }

    setInstruments((prev) => [...prev, normalizeRow(data)]);
  };

  const handleDeleteInstrument = async (rowId) => {
    setError(null);

    const { error: deleteError } = await supabase
      .from("investment_instruments")
      .delete()
      .eq("id", rowId);

    if (deleteError) {
      setError(deleteError.message);
      return;
    }

    setInstruments((prev) => prev.filter((row) => row.id !== rowId));
  };

  if (loading) {
    return (
      <Box sx={{ p: { xs: 2, md: 3 }, display: "flex", justifyContent: "center", py: 6 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!sheet) {
    return (
      <Box sx={{ p: { xs: 2, md: 3 } }}>
        <Alert severity="error">{error ?? "Plan sheet not found."}</Alert>
      </Box>
    );
  }

  const currency = sheet.currency;
  const { totalCapital, totalProfit, finalResult } = computeSheetTotals(instruments);

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      <PageHeader
        title={sheet.name}
        subtitle={`Currency: ${currency}`}
        action={<Button onClick={() => navigate("/investment")}>Back</Button>}
      />

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <TableContainer component={Box} sx={{ overflowX: "auto", mb: 2 }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Code</TableCell>
              <TableCell>Amount invested</TableCell>
              <TableCell>Target in</TableCell>
              <TableCell>Target out</TableCell>
              <TableCell>Actual in</TableCell>
              <TableCell>Actual out</TableCell>
              <TableCell>Profit %</TableCell>
              <TableCell>Result</TableCell>
              <TableCell />
            </TableRow>
          </TableHead>
          <TableBody>
            {instruments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9}>
                  <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
                    No instruments yet — add one below.
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              instruments.map((row) => {
                const profitPercent = computeProfitPercent(row);
                const amount = Number(row.amount_invested) || 0;
                const profit = profitPercent != null ? amount * (profitPercent / 100) : null;
                const result = profit != null ? amount + profit : null;

                return (
                  <TableRow key={row.id}>
                    <TableCell sx={{ minWidth: 100 }}>
                      <TextField
                        value={row.code}
                        onChange={(event) => handleFieldChange(row.id, "code", event.target.value)}
                        onBlur={() => handleFieldBlur(row.id, "code")}
                        size="small"
                        variant="standard"
                        fullWidth
                      />
                    </TableCell>
                    {NUMERIC_FIELDS.map((field) => (
                      <TableCell key={field} sx={{ minWidth: 100 }}>
                        <TextField
                          type="number"
                          value={row[field]}
                          onChange={(event) => handleFieldChange(row.id, field, event.target.value)}
                          onBlur={() => handleFieldBlur(row.id, field)}
                          size="small"
                          variant="standard"
                          fullWidth
                          slotProps={{ input: { inputProps: { step: "0.0001" } } }}
                        />
                      </TableCell>
                    ))}
                    <TableCell sx={{ minWidth: 90 }}>
                      {profitPercent == null ? "—" : `${profitPercent.toFixed(2)}%`}
                    </TableCell>
                    <TableCell sx={{ minWidth: 120 }}>
                      {result == null ? "—" : formatCurrency(result, currency)}
                    </TableCell>
                    <TableCell>
                      <IconButton
                        aria-label="delete instrument"
                        size="small"
                        onClick={() => handleDeleteInstrument(row.id)}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Button startIcon={<AddIcon />} onClick={handleAddInstrument} sx={{ mb: 3 }}>
        Add instrument
      </Button>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", sm: "repeat(3, 1fr)" },
          gap: 2,
        }}
      >
        <Card>
          <CardContent>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Total capital
            </Typography>
            <Typography variant="h5" fontWeight={700}>
              {formatCurrency(totalCapital, currency)}
            </Typography>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Total profit
            </Typography>
            <Typography
              variant="h5"
              fontWeight={700}
              color={totalProfit >= 0 ? "success.main" : "error.main"}
            >
              {formatCurrency(totalProfit, currency)}
            </Typography>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Final result
            </Typography>
            <Typography variant="h5" fontWeight={700}>
              {formatCurrency(finalResult, currency)}
            </Typography>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
}
