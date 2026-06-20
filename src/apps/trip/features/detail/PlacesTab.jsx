import { useState } from "react";
import {
  Box, Button, Card, CardContent, Chip, Dialog, DialogActions,
  DialogContent, DialogTitle, Divider, IconButton, MenuItem,
  Stack, TextField, Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import MyLocationIcon from "@mui/icons-material/MyLocation";
import TripMap from "../../components/TripMap";
import { PLACE_CATEGORIES } from "../../utils/tripUtils";

function PlaceDialog({ open, onClose, onSave, initialCoords, initial }) {
  const [name, setName]         = useState(initial?.name ?? "");
  const [category, setCategory] = useState(initial?.category ?? "attraction");
  const [lat, setLat]           = useState(initial?.lat ?? initialCoords?.lat ?? "");
  const [lng, setLng]           = useState(initial?.lng ?? initialCoords?.lng ?? "");
  const [visitDate, setVisitDate] = useState(initial?.visitDate ?? "");
  const [notes, setNotes]       = useState(initial?.notes ?? "");

  function handleSave() {
    onSave({
      name: name.trim(),
      category,
      lat: lat !== "" ? Number(lat) : null,
      lng: lng !== "" ? Number(lng) : null,
      visitDate: visitDate || null,
      notes: notes.trim(),
    });
    onClose();
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>{initial ? "Edit Place" : "Add Place"}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <TextField label="Place name" value={name} onChange={(e) => setName(e.target.value)} required fullWidth />
          <TextField select label="Category" value={category} onChange={(e) => setCategory(e.target.value)} fullWidth>
            {PLACE_CATEGORIES.map((c) => (
              <MenuItem key={c.id} value={c.id}>{c.icon} {c.label}</MenuItem>
            ))}
          </TextField>
          <Stack direction="row" spacing={1.5}>
            <TextField label="Latitude" type="number" value={lat} onChange={(e) => setLat(e.target.value)} inputProps={{ step: 0.000001 }} fullWidth size="small" />
            <TextField label="Longitude" type="number" value={lng} onChange={(e) => setLng(e.target.value)} inputProps={{ step: 0.000001 }} fullWidth size="small" />
          </Stack>
          <Typography variant="caption" color="text.secondary">
            Tip: click on the map to auto-fill coordinates, or paste from Google Maps.
          </Typography>
          <TextField label="Visit date" type="date" value={visitDate} onChange={(e) => setVisitDate(e.target.value)} InputLabelProps={{ shrink: true }} fullWidth />
          <TextField label="Notes" value={notes} onChange={(e) => setNotes(e.target.value)} multiline rows={2} fullWidth />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={handleSave} disabled={!name.trim()}>Save</Button>
      </DialogActions>
    </Dialog>
  );
}

export default function PlacesTab({ trip, onChange }) {
  const [dialogState, setDialogState] = useState(null); // { coords?, place? }
  const places = trip.places ?? [];

  function handleMapClick(coords) {
    setDialogState({ coords });
  }

  function addPlace(data) {
    const place = { id: crypto.randomUUID(), ...data };
    onChange({ places: [...places, place] });
  }

  function updatePlace(id, data) {
    onChange({ places: places.map((p) => (p.id === id ? { ...p, ...data } : p)) });
  }

  function deletePlace(id) {
    onChange({ places: places.filter((p) => p.id !== id) });
  }

  function getCategoryConfig(catId) {
    return PLACE_CATEGORIES.find((c) => c.id === catId) ?? PLACE_CATEGORIES.at(-1);
  }

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      {/* Map */}
      <Box sx={{ mb: 2 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
          <Typography variant="subtitle2">
            Map {places.filter((p) => p.lat).length > 0 && `· ${places.filter((p) => p.lat).length} pins`}
          </Typography>
          <Button size="small" startIcon={<AddIcon />} onClick={() => setDialogState({})}>
            Add Place
          </Button>
        </Stack>
        <TripMap places={places} onMapClick={handleMapClick} height={340} />
        <Typography variant="caption" color="text.secondary" mt={0.5} display="block">
          Tap anywhere on the map to pin a new place.
        </Typography>
      </Box>

      {/* Places list */}
      {places.length === 0 ? (
        <Card>
          <CardContent sx={{ textAlign: "center", py: 3 }}>
            <Typography color="text.secondary">No places added yet.</Typography>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <Stack divider={<Divider />}>
            {places.map((place) => {
              const cat = getCategoryConfig(place.category);
              return (
                <Stack
                  key={place.id}
                  direction="row"
                  alignItems="flex-start"
                  justifyContent="space-between"
                  sx={{ px: 2, py: 1.5 }}
                  gap={1}
                >
                  <Box sx={{ flex: 1 }}>
                    <Stack direction="row" spacing={0.75} alignItems="center" mb={0.25}>
                      <Typography fontSize={16}>{cat.icon}</Typography>
                      <Typography variant="body2" fontWeight={600}>{place.name}</Typography>
                    </Stack>
                    <Stack direction="row" spacing={0.75} flexWrap="wrap" gap={0.5}>
                      <Chip label={cat.label} size="small" variant="outlined" />
                      {place.lat != null && (
                        <Chip
                          icon={<MyLocationIcon sx={{ fontSize: "12px !important" }} />}
                          label={`${place.lat.toFixed(4)}, ${place.lng.toFixed(4)}`}
                          size="small"
                          variant="outlined"
                        />
                      )}
                      {place.visitDate && (
                        <Chip label={place.visitDate} size="small" variant="outlined" />
                      )}
                    </Stack>
                    {place.notes && (
                      <Typography variant="caption" color="text.secondary" mt={0.25} display="block">
                        {place.notes}
                      </Typography>
                    )}
                  </Box>
                  <Stack direction="row" sx={{ flexShrink: 0 }}>
                    <IconButton size="small" onClick={() => setDialogState({ place })}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Stack>
                </Stack>
              );
            })}
          </Stack>
        </Card>
      )}

      {dialogState && (
        <PlaceDialog
          open
          onClose={() => setDialogState(null)}
          initialCoords={dialogState.coords}
          initial={dialogState.place}
          onSave={(data) => {
            if (dialogState.place) updatePlace(dialogState.place.id, data);
            else addPlace(data);
            setDialogState(null);
          }}
        />
      )}
    </Box>
  );
}
