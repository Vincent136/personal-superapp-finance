import { useState } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Fab,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import DirectionsBikeIcon from "@mui/icons-material/DirectionsBike";
import { BarChart } from "@mui/x-charts/BarChart";
import PageHeader from "../../../../components/common/PageHeader";
import { useHealthData } from "../../hooks/useHealthData";
import { today, formatDisplayDate } from "../../utils/dates";

const CYCLE_TYPES = [
  { value: "outdoor", label: "Outdoor" },
  { value: "indoor", label: "Indoor" },
  { value: "commute", label: "Commute" },
];

function fmtDuration(mins) {
  if (!mins) return "—";
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

function avgSpeed(distKm, durationMins) {
  if (!distKm || !durationMins) return null;
  return (distKm / (durationMins / 60)).toFixed(1);
}

export default function CyclingPage() {
  const { records, loading, add, update, remove } = useHealthData("health_cycling");

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [date, setDate] = useState(today());
  const [cycleType, setCycleType] = useState("outdoor");
  const [durationMinutes, setDurationMinutes] = useState("60");
  const [distanceKm, setDistanceKm] = useState("15");
  const [calories, setCalories] = useState("");
  const [notes, setNotes] = useState("");

  const openAdd = () => {
    setEditing(null);
    setDate(today());
    setCycleType("outdoor");
    setDurationMinutes("60");
    setDistanceKm("15");
    setCalories("");
    setNotes("");
    setOpen(true);
  };

  const openEdit = (r) => {
    setEditing(r);
    setDate(r.date);
    setCycleType(r.cycleType ?? "outdoor");
    setDurationMinutes(String(r.durationMinutes ?? 60));
    setDistanceKm(String(r.distanceKm ?? ""));
    setCalories(r.calories != null ? String(r.calories) : "");
    setNotes(r.notes ?? "");
    setOpen(true);
  };

  const handleSave = async () => {
    const payload = {
      date,
      cycleType,
      durationMinutes: Number(durationMinutes),
      distanceKm: distanceKm ? Number(distanceKm) : null,
      calories: calories ? Number(calories) : null,
      notes: notes.trim() || null,
    };
    if (editing) await update(editing.id, payload);
    else await add(payload);
    setOpen(false);
  };

  // Monthly stats
  const now = new Date();
  const monthPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const monthRecs = records.filter((r) => r.date.startsWith(monthPrefix));

  const totalDistKm = monthRecs.reduce((s, r) => s + (r.distanceKm ?? 0), 0);
  const totalMins = monthRecs.reduce((s, r) => s + (r.durationMinutes ?? 0), 0);
  const monthAvgSpeed =
    totalDistKm && totalMins ? (totalDistKm / (totalMins / 60)).toFixed(1) : null;

  // Chart: last 15 sessions, distance per session
  const recent = records.slice(0, 15).reverse();
  const chartData = recent.map((r, i) => ({
    idx: String(i + 1),
    km: r.distanceKm ?? 0,
  }));

  const typeColor = { outdoor: "success", indoor: "primary", commute: "warning" };

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, pb: 12 }}>
      <PageHeader title="Cycling" subtitle="Track your rides" />

      {/* Monthly stats */}
      <Typography variant="caption" color="text.secondary" fontWeight={600}>
        {now.toLocaleString("default", { month: "long", year: "numeric" })}
      </Typography>
      <Stack direction="row" spacing={1.5} sx={{ mt: 0.5, mb: 3 }}>
        <Card sx={{ flex: 1 }}>
          <CardContent sx={{ py: 1.5, "&:last-child": { pb: 1.5 } }}>
            <Typography variant="h5" fontWeight={700} color="primary.main">
              {totalDistKm.toFixed(1)}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              km total
            </Typography>
          </CardContent>
        </Card>
        <Card sx={{ flex: 1 }}>
          <CardContent sx={{ py: 1.5, "&:last-child": { pb: 1.5 } }}>
            <Typography variant="h5" fontWeight={700} color="primary.main">
              {fmtDuration(totalMins)}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Total time
            </Typography>
          </CardContent>
        </Card>
        <Card sx={{ flex: 1 }}>
          <CardContent sx={{ py: 1.5, "&:last-child": { pb: 1.5 } }}>
            <Typography variant="h5" fontWeight={700} color="primary.main">
              {monthRecs.length}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Rides
            </Typography>
          </CardContent>
        </Card>
        <Card sx={{ flex: 1 }}>
          <CardContent sx={{ py: 1.5, "&:last-child": { pb: 1.5 } }}>
            <Typography variant="h5" fontWeight={700} color="primary.main">
              {monthAvgSpeed ?? "—"}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              km/h avg
            </Typography>
          </CardContent>
        </Card>
      </Stack>

      {/* Distance chart */}
      {recent.length > 0 && (
        <>
          <Typography variant="subtitle2" gutterBottom>
            Last {recent.length} rides (km)
          </Typography>
          <BarChart
            dataset={chartData}
            xAxis={[{ scaleType: "band", dataKey: "idx" }]}
            series={[{ dataKey: "km", label: "Distance (km)", color: "#4CAF50" }]}
            height={200}
            margin={{ top: 8, right: 8, bottom: 30, left: 40 }}
            sx={{ mb: 3 }}
          />
        </>
      )}

      {/* History */}
      <Typography variant="subtitle2" gutterBottom>
        History
      </Typography>
      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
          <CircularProgress />
        </Box>
      ) : records.length === 0 ? (
        <Typography variant="body2" color="text.secondary">
          No rides logged yet.
        </Typography>
      ) : (
        <List disablePadding>
          {records.map((r) => {
            const speed = avgSpeed(r.distanceKm, r.durationMinutes);
            return (
              <ListItem
                key={r.id}
                divider
                secondaryAction={
                  <Stack direction="row">
                    <IconButton size="small" onClick={() => openEdit(r)}>
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton size="small" onClick={() => remove(r.id)}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Stack>
                }
              >
                <ListItemText
                  primary={
                    <Stack direction="row" spacing={1} alignItems="center">
                      <DirectionsBikeIcon
                        sx={{ fontSize: 16, color: "primary.main" }}
                      />
                      <Typography variant="body2" fontWeight={600}>
                        {r.distanceKm != null ? `${r.distanceKm} km` : "—"}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {fmtDuration(r.durationMinutes)}
                      </Typography>
                      {speed && (
                        <Typography variant="caption" color="text.secondary">
                          {speed} km/h
                        </Typography>
                      )}
                      <Chip
                        label={r.cycleType ?? "outdoor"}
                        size="small"
                        color={typeColor[r.cycleType] ?? "default"}
                        variant="outlined"
                        sx={{ height: 18, fontSize: "0.65rem" }}
                      />
                    </Stack>
                  }
                  secondary={[
                    formatDisplayDate(r.date),
                    r.calories != null ? `${r.calories} kcal` : null,
                    r.notes,
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                />
              </ListItem>
            );
          })}
        </List>
      )}

      <Fab
        color="primary"
        sx={{ position: "fixed", bottom: 80, right: 24 }}
        onClick={openAdd}
      >
        <AddIcon />
      </Fab>

      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle>{editing ? "Edit ride" : "Log ride"}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              type="date"
              label="Date"
              size="small"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              slotProps={{ inputLabel: { shrink: true } }}
            />

            <Box>
              <Typography variant="caption" color="text.secondary" display="block" mb={0.75}>
                Ride type
              </Typography>
              <Stack direction="row" spacing={1}>
                {CYCLE_TYPES.map((t) => (
                  <Button
                    key={t.value}
                    size="small"
                    variant={cycleType === t.value ? "contained" : "outlined"}
                    onClick={() => setCycleType(t.value)}
                  >
                    {t.label}
                  </Button>
                ))}
              </Stack>
            </Box>

            <Stack direction="row" spacing={1}>
              <TextField
                type="number"
                label="Duration (min)"
                size="small"
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(e.target.value)}
                slotProps={{ input: { inputProps: { min: 1, step: 5 } } }}
                sx={{ flex: 1 }}
              />
              <TextField
                type="number"
                label="Distance (km)"
                size="small"
                value={distanceKm}
                onChange={(e) => setDistanceKm(e.target.value)}
                slotProps={{ input: { inputProps: { min: 0, step: 0.1 } } }}
                sx={{ flex: 1 }}
              />
            </Stack>

            {durationMinutes && distanceKm && Number(durationMinutes) > 0 && (
              <Typography variant="caption" color="text.secondary">
                Avg speed:{" "}
                {(Number(distanceKm) / (Number(durationMinutes) / 60)).toFixed(1)} km/h
              </Typography>
            )}

            <TextField
              type="number"
              label="Calories (optional)"
              size="small"
              value={calories}
              onChange={(e) => setCalories(e.target.value)}
              slotProps={{ input: { inputProps: { min: 0 } } }}
            />

            <TextField
              label="Notes (optional)"
              size="small"
              multiline
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={handleSave} variant="contained">
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
