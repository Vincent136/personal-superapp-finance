import { useState } from "react";
import {
  Box, Card, CardActionArea, CardContent, CardMedia, Chip,
  Fab, LinearProgress, Stack, Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import LuggageIcon from "@mui/icons-material/Luggage";
import { useNavigate } from "react-router-dom";
import PageHeader from "../../../../components/common/PageHeader";
import TripFormDialog from "./TripFormDialog";
import { useTripData } from "../../hooks/useTripData";
import { STATUS_CONFIG, formatCurrency, formatDateRange, tripDuration } from "../../utils/tripUtils";

function BudgetBar({ planned, actual, currency }) {
  if (!planned) return null;
  const pct = Math.min((actual / planned) * 100, 100);
  const over = actual > planned;
  return (
    <Box sx={{ mt: 1 }}>
      <Stack direction="row" justifyContent="space-between" mb={0.25}>
        <Typography variant="caption" color="text.secondary">
          {formatCurrency(actual, currency)} spent
        </Typography>
        <Typography variant="caption" color={over ? "error.main" : "text.secondary"}>
          of {formatCurrency(planned, currency)}
        </Typography>
      </Stack>
      <LinearProgress
        variant="determinate"
        value={pct}
        color={over ? "error" : actual / planned > 0.8 ? "warning" : "primary"}
        sx={{ borderRadius: 1, height: 6 }}
      />
    </Box>
  );
}

export default function TripListPage() {
  const navigate = useNavigate();
  const { trips, addTrip } = useTripData();
  const [dialogOpen, setDialogOpen] = useState(false);

  function handleCreate(data) {
    const trip = addTrip(data);
    navigate(`/trip/${trip.id}`);
  }

  const sorted = [...trips].sort((a, b) => {
    const order = { ongoing: 0, upcoming: 1, planning: 2, completed: 3 };
    return (order[a.status] ?? 4) - (order[b.status] ?? 4);
  });

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, pb: 10 }}>
      <PageHeader title="My Trips" subtitle={`${trips.length} trip${trips.length !== 1 ? "s" : ""}`} />

      {sorted.length === 0 ? (
        <Card>
          <CardContent sx={{ textAlign: "center", py: 6 }}>
            <LuggageIcon sx={{ fontSize: 48, color: "text.disabled", mb: 1 }} />
            <Typography color="text.secondary" gutterBottom>No trips yet.</Typography>
            <Typography variant="caption" color="text.secondary">Tap + to plan your first trip.</Typography>
          </CardContent>
        </Card>
      ) : (
        <Stack spacing={2}>
          {sorted.map((trip) => {
            const actualCost = (trip.expenses ?? [])
              .filter((e) => e.type === "actual")
              .reduce((s, e) => s + (e.amount ?? 0), 0);
            const statusCfg = STATUS_CONFIG[trip.status] ?? STATUS_CONFIG.planning;

            return (
              <Card key={trip.id}>
                <CardActionArea onClick={() => navigate(`/trip/${trip.id}`)}>
                  {trip.coverImage && (
                    <CardMedia component="img" height={160} image={trip.coverImage} alt={trip.title} />
                  )}
                  <CardContent>
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 0.5 }}>
                      <Typography variant="h6" fontWeight={700} lineHeight={1.2}>
                        {trip.title}
                      </Typography>
                      <Chip label={statusCfg.label} color={statusCfg.color} size="small" sx={{ ml: 1, flexShrink: 0 }} />
                    </Box>
                    {trip.destination && (
                      <Typography variant="body2" color="text.secondary">📍 {trip.destination}</Typography>
                    )}
                    <Typography variant="caption" color="text.secondary" display="block" mt={0.5}>
                      {formatDateRange(trip.startDate, trip.endDate)}
                      {trip.startDate && trip.endDate && ` · ${tripDuration(trip.startDate, trip.endDate)}`}
                    </Typography>
                    <BudgetBar planned={trip.plannedBudget} actual={actualCost} currency={trip.currency} />
                    {!trip.plannedBudget && actualCost > 0 && (
                      <Typography variant="caption" color="text.secondary">
                        {formatCurrency(actualCost, trip.currency)} tracked
                      </Typography>
                    )}
                  </CardContent>
                </CardActionArea>
              </Card>
            );
          })}
        </Stack>
      )}

      <Fab color="primary" sx={{ position: "fixed", bottom: { xs: 72, md: 24 }, right: 24 }} onClick={() => setDialogOpen(true)}>
        <AddIcon />
      </Fab>

      <TripFormDialog open={dialogOpen} onClose={() => setDialogOpen(false)} onSave={handleCreate} />
    </Box>
  );
}
