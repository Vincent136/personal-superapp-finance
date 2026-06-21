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
  Grid,
  IconButton,
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
import StarIcon from "@mui/icons-material/Star";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import { BarChart } from "@mui/x-charts/BarChart";
import { LineChart } from "@mui/x-charts/LineChart";
import PageHeader from "../../../../components/common/PageHeader";
import LogSleepDialog from "./LogSleepDialog";
import { useHealthData } from "../../hooks/useHealthData";
import { toLocalDateStr, today, formatDisplayDate, getMonthDays, getYearMonths } from "../../utils/dates";

const GOAL_HOURS = 8;
const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const NAP_QUALITY_LABELS = ["", "Bad", "Fair", "Good", "Great", "Excellent"];

// ─── night sleep helpers ─────────────────────────────────────────────────────

function calcStats(recs) {
  if (!recs.length) return null;
  const avg = (arr) => arr.reduce((s, v) => s + v, 0) / arr.length;
  const hours = recs.map((r) => r.durationHours);
  const qualities = recs.map((r) => r.quality).filter(Boolean);
  const metGoal = recs.filter((r) => r.durationHours >= GOAL_HOURS);
  return {
    count: recs.length,
    avgHours: avg(hours),
    avgQuality: qualities.length ? avg(qualities) : null,
    bestHours: Math.max(...hours),
    worstHours: Math.min(...hours),
    goalsMetCount: metGoal.length,
    goalRate: (metGoal.length / recs.length) * 100,
    sleepDebt: recs.reduce((s, r) => s + Math.max(0, GOAL_HOURS - r.durationHours), 0),
  };
}

function sleepColor(hours) {
  return hours >= GOAL_HOURS ? "success.main" : hours >= 6 ? "warning.main" : "error.main";
}

function QualityStars({ quality }) {
  return (
    <Stack direction="row" spacing={0.25}>
      {[1, 2, 3, 4, 5].map((s) => (
        <StarIcon key={s} sx={{ fontSize: 14, color: s <= quality ? "warning.main" : "action.disabled" }} />
      ))}
    </Stack>
  );
}

function StatCard({ label, value, sub, color = "primary.main" }) {
  return (
    <Card>
      <CardContent sx={{ py: 1.5, "&:last-child": { pb: 1.5 } }}>
        <Typography variant="h6" fontWeight={700} color={color} lineHeight={1.2}>
          {value}
        </Typography>
        {sub && (
          <Typography variant="caption" color="text.secondary" display="block">
            {sub}
          </Typography>
        )}
        <Typography variant="caption" color="text.secondary" display="block" mt={0.25}>
          {label}
        </Typography>
      </CardContent>
    </Card>
  );
}

function StatsGrid({ stats, emptyLabel }) {
  if (!stats) {
    return (
      <Card sx={{ mb: 2 }}>
        <CardContent sx={{ textAlign: "center", py: 3 }}>
          <Typography color="text.secondary">No sleep data {emptyLabel}.</Typography>
        </CardContent>
      </Card>
    );
  }
  return (
    <Grid container spacing={1.5} sx={{ mb: 2 }}>
      <Grid item xs={6}>
        <StatCard label="Avg Sleep" value={`${stats.avgHours.toFixed(1)}h`} color={sleepColor(stats.avgHours)} />
      </Grid>
      <Grid item xs={6}>
        <StatCard
          label="Avg Quality"
          value={stats.avgQuality != null ? `${stats.avgQuality.toFixed(1)} ★` : "—"}
          color="warning.main"
        />
      </Grid>
      <Grid item xs={6}>
        <StatCard
          label="Goal Rate (≥8h)"
          value={`${Math.round(stats.goalRate)}%`}
          sub={`${stats.goalsMetCount} of ${stats.count} nights`}
          color={stats.goalRate >= 70 ? "success.main" : "error.main"}
        />
      </Grid>
      <Grid item xs={6}>
        <StatCard
          label="Sleep Debt"
          value={`${stats.sleepDebt.toFixed(1)}h`}
          sub="vs 8h goal"
          color={stats.sleepDebt > 0 ? "error.main" : "success.main"}
        />
      </Grid>
      <Grid item xs={6}>
        <StatCard label="Best Night" value={`${stats.bestHours}h`} color="success.main" />
      </Grid>
      <Grid item xs={6}>
        <StatCard label="Nights Logged" value={stats.count} />
      </Grid>
    </Grid>
  );
}

// ─── nap helpers ─────────────────────────────────────────────────────────────

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

function NapStars({ n }) {
  return (
    <Stack direction="row" spacing={0.25}>
      {[1, 2, 3, 4, 5].map((i) => (
        <StarIcon key={i} sx={{ fontSize: 12, color: i <= n ? "warning.main" : "action.disabled" }} />
      ))}
    </Stack>
  );
}

function NapQualityPicker({ value, onChange }) {
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
          {NAP_QUALITY_LABELS[q]}
        </Button>
      ))}
    </Stack>
  );
}

// ─── main page ───────────────────────────────────────────────────────────────

export default function SleepPage() {
  // ── Night sleep ──────────────────────────────────────────────────────────
  const { records, add, update, remove } = useHealthData("health_sleep");
  const [section, setSection] = useState(0); // 0=Night, 1=Nap
  const [tab, setTab] = useState(0);
  const [monthOffset, setMonthOffset] = useState(0);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);

  const sorted = useMemo(
    () => [...records].sort((a, b) => b.date.localeCompare(a.date)),
    [records],
  );

  const todayRecord = sorted.find((r) => r.date === today());

  const weekDays = useMemo(() => {
    const ref = new Date();
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(ref);
      d.setDate(ref.getDate() - (6 - i));
      return {
        dateStr: toLocalDateStr(d),
        label: d.toLocaleDateString("en-US", { weekday: "short" }).slice(0, 3),
      };
    });
  }, []);

  const weekRecords = useMemo(
    () => records.filter((r) => weekDays.some((d) => d.dateStr === r.date)),
    [records, weekDays],
  );

  const weekStats = useMemo(() => calcStats(weekRecords), [weekRecords]);

  const weekChartData = useMemo(() => ({
    labels: weekDays.map((d) => d.label),
    hours: weekDays.map((d) => records.find((r) => r.date === d.dateStr)?.durationHours ?? null),
    quality: weekDays.map((d) => records.find((r) => r.date === d.dateStr)?.quality ?? null),
  }), [weekDays, records]);

  const targetMonth = useMemo(() => {
    const d = new Date();
    d.setDate(1);
    d.setMonth(d.getMonth() + monthOffset);
    return d;
  }, [monthOffset]);

  const monthPrefix = `${targetMonth.getFullYear()}-${String(targetMonth.getMonth() + 1).padStart(2, "0")}`;
  const monthLabel = targetMonth.toLocaleDateString("en-US", { month: "long", year: "numeric" });

  const monthRecords = useMemo(
    () => records.filter((r) => r.date.startsWith(monthPrefix)),
    [records, monthPrefix],
  );

  const monthStats = useMemo(() => calcStats(monthRecords), [monthRecords]);

  const monthChartData = useMemo(() => {
    const days = getMonthDays(targetMonth);
    const byDate = Object.fromEntries(records.map((r) => [r.date, r]));
    return {
      labels: days.map((d) => String(parseInt(d.slice(8), 10))),
      hours: days.map((d) => byDate[d]?.durationHours ?? null),
      quality: days.map((d) => byDate[d]?.quality ?? null),
    };
  }, [records, targetMonth]);

  const currentYear = new Date().getFullYear();
  const yearMonths = useMemo(() => getYearMonths(), []);

  const yearRecords = useMemo(
    () => records.filter((r) => r.date.startsWith(String(currentYear))),
    [records, currentYear],
  );

  const yearStats = useMemo(() => calcStats(yearRecords), [yearRecords]);

  const yearChartData = useMemo(() => {
    const avgHours = yearMonths.map((mo) => {
      const recs = records.filter((r) => r.date.startsWith(mo));
      if (!recs.length) return null;
      return Math.round((recs.reduce((s, r) => s + r.durationHours, 0) / recs.length) * 10) / 10;
    });
    const avgQuality = yearMonths.map((mo) => {
      const recs = records.filter((r) => r.date.startsWith(mo));
      if (!recs.length) return null;
      return Math.round((recs.reduce((s, r) => s + (r.quality ?? 0), 0) / recs.length) * 10) / 10;
    });
    const bestMonth = MONTH_NAMES[
      avgHours.reduce((bestIdx, v, i) => (v != null && (bestIdx === -1 || v > avgHours[bestIdx]) ? i : bestIdx), -1)
    ];
    return { avgHours, avgQuality, bestMonth };
  }, [records, yearMonths]);

  function openEdit(rec) {
    setEditingRecord(rec);
    setDialogOpen(true);
  }

  function handleSave(data) {
    if (editingRecord) update(editingRecord.id, data);
    else add(data);
    setEditingRecord(null);
  }

  function handleClose() {
    setDialogOpen(false);
    setEditingRecord(null);
  }

  // ── Nap ─────────────────────────────────────────────────────────────────
  const { records: napRecords, add: napAdd, update: napUpdate, remove: napRemove } = useHealthData("health_noon_sleep");
  const [napOpen, setNapOpen] = useState(false);
  const [napEditing, setNapEditing] = useState(null);
  const [napDate, setNapDate] = useState(today());
  const [napStartTime, setNapStartTime] = useState("13:00");
  const [napDurationMinutes, setNapDurationMinutes] = useState("20");
  const [napQuality, setNapQuality] = useState(3);
  const [napNotes, setNapNotes] = useState("");

  const napDays7 = useMemo(() => lastNDays(7), []);
  const napDays14 = useMemo(() => lastNDays(14), []);

  const todayNaps = useMemo(
    () => napRecords.filter((r) => r.date === today()),
    [napRecords],
  );

  const napWeek = useMemo(
    () => napRecords.filter((r) => napDays7.includes(r.date)),
    [napRecords, napDays7],
  );

  const napAvgDuration = napWeek.length
    ? Math.round(napWeek.reduce((s, r) => s + (r.durationMinutes ?? 0), 0) / napWeek.length)
    : 0;

  const napAvgQuality = napWeek.length
    ? napWeek.reduce((s, r) => s + (r.quality ?? 0), 0) / napWeek.length
    : 0;

  const napChartData = useMemo(
    () =>
      napDays14.map((d) => ({
        day: d.slice(5),
        minutes: napRecords.filter((r) => r.date === d).reduce((s, r) => s + (r.durationMinutes ?? 0), 0),
      })),
    [napRecords, napDays14],
  );

  function openNapAdd() {
    setNapEditing(null);
    setNapDate(today());
    setNapStartTime("13:00");
    setNapDurationMinutes("20");
    setNapQuality(3);
    setNapNotes("");
    setNapOpen(true);
  }

  function openNapEdit(r) {
    setNapEditing(r);
    setNapDate(r.date);
    setNapStartTime(r.startTime ?? "13:00");
    setNapDurationMinutes(String(r.durationMinutes ?? 20));
    setNapQuality(r.quality ?? 3);
    setNapNotes(r.notes ?? "");
    setNapOpen(true);
  }

  async function handleNapSave() {
    const payload = {
      date: napDate,
      startTime: napStartTime,
      durationMinutes: Number(napDurationMinutes),
      quality: napQuality,
      notes: napNotes.trim() || null,
    };
    if (napEditing) await napUpdate(napEditing.id, payload);
    else await napAdd(payload);
    setNapOpen(false);
  }

  // ── render ───────────────────────────────────────────────────────────────
  return (
    <Box sx={{ p: { xs: 2, md: 3 }, pb: 10 }}>
      <PageHeader
        title="Sleep"
        subtitle={section === 0 ? `Goal: ${GOAL_HOURS}h per night` : "Track your midday naps"}
      />

      {/* Top-level section: Night / Nap */}
      <Tabs value={section} onChange={(_, v) => setSection(v)} sx={{ mb: 2 }}>
        <Tab label="Night" />
        <Tab label="Nap" />
      </Tabs>

      {/* ══ NIGHT SLEEP ══ */}
      {section === 0 && (
        <Box>
          {/* Last night card */}
          <Card sx={{ mb: 2 }}>
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Last night
              </Typography>
              {todayRecord ? (
                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <Box>
                    <Typography variant="h4" fontWeight={700} color={sleepColor(todayRecord.durationHours)}>
                      {todayRecord.durationHours}h
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {todayRecord.bedtime} → {todayRecord.wakeTime}
                    </Typography>
                    <QualityStars quality={todayRecord.quality} />
                  </Box>
                  <IconButton onClick={() => openEdit(todayRecord)}>
                    <EditIcon />
                  </IconButton>
                </Box>
              ) : (
                <Box sx={{ textAlign: "center", py: 1 }}>
                  <Typography color="text.secondary" gutterBottom>
                    Not logged yet.
                  </Typography>
                  <Button variant="outlined" startIcon={<AddIcon />} onClick={() => setDialogOpen(true)}>
                    Log Sleep
                  </Button>
                </Box>
              )}
            </CardContent>
          </Card>

          {/* Time period tabs */}
          <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2 }}>
            <Tab label="Week" />
            <Tab label="Month" />
            <Tab label="Year" />
          </Tabs>

          {/* ── WEEK ── */}
          {tab === 0 && (
            <Box>
              <StatsGrid stats={weekStats} emptyLabel="in the last 7 nights" />
              <Card sx={{ mb: 2 }}>
                <CardContent>
                  <Typography variant="subtitle2" gutterBottom>
                    Sleep duration — last 7 nights
                  </Typography>
                  <BarChart
                    xAxis={[{ scaleType: "band", data: weekChartData.labels }]}
                    series={[{ data: weekChartData.hours, label: "Hours", color: "#1976d2" }]}
                    height={200}
                  />
                </CardContent>
              </Card>
              {weekChartData.quality.some((v) => v != null) && (
                <Card sx={{ mb: 2 }}>
                  <CardContent>
                    <Typography variant="subtitle2" gutterBottom>
                      Sleep quality — last 7 nights
                    </Typography>
                    <LineChart
                      xAxis={[{ scaleType: "band", data: weekChartData.labels }]}
                      series={[{ data: weekChartData.quality, label: "Quality (1–5)", color: "#f59e0b", connectNulls: true }]}
                      yAxis={[{ min: 0, max: 5 }]}
                      height={160}
                    />
                  </CardContent>
                </Card>
              )}
            </Box>
          )}

          {/* ── MONTH ── */}
          {tab === 1 && (
            <Box>
              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", mb: 2, gap: 1 }}>
                <IconButton onClick={() => setMonthOffset((v) => v - 1)}>
                  <ChevronLeftIcon />
                </IconButton>
                <Typography variant="subtitle1" fontWeight={600} minWidth={160} textAlign="center">
                  {monthLabel}
                </Typography>
                <IconButton onClick={() => setMonthOffset((v) => v + 1)} disabled={monthOffset >= 0}>
                  <ChevronRightIcon />
                </IconButton>
              </Box>
              <StatsGrid stats={monthStats} emptyLabel={`in ${monthLabel}`} />
              <Card sx={{ mb: 2 }}>
                <CardContent>
                  <Typography variant="subtitle2" gutterBottom>
                    Sleep duration — each night
                  </Typography>
                  <BarChart
                    xAxis={[{ scaleType: "band", data: monthChartData.labels }]}
                    series={[{ data: monthChartData.hours, label: "Hours", color: "#1976d2" }]}
                    height={200}
                  />
                </CardContent>
              </Card>
              {monthChartData.quality.some((v) => v != null) && (
                <Card sx={{ mb: 2 }}>
                  <CardContent>
                    <Typography variant="subtitle2" gutterBottom>
                      Sleep quality — each night
                    </Typography>
                    <LineChart
                      xAxis={[{ scaleType: "band", data: monthChartData.labels }]}
                      series={[{ data: monthChartData.quality, label: "Quality (1–5)", color: "#f59e0b", connectNulls: true }]}
                      yAxis={[{ min: 0, max: 5 }]}
                      height={160}
                    />
                  </CardContent>
                </Card>
              )}
            </Box>
          )}

          {/* ── YEAR ── */}
          {tab === 2 && (
            <Box>
              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
                <Typography variant="subtitle1" fontWeight={600}>
                  {currentYear}
                </Typography>
                {yearChartData.bestMonth && (
                  <Chip label={`Best: ${yearChartData.bestMonth}`} color="success" size="small" variant="outlined" />
                )}
              </Box>
              <StatsGrid stats={yearStats} emptyLabel={`in ${currentYear}`} />
              <Card sx={{ mb: 2 }}>
                <CardContent>
                  <Typography variant="subtitle2" gutterBottom>
                    Avg sleep per month (h)
                  </Typography>
                  <BarChart
                    xAxis={[{ scaleType: "band", data: MONTH_NAMES }]}
                    series={[{ data: yearChartData.avgHours, label: "Avg Hours", color: "#1976d2" }]}
                    height={200}
                  />
                </CardContent>
              </Card>
              {yearChartData.avgQuality.some((v) => v != null) && (
                <Card sx={{ mb: 2 }}>
                  <CardContent>
                    <Typography variant="subtitle2" gutterBottom>
                      Avg quality per month
                    </Typography>
                    <LineChart
                      xAxis={[{ scaleType: "band", data: MONTH_NAMES }]}
                      series={[{ data: yearChartData.avgQuality, label: "Avg Quality", color: "#f59e0b", connectNulls: true }]}
                      yAxis={[{ min: 0, max: 5 }]}
                      height={160}
                    />
                  </CardContent>
                </Card>
              )}
            </Box>
          )}

          {/* Night history */}
          {sorted.length > 0 && (
            <Card sx={{ mt: 1 }}>
              <CardContent sx={{ pb: 0 }}>
                <Typography variant="subtitle2" gutterBottom>
                  History
                </Typography>
              </CardContent>
              <List disablePadding>
                {sorted.map((rec, i) => (
                  <Box key={rec.id}>
                    {i > 0 && <Divider />}
                    <ListItem
                      secondaryAction={
                        <Stack direction="row">
                          <IconButton size="small" onClick={() => openEdit(rec)}>
                            <EditIcon fontSize="small" />
                          </IconButton>
                          <IconButton size="small" onClick={() => remove(rec.id)}>
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Stack>
                      }
                    >
                      <ListItemText
                        primary={
                          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                            <Typography variant="body1" fontWeight={600} color={sleepColor(rec.durationHours)}>
                              {rec.durationHours}h
                            </Typography>
                            <QualityStars quality={rec.quality} />
                          </Box>
                        }
                        secondary={`${formatDisplayDate(rec.date)} · ${rec.bedtime} → ${rec.wakeTime}${rec.notes ? ` · ${rec.notes}` : ""}`}
                      />
                    </ListItem>
                  </Box>
                ))}
              </List>
            </Card>
          )}
        </Box>
      )}

      {/* ══ NAP ══ */}
      {section === 1 && (
        <Box>
          {/* Today's naps */}
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
                      {r.quality != null && <NapStars n={r.quality} />}
                    </Stack>
                  ))}
                </Stack>
              )}
            </CardContent>
          </Card>

          {/* Nap stats */}
          <Stack direction="row" spacing={1.5} sx={{ mb: 3 }}>
            <Card sx={{ flex: 1 }}>
              <CardContent sx={{ py: 1.5, "&:last-child": { pb: 1.5 } }}>
                <Typography variant="h5" fontWeight={700} color="primary.main">
                  {napWeek.length}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Naps this week
                </Typography>
              </CardContent>
            </Card>
            <Card sx={{ flex: 1 }}>
              <CardContent sx={{ py: 1.5, "&:last-child": { pb: 1.5 } }}>
                <Typography variant="h5" fontWeight={700} color="primary.main">
                  {napAvgDuration ? fmtDuration(napAvgDuration) : "—"}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Avg duration
                </Typography>
              </CardContent>
            </Card>
            <Card sx={{ flex: 1 }}>
              <CardContent sx={{ py: 1.5, "&:last-child": { pb: 1.5 } }}>
                <Typography variant="h5" fontWeight={700} color="primary.main">
                  {napAvgQuality ? napAvgQuality.toFixed(1) : "—"}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Avg quality
                </Typography>
              </CardContent>
            </Card>
          </Stack>

          {/* Nap chart */}
          <Typography variant="subtitle2" gutterBottom>
            Last 14 days (minutes)
          </Typography>
          <BarChart
            dataset={napChartData}
            xAxis={[{ scaleType: "band", dataKey: "day" }]}
            series={[{ dataKey: "minutes", label: "Nap min", color: "#7986CB" }]}
            height={200}
            margin={{ top: 8, right: 8, bottom: 30, left: 40 }}
            sx={{ mb: 3 }}
          />

          {/* Nap history */}
          <Typography variant="subtitle2" gutterBottom>
            History
          </Typography>
          {napRecords.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              No naps logged yet.
            </Typography>
          ) : (
            <List disablePadding>
              {napRecords.map((r) => (
                <ListItem
                  key={r.id}
                  divider
                  secondaryAction={
                    <Stack direction="row">
                      <IconButton size="small" onClick={() => openNapEdit(r)}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton size="small" onClick={() => napRemove(r.id)}>
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
                        {r.quality != null && <NapStars n={r.quality} />}
                      </Stack>
                    }
                    secondary={[formatDisplayDate(r.date), r.startTime, r.notes].filter(Boolean).join(" · ")}
                  />
                </ListItem>
              ))}
            </List>
          )}
        </Box>
      )}

      {/* FAB — switches action based on active section */}
      <Fab
        color="primary"
        sx={{ position: "fixed", bottom: { xs: 72, md: 24 }, right: 24 }}
        onClick={section === 0 ? () => setDialogOpen(true) : openNapAdd}
      >
        <AddIcon />
      </Fab>

      {/* Night sleep dialog */}
      <LogSleepDialog
        open={dialogOpen}
        onClose={handleClose}
        onSave={handleSave}
        initial={editingRecord}
      />

      {/* Nap dialog */}
      <Dialog open={napOpen} onClose={() => setNapOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle>{napEditing ? "Edit nap" : "Log nap"}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              type="date"
              label="Date"
              size="small"
              value={napDate}
              onChange={(e) => setNapDate(e.target.value)}
              slotProps={{ inputLabel: { shrink: true } }}
            />
            <TextField
              type="time"
              label="Start time"
              size="small"
              value={napStartTime}
              onChange={(e) => setNapStartTime(e.target.value)}
              slotProps={{ inputLabel: { shrink: true } }}
            />
            <TextField
              type="number"
              label="Duration (minutes)"
              size="small"
              value={napDurationMinutes}
              onChange={(e) => setNapDurationMinutes(e.target.value)}
              slotProps={{ input: { inputProps: { min: 5, max: 240, step: 5 } } }}
            />
            <Box>
              <Typography variant="caption" color="text.secondary" display="block" mb={0.75}>
                Quality
              </Typography>
              <NapQualityPicker value={napQuality} onChange={setNapQuality} />
            </Box>
            <TextField
              label="Notes (optional)"
              size="small"
              multiline
              rows={2}
              value={napNotes}
              onChange={(e) => setNapNotes(e.target.value)}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setNapOpen(false)}>Cancel</Button>
          <Button onClick={handleNapSave} variant="contained">
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
