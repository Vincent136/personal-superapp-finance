import { useState } from "react";
import { Alert, Box, Button, MenuItem, TextField } from "@mui/material";
import { Link as RouterLink } from "react-router-dom";
import PageHeader from "../../../../components/common/PageHeader";
import { supabase } from "../../../../lib/supabase";
import { useAuth } from "../../../../hooks/useAuth";
import { useProfile } from "../../../../hooks/useProfile";
import { useCurrency } from "../../hooks/useCurrency";
import { CURRENCIES } from "../../lib/format";

export default function SettingsPage() {
  const { user } = useAuth();
  const { loading: profileLoading, reload } = useProfile();
  const { currency, loading: currencyLoading } = useCurrency();

  const [savingCurrency, setSavingCurrency] = useState(false);
  const [error, setError] = useState(null);

  const loading = profileLoading || currencyLoading;

  const handleCurrencyChange = async (event) => {
    setSavingCurrency(true);
    setError(null);

    const { error: updateError } = await supabase
      .from("profiles")
      .update({ currency: event.target.value })
      .eq("id", user.id);

    setSavingCurrency(false);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    await reload();
  };

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      <PageHeader
        title="Settings"
        subtitle="Finance preferences for this account."
        action={
          <Button component={RouterLink} to="/finance/categories" size="small">
            Manage categories
          </Button>
        }
      />

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
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
      >
        {CURRENCIES.map((option) => (
          <MenuItem key={option.code} value={option.code}>
            {option.label}
          </MenuItem>
        ))}
      </TextField>
    </Box>
  );
}
