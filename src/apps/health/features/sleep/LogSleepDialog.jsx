import { useState } from "react";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  Stack,
  Typography,
  ToggleButton,
  ToggleButtonGroup,
  Box,
} from "@mui/material";
import StarIcon from "@mui/icons-material/Star";
import StarBorderIcon from "@mui/icons-material/StarBorder";
import { today, calcSleepHours } from "../../utils/dates";

export default function LogSleepDialog({ open, onClose, onSave, initial }) {
  const [date, setDate] = useState(initial?.date ?? today());
  const [bedtime, setBedtime] = useState(initial?.bedtime ?? "22:00");
  const [wakeTime, setWakeTime] = useState(initial?.wakeTime ?? "06:00");
  const [quality, setQuality] = useState(initial?.quality ?? 3);
  const [notes, setNotes] = useState(initial?.notes ?? "");

  const sleepHours = calcSleepHours(bedtime, wakeTime);

  function handleSave() {
    onSave({
      date,
      bedtime,
      wakeTime,
      durationHours: Math.round(sleepHours * 10) / 10,
      quality,
      notes: notes.trim(),
    });
    onClose();
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>{initial ? "Edit Sleep Log" : "Log Sleep"}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <TextField
            label="Night of"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
            fullWidth
          />

          <Stack direction="row" spacing={1.5}>
            <TextField
              label="Bedtime"
              type="time"
              value={bedtime}
              onChange={(e) => setBedtime(e.target.value)}
              InputLabelProps={{ shrink: true }}
              fullWidth
            />
            <TextField
              label="Wake time"
              type="time"
              value={wakeTime}
              onChange={(e) => setWakeTime(e.target.value)}
              InputLabelProps={{ shrink: true }}
              fullWidth
            />
          </Stack>

          {sleepHours > 0 && (
            <Box sx={{ p: 1.5, bgcolor: "action.hover", borderRadius: 2, textAlign: "center" }}>
              <Typography variant="h5" fontWeight={700} color="primary">
                {sleepHours.toFixed(1)}h
              </Typography>
              <Typography variant="caption" color="text.secondary">
                sleep duration
              </Typography>
            </Box>
          )}

          <Box>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Sleep quality
            </Typography>
            <Stack direction="row" spacing={0.5}>
              {[1, 2, 3, 4, 5].map((s) => (
                <Box
                  key={s}
                  onClick={() => setQuality(s)}
                  sx={{ cursor: "pointer", color: s <= quality ? "warning.main" : "action.disabled" }}
                >
                  {s <= quality ? <StarIcon /> : <StarBorderIcon />}
                </Box>
              ))}
            </Stack>
          </Box>

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
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={handleSave} disabled={!date || !bedtime || !wakeTime}>
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
}
