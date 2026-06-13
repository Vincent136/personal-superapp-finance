import { useState } from "react";
import {
  Alert,
  Avatar,
  Box,
  Button,
  CircularProgress,
  Divider,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import PageHeader from "../../components/common/PageHeader";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../hooks/useAuth";
import { useCurrency } from "../../hooks/useCurrency";
import { useProfile } from "../../hooks/useProfile";
import { CURRENCIES } from "../../lib/format";

// Replace with real menu items and handlers.
const MENU_ITEMS = ["Settings", "Privacy", "Help & Support"];

export default function ProfilePage() {
  const { user, isAdmin, signOut } = useAuth();
  const navigate = useNavigate();
  const { profile, loading: profileLoading, reload } = useProfile();
  const { currency, fromBase, toBase, loading: currencyLoading } = useCurrency();
  const email = user?.email ?? "";
  const initial = email ? email[0].toUpperCase() : "U";

  const [initialCapitalInput, setInitialCapitalInput] = useState(null);
  const [saving, setSaving] = useState(false);
  const [savingCurrency, setSavingCurrency] = useState(false);
  const [capitalError, setCapitalError] = useState(null);
  const [capitalMessage, setCapitalMessage] = useState(null);

  const loading = profileLoading || currencyLoading;
  const initialCapitalValue =
    initialCapitalInput ?? String(fromBase(profile?.initial_capital ?? 0));

  const handleSaveCapital = async () => {
    setSaving(true);
    setCapitalError(null);
    setCapitalMessage(null);

    const { error } = await supabase
      .from("profiles")
      .update({ initial_capital: toBase(Number(initialCapitalValue)) })
      .eq("id", user.id);

    setSaving(false);

    if (error) {
      setCapitalError(error.message);
      return;
    }

    setCapitalMessage("Saved.");
    setInitialCapitalInput(null);
    await reload();
  };

  const handleCurrencyChange = async (event) => {
    setSavingCurrency(true);
    setCapitalError(null);
    setCapitalMessage(null);

    const { error } = await supabase
      .from("profiles")
      .update({ currency: event.target.value })
      .eq("id", user.id);

    setSavingCurrency(false);

    if (error) {
      setCapitalError(error.message);
      return;
    }

    setInitialCapitalInput(null);
    await reload();
  };

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      <PageHeader title="Profile" />

      <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 3 }}>
        <Avatar sx={{ width: 64, height: 64, bgcolor: "primary.main", fontSize: 28 }}>
          {initial}
        </Avatar>
        <Box>
          <Typography variant="h6">{email || "Signed in"}</Typography>
        </Box>
      </Box>

      {capitalError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {capitalError}
        </Alert>
      )}
      {capitalMessage && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {capitalMessage}
        </Alert>
      )}

      <TextField
        select
        label="Currency"
        value={currency}
        onChange={handleCurrencyChange}
        size="small"
        fullWidth
        disabled={loading || savingCurrency}
        sx={{ mb: 2 }}
      >
        {CURRENCIES.map((option) => (
          <MenuItem key={option.code} value={option.code}>
            {option.label}
          </MenuItem>
        ))}
      </TextField>

      <Stack direction="row" spacing={2} alignItems="flex-start" sx={{ mb: 3 }}>
        <TextField
          type="number"
          label={`Initial capital (${currency})`}
          value={initialCapitalValue}
          onChange={(event) => {
            setInitialCapitalInput(event.target.value);
            setCapitalMessage(null);
          }}
          size="small"
          disabled={loading}
          fullWidth
          slotProps={{ input: { inputProps: { min: 0, step: currency === "IDR" ? "1000" : "0.01" } } }}
        />
        <Button variant="contained" onClick={handleSaveCapital} disabled={saving || loading}>
          {saving ? <CircularProgress size={24} /> : "Save"}
        </Button>
      </Stack>

      <Divider sx={{ mb: 1 }} />

      <List disablePadding>
        {MENU_ITEMS.map((item) => (
          <ListItem key={item} divider disablePadding>
            <ListItemButton>
              <ListItemText primary={item} />
            </ListItemButton>
          </ListItem>
        ))}
        {isAdmin && (
          <ListItem divider disablePadding>
            <ListItemButton onClick={() => navigate("/admin")}>
              <ListItemText primary="Admin Dashboard" />
            </ListItemButton>
          </ListItem>
        )}
        <ListItem divider disablePadding>
          <ListItemButton onClick={signOut}>
            <ListItemText primary="Sign Out" />
          </ListItemButton>
        </ListItem>
      </List>
    </Box>
  );
}
