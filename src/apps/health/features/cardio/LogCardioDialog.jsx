import { useState } from "react";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import { today } from "../../utils/dates";
import { TYPE_CONFIG, ORDERED_TYPES } from "./cardioConfig";

function NumField({ label, value, onChange, helperText, required, step = 1 }) {
  return (
    <TextField
      label={label}
      type="number"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      helperText={helperText}
      inputProps={{ step, min: 0 }}
      fullWidth
      required={required}
    />
  );
}

export default function LogCardioDialog({ open, onClose, onSave }) {
  const [date, setDate] = useState(today());
  const [type, setType] = useState("stairs");

  // Stairs
  const [floorsUp, setFloorsUp] = useState("");
  const [floorsDown, setFloorsDown] = useState("");

  // Treadmill / Walking / Running (shared)
  const [durationMinutes, setDurationMinutes] = useState("");
  const [distanceKm, setDistanceKm] = useState("");

  // Treadmill-specific
  const [speedKmh, setSpeedKmh] = useState("");
  const [inclinePct, setInclinePct] = useState("");

  // Walking-specific
  const [steps, setSteps] = useState("");

  // Running-specific
  const [paceMinPerKm, setPaceMinPerKm] = useState("");

  // Shared
  const [notes, setNotes] = useState("");

  function num(v) {
    return v !== "" && v != null ? parseFloat(v) : null;
  }

  function buildRecord() {
    const base = { date, type, notes: notes.trim() };
    if (type === "stairs") {
      return { ...base, floorsUp: num(floorsUp), floorsDown: num(floorsDown) };
    }
    const shared = { ...base, durationMinutes: num(durationMinutes), distanceKm: num(distanceKm) };
    if (type === "treadmill") return { ...shared, speedKmh: num(speedKmh), inclinePct: num(inclinePct) };
    if (type === "walking")   return { ...shared, steps: num(steps) };
    if (type === "running")   return { ...shared, paceMinPerKm: num(paceMinPerKm) };
    return base;
  }

  function handleSave() {
    onSave(buildRecord());
    reset();
    onClose();
  }

  function reset() {
    setDate(today());
    setType("stairs");
    setFloorsUp("");
    setFloorsDown("");
    setDurationMinutes("");
    setDistanceKm("");
    setSpeedKmh("");
    setInclinePct("");
    setSteps("");
    setPaceMinPerKm("");
    setNotes("");
  }

  function handleClose() {
    reset();
    onClose();
  }

  const canSave =
    date &&
    (type === "stairs"
      ? (floorsUp !== "" && Number(floorsUp) > 0) || (floorsDown !== "" && Number(floorsDown) > 0)
      : durationMinutes !== "" && Number(durationMinutes) > 0);

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="xs">
      <DialogTitle>Log Cardio Session</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <TextField
            label="Date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
            fullWidth
          />

          {/* Activity type selector */}
          <Box>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Activity
            </Typography>
            <ToggleButtonGroup
              value={type}
              exclusive
              onChange={(_, v) => v && setType(v)}
              size="small"
              sx={{ flexWrap: "wrap", gap: 0.5 }}
            >
              {ORDERED_TYPES.map((t) => {
                const { label, Icon, color } = TYPE_CONFIG[t];
                return (
                  <ToggleButton
                    key={t}
                    value={t}
                    sx={{
                      gap: 0.5,
                      "&.Mui-selected": { borderColor: color, color: color, bgcolor: color + "14" },
                    }}
                  >
                    <Icon fontSize="small" />
                    {label}
                  </ToggleButton>
                );
              })}
            </ToggleButtonGroup>
          </Box>

          {/* Stairs-specific fields */}
          {type === "stairs" && (
            <>
              <NumField
                label="Floors up (incline)"
                value={floorsUp}
                onChange={setFloorsUp}
                helperText="Total floors climbed upward this session"
              />
              <NumField
                label="Floors down (decline)"
                value={floorsDown}
                onChange={setFloorsDown}
                helperText="Total floors descended this session"
              />
            </>
          )}

          {/* Treadmill-specific fields */}
          {type === "treadmill" && (
            <>
              <NumField label="Duration (minutes)" value={durationMinutes} onChange={setDurationMinutes} required />
              <NumField label="Distance (km)" value={distanceKm} onChange={setDistanceKm} step={0.1} />
              <NumField label="Speed (km/h)" value={speedKmh} onChange={setSpeedKmh} step={0.1} />
              <NumField label="Incline (%)" value={inclinePct} onChange={setInclinePct} step={0.5} />
            </>
          )}

          {/* Walking-specific fields */}
          {type === "walking" && (
            <>
              <NumField label="Duration (minutes)" value={durationMinutes} onChange={setDurationMinutes} required />
              <NumField label="Distance (km)" value={distanceKm} onChange={setDistanceKm} step={0.1} />
              <NumField label="Steps" value={steps} onChange={setSteps} />
            </>
          )}

          {/* Running-specific fields */}
          {type === "running" && (
            <>
              <NumField label="Duration (minutes)" value={durationMinutes} onChange={setDurationMinutes} required />
              <NumField label="Distance (km)" value={distanceKm} onChange={setDistanceKm} step={0.1} />
              <NumField label="Pace (min/km)" value={paceMinPerKm} onChange={setPaceMinPerKm} step={0.1} />
            </>
          )}

          <TextField
            label="Notes (optional)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            multiline
            rows={2}
            fullWidth
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Cancel</Button>
        <Button variant="contained" onClick={handleSave} disabled={!canSave}>
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
}
