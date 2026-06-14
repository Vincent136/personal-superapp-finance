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
  MenuItem,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import { useNavigate } from "react-router-dom";
import PageHeader from "../../../../components/common/PageHeader";
import { supabase } from "../../../../lib/supabase";
import { useAuth } from "../../../../hooks/useAuth";
import { useExchangeRates } from "../../hooks/useExchangeRates";
import { INVESTMENT_CURRENCIES, convertAmount, formatCurrency } from "../../lib/currency";
import { computeSheetTotals } from "../../lib/instruments";

// Fetches all plan sheets with their instrument rows grouped by plan_sheet_id.
async function fetchSheetsWithInstruments() {
  const [sheetsRes, instrumentsRes] = await Promise.all([
    supabase
      .from("investment_plan_sheets")
      .select("id, name, currency, created_at")
      .order("created_at", { ascending: true }),
    supabase.from("investment_instruments").select("plan_sheet_id, amount_invested, actual_in, actual_out"),
  ]);

  if (sheetsRes.error) return { error: sheetsRes.error };
  if (instrumentsRes.error) return { error: instrumentsRes.error };

  const instrumentsBySheet = new Map();
  for (const instrument of instrumentsRes.data ?? []) {
    const list = instrumentsBySheet.get(instrument.plan_sheet_id) ?? [];
    list.push(instrument);
    instrumentsBySheet.set(instrument.plan_sheet_id, list);
  }

  const sheets = (sheetsRes.data ?? []).map((sheet) => ({
    ...sheet,
    instruments: instrumentsBySheet.get(sheet.id) ?? [],
  }));

  return { sheets };
}

export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { sgdToIdr, usdToIdr, loading: ratesLoading } = useExchangeRates();

  // --- Wallets ---
  const [walletAmounts, setWalletAmounts] = useState({ IDR: "0", SGD: "0", USD: "0" });
  const [walletsLoading, setWalletsLoading] = useState(true);
  const [walletsError, setWalletsError] = useState(null);
  const [walletsMessage, setWalletsMessage] = useState(null);
  const [savingWallets, setSavingWallets] = useState(false);
  const [displayCurrency, setDisplayCurrency] = useState("IDR");

  useEffect(() => {
    let active = true;

    supabase
      .from("investment_wallets")
      .select("currency, balance")
      .then(({ data, error }) => {
        if (!active) return;

        if (error) {
          setWalletsError(error.message);
        } else {
          const byCurrency = new Map((data ?? []).map((row) => [row.currency, row.balance]));
          setWalletAmounts({
            IDR: String(byCurrency.get("IDR") ?? 0),
            SGD: String(byCurrency.get("SGD") ?? 0),
            USD: String(byCurrency.get("USD") ?? 0),
          });
        }

        setWalletsLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const handleSaveWallets = async (event) => {
    event.preventDefault();
    setSavingWallets(true);
    setWalletsError(null);
    setWalletsMessage(null);

    const rows = INVESTMENT_CURRENCIES.map((option) => ({
      user_id: user.id,
      currency: option.code,
      balance: Number(walletAmounts[option.code]) || 0,
      updated_at: new Date().toISOString(),
    }));

    const { error } = await supabase
      .from("investment_wallets")
      .upsert(rows, { onConflict: "user_id,currency" });

    setSavingWallets(false);

    if (error) {
      setWalletsError(error.message);
      return;
    }

    setWalletsMessage("Wallet balances saved.");
  };

  const rates = { sgdToIdr, usdToIdr };
  const totalCapital = INVESTMENT_CURRENCIES.reduce(
    (sum, option) =>
      sum + convertAmount(Number(walletAmounts[option.code]) || 0, option.code, displayCurrency, rates),
    0,
  );

  // --- Plan sheets ---
  const [sheets, setSheets] = useState([]);
  const [sheetsLoading, setSheetsLoading] = useState(true);
  const [sheetsError, setSheetsError] = useState(null);

  const [newSheetName, setNewSheetName] = useState("");
  const [newSheetCurrency, setNewSheetCurrency] = useState("IDR");
  const [creatingSheet, setCreatingSheet] = useState(false);
  const [createError, setCreateError] = useState(null);

  useEffect(() => {
    let active = true;

    fetchSheetsWithInstruments().then(({ sheets, error }) => {
      if (!active) return;

      if (error) {
        setSheetsError(error.message);
      } else {
        setSheets(sheets);
        setSheetsError(null);
      }

      setSheetsLoading(false);
    });

    return () => {
      active = false;
    };
  }, []);

  const handleCreateSheet = async (event) => {
    event.preventDefault();
    if (!newSheetName.trim()) return;

    setCreatingSheet(true);
    setCreateError(null);

    const { data, error } = await supabase
      .from("investment_plan_sheets")
      .insert({ user_id: user.id, name: newSheetName.trim(), currency: newSheetCurrency })
      .select()
      .single();

    setCreatingSheet(false);

    if (error) {
      setCreateError(error.message);
      return;
    }

    navigate(`/investment/sheets/${data.id}`);
  };

  const handleDeleteSheet = async (id) => {
    setSheetsError(null);

    const { error } = await supabase.from("investment_plan_sheets").delete().eq("id", id);

    if (error) {
      setSheetsError(error.message);
      return;
    }

    const { sheets: reloaded, error: reloadError } = await fetchSheetsWithInstruments();

    if (reloadError) {
      setSheetsError(reloadError.message);
      return;
    }

    setSheets(reloaded);
  };

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      <PageHeader title="Dashboard" subtitle="Multi-currency capital and investment plan sheets." />

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Wallets
          </Typography>

          {walletsError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {walletsError}
            </Alert>
          )}
          {walletsMessage && (
            <Alert severity="success" sx={{ mb: 2 }}>
              {walletsMessage}
            </Alert>
          )}

          {walletsLoading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 2 }}>
              <CircularProgress />
            </Box>
          ) : (
            <Box component="form" onSubmit={handleSaveWallets}>
              <Stack direction="row" spacing={2} flexWrap="wrap" sx={{ mb: 2 }}>
                {INVESTMENT_CURRENCIES.map((option) => (
                  <TextField
                    key={option.code}
                    type="number"
                    label={`${option.code} balance`}
                    value={walletAmounts[option.code]}
                    onChange={(event) =>
                      setWalletAmounts((prev) => ({ ...prev, [option.code]: event.target.value }))
                    }
                    size="small"
                    slotProps={{
                      input: { inputProps: { min: 0, step: option.code === "IDR" ? "1000" : "0.01" } },
                    }}
                  />
                ))}
              </Stack>
              <Button type="submit" variant="contained" disabled={savingWallets}>
                {savingWallets ? <CircularProgress size={24} /> : "Save"}
              </Button>
            </Box>
          )}

          <Divider sx={{ my: 2 }} />

          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            flexWrap="wrap"
            gap={1}
          >
            <Box>
              <Typography variant="body2" color="text.secondary">
                Total capital
              </Typography>
              <Typography variant="h5" fontWeight={700}>
                {ratesLoading ? (
                  <CircularProgress size={20} />
                ) : (
                  formatCurrency(totalCapital, displayCurrency)
                )}
              </Typography>
            </Box>
            <ToggleButtonGroup
              value={displayCurrency}
              exclusive
              size="small"
              onChange={(_event, value) => value && setDisplayCurrency(value)}
            >
              {INVESTMENT_CURRENCIES.map((option) => (
                <ToggleButton key={option.code} value={option.code}>
                  {option.code}
                </ToggleButton>
              ))}
            </ToggleButtonGroup>
          </Stack>
        </CardContent>
      </Card>

      <Typography variant="h6" gutterBottom>
        Plan sheets
      </Typography>

      {sheetsError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {sheetsError}
        </Alert>
      )}

      {sheetsLoading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
          <CircularProgress />
        </Box>
      ) : sheets.length === 0 ? (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          No plan sheets yet — create one below.
        </Typography>
      ) : (
        <Stack spacing={2} sx={{ mb: 3 }}>
          {sheets.map((sheet) => {
            const { totalCapital: sheetCapital, totalProfit, finalResult } = computeSheetTotals(
              sheet.instruments,
            );

            return (
              <Card key={sheet.id}>
                <CardContent>
                  <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                    <Box
                      sx={{ cursor: "pointer", flex: 1 }}
                      onClick={() => navigate(`/investment/sheets/${sheet.id}`)}
                    >
                      <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                        <Typography variant="subtitle1" fontWeight={600}>
                          {sheet.name}
                        </Typography>
                        <Chip label={sheet.currency} size="small" />
                      </Stack>
                      <Stack direction="row" spacing={3} flexWrap="wrap">
                        <Box>
                          <Typography variant="caption" color="text.secondary">
                            Total capital
                          </Typography>
                          <Typography variant="body1" fontWeight={600}>
                            {formatCurrency(sheetCapital, sheet.currency)}
                          </Typography>
                        </Box>
                        <Box>
                          <Typography variant="caption" color="text.secondary">
                            Total profit
                          </Typography>
                          <Typography
                            variant="body1"
                            fontWeight={600}
                            color={totalProfit >= 0 ? "success.main" : "error.main"}
                          >
                            {formatCurrency(totalProfit, sheet.currency)}
                          </Typography>
                        </Box>
                        <Box>
                          <Typography variant="caption" color="text.secondary">
                            Final result
                          </Typography>
                          <Typography variant="body1" fontWeight={600}>
                            {formatCurrency(finalResult, sheet.currency)}
                          </Typography>
                        </Box>
                      </Stack>
                    </Box>
                    <IconButton
                      aria-label="delete plan sheet"
                      onClick={() => handleDeleteSheet(sheet.id)}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Stack>
                </CardContent>
              </Card>
            );
          })}
        </Stack>
      )}

      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            New plan sheet
          </Typography>

          {createError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {createError}
            </Alert>
          )}

          <Box
            component="form"
            onSubmit={handleCreateSheet}
            sx={{ display: "flex", gap: 2, flexWrap: "wrap", alignItems: "center" }}
          >
            <TextField
              label="Name"
              value={newSheetName}
              onChange={(event) => setNewSheetName(event.target.value)}
              size="small"
              required
              sx={{ flex: 1, minWidth: 200 }}
            />
            <TextField
              select
              label="Currency"
              value={newSheetCurrency}
              onChange={(event) => setNewSheetCurrency(event.target.value)}
              size="small"
              sx={{ minWidth: 120 }}
            >
              {INVESTMENT_CURRENCIES.map((option) => (
                <MenuItem key={option.code} value={option.code}>
                  {option.code}
                </MenuItem>
              ))}
            </TextField>
            <Button type="submit" variant="contained" disabled={creatingSheet}>
              {creatingSheet ? <CircularProgress size={24} /> : "Create"}
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
