import { useState, useMemo } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Fab,
  IconButton,
  LinearProgress,
  List,
  ListItem,
  ListItemText,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import { BarChart } from "@mui/x-charts/BarChart";
import PageHeader from "../../../../components/common/PageHeader";
import { useHealthData } from "../../hooks/useHealthData";
import { today, toLocalDateStr, formatDisplayDate } from "../../utils/dates";

const DRINK_TYPES = [
  { value: "water",  label: "Water",  color: "#03A9F4", defaultMl: 250, caffeinated: false },
  { value: "coffee", label: "Coffee", color: "#795548", defaultMl: 150, caffeinated: true  },
  { value: "tea",    label: "Tea",    color: "#8BC34A", defaultMl: 200, caffeinated: true  },
  { value: "juice",  label: "Juice",  color: "#FF9800", defaultMl: 250, caffeinated: false },
  { value: "soda",   label: "Soda",   color: "#F44336", defaultMl: 330, caffeinated: false },
  { value: "other",  label: "Other",  color: "#9E9E9E", defaultMl: 200, caffeinated: false },
];

const SUGAR_LEVELS = [
  { value: "none",   label: "None"   },
  { value: "low",    label: "Low"    },
  { value: "medium", label: "Medium" },
  { value: "high",   label: "High"   },
];

const DEFAULT_WATER_GOAL = 2000;

function drinkCfg(value) {
  return DRINK_TYPES.find((d) => d.value === value);
}

function fmtMl(ml) {
  return ml >= 1000 ? `${(ml / 1000).toFixed(1)}L` : `${ml}ml`;
}

function sugarChipColor(level) {
  if (level === "high")   return "error";
  if (level === "medium") return "warning";
  if (level === "low")    return "info";
  return "default";
}

export default function DrinkPage() {
  const { records, add, update, remove } = useHealthData("health_drinks");

  const [waterGoal, setWaterGoal] = useState(() =>
    Number(localStorage.getItem("drink_water_goal") || DEFAULT_WATER_GOAL)
  );
  const [tab, setTab] = useState(0);
  const [open, setOpen] = useState(false);
  const [goalOpen, setGoalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [goalInput, setGoalInput] = useState(String(waterGoal));

  // Form state
  const [date, setDate] = useState(today());
  const [drinkType, setDrinkType] = useState("water");
  const [amountMl, setAmountMl] = useState("250");
  const [sugarLevel, setSugarLevel] = useState("none");
  const [time, setTime] = useState("");
  const [notes, setNotes] = useState("");

  const todayStr = today();

  const todayDrinks = useMemo(
    () =>
      records
        .filter((r) => r.date === todayStr)
        .sort((a, b) => (a.time ?? "00:00").localeCompare(b.time ?? "00:00")),
    [records, todayStr],
  );

  const todayWaterMl = todayDrinks
    .filter((r) => r.drinkType === "water")
    .reduce((s, r) => s + (r.amountMl ?? 0), 0);

  const waterProgress = Math.min(100, (todayWaterMl / waterGoal) * 100);

  const caffeinatedCount = todayDrinks.filter(
    (r) => drinkCfg(r.drinkType)?.caffeinated,
  ).length;

  const sugaryCount = todayDrinks.filter(
    (r) => r.sugarLevel && r.sugarLevel !== "none",
  ).length;

  // Drink totals per type for today summary
  const drinkTotals = useMemo(() => {
    const totals = {};
    todayDrinks.forEach((r) => {
      totals[r.drinkType] = (totals[r.drinkType] ?? 0) + (r.amountMl ?? 0);
    });
    return totals;
  }, [todayDrinks]);

  // Weekly water chart
  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      return toLocalDateStr(d);
    });
  }, []);

  const weekChartData = useMemo(() => {
    const byDate = {};
    records
      .filter((r) => r.drinkType === "water")
      .forEach((r) => {
        byDate[r.date] = (byDate[r.date] ?? 0) + (r.amountMl ?? 0);
      });
    return {
      labels: weekDays.map((d) =>
        new Date(d + "T12:00:00").toLocaleDateString("en-US", { weekday: "short" }).slice(0, 3),
      ),
      values: weekDays.map((d) => byDate[d] ?? 0),
    };
  }, [records, weekDays]);

  const weekWaterAvg = useMemo(() => {
    const nonZero = weekChartData.values.filter((v) => v > 0);
    return nonZero.length ? Math.round(nonZero.reduce((s, v) => s + v, 0) / nonZero.length) : 0;
  }, [weekChartData]);

  // Quick-add: instant add with defaults, no dialog
  async function quickAdd(type) {
    const cfg = drinkCfg(type);
    await add({
      date: todayStr,
      drinkType: type,
      amountMl: cfg?.defaultMl ?? 250,
      sugarLevel: "none",
      time: new Date().toTimeString().slice(0, 5),
      notes: null,
    });
  }

  function openAdd(preset = "water") {
    setEditing(null);
    setDate(todayStr);
    setDrinkType(preset);
    setAmountMl(String(drinkCfg(preset)?.defaultMl ?? 250));
    setSugarLevel("none");
    setTime(new Date().toTimeString().slice(0, 5));
    setNotes("");
    setOpen(true);
  }

  function openEdit(r) {
    setEditing(r);
    setDate(r.date);
    setDrinkType(r.drinkType ?? "water");
    setAmountMl(String(r.amountMl ?? 250));
    setSugarLevel(r.sugarLevel ?? "none");
    setTime(r.time ?? "");
    setNotes(r.notes ?? "");
    setOpen(true);
  }

  async function handleSave() {
    const payload = {
      date,
      drinkType,
      amountMl: Number(amountMl),
      sugarLevel,
      time: time || null,
      notes: notes.trim() || null,
    };
    if (editing) await update(editing.id, payload);
    else await add(payload);
    setOpen(false);
  }

  function saveGoal() {
    const g = Number(goalInput);
    if (g >= 500) {
      setWaterGoal(g);
      localStorage.setItem("drink_water_goal", String(g));
    }
    setGoalOpen(false);
  }

  const canSave = date && amountMl && Number(amountMl) > 0;

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, pb: 10 }}>
      <PageHeader title="Drinks" subtitle="Stay hydrated" />

      {/* Water intake progress */}
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 1 }}>
            <Box>
              <Typography
                variant="h4"
                fontWeight={700}
                color={todayWaterMl >= waterGoal ? "success.main" : "primary.main"}
              >
                {fmtMl(todayWaterMl)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                water goal: {fmtMl(waterGoal)}
              </Typography>
            </Box>
            <IconButton
              size="small"
              onClick={() => {
                setGoalInput(String(waterGoal));
                setGoalOpen(true);
              }}
            >
              <EditIcon fontSize="small" />
            </IconButton>
          </Box>
          <LinearProgress
            variant="determinate"
            value={waterProgress}
            color={waterProgress >= 100 ? "success" : "primary"}
            sx={{ height: 8, borderRadius: 4, mb: 1.5 }}
          />
          <Stack direction="row" spacing={2} flexWrap="wrap">
            <Typography variant="caption" color="text.secondary">
              {Math.round(waterProgress)}% of goal
            </Typography>
            {caffeinatedCount > 0 && (
              <Typography variant="caption" color="text.secondary">
                {caffeinatedCount} caffeinated
              </Typography>
            )}
            {sugaryCount > 0 && (
              <Typography variant="caption" color="warning.main">
                {sugaryCount} sugary
              </Typography>
            )}
          </Stack>

          {/* Per-type breakdown chips */}
          {Object.keys(drinkTotals).length > 0 && (
            <Stack direction="row" spacing={1} flexWrap="wrap" mt={1.5} gap={0.5}>
              {DRINK_TYPES.filter((d) => drinkTotals[d.value]).map((d) => (
                <Chip
                  key={d.value}
                  label={`${d.label} ${fmtMl(drinkTotals[d.value])}`}
                  size="small"
                  sx={{ bgcolor: d.color + "22", color: d.color, fontSize: "0.65rem" }}
                />
              ))}
            </Stack>
          )}
        </CardContent>
      </Card>

      {/* Quick add */}
      <Typography variant="caption" color="text.secondary" fontWeight={600} display="block" mb={0.75}>
        Quick add
      </Typography>
      <Stack direction="row" spacing={1} flexWrap="wrap" gap={1} sx={{ mb: 2 }}>
        <Button
          size="small"
          variant="outlined"
          sx={{ borderColor: "#03A9F4", color: "#03A9F4" }}
          onClick={() => quickAdd("water")}
        >
          + Water (250ml)
        </Button>
        <Button
          size="small"
          variant="outlined"
          sx={{ borderColor: "#795548", color: "#795548" }}
          onClick={() => quickAdd("coffee")}
        >
          + Coffee
        </Button>
        <Button
          size="small"
          variant="outlined"
          sx={{ borderColor: "#8BC34A", color: "#8BC34A" }}
          onClick={() => quickAdd("tea")}
        >
          + Tea
        </Button>
        <Button size="small" variant="outlined" onClick={() => openAdd()}>
          Custom...
        </Button>
      </Stack>

      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2 }}>
        <Tab label="Today" />
        <Tab label="Weekly" />
      </Tabs>

      {/* ── TODAY ── */}
      {tab === 0 &&
        (todayDrinks.length === 0 ? (
          <Card>
            <CardContent sx={{ textAlign: "center", py: 3 }}>
              <Typography color="text.secondary">No drinks logged today.</Typography>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <List disablePadding>
              {todayDrinks.map((r, i) => {
                const cfg = drinkCfg(r.drinkType);
                const color = cfg?.color ?? "#9E9E9E";
                return (
                  <Box key={r.id}>
                    {i > 0 && <Divider />}
                    <ListItem
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
                            <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: color, flexShrink: 0 }} />
                            <Typography variant="body2" fontWeight={600} sx={{ color }}>
                              {cfg?.label ?? r.drinkType}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {fmtMl(r.amountMl ?? 0)}
                            </Typography>
                            {r.sugarLevel && r.sugarLevel !== "none" && (
                              <Chip
                                label={SUGAR_LEVELS.find((s) => s.value === r.sugarLevel)?.label}
                                size="small"
                                color={sugarChipColor(r.sugarLevel)}
                                variant="outlined"
                                sx={{ height: 16, fontSize: "0.6rem" }}
                              />
                            )}
                          </Stack>
                        }
                        secondary={[r.time, r.notes].filter(Boolean).join(" · ")}
                      />
                    </ListItem>
                  </Box>
                );
              })}
            </List>
          </Card>
        ))}

      {/* ── WEEKLY ── */}
      {tab === 1 && (
        <Box>
          <Stack direction="row" spacing={1.5} mb={2}>
            <Card sx={{ flex: 1 }}>
              <CardContent sx={{ py: 1.5, "&:last-child": { pb: 1.5 } }}>
                <Typography variant="h5" fontWeight={700} color="primary.main">
                  {weekWaterAvg ? fmtMl(weekWaterAvg) : "—"}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Avg water/day
                </Typography>
              </CardContent>
            </Card>
            <Card sx={{ flex: 1 }}>
              <CardContent sx={{ py: 1.5, "&:last-child": { pb: 1.5 } }}>
                <Typography
                  variant="h5"
                  fontWeight={700}
                  color={weekWaterAvg >= waterGoal ? "success.main" : weekWaterAvg > 0 ? "warning.main" : "text.secondary"}
                >
                  {weekWaterAvg >= waterGoal ? "On track" : weekWaterAvg > 0 ? "Low" : "—"}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  vs goal
                </Typography>
              </CardContent>
            </Card>
          </Stack>

          <Card sx={{ mb: 2 }}>
            <CardContent>
              <Typography variant="subtitle2" gutterBottom>
                Water intake — last 7 days (goal: {fmtMl(waterGoal)})
              </Typography>
              <BarChart
                xAxis={[{ scaleType: "band", data: weekChartData.labels }]}
                series={[{ data: weekChartData.values, label: "ml water", color: "#03A9F4" }]}
                height={220}
              />
            </CardContent>
          </Card>

          {/* History */}
          {records.length > 0 && (
            <Card>
              <CardContent sx={{ pb: 0 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Recent entries
                </Typography>
              </CardContent>
              <List disablePadding>
                {records.slice(0, 30).map((r, i) => {
                  const cfg = drinkCfg(r.drinkType);
                  const color = cfg?.color ?? "#9E9E9E";
                  return (
                    <Box key={r.id}>
                      {i > 0 && <Divider />}
                      <ListItem
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
                              <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: color, flexShrink: 0 }} />
                              <Typography variant="body2" fontWeight={600} sx={{ color }}>
                                {cfg?.label ?? r.drinkType}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                {fmtMl(r.amountMl ?? 0)}
                              </Typography>
                              {r.sugarLevel && r.sugarLevel !== "none" && (
                                <Chip
                                  label={SUGAR_LEVELS.find((s) => s.value === r.sugarLevel)?.label}
                                  size="small"
                                  color={sugarChipColor(r.sugarLevel)}
                                  variant="outlined"
                                  sx={{ height: 16, fontSize: "0.6rem" }}
                                />
                              )}
                            </Stack>
                          }
                          secondary={[formatDisplayDate(r.date), r.time, r.notes].filter(Boolean).join(" · ")}
                        />
                      </ListItem>
                    </Box>
                  );
                })}
              </List>
            </Card>
          )}
        </Box>
      )}

      <Fab
        color="primary"
        sx={{ position: "fixed", bottom: { xs: 72, md: 24 }, right: 24 }}
        onClick={() => openAdd()}
      >
        <AddIcon />
      </Fab>

      {/* Drink dialog */}
      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle>{editing ? "Edit drink" : "Log drink"}</DialogTitle>
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
                Drink type
              </Typography>
              <Stack direction="row" flexWrap="wrap" gap={0.5}>
                {DRINK_TYPES.map((t) => (
                  <Button
                    key={t.value}
                    size="small"
                    onClick={() => {
                      setDrinkType(t.value);
                      if (!editing) setAmountMl(String(t.defaultMl));
                    }}
                    variant={drinkType === t.value ? "contained" : "outlined"}
                    sx={
                      drinkType === t.value
                        ? { bgcolor: t.color, borderColor: t.color, "&:hover": { bgcolor: t.color } }
                        : { borderColor: t.color, color: t.color }
                    }
                  >
                    {t.label}
                  </Button>
                ))}
              </Stack>
            </Box>
            <TextField
              type="number"
              label="Amount (ml)"
              size="small"
              value={amountMl}
              onChange={(e) => setAmountMl(e.target.value)}
              slotProps={{ input: { inputProps: { min: 10, step: 10 } } }}
            />
            {drinkType !== "water" && (
              <Box>
                <Typography variant="caption" color="text.secondary" display="block" mb={0.75}>
                  Sugar level
                </Typography>
                <Stack direction="row" gap={0.5}>
                  {SUGAR_LEVELS.map((s) => (
                    <Button
                      key={s.value}
                      size="small"
                      variant={sugarLevel === s.value ? "contained" : "outlined"}
                      onClick={() => setSugarLevel(s.value)}
                      sx={{ minWidth: 0, px: 1 }}
                    >
                      {s.label}
                    </Button>
                  ))}
                </Stack>
              </Box>
            )}
            <TextField
              type="time"
              label="Time"
              size="small"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              slotProps={{ inputLabel: { shrink: true } }}
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
          <Button onClick={handleSave} variant="contained" disabled={!canSave}>
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* Water goal dialog */}
      <Dialog open={goalOpen} onClose={() => setGoalOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Daily water goal</DialogTitle>
        <DialogContent>
          <TextField
            type="number"
            label="Goal (ml)"
            size="small"
            value={goalInput}
            onChange={(e) => setGoalInput(e.target.value)}
            slotProps={{ input: { inputProps: { min: 500, max: 10000, step: 100 } } }}
            fullWidth
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setGoalOpen(false)}>Cancel</Button>
          <Button onClick={saveGoal} variant="contained">
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
