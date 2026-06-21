import { useState } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
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
import StarIcon from "@mui/icons-material/Star";
import { BarChart } from "@mui/x-charts/BarChart";
import PageHeader from "../../../../components/common/PageHeader";
import { useHealthData } from "../../hooks/useHealthData";
import { today, toLocalDateStr, formatDisplayDate } from "../../utils/dates";

function fmtDuration(mins) {
  if (!mins) return "—";
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

function lastNDays(n) {
  return Array.from({ length: n }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (n - 1 - i));
    return toLocalDateStr(d);
  });
}

function Stars({ n }) {
  return (
    <Stack direction="row" spacing={0.25}>
      {[1, 2, 3, 4, 5].map((i) => (
        <StarIcon
          key={i}
          sx={{ fontSize: 12, color: i <= n ? "warning.main" : "action.disabled" }}
        />
      ))}
    </Stack>
  );
}

const QUALITY_LABELS = ["", "Bad", "Fair", "Good", "Great", "Excellent"];

function QualityPicker({ value, onChange }) {
  return (
    <Stack direction="row" flexWrap="wrap" gap={0.5}>
      {[1, 2, 3, 4, 5].map((q) => (
        <Button
          key={q}
          size="small"
          variant={value === q ? "contained" : "outlined"}
          onClick={() => onChange(q)}
          sx={{ minWidth: 0, px: 1.5 }}
        >
          {QUALITY_LABELS[q]}
        </Button>
      ))}
    </Stack>
  );
}

export default function NoonSleepPage() {
  const { records, loading, add, update, remove } = useHealthData("health_noon_sleep");

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [date, setDate] = useState(today());
  const [startTime, setStartTime] = useState("13:00");
  const [durationMinutes, setDurationMinutes] = useState("20");
  const [quality, setQuality] = useState(3);
  const [notes, setNotes] = useState("");

  const openAdd = () => {
    setEditing(null);
    setDate(today());
    setStartTime("13:00");
    setDurationMinutes("20");
    setQuality(3);
    setNotes("");
    setOpen(true);
  };

  const openEdit = (r) => {
    setEditing(r);
    setDate(r.date);
    setStartTime(r.startTime ?? "13:00");
    setDurationMinutes(String(r.durationMinutes ?? 20));
    setQuality(r.quality ?? 3);
    setNotes(r.notes ?? "");
    setOpen(true);
  };

  const handleSave = async () => {
    const payload = {
      date,
      startTime,
      durationMinutes: Number(durationMinutes),
      quality,
      notes: notes.trim() || null,
    };
    if (editing) await update(editing.id, payload);
    else await add(payload);
    setOpen(false);
  };

  const todayDate = today();
  const todayNaps = records.filter((r) => r.date === todayDate);

  const days7 = lastNDays(7);
  const week = records.filter((r) => days7.includes(r.date));
  const avgDuration = week.length
    ? Math.round(week.reduce((s, r) => s + (r.durationMinutes ?? 0), 0) / week.length)
    : 0;
  const avgQuality = week.length
    ? week.reduce((s, r) => s + (r.quality ?? 0), 0) / week.length
    : 0;

  const days14 = lastNDays(14);
  const chartData = days14.map((d) => ({
    day: d.slice(5),
    minutes: records.filter((r) => r.date === d).reduce((s, r) => s + (r.durationMinutes ?? 0), 0),
  }));

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, pb: 12 }}>
      <PageHeader title="Noon Sleep" subtitle="Track your midday naps" />

      {/* Today's nap(s) */}
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            Today
          </Typography>
          {todayNaps.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              No nap logged yet
            </Typography>
          ) : (
            <Stack spacing={1}>
              {todayNaps.map((r) => (
                <Stack key={r.id} direction="row" justifyContent="space-between" alignItems="center">
                  <Box>
                    <Typography variant="h6" fontWeight={700}>
                      {fmtDuration(r.durationMinutes)}
                    </Typography>
                    {r.startTime && (
                      <Typography variant="caption" color="text.secondary">
                        Started {r.startTime}
                      </Typography>
                    )}
                  </Box>
                  {r.quality != null && <Stars n={r.quality} />}
                </Stack>
              ))}
            </Stack>
          )}
        </CardContent>
      </Card>

      {/* Stats */}
      <Stack direction="row" spacing={1.5} sx={{ mb: 3 }}>
        <Card sx={{ flex: 1 }}>
          <CardContent sx={{ py: 1.5, "&:last-child": { pb: 1.5 } }}>
            <Typography variant="h5" fontWeight={700} color="primary.main">
              {week.length}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Naps this week
            </Typography>
          </CardContent>
        </Card>
        <Card sx={{ flex: 1 }}>
          <CardContent sx={{ py: 1.5, "&:last-child": { pb: 1.5 } }}>
            <Typography variant="h5" fontWeight={700} color="primary.main">
              {avgDuration ? fmtDuration(avgDuration) : "—"}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Avg duration
            </Typography>
          </CardContent>
        </Card>
        <Card sx={{ flex: 1 }}>
          <CardContent sx={{ py: 1.5, "&:last-child": { pb: 1.5 } }}>
            <Typography variant="h5" fontWeight={700} color="primary.main">
              {avgQuality ? avgQuality.toFixed(1) : "—"}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Avg quality
            </Typography>
          </CardContent>
        </Card>
      </Stack>

      {/* Chart */}
      <Typography variant="subtitle2" gutterBottom>
        Last 14 days (minutes)
      </Typography>
      <BarChart
        dataset={chartData}
        xAxis={[{ scaleType: "band", dataKey: "day" }]}
        series={[{ dataKey: "minutes", label: "Nap min", color: "#7986CB" }]}
        height={200}
        margin={{ top: 8, right: 8, bottom: 30, left: 40 }}
        sx={{ mb: 3 }}
      />

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
          No naps logged yet.
        </Typography>
      ) : (
        <List disablePadding>
          {records.map((r) => (
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
                    <Typography variant="body2" fontWeight={600}>
                      {fmtDuration(r.durationMinutes)}
                    </Typography>
                    {r.quality != null && <Stars n={r.quality} />}
                  </Stack>
                }
                secondary={[
                  formatDisplayDate(r.date),
                  r.startTime,
                  r.notes,
                ]
                  .filter(Boolean)
                  .join(" · ")}
              />
            </ListItem>
          ))}
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
        <DialogTitle>{editing ? "Edit nap" : "Log nap"}</DialogTitle>
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
            <TextField
              type="time"
              label="Start time"
              size="small"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              slotProps={{ inputLabel: { shrink: true } }}
            />
            <TextField
              type="number"
              label="Duration (minutes)"
              size="small"
              value={durationMinutes}
              onChange={(e) => setDurationMinutes(e.target.value)}
              slotProps={{ input: { inputProps: { min: 5, max: 240, step: 5 } } }}
            />
            <Box>
              <Typography variant="caption" color="text.secondary" display="block" mb={0.75}>
                Quality
              </Typography>
              <QualityPicker value={quality} onChange={setQuality} />
            </Box>
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
