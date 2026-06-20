import { useState, useEffect } from "react";
import {
  Box, Card, CardContent, Chip, Divider, InputAdornment,
  Stack, TextField, Typography,
} from "@mui/material";
import LockIcon from "@mui/icons-material/Lock";
import PageHeader from "../../../../components/common/PageHeader";
import { useCurrencyConfig, CURRENCIES } from "../../../../hooks/useCurrencyConfig";

export default function RatesPage() {
  const { rates, updatedAt, updateRate, formatIDR } = useCurrencyConfig();
  const [drafts, setDrafts] = useState({});

  useEffect(() => {
    const init = {};
    CURRENCIES.forEach((c) => { init[c.code] = String(rates[c.code] ?? 1); });
    setDrafts(init);
  }, [rates]);

  function handleBlur(code) {
    const val = parseFloat(drafts[code]) || 1;
    updateRate(code, val);
  }

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      <PageHeader
        title="Exchange Rates"
        subtitle="How many IDR equals 1 unit of each currency. IDR is locked as the base (1)."
      />

      {updatedAt && (
        <Typography variant="caption" color="text.secondary" display="block" mb={2}>
          Last updated: {new Date(updatedAt).toLocaleString("id-ID")}
        </Typography>
      )}

      <Card>
        <Stack divider={<Divider />}>
          {CURRENCIES.map((c) => {
            const rate = parseFloat(drafts[c.code]) || 1;
            return (
              <CardContent key={c.code} sx={{ py: "12px !important" }}>
                <Stack direction="row" alignItems="center" spacing={2}>
                  <Typography fontSize={24} sx={{ minWidth: 32 }}>{c.flag}</Typography>
                  <Box sx={{ flex: 1 }}>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Typography variant="body2" fontWeight={700}>{c.code}</Typography>
                      {c.locked && <LockIcon fontSize="small" color="disabled" />}
                    </Stack>
                    <Typography variant="caption" color="text.secondary">{c.label}</Typography>
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    {c.locked ? (
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <Chip label="1 = Base" size="small" color="primary" />
                        <Typography variant="caption" color="text.secondary">Cannot change</Typography>
                      </Stack>
                    ) : (
                      <>
                        <TextField
                          type="number"
                          size="small"
                          value={drafts[c.code] ?? ""}
                          onChange={(e) => setDrafts((p) => ({ ...p, [c.code]: e.target.value }))}
                          onBlur={() => handleBlur(c.code)}
                          inputProps={{ min: 1, step: 1 }}
                          InputProps={{
                            endAdornment: <InputAdornment position="end">IDR</InputAdornment>,
                          }}
                          helperText={`1 ${c.code} = ${formatIDR(rate)}`}
                          fullWidth
                        />
                      </>
                    )}
                  </Box>
                </Stack>
              </CardContent>
            );
          })}
        </Stack>
      </Card>

      <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1.5 }}>
        Rates are saved automatically when you leave each field. These rates are used across the Wallet, Trip, and Finance apps.
      </Typography>
    </Box>
  );
}
