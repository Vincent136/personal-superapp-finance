import { useState } from "react";
import {
  Box, Button, Card, CardContent, Chip, Dialog, DialogActions,
  DialogContent, DialogTitle, Divider, IconButton, MenuItem,
  Stack, TextField, Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import { getDaysBetween } from "../../utils/tripUtils";

function ActivityDialog({ open, onClose, onSave, places, initial }) {
  const [time, setTime]     = useState(initial?.time ?? "");
  const [title, setTitle]   = useState(initial?.title ?? "");
  const [desc, setDesc]     = useState(initial?.description ?? "");
  const [placeId, setPlaceId] = useState(initial?.placeId ?? "");

  function handleSave() {
    onSave({ time, title: title.trim(), description: desc.trim(), placeId: placeId || null });
    onClose();
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>{initial ? "Edit Activity" : "Add Activity"}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <TextField label="Time" type="time" value={time} onChange={(e) => setTime(e.target.value)} InputLabelProps={{ shrink: true }} fullWidth />
          <TextField label="Activity title" value={title} onChange={(e) => setTitle(e.target.value)} required fullWidth />
          <TextField label="Description / notes" value={desc} onChange={(e) => setDesc(e.target.value)} multiline rows={2} fullWidth />
          {places?.length > 0 && (
            <TextField select label="Linked place (optional)" value={placeId} onChange={(e) => setPlaceId(e.target.value)} fullWidth>
              <MenuItem value="">None</MenuItem>
              {places.map((p) => <MenuItem key={p.id} value={p.id}>{p.name}</MenuItem>)}
            </TextField>
          )}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={handleSave} disabled={!title.trim()}>Save</Button>
      </DialogActions>
    </Dialog>
  );
}

export default function ItineraryTab({ trip, onChange }) {
  const [dialogState, setDialogState] = useState(null); // { date, item? }

  const days = getDaysBetween(trip.startDate, trip.endDate);
  const itinerary = trip.itinerary ?? [];

  function getActivities(date) {
    return itinerary.filter((a) => a.date === date).sort((a, b) => (a.time ?? "").localeCompare(b.time ?? ""));
  }

  function addActivity(date, data) {
    const item = { id: crypto.randomUUID(), date, ...data };
    onChange({ itinerary: [...itinerary, item] });
  }

  function updateActivity(id, data) {
    onChange({ itinerary: itinerary.map((a) => (a.id === id ? { ...a, ...data } : a)) });
  }

  function deleteActivity(id) {
    onChange({ itinerary: itinerary.filter((a) => a.id !== id) });
  }

  function formatDayLabel(dateStr) {
    const d = new Date(dateStr + "T00:00:00");
    return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
  }

  if (!trip.startDate || !trip.endDate) {
    return (
      <Box sx={{ p: 3, textAlign: "center" }}>
        <Typography color="text.secondary">
          Set trip start and end dates to build an itinerary.
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      <Stack spacing={2}>
        {days.map((date, dayIdx) => {
          const activities = getActivities(date);
          const linkedPlace = (id) => (trip.places ?? []).find((p) => p.id === id);

          return (
            <Card key={date}>
              <CardContent sx={{ pb: "0 !important" }}>
                <Stack direction="row" alignItems="center" justifyContent="space-between" mb={1}>
                  <Box>
                    <Typography variant="subtitle2" fontWeight={700}>Day {dayIdx + 1}</Typography>
                    <Typography variant="caption" color="text.secondary">{formatDayLabel(date)}</Typography>
                  </Box>
                  <Button
                    size="small"
                    startIcon={<AddIcon />}
                    onClick={() => setDialogState({ date })}
                  >
                    Add
                  </Button>
                </Stack>

                {activities.length === 0 ? (
                  <Typography variant="body2" color="text.secondary" sx={{ pb: 2 }}>
                    No activities planned.
                  </Typography>
                ) : (
                  <Stack divider={<Divider />}>
                    {activities.map((act) => {
                      const place = act.placeId ? linkedPlace(act.placeId) : null;
                      return (
                        <Stack
                          key={act.id}
                          direction="row"
                          alignItems="flex-start"
                          justifyContent="space-between"
                          py={1.25}
                          gap={1}
                        >
                          <Box sx={{ flex: 1 }}>
                            <Stack direction="row" spacing={1} alignItems="center">
                              {act.time && (
                                <Typography variant="caption" color="text.secondary" sx={{ minWidth: 36 }}>
                                  {act.time}
                                </Typography>
                              )}
                              <Typography variant="body2" fontWeight={600}>{act.title}</Typography>
                            </Stack>
                            {act.description && (
                              <Typography variant="caption" color="text.secondary" display="block">
                                {act.description}
                              </Typography>
                            )}
                            {place && (
                              <Chip label={`📍 ${place.name}`} size="small" variant="outlined" sx={{ mt: 0.5 }} />
                            )}
                          </Box>
                          <Stack direction="row" sx={{ flexShrink: 0 }}>
                            <IconButton size="small" onClick={() => setDialogState({ date, item: act })}>
                              <EditIcon fontSize="small" />
                            </IconButton>
                            <IconButton size="small" onClick={() => deleteActivity(act.id)}>
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Stack>
                        </Stack>
                      );
                    })}
                  </Stack>
                )}
              </CardContent>
            </Card>
          );
        })}
      </Stack>

      {dialogState && (
        <ActivityDialog
          open
          onClose={() => setDialogState(null)}
          places={trip.places ?? []}
          initial={dialogState.item}
          onSave={(data) => {
            if (dialogState.item) updateActivity(dialogState.item.id, data);
            else addActivity(dialogState.date, data);
            setDialogState(null);
          }}
        />
      )}
    </Box>
  );
}
