import { useState, useMemo } from "react";
import {
  Box,
  Card,
  CardContent,
  Chip,
  Divider,
  Fab,
  Grid,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Stack,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import TrendingDownIcon from "@mui/icons-material/TrendingDown";
import TrendingFlatIcon from "@mui/icons-material/TrendingFlat";
import { LineChart } from "@mui/x-charts/LineChart";
import PageHeader from "../../../../components/common/PageHeader";
import LogBodyDialog from "./LogBodyDialog";
import { useHealthData } from "../../hooks/useHealthData";
import { formatDisplayDate } from "../../utils/dates";

function MetricCard({ label, value, unit, trend }) {
  const TrendIcon =
    trend > 0 ? TrendingUpIcon : trend < 0 ? TrendingDownIcon : TrendingFlatIcon;
  const trendColor = trend > 0 ? "error.main" : trend < 0 ? "success.main" : "text.disabled";

  return (
    <Card>
      <CardContent sx={{ py: 1.5, "&:last-child": { pb: 1.5 } }}>
        <Typography variant="caption" color="text.secondary">
          {label}
        </Typography>
        <Box sx={{ display: "flex", alignItems: "baseline", gap: 0.5, mt: 0.25 }}>
          <Typography variant="h6" fontWeight={700}>
            {value ?? "—"}
          </Typography>
          {unit && value != null && (
            <Typography variant="caption" color="text.secondary">
              {unit}
            </Typography>
          )}
          {trend !== 0 && value != null && (
            <TrendIcon sx={{ fontSize: 16, color: trendColor, ml: "auto" }} />
          )}
        </Box>
      </CardContent>
    </Card>
  );
}

const METRICS = [
  { key: "weight",        label: "Weight",          unit: "kg"    },
  { key: "bmi",           label: "BMI",             unit: ""      },
  { key: "bodyFatPercent",label: "Body Fat",        unit: "%"     },
  { key: "visceralFat",   label: "Visceral Fat",    unit: "level" },
  { key: "muscleMass",    label: "Muscle Mass",     unit: "kg"    },
  { key: "boneMass",      label: "Bone Mass",       unit: "kg"    },
  { key: "waterPercent",  label: "Body Water",      unit: "%"     },
  { key: "metabolicAge",  label: "Metabolic Age",   unit: "yrs"   },
  { key: "bmr",           label: "BMR",             unit: "kcal"  },
];

export default function BodyPage() {
  const { records, add, update, remove } = useHealthData("health_body");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);

  const sorted = useMemo(
    () => [...records].sort((a, b) => b.date.localeCompare(a.date)),
    [records],
  );

  const latest = sorted[0];
  const prev = sorted[1];

  function trend(key) {
    if (!latest || !prev) return 0;
    const a = latest[key], b = prev[key];
    if (a == null || b == null) return 0;
    return a > b ? 1 : a < b ? -1 : 0;
  }

  // Weight chart – last 12 measurements ascending
  const weightChartData = useMemo(() => {
    const chronological = [...sorted].reverse().slice(-12);
    return {
      labels: chronological.map((r) => {
        const [, m, d] = r.date.split("-");
        return `${parseInt(m, 10)}/${parseInt(d, 10)}`;
      }),
      values: chronological.map((r) => r.weight),
    };
  }, [sorted]);

  function openEdit(rec) {
    setEditingRecord(rec);
    setDialogOpen(true);
  }

  function handleSave(data) {
    if (editingRecord) {
      update(editingRecord.id, data);
    } else {
      add(data);
    }
    setEditingRecord(null);
  }

  function handleClose() {
    setDialogOpen(false);
    setEditingRecord(null);
  }

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, pb: 10 }}>
      <PageHeader
        title="Body Metrics"
        subtitle="Hyundai scale measurements"
        action={
          latest && (
            <Chip label={formatDisplayDate(latest.date)} variant="outlined" size="small" />
          )
        }
      />

      {/* Latest metrics grid */}
      {latest ? (
        <Grid container spacing={1.5} sx={{ mb: 2 }}>
          {METRICS.map(({ key, label, unit }) =>
            latest[key] != null ? (
              <Grid item xs={6} sm={4} key={key}>
                <MetricCard
                  label={label}
                  value={latest[key]}
                  unit={unit}
                  trend={trend(key)}
                />
              </Grid>
            ) : null,
          )}
        </Grid>
      ) : (
        <Card sx={{ mb: 2 }}>
          <CardContent sx={{ textAlign: "center", py: 4 }}>
            <Typography color="text.secondary">
              No measurements yet. Log your first measurement from your Hyundai scale.
            </Typography>
          </CardContent>
        </Card>
      )}

      {/* Weight trend chart */}
      {weightChartData.values.filter((v) => v != null).length >= 2 && (
        <Card sx={{ mb: 2 }}>
          <CardContent>
            <Typography variant="subtitle2" gutterBottom>
              Weight trend (kg)
            </Typography>
            <LineChart
              xAxis={[{ scaleType: "band", data: weightChartData.labels }]}
              series={[{ data: weightChartData.values, label: "Weight", area: true, color: "#1976d2" }]}
              height={200}
            />
          </CardContent>
        </Card>
      )}

      {/* History list */}
      {sorted.length > 0 && (
        <Card>
          <CardContent sx={{ pb: 0 }}>
            <Typography variant="subtitle2" gutterBottom>History</Typography>
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
                    primary={`${rec.weight != null ? `${rec.weight} kg` : "—"}${rec.bmi != null ? ` · BMI ${rec.bmi}` : ""}${rec.bodyFatPercent != null ? ` · ${rec.bodyFatPercent}% fat` : ""}`}
                    secondary={`${formatDisplayDate(rec.date)}${rec.notes ? ` · ${rec.notes}` : ""}`}
                  />
                </ListItem>
              </Box>
            ))}
          </List>
        </Card>
      )}

      <Fab
        color="primary"
        sx={{ position: "fixed", bottom: { xs: 72, md: 24 }, right: 24 }}
        onClick={() => setDialogOpen(true)}
      >
        <AddIcon />
      </Fab>

      <LogBodyDialog
        open={dialogOpen}
        onClose={handleClose}
        onSave={handleSave}
        initial={editingRecord}
      />
    </Box>
  );
}
