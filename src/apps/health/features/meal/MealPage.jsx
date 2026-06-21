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

const MEAL_TYPES = [
  { value: "breakfast", label: "Breakfast", color: "#FF9800" },
  { value: "lunch",     label: "Lunch",     color: "#4CAF50" },
  { value: "dinner",    label: "Dinner",    color: "#2196F3" },
  { value: "snack",     label: "Snack",     color: "#9C27B0" },
  { value: "other",     label: "Other",     color: "#607D8B" },
];

const DEFAULT_GOAL = 2000;

function mealType(value) {
  return MEAL_TYPES.find((t) => t.value === value);
}

export default function MealPage() {
  const { records, add, update, remove } = useHealthData("health_meals");

  const [calorieGoal, setCalorieGoal] = useState(() =>
    Number(localStorage.getItem("meal_calorie_goal") || DEFAULT_GOAL)
  );
  const [tab, setTab] = useState(0);
  const [open, setOpen] = useState(false);
  const [goalOpen, setGoalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [goalInput, setGoalInput] = useState(String(calorieGoal));

  // Form state
  const [date, setDate] = useState(today());
  const [mealTypeVal, setMealTypeVal] = useState("lunch");
  const [name, setName] = useState("");
  const [calories, setCalories] = useState("");
  const [time, setTime] = useState("");
  const [notes, setNotes] = useState("");

  const todayStr = today();

  const todayMeals = useMemo(
    () =>
      records
        .filter((r) => r.date === todayStr)
        .sort((a, b) => (a.time ?? "00:00").localeCompare(b.time ?? "00:00")),
    [records, todayStr],
  );

  const todayCalories = todayMeals.reduce((s, r) => s + (r.calories ?? 0), 0);
  const progress = Math.min(100, (todayCalories / calorieGoal) * 100);
  const snacksToday = todayMeals.filter((r) => r.mealType === "snack").length;
  const mealsToday = todayMeals.filter(
    (r) => r.mealType !== "snack" && r.mealType !== "other",
  ).length;

  // Weekly chart
  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      return toLocalDateStr(d);
    });
  }, []);

  const weekChartData = useMemo(() => {
    const byDate = {};
    records.forEach((r) => {
      byDate[r.date] = (byDate[r.date] ?? 0) + (r.calories ?? 0);
    });
    return {
      labels: weekDays.map((d) =>
        new Date(d + "T12:00:00").toLocaleDateString("en-US", { weekday: "short" }).slice(0, 3),
      ),
      values: weekDays.map((d) => byDate[d] ?? 0),
    };
  }, [records, weekDays]);

  const loggedDays = weekChartData.values.filter((v) => v > 0).length;
  const weekAvg = loggedDays
    ? Math.round(weekChartData.values.reduce((s, v) => s + v, 0) / loggedDays)
    : 0;

  function openAdd(preset = "lunch") {
    setEditing(null);
    setDate(todayStr);
    setMealTypeVal(preset);
    setName("");
    setCalories("");
    setTime(new Date().toTimeString().slice(0, 5));
    setNotes("");
    setOpen(true);
  }

  function openEdit(r) {
    setEditing(r);
    setDate(r.date);
    setMealTypeVal(r.mealType ?? "other");
    setName(r.name ?? "");
    setCalories(r.calories != null ? String(r.calories) : "");
    setTime(r.time ?? "");
    setNotes(r.notes ?? "");
    setOpen(true);
  }

  async function handleSave() {
    const payload = {
      date,
      mealType: mealTypeVal,
      name: name.trim() || null,
      calories: calories ? Number(calories) : null,
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
      setCalorieGoal(g);
      localStorage.setItem("meal_calorie_goal", String(g));
    }
    setGoalOpen(false);
  }

  const canSave = date && (name.trim() || calories);

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, pb: 10 }}>
      <PageHeader title="Meals" subtitle="Daily calorie tracking" />

      {/* Calorie summary */}
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 1 }}>
            <Box>
              <Typography
                variant="h4"
                fontWeight={700}
                color={todayCalories > calorieGoal ? "error.main" : "primary.main"}
              >
                {todayCalories.toLocaleString()} kcal
              </Typography>
              <Typography variant="body2" color="text.secondary">
                goal: {calorieGoal.toLocaleString()} kcal/day
              </Typography>
            </Box>
            <IconButton
              size="small"
              onClick={() => {
                setGoalInput(String(calorieGoal));
                setGoalOpen(true);
              }}
            >
              <EditIcon fontSize="small" />
            </IconButton>
          </Box>
          <LinearProgress
            variant="determinate"
            value={progress}
            color={todayCalories > calorieGoal ? "error" : progress > 80 ? "warning" : "primary"}
            sx={{ height: 8, borderRadius: 4, mb: 1.5 }}
          />
          <Stack direction="row" spacing={2}>
            <Typography variant="caption" color="text.secondary">
              {mealsToday} meal{mealsToday !== 1 ? "s" : ""}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {snacksToday} snack{snacksToday !== 1 ? "s" : ""}
            </Typography>
            <Typography
              variant="caption"
              fontWeight={600}
              color={todayCalories > calorieGoal ? "error.main" : "success.main"}
            >
              {todayCalories > calorieGoal
                ? `${(todayCalories - calorieGoal).toLocaleString()} kcal over`
                : `${(calorieGoal - todayCalories).toLocaleString()} kcal left`}
            </Typography>
          </Stack>
        </CardContent>
      </Card>

      {/* Quick add buttons */}
      <Box sx={{ display: "flex", gap: 1, overflowX: "auto", pb: 0.5, mb: 2 }}>
        {MEAL_TYPES.map((t) => (
          <Button
            key={t.value}
            size="small"
            variant="outlined"
            onClick={() => openAdd(t.value)}
            sx={{ borderColor: t.color, color: t.color, whiteSpace: "nowrap", flexShrink: 0 }}
          >
            + {t.label}
          </Button>
        ))}
      </Box>

      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2 }}>
        <Tab label="Today" />
        <Tab label="Weekly" />
      </Tabs>

      {/* ── TODAY ── */}
      {tab === 0 &&
        (todayMeals.length === 0 ? (
          <Card>
            <CardContent sx={{ textAlign: "center", py: 3 }}>
              <Typography color="text.secondary">No meals logged today.</Typography>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <List disablePadding>
              {todayMeals.map((r, i) => {
                const mt = mealType(r.mealType);
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
                          <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                            <Box
                              sx={{
                                width: 8,
                                height: 8,
                                borderRadius: "50%",
                                bgcolor: mt?.color ?? "#607D8B",
                                flexShrink: 0,
                              }}
                            />
                            <Chip
                              label={mt?.label ?? r.mealType}
                              size="small"
                              sx={{
                                height: 16,
                                fontSize: "0.6rem",
                                bgcolor: (mt?.color ?? "#607D8B") + "22",
                                color: mt?.color ?? "#607D8B",
                              }}
                            />
                            {r.name && (
                              <Typography variant="body2" fontWeight={600}>
                                {r.name}
                              </Typography>
                            )}
                            {r.calories != null && (
                              <Typography variant="body2" color="text.secondary">
                                {r.calories} kcal
                              </Typography>
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
                  {weekAvg > 0 ? weekAvg.toLocaleString() : "—"}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Avg kcal/day
                </Typography>
              </CardContent>
            </Card>
            <Card sx={{ flex: 1 }}>
              <CardContent sx={{ py: 1.5, "&:last-child": { pb: 1.5 } }}>
                <Typography variant="h5" fontWeight={700} color="primary.main">
                  {loggedDays}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Days logged
                </Typography>
              </CardContent>
            </Card>
            <Card sx={{ flex: 1 }}>
              <CardContent sx={{ py: 1.5, "&:last-child": { pb: 1.5 } }}>
                <Typography
                  variant="h5"
                  fontWeight={700}
                  color={weekAvg > calorieGoal ? "error.main" : weekAvg > 0 ? "success.main" : "text.secondary"}
                >
                  {weekAvg > 0 ? (weekAvg <= calorieGoal ? "On track" : "Over") : "—"}
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
                Calories — last 7 days (goal: {calorieGoal.toLocaleString()} kcal)
              </Typography>
              <BarChart
                xAxis={[{ scaleType: "band", data: weekChartData.labels }]}
                series={[{ data: weekChartData.values, label: "kcal", color: "#FF9800" }]}
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
                  const mt = mealType(r.mealType);
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
                            <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                              <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: mt?.color ?? "#607D8B", flexShrink: 0 }} />
                              <Chip
                                label={mt?.label ?? r.mealType}
                                size="small"
                                sx={{ height: 16, fontSize: "0.6rem", bgcolor: (mt?.color ?? "#607D8B") + "22", color: mt?.color ?? "#607D8B" }}
                              />
                              {r.name && <Typography variant="body2" fontWeight={600}>{r.name}</Typography>}
                              {r.calories != null && (
                                <Typography variant="body2" color="text.secondary">{r.calories} kcal</Typography>
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

      {/* Meal dialog */}
      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle>{editing ? "Edit meal" : "Log meal"}</DialogTitle>
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
                Meal type
              </Typography>
              <Stack direction="row" flexWrap="wrap" gap={0.5}>
                {MEAL_TYPES.map((t) => (
                  <Button
                    key={t.value}
                    size="small"
                    onClick={() => setMealTypeVal(t.value)}
                    variant={mealTypeVal === t.value ? "contained" : "outlined"}
                    sx={
                      mealTypeVal === t.value
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
              label="What did you eat?"
              size="small"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <TextField
              type="number"
              label="Calories (kcal)"
              size="small"
              value={calories}
              onChange={(e) => setCalories(e.target.value)}
              slotProps={{ input: { inputProps: { min: 0, step: 10 } } }}
            />
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

      {/* Goal dialog */}
      <Dialog open={goalOpen} onClose={() => setGoalOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Daily calorie goal</DialogTitle>
        <DialogContent>
          <TextField
            type="number"
            label="Kcal per day"
            size="small"
            value={goalInput}
            onChange={(e) => setGoalInput(e.target.value)}
            slotProps={{ input: { inputProps: { min: 500, max: 10000, step: 50 } } }}
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
