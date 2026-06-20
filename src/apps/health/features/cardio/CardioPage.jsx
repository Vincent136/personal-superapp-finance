import { useState, useMemo } from "react";
import {
  Box,
  Card,
  CardContent,
  Chip,
  Divider,
  Fab,
  IconButton,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Stack,
  Tab,
  Tabs,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import WhatshotIcon from "@mui/icons-material/Whatshot";
import { BarChart } from "@mui/x-charts/BarChart";
import PageHeader from "../../../../components/common/PageHeader";
import LogCardioDialog from "./LogCardioDialog";
import { useHealthData } from "../../hooks/useHealthData";
import {
  today,
  getWeekDays,
  getMonthDays,
  getYearMonths,
  calcStreak,
} from "../../utils/dates";
import { TYPE_CONFIG, ORDERED_TYPES } from "./cardioConfig";

const DAY_LABELS   = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function StatCard({ label, value, unit }) {
  return (
    <Card sx={{ flex: 1, textAlign: "center" }}>
      <CardContent sx={{ py: 1.5, "&:last-child": { pb: 1.5 } }}>
        <Typography variant="h4" fontWeight={700} color="primary">
          {value}
        </Typography>
        {unit && (
          <Typography variant="caption" color="text.secondary" display="block">
            {unit}
          </Typography>
        )}
        <Typography variant="body2" color="text.secondary" mt={0.25}>
          {label}
        </Typography>
      </CardContent>
    </Card>
  );
}

function getSessionType(r) {
  return r.type ?? "stairs";
}

// Return the primary metric for a record based on its type
function metricOf(r) {
  const cfg = TYPE_CONFIG[getSessionType(r)];
  return cfg ? cfg.getMetric(r) : 0;
}

export default function CardioPage() {
  const { records, add, remove } = useHealthData("health_cardio");
  const [timePeriod, setTimePeriod] = useState(0); // 0=Today 1=Week 2=Month 3=Year
  const [typeFilter, setTypeFilter] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);

  const todayStr = today();
  const streak = useMemo(() => calcStreak(records), [records]);

  const filtered = useMemo(
    () => (typeFilter === "all" ? records : records.filter((r) => getSessionType(r) === typeFilter)),
    [records, typeFilter],
  );

  const todaySessions = useMemo(
    () => filtered.filter((r) => r.date === todayStr),
    [filtered, todayStr],
  );

  // Today stats
  const todayStats = useMemo(() => {
    if (typeFilter === "stairs") {
      const up = todaySessions.reduce((s, r) => s + (r.floorsUp ?? r.floorsClimbed ?? 0), 0);
      const down = todaySessions.reduce((s, r) => s + (r.floorsDown ?? 0), 0);
      return [
        { label: "Floors up",   value: `↑ ${up}`   },
        { label: "Floors down", value: `↓ ${down}` },
      ];
    }
    if (typeFilter === "all") {
      const sessions = todaySessions.length;
      const minutes = todaySessions.reduce((s, r) => s + (r.durationMinutes ?? 0), 0);
      return [
        { label: "Sessions",       value: sessions },
        { label: "Active minutes", value: minutes || "—" },
      ];
    }
    const cfg = TYPE_CONFIG[typeFilter];
    const minutes = todaySessions.reduce((s, r) => s + (r.durationMinutes ?? 0), 0);
    const km = todaySessions.reduce((s, r) => s + (r.distanceKm ?? 0), 0);
    return [
      { label: "Minutes",  value: minutes || "—" },
      { label: "Distance", value: km ? `${km} km` : "—" },
    ];
  }, [todaySessions, typeFilter]);

  // Aggregate metric function for charts
  const getChartMetric = useMemo(() => {
    if (typeFilter === "all") return () => 1; // count sessions
    return metricOf;
  }, [typeFilter]);

  const chartLabel = useMemo(() => {
    if (typeFilter === "all") return "Sessions";
    return TYPE_CONFIG[typeFilter]?.chartLabel ?? "Value";
  }, [typeFilter]);

  // Weekly
  const weeklyData = useMemo(() => {
    const days = getWeekDays();
    const byDate = {};
    filtered.forEach((r) => { byDate[r.date] = (byDate[r.date] ?? 0) + getChartMetric(r); });
    return { labels: DAY_LABELS, values: days.map((d) => byDate[d] ?? 0) };
  }, [filtered, getChartMetric]);

  // Monthly
  const monthlyData = useMemo(() => {
    const days = getMonthDays();
    const byDate = {};
    filtered.forEach((r) => { byDate[r.date] = (byDate[r.date] ?? 0) + getChartMetric(r); });
    return {
      labels: days.map((d) => String(parseInt(d.slice(8), 10))),
      values: days.map((d) => byDate[d] ?? 0),
    };
  }, [filtered, getChartMetric]);

  // Yearly
  const yearlyData = useMemo(() => {
    const months = getYearMonths();
    const byMonth = {};
    filtered.forEach((r) => {
      const mo = r.date.slice(0, 7);
      byMonth[mo] = (byMonth[mo] ?? 0) + getChartMetric(r);
    });
    return { labels: MONTH_LABELS, values: months.map((m) => byMonth[m] ?? 0) };
  }, [filtered, getChartMetric]);

  const weekTotal = weeklyData.values.reduce((s, v) => s + v, 0);
  const weekActiveDays = weeklyData.values.filter((v) => v > 0).length;
  const monthTotal = monthlyData.values.reduce((s, v) => s + v, 0);
  const yearTotal = yearlyData.values.reduce((s, v) => s + v, 0);

  const activeColor = typeFilter !== "all" ? TYPE_CONFIG[typeFilter]?.color : undefined;

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, pb: 10 }}>
      <PageHeader
        title="Cardio"
        subtitle="Track every workout"
        action={
          <Chip
            icon={<WhatshotIcon />}
            label={`${streak} day streak`}
            color={streak > 0 ? "warning" : "default"}
            variant={streak > 0 ? "filled" : "outlined"}
          />
        }
      />

      {/* Activity type filter */}
      <Box sx={{ display: "flex", gap: 1, overflowX: "auto", pb: 0.5, mb: 2, flexShrink: 0 }}>
        <Chip
          label="All"
          onClick={() => setTypeFilter("all")}
          color={typeFilter === "all" ? "primary" : "default"}
          variant={typeFilter === "all" ? "filled" : "outlined"}
        />
        {ORDERED_TYPES.map((t) => {
          const { label, Icon, color } = TYPE_CONFIG[t];
          return (
            <Chip
              key={t}
              icon={<Icon style={{ color: typeFilter === t ? undefined : color }} />}
              label={label}
              onClick={() => setTypeFilter(t)}
              sx={
                typeFilter === t
                  ? { bgcolor: color, color: "#fff", "& .MuiChip-icon": { color: "#fff" }, border: "none" }
                  : { borderColor: color }
              }
              variant={typeFilter === t ? "filled" : "outlined"}
            />
          );
        })}
      </Box>

      {/* Time period tabs */}
      <Tabs value={timePeriod} onChange={(_, v) => setTimePeriod(v)} sx={{ mb: 2 }}>
        <Tab label="Today" />
        <Tab label="Week" />
        <Tab label="Month" />
        <Tab label="Year" />
      </Tabs>

      {/* TODAY */}
      {timePeriod === 0 && (
        <Box>
          <Stack direction="row" spacing={1.5} mb={2}>
            {todayStats.map((s) => (
              <StatCard key={s.label} label={s.label} value={s.value} />
            ))}
          </Stack>

          {todaySessions.length === 0 ? (
            <Card>
              <CardContent sx={{ textAlign: "center", py: 4 }}>
                <Typography color="text.secondary">No sessions logged today.</Typography>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <List disablePadding>
                {todaySessions.map((session, i) => {
                  const cfg = TYPE_CONFIG[getSessionType(session)];
                  const Icon = cfg?.Icon;
                  return (
                    <Box key={session.id}>
                      {i > 0 && <Divider />}
                      <ListItem
                        secondaryAction={
                          <IconButton edge="end" onClick={() => remove(session.id)}>
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        }
                      >
                        {Icon && (
                          <ListItemIcon sx={{ minWidth: 36 }}>
                            <Icon fontSize="small" sx={{ color: cfg.color }} />
                          </ListItemIcon>
                        )}
                        <ListItemText
                          primary={
                            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                              <Typography variant="body2" fontWeight={600} sx={{ color: cfg?.color }}>
                                {cfg?.label}
                              </Typography>
                              <Typography variant="body2">{cfg?.getSummary(session)}</Typography>
                            </Box>
                          }
                          secondary={new Date(session.createdAt).toLocaleTimeString("en-US", {
                            hour: "2-digit",
                            minute: "2-digit",
                          }) + (session.notes ? ` · ${session.notes}` : "")}
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

      {/* WEEK */}
      {timePeriod === 1 && (
        <Box>
          <Stack direction="row" spacing={1.5} mb={2}>
            <StatCard label={`${chartLabel} this week`} value={weekTotal} />
            <StatCard label="Active days" value={`${weekActiveDays}/7`} />
          </Stack>
          <Card>
            <CardContent>
              <Typography variant="subtitle2" mb={1}>
                {chartLabel} per day
              </Typography>
              <BarChart
                xAxis={[{ scaleType: "band", data: weeklyData.labels }]}
                series={[{ data: weeklyData.values, label: chartLabel, color: activeColor }]}
                height={220}
              />
            </CardContent>
          </Card>
        </Box>
      )}

      {/* MONTH */}
      {timePeriod === 2 && (
        <Box>
          <Stack direction="row" spacing={1.5} mb={2}>
            <StatCard label={`${chartLabel} this month`} value={monthTotal} />
            <StatCard label="Days active" value={monthlyData.values.filter((v) => v > 0).length} />
          </Stack>
          <Card>
            <CardContent>
              <Typography variant="subtitle2" mb={1}>
                {chartLabel} per day
              </Typography>
              <BarChart
                xAxis={[{ scaleType: "band", data: monthlyData.labels }]}
                series={[{ data: monthlyData.values, label: chartLabel, color: activeColor }]}
                height={220}
              />
            </CardContent>
          </Card>
        </Box>
      )}

      {/* YEAR */}
      {timePeriod === 3 && (
        <Box>
          <Stack direction="row" spacing={1.5} mb={2}>
            <StatCard label={`${chartLabel} this year`} value={yearTotal} />
            <StatCard label="Active months" value={yearlyData.values.filter((v) => v > 0).length} />
          </Stack>
          <Card>
            <CardContent>
              <Typography variant="subtitle2" mb={1}>
                {chartLabel} per month
              </Typography>
              <BarChart
                xAxis={[{ scaleType: "band", data: yearlyData.labels }]}
                series={[{ data: yearlyData.values, label: chartLabel, color: activeColor }]}
                height={220}
              />
            </CardContent>
          </Card>
        </Box>
      )}

      <Fab
        color="primary"
        sx={{ position: "fixed", bottom: { xs: 72, md: 24 }, right: 24 }}
        onClick={() => setDialogOpen(true)}
      >
        <AddIcon />
      </Fab>

      <LogCardioDialog open={dialogOpen} onClose={() => setDialogOpen(false)} onSave={add} />
    </Box>
  );
}
