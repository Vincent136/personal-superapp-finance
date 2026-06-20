import { useMemo } from "react";
import {
  Box, Card, CardActionArea, CardContent, Chip, Divider,
  LinearProgress, Stack, Typography,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import PageHeader from "../../../../components/common/PageHeader";
import { useTripData } from "../../hooks/useTripData";
import { STATUS_CONFIG, formatCurrency, formatDateRange } from "../../utils/tripUtils";

function BudgetRow({ trip }) {
  const navigate = useNavigate();
  const expenses = trip.expenses ?? [];
  const planned  = expenses.filter((e) => e.type === "planned").reduce((s, e) => s + (e.amount ?? 0), 0);
  const actual   = expenses.filter((e) => e.type === "actual").reduce((s, e) => s + (e.amount ?? 0), 0);
  const budget   = trip.plannedBudget ?? planned;
  const pct      = budget > 0 ? Math.min((actual / budget) * 100, 100) : 0;
  const over     = budget > 0 && actual > budget;
  const statusCfg = STATUS_CONFIG[trip.status] ?? STATUS_CONFIG.planning;

  return (
    <Card>
      <CardActionArea onClick={() => navigate(`/trip/${trip.id}`)}>
        <CardContent>
          <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={0.5}>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography variant="subtitle2" fontWeight={700} noWrap>{trip.title}</Typography>
              <Typography variant="caption" color="text.secondary" noWrap display="block">
                {formatDateRange(trip.startDate, trip.endDate)}
              </Typography>
            </Box>
            <Chip label={statusCfg.label} color={statusCfg.color} size="small" sx={{ ml: 1 }} />
          </Stack>

          <Stack direction="row" spacing={2} mb={1}>
            <Box sx={{ flex: 1 }}>
              <Typography variant="caption" color="text.secondary">Budget</Typography>
              <Typography variant="body2" fontWeight={600}>{budget ? formatCurrency(budget, trip.currency) : "—"}</Typography>
            </Box>
            <Box sx={{ flex: 1 }}>
              <Typography variant="caption" color="text.secondary">Planned</Typography>
              <Typography variant="body2">{planned ? formatCurrency(planned, trip.currency) : "—"}</Typography>
            </Box>
            <Box sx={{ flex: 1 }}>
              <Typography variant="caption" color="text.secondary">Actual</Typography>
              <Typography variant="body2" color={over ? "error.main" : "text.primary"} fontWeight={over ? 700 : 400}>
                {actual ? formatCurrency(actual, trip.currency) : "—"}
              </Typography>
            </Box>
          </Stack>

          {budget > 0 && (
            <Box>
              <LinearProgress
                variant="determinate"
                value={pct}
                color={over ? "error" : pct > 80 ? "warning" : "primary"}
                sx={{ borderRadius: 1, height: 6 }}
              />
              <Typography variant="caption" color={over ? "error.main" : "text.secondary"} mt={0.25} display="block">
                {over
                  ? `Over by ${formatCurrency(actual - budget, trip.currency)}`
                  : `${Math.round(pct)}% used · ${formatCurrency(budget - actual, trip.currency)} remaining`}
              </Typography>
            </Box>
          )}

          {trip.financeCategory && (
            <Chip
              label={`Finance: ${trip.financeCategory}`}
              size="small"
              variant="outlined"
              color="primary"
              sx={{ mt: 1 }}
            />
          )}
        </CardContent>
      </CardActionArea>
    </Card>
  );
}

export default function BudgetOverviewPage() {
  const { trips } = useTripData();

  const totals = useMemo(() => {
    let totalBudget = 0, totalActual = 0;
    trips.forEach((t) => {
      const expenses = t.expenses ?? [];
      const planned = expenses.filter((e) => e.type === "planned").reduce((s, e) => s + (e.amount ?? 0), 0);
      totalBudget += t.plannedBudget ?? planned;
      totalActual += expenses.filter((e) => e.type === "actual").reduce((s, e) => s + (e.amount ?? 0), 0);
    });
    return { totalBudget, totalActual };
  }, [trips]);

  const sorted = [...trips].sort((a, b) => {
    const order = { ongoing: 0, upcoming: 1, planning: 2, completed: 3 };
    return (order[a.status] ?? 4) - (order[b.status] ?? 4);
  });

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      <PageHeader title="Trip Budget" subtitle="All trips budget overview" />

      {/* Grand total */}
      {trips.length > 0 && (
        <Card sx={{ mb: 2, bgcolor: "primary.main", color: "primary.contrastText" }}>
          <CardContent>
            <Typography variant="subtitle2" sx={{ opacity: 0.8 }}>Total across all trips</Typography>
            <Stack direction="row" spacing={3} mt={0.5}>
              <Box>
                <Typography variant="caption" sx={{ opacity: 0.7 }}>Budget</Typography>
                <Typography variant="h6" fontWeight={700}>{formatCurrency(totals.totalBudget, "IDR")}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" sx={{ opacity: 0.7 }}>Spent</Typography>
                <Typography variant="h6" fontWeight={700}>{formatCurrency(totals.totalActual, "IDR")}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" sx={{ opacity: 0.7 }}>Remaining</Typography>
                <Typography variant="h6" fontWeight={700}>{formatCurrency(totals.totalBudget - totals.totalActual, "IDR")}</Typography>
              </Box>
            </Stack>
          </CardContent>
        </Card>
      )}

      {sorted.length === 0 ? (
        <Card>
          <CardContent sx={{ textAlign: "center", py: 4 }}>
            <Typography color="text.secondary">No trips yet. Create a trip to track its budget.</Typography>
          </CardContent>
        </Card>
      ) : (
        <Stack spacing={1.5}>
          {sorted.map((trip) => <BudgetRow key={trip.id} trip={trip} />)}
        </Stack>
      )}
    </Box>
  );
}
