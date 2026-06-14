import { useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  FormControlLabel,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Stack,
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import { useNavigate } from "react-router-dom";
import PageHeader from "../../components/common/PageHeader";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../hooks/useAuth";

export default function AdminPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [email, setEmail] = useState("");
  const [makeAdmin, setMakeAdmin] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [sgdToIdr, setSgdToIdr] = useState("");
  const [usdToIdr, setUsdToIdr] = useState("");
  const [rateLoading, setRateLoading] = useState(true);
  const [rateError, setRateError] = useState(null);
  const [rateMessage, setRateMessage] = useState(null);
  const [savingRate, setSavingRate] = useState(false);

  useEffect(() => {
    let active = true;

    supabase
      .from("email_whitelist")
      .select("email, is_admin, created_at")
      .order("created_at", { ascending: true })
      .then(({ data, error }) => {
        if (!active) return;
        if (error) setError(error.message);
        else setEntries(data);
        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;

    supabase
      .from("currency_rates")
      .select("sgd_to_idr, usd_to_idr")
      .eq("id", 1)
      .single()
      .then(({ data, error }) => {
        if (!active) return;
        if (error) {
          setRateError(error.message);
        } else {
          setSgdToIdr(String(data.sgd_to_idr));
          setUsdToIdr(String(data.usd_to_idr));
        }
        setRateLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const loadEntries = async () => {
    const { data, error } = await supabase
      .from("email_whitelist")
      .select("email, is_admin, created_at")
      .order("created_at", { ascending: true });

    if (error) {
      setError(error.message);
    } else {
      setEntries(data);
    }
  };

  const handleAdd = async (event) => {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    const { error } = await supabase
      .from("email_whitelist")
      .insert({ email: email.trim().toLowerCase(), is_admin: makeAdmin });

    setSubmitting(false);

    if (error) {
      setError(error.message);
      return;
    }

    setEmail("");
    setMakeAdmin(false);
    loadEntries();
  };

  const handleRemove = async (entryEmail) => {
    setError(null);
    const { error } = await supabase.from("email_whitelist").delete().eq("email", entryEmail);

    if (error) {
      setError(error.message);
      return;
    }
    loadEntries();
  };

  const handleSaveRate = async (event) => {
    event.preventDefault();
    setSavingRate(true);
    setRateError(null);
    setRateMessage(null);

    const { error } = await supabase
      .from("currency_rates")
      .update({
        sgd_to_idr: Number(sgdToIdr),
        usd_to_idr: Number(usdToIdr),
        updated_at: new Date().toISOString(),
      })
      .eq("id", 1);

    setSavingRate(false);

    if (error) {
      setRateError(error.message);
      return;
    }

    setRateMessage("Currency rate saved.");
  };

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      <PageHeader
        title="Admin Dashboard"
        subtitle="Manage which email addresses are allowed to register."
        action={<Button onClick={() => navigate("/")}>Back to Apps</Button>}
      />

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Box
        component="form"
        onSubmit={handleAdd}
        sx={{ display: "flex", gap: 2, flexWrap: "wrap", alignItems: "center", mb: 3 }}
      >
        <TextField
          label="Email to whitelist"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
          size="small"
          sx={{ flex: 1, minWidth: 240 }}
        />
        <FormControlLabel
          control={
            <Switch checked={makeAdmin} onChange={(event) => setMakeAdmin(event.target.checked)} />
          }
          label="Admin"
        />
        <Button type="submit" variant="contained" disabled={submitting}>
          {submitting ? <CircularProgress size={24} /> : "Add"}
        </Button>
      </Box>

      <Divider sx={{ mb: 1 }} />

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
          <CircularProgress />
        </Box>
      ) : entries.length === 0 ? (
        <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
          No whitelisted emails yet.
        </Typography>
      ) : (
        <List disablePadding>
          {entries.map((entry) => (
            <ListItem
              key={entry.email}
              divider
              secondaryAction={
                <IconButton
                  edge="end"
                  aria-label="remove"
                  disabled={entry.email === user?.email?.toLowerCase()}
                  onClick={() => handleRemove(entry.email)}
                >
                  <DeleteIcon />
                </IconButton>
              }
            >
              <ListItemText
                primary={
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    {entry.email}
                    {entry.is_admin && <Chip label="Admin" size="small" color="primary" />}
                  </Box>
                }
                secondary={`Added ${new Date(entry.created_at).toLocaleDateString()}`}
              />
            </ListItem>
          ))}
        </List>
      )}

      <Divider sx={{ my: 3 }} />

      <Typography variant="h6" gutterBottom>
        Currency rate
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Used to convert amounts between Indonesian Rupiah (IDR), Singapore Dollar (SGD), and US
        Dollar (USD).
      </Typography>

      {rateError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {rateError}
        </Alert>
      )}
      {rateMessage && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {rateMessage}
        </Alert>
      )}

      {rateLoading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Box component="form" onSubmit={handleSaveRate}>
          <Stack direction="row" spacing={2} alignItems="flex-start" flexWrap="wrap">
            <TextField
              type="number"
              label="1 SGD = ? IDR"
              value={sgdToIdr}
              onChange={(event) => setSgdToIdr(event.target.value)}
              size="small"
              required
              slotProps={{ input: { inputProps: { min: 0, step: "0.0001" } } }}
            />
            <TextField
              type="number"
              label="1 USD = ? IDR"
              value={usdToIdr}
              onChange={(event) => setUsdToIdr(event.target.value)}
              size="small"
              required
              slotProps={{ input: { inputProps: { min: 0, step: "0.0001" } } }}
            />
            <Button type="submit" variant="contained" disabled={savingRate}>
              {savingRate ? <CircularProgress size={24} /> : "Save"}
            </Button>
          </Stack>
        </Box>
      )}
    </Box>
  );
}
