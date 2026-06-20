import {
  Box, Button, Card, CardContent, Chip,
  LinearProgress, Stack, Typography,
} from "@mui/material";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import { useNavigate } from "react-router-dom";
import {
  STATUS_CONFIG, formatCurrency, formatDateRange, tripDuration,
} from "../../utils/tripUtils";

export default function OverviewTab({ trip }) {
  const navigate = useNavigate();

  const expenses = trip.expenses ?? [];
  const planned  = expenses.filter((e) => e.type === "planned").reduce((s, e) => s + (e.amount ?? 0), 0);
  const actual   = expenses.filter((e) => e.type === "actual").reduce((s, e) => s + (e.amount ?? 0), 0);
  const budget   = trip.plannedBudget ?? planned;
  const pct      = budget > 0 ? Math.min((actual / budget) * 100, 100) : 0;
  const over     = actual > budget && budget > 0;

  const statusCfg = STATUS_CONFIG[trip.status] ?? STATUS_CONFIG.planning;

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      {/* Cover */}
      {trip.coverImage && (
        <Box
          component="img"
          src={trip.coverImage}
          alt={trip.title}
          sx={{ width: "100%", maxHeight: 240, objectFit: "cover", borderRadius: 2, mb: 2 }}
        />
      )}

      {/* Header info */}
      <Stack direction="row" spacing={1} flexWrap="wrap" mb={1.5} gap={0.5}>
        <Chip label={statusCfg.label} color={statusCfg.color} size="small" />
        {trip.destination && <Chip label={`📍 ${trip.destination}`} variant="outlined" size="small" />}
        {trip.startDate && (
          <Chip
            label={`${formatDateRange(trip.startDate, trip.endDate)}${trip.endDate ? ` · ${tripDuration(trip.startDate, trip.endDate)}` : ""}`}
            variant="outlined"
            size="small"
          />
        )}
      </Stack>

      {trip.description && (
        <Typography variant="body1" color="text.secondary" mb={2} sx={{ whiteSpace: "pre-line" }}>
          {trip.description}
        </Typography>
      )}

      {/* Budget card */}
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Typography variant="subtitle2" gutterBottom>Budget Overview</Typography>
          <Stack direction="row" spacing={2} mb={1.5}>
            <Box sx={{ flex: 1 }}>
              <Typography variant="caption" color="text.secondary">Planned</Typography>
              <Typography variant="h6" fontWeight={700}>{formatCurrency(budget || planned, trip.currency)}</Typography>
            </Box>
            <Box sx={{ flex: 1 }}>
              <Typography variant="caption" color="text.secondary">Actual spent</Typography>
              <Typography variant="h6" fontWeight={700} color={over ? "error.main" : "text.primary"}>
                {formatCurrency(actual, trip.currency)}
              </Typography>
            </Box>
            <Box sx={{ flex: 1 }}>
              <Typography variant="caption" color="text.secondary">Remaining</Typography>
              <Typography
                variant="h6"
                fontWeight={700}
                color={over ? "error.main" : "success.main"}
              >
                {budget > 0 ? formatCurrency(budget - actual, trip.currency) : "—"}
              </Typography>
            </Box>
          </Stack>
          {budget > 0 && (
            <LinearProgress
              variant="determinate"
              value={pct}
              color={over ? "error" : pct > 80 ? "warning" : "primary"}
              sx={{ borderRadius: 1, height: 8 }}
            />
          )}
          <Typography variant="caption" color="text.secondary" mt={0.5} display="block">
            {budget > 0 ? `${Math.round(pct)}% of budget used` : "No budget set — expenses are tracked in Expenses tab"}
          </Typography>
        </CardContent>
      </Card>

      {/* Finance integration */}
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Typography variant="subtitle2" gutterBottom>Finance Link</Typography>
          {trip.financeCategory ? (
            <Stack direction="row" alignItems="center" spacing={1} flexWrap="wrap" gap={0.5}>
              <Chip label={`Category: ${trip.financeCategory}`} variant="outlined" size="small" color="primary" />
              <Button
                size="small"
                endIcon={<OpenInNewIcon fontSize="small" />}
                onClick={() => navigate("/finance/transactions")}
              >
                View in Finance
              </Button>
            </Stack>
          ) : (
            <Typography variant="body2" color="text.secondary">
              No finance category linked. Edit the trip to set one — it maps to a Finance app category
              so you can cross-reference your transactions.
            </Typography>
          )}
        </CardContent>
      </Card>

      {/* Quick stats */}
      <Stack direction="row" spacing={1.5}>
        <Card sx={{ flex: 1 }}>
          <CardContent sx={{ py: 1.5, "&:last-child": { pb: 1.5 }, textAlign: "center" }}>
            <Typography variant="h5" fontWeight={700} color="primary">{(trip.places ?? []).length}</Typography>
            <Typography variant="caption" color="text.secondary">Places</Typography>
          </CardContent>
        </Card>
        <Card sx={{ flex: 1 }}>
          <CardContent sx={{ py: 1.5, "&:last-child": { pb: 1.5 }, textAlign: "center" }}>
            <Typography variant="h5" fontWeight={700} color="primary">{(trip.itinerary ?? []).length}</Typography>
            <Typography variant="caption" color="text.secondary">Activities</Typography>
          </CardContent>
        </Card>
        <Card sx={{ flex: 1 }}>
          <CardContent sx={{ py: 1.5, "&:last-child": { pb: 1.5 }, textAlign: "center" }}>
            <Typography variant="h5" fontWeight={700} color="primary">{(trip.images ?? []).length}</Typography>
            <Typography variant="caption" color="text.secondary">Photos</Typography>
          </CardContent>
        </Card>
      </Stack>
    </Box>
  );
}
