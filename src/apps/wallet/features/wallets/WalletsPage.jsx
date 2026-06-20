import { useState, useEffect } from "react";
import {
  Box, Card, CardContent, Divider, InputAdornment,
  Stack, TextField, Typography,
} from "@mui/material";
import PageHeader from "../../../../components/common/PageHeader";
import { useCurrencyConfig } from "../../../../hooks/useCurrencyConfig";

export default function WalletsPage() {
  const { currencies, wallets, updateWallet, toIDR, formatIDR, formatAmount } = useCurrencyConfig();

  const [drafts, setDrafts] = useState({});

  useEffect(() => {
    const init = {};
    currencies.forEach((c) => { init[c.code] = String(wallets[c.code] ?? 0); });
    setDrafts(init);
  }, [currencies, wallets]);

  function handleBlur(code) {
    const val = parseFloat(drafts[code]) || 0;
    updateWallet(code, val);
  }

  const totalIDR = currencies.reduce((sum, c) => {
    const bal = parseFloat(drafts[c.code]) || 0;
    return sum + toIDR(bal, c.code);
  }, 0);

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      <PageHeader
        title="Cash Wallets"
        subtitle="Enter your current cash balance per currency. IDR is the main currency."
      />

      <Card sx={{ mb: 2, bgcolor: "primary.main", color: "primary.contrastText" }}>
        <CardContent>
          <Typography variant="caption" sx={{ opacity: 0.8 }}>Total cash in IDR</Typography>
          <Typography variant="h5" fontWeight={700}>{formatIDR(totalIDR)}</Typography>
        </CardContent>
      </Card>

      <Card>
        <Stack divider={<Divider />}>
          {currencies.map((c) => {
            const bal = parseFloat(drafts[c.code]) || 0;
            const idr = toIDR(bal, c.code);
            return (
              <CardContent key={c.code} sx={{ py: "12px !important" }}>
                <Stack direction="row" alignItems="center" spacing={2}>
                  <Typography fontSize={24} sx={{ minWidth: 32 }}>{c.flag}</Typography>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="body2" fontWeight={700}>{c.code}</Typography>
                    <Typography variant="caption" color="text.secondary">{c.label}</Typography>
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <TextField
                      type="number"
                      size="small"
                      value={drafts[c.code] ?? "0"}
                      onChange={(e) => setDrafts((p) => ({ ...p, [c.code]: e.target.value }))}
                      onBlur={() => handleBlur(c.code)}
                      inputProps={{ min: 0, step: c.code === "IDR" ? 10000 : 0.01 }}
                      InputProps={{
                        startAdornment: <InputAdornment position="start">{c.symbol}</InputAdornment>,
                      }}
                      fullWidth
                    />
                    {c.code !== "IDR" && bal > 0 && (
                      <Typography variant="caption" color="text.secondary" display="block" mt={0.25}>
                        ≈ {formatIDR(idr)}
                      </Typography>
                    )}
                  </Box>
                </Stack>
              </CardContent>
            );
          })}
        </Stack>
      </Card>

      <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1.5 }}>
        Changes are saved automatically when you leave each field. Rates are managed in the Rates tab.
      </Typography>
    </Box>
  );
}
