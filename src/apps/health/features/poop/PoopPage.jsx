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
  Tooltip,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import { BarChart } from "@mui/x-charts/BarChart";
import PageHeader from "../../../../components/common/PageHeader";
import { useHealthData } from "../../hooks/useHealthData";
import { today, toLocalDateStr, formatDisplayDate } from "../../utils/dates";

// Bristol Stool Scale — types 3 & 4 are considered ideal
const BRISTOL = [
  { type: 1, label: "Type 1", desc: "Separate hard lumps", health: "Constipation" },
  { type: 2, label: "Type 2", desc: "Lumpy sausage-shape", health: "Constipation" },
  { type: 3, label: "Type 3", desc: "Sausage with cracks", health: "Normal" },
  { type: 4, label: "Type 4", desc: "Smooth soft sausage", health: "Ideal" },
  { type: 5, label: "Type 5", desc: "Soft blobs", health: "Lacking fibre" },
  { type: 6, label: "Type 6", desc: "Fluffy/mushy pieces", health: "Mild diarrhea" },
  { type: 7, label: "Type 7", desc: "Entirely liquid", health: "Diarrhea" },
];

const BRISTOL_HEALTH_COLOR = {
  "Constipation": "error.main",
  "Normal": "text.primary",
  "Ideal": "success.main",
  "Lacking fibre": "warning.main",
  "Mild diarrhea": "warning.main",
  "Diarrhea": "error.main",
};

const COLORS = [
  { value: "brown", label: "Brown", hex: "#8B4513", note: "Normal" },
  { value: "yellow", label: "Yellow", hex: "#DAA520", note: "Check diet" },
  { value: "green", label: "Green", hex: "#3A7D44", note: "Usually OK" },
  { value: "dark", label: "Dark", hex: "#3C3C3C", note: "See doctor if persistent" },
  { value: "red", label: "Red", hex: "#C0392B", note: "See doctor" },
];

function currentTime() {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function lastNDays(n) {
  return Array.from({ length: n }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (n - 1 - i));
    return toLocalDateStr(d);
  });
}

function BristolPicker({ value, onChange }) {
  return (
    <Stack spacing={0.5}>
      {BRISTOL.map((b) => (
        <Button
          key={b.type}
          variant={value === b.type ? "contained" : "outlined"}
          onClick={() => onChange(b.type)}
          size="small"
          sx={{ justifyContent: "flex-start", textAlign: "left", textTransform: "none" }}
        >
          <Stack direction="row" spacing={1.5} alignItems="center" sx={{ width: "100%" }}>
            <Typography
              variant="body2"
              fontWeight={700}
              sx={{ minWidth: 20, color: value === b.type ? "inherit" : "text.secondary" }}
            >
              {b.type}
            </Typography>
            <Box sx={{ flex: 1 }}>
              <Typography variant="body2" fontWeight={500} lineHeight={1.2}>
                {b.desc}
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  color:
                    value === b.type
                      ? "inherit"
                      : BRISTOL_HEALTH_COLOR[b.health] ?? "text.secondary",
                }}
              >
                {b.health}
              </Typography>
            </Box>
          </Stack>
        </Button>
      ))}
    </Stack>
  );
}

function ColorPicker({ value, onChange }) {
  return (
    <Stack direction="row" spacing={1} flexWrap="wrap">
      {COLORS.map((c) => (
        <Tooltip key={c.value} title={`${c.label} — ${c.note}`}>
          <Box
            onClick={() => onChange(c.value)}
            sx={{
              width: 36,
              height: 36,
              borderRadius: "50%",
              bgcolor: c.hex,
              cursor: "pointer",
              border: value === c.value ? "3px solid" : "2px solid transparent",
              borderColor: value === c.value ? "primary.main" : "transparent",
              outline: value === c.value ? "2px solid" : "none",
              outlineColor: value === c.value ? c.hex : "transparent",
              transition: "transform 0.1s",
              "&:hover": { transform: "scale(1.15)" },
            }}
          />
        </Tooltip>
      ))}
    </Stack>
  );
}

export default function PoopPage() {
  const { records, loading, add, update, remove } = useHealthData("health_poop");

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [date, setDate] = useState(today());
  const [time, setTime] = useState(currentTime());
  const [bristolType, setBristolType] = useState(4);
  const [color, setColor] = useState("brown");
  const [notes, setNotes] = useState("");

  const openAdd = () => {
    setEditing(null);
    setDate(today());
    setTime(currentTime());
    setBristolType(4);
    setColor("brown");
    setNotes("");
    setOpen(true);
  };

  const openEdit = (r) => {
    setEditing(r);
    setDate(r.date);
    setTime(r.time ?? currentTime());
    setBristolType(r.bristolType ?? 4);
    setColor(r.color ?? "brown");
    setNotes(r.notes ?? "");
    setOpen(true);
  };

  const handleSave = async () => {
    const payload = { date, time, bristolType, color, notes: notes.trim() || null };
    if (editing) await update(editing.id, payload);
    else await add(payload);
    setOpen(false);
  };

  const todayDate = today();
  const todayCount = records.filter((r) => r.date === todayDate).length;

  const days7 = lastNDays(7);
  const week = records.filter((r) => days7.includes(r.date));
  const avgPerDay = (week.length / 7).toFixed(1);

  // Most common Bristol type in the last 30 days
  const days30 = lastNDays(30);
  const month = records.filter((r) => days30.includes(r.date));
  const typeCounts = {};
  month.forEach((r) => {
    typeCounts[r.bristolType] = (typeCounts[r.bristolType] ?? 0) + 1;
  });
  const mostCommon = Object.entries(typeCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
  const mostCommonInfo = mostCommon ? BRISTOL.find((b) => b.type === Number(mostCommon)) : null;

  const days14 = lastNDays(14);
  const chartData = days14.map((d) => ({
    day: d.slice(5),
    count: records.filter((r) => r.date === d).length,
  }));

  const getBristolDesc = (type) => BRISTOL.find((b) => b.type === type)?.desc ?? `Type ${type}`;
  const getColorLabel = (val) => COLORS.find((c) => c.value === val)?.label ?? val;
  const getColorHex = (val) => COLORS.find((c) => c.value === val)?.hex ?? "#8B4513";

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, pb: 12 }}>
      <PageHeader title="Poop Tracker" subtitle="Monitor your digestive health" />

      {/* Stats row */}
      <Stack direction="row" spacing={1.5} sx={{ mb: 3 }}>
        <Card sx={{ flex: 1 }}>
          <CardContent sx={{ py: 1.5, "&:last-child": { pb: 1.5 } }}>
            <Typography variant="h5" fontWeight={700} color="primary.main">
              {todayCount}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Today
            </Typography>
          </CardContent>
        </Card>
        <Card sx={{ flex: 1 }}>
          <CardContent sx={{ py: 1.5, "&:last-child": { pb: 1.5 } }}>
            <Typography variant="h5" fontWeight={700} color="primary.main">
              {avgPerDay}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Avg / day (7d)
            </Typography>
          </CardContent>
        </Card>
        <Card sx={{ flex: 1 }}>
          <CardContent sx={{ py: 1.5, "&:last-child": { pb: 1.5 } }}>
            <Typography variant="h5" fontWeight={700} color="primary.main">
              {mostCommonInfo ? `T${mostCommonInfo.type}` : "—"}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {mostCommonInfo ? mostCommonInfo.health : "Common type"}
            </Typography>
          </CardContent>
        </Card>
      </Stack>

      {/* Frequency chart */}
      <Typography variant="subtitle2" gutterBottom>
        Last 14 days (entries per day)
      </Typography>
      <BarChart
        dataset={chartData}
        xAxis={[{ scaleType: "band", dataKey: "day" }]}
        series={[{ dataKey: "count", label: "Entries", color: "#A5D6A7" }]}
        yAxis={[{ tickMinStep: 1 }]}
        height={180}
        margin={{ top: 8, right: 8, bottom: 30, left: 32 }}
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
          No entries yet.
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
                    <Box
                      sx={{
                        width: 10,
                        height: 10,
                        borderRadius: "50%",
                        bgcolor: getColorHex(r.color),
                        flexShrink: 0,
                      }}
                    />
                    <Typography variant="body2" fontWeight={600}>
                      Type {r.bristolType} — {getBristolDesc(r.bristolType)}
                    </Typography>
                  </Stack>
                }
                secondary={[
                  formatDisplayDate(r.date),
                  r.time,
                  getColorLabel(r.color),
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
        <DialogTitle>{editing ? "Edit entry" : "Log entry"}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Stack direction="row" spacing={1}>
              <TextField
                type="date"
                label="Date"
                size="small"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                slotProps={{ inputLabel: { shrink: true } }}
                sx={{ flex: 1 }}
              />
              <TextField
                type="time"
                label="Time"
                size="small"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                slotProps={{ inputLabel: { shrink: true } }}
                sx={{ flex: 1 }}
              />
            </Stack>

            <Box>
              <Typography variant="caption" color="text.secondary" display="block" mb={0.75}>
                Bristol Stool Type
              </Typography>
              <BristolPicker value={bristolType} onChange={setBristolType} />
            </Box>

            <Box>
              <Typography variant="caption" color="text.secondary" display="block" mb={0.75}>
                Color
              </Typography>
              <ColorPicker value={color} onChange={setColor} />
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
