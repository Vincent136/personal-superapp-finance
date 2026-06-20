import { useState, useEffect } from "react";
import {
  Box, Button, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle,
  Grid, IconButton, MenuItem, Stack, TextField, Typography,
} from "@mui/material";
import AddPhotoAlternateIcon from "@mui/icons-material/AddPhotoAlternate";
import CloseIcon from "@mui/icons-material/Close";
import { useAuth } from "../../../../hooks/useAuth";
import { compressImage, pickImageFile, uploadTripImage } from "../../utils/imageUtils";

const CURRENCIES = ["IDR", "USD", "EUR", "SGD", "MYR", "JPY", "AUD"];
const STATUSES = [
  { value: "planning",  label: "Planning"  },
  { value: "upcoming",  label: "Upcoming"  },
  { value: "ongoing",   label: "On Trip"   },
  { value: "completed", label: "Completed" },
];

export default function TripFormDialog({ open, onClose, onSave, initial }) {
  const { user } = useAuth();
  const [uploading, setUploading]        = useState(false);
  const [title, setTitle]               = useState("");
  const [destination, setDestination]   = useState("");
  const [description, setDescription]   = useState("");
  const [status, setStatus]             = useState("planning");
  const [startDate, setStartDate]       = useState("");
  const [endDate, setEndDate]           = useState("");
  const [plannedBudget, setPlannedBudget] = useState("");
  const [currency, setCurrency]         = useState("IDR");
  const [financeCategory, setFinanceCategory] = useState("");
  const [coverImage, setCoverImage]     = useState(null);
  const [images, setImages]             = useState([]);

  useEffect(() => {
    if (initial) {
      setTitle(initial.title ?? "");
      setDestination(initial.destination ?? "");
      setDescription(initial.description ?? "");
      setStatus(initial.status ?? "planning");
      setStartDate(initial.startDate ?? "");
      setEndDate(initial.endDate ?? "");
      setPlannedBudget(initial.plannedBudget ?? "");
      setCurrency(initial.currency ?? "IDR");
      setFinanceCategory(initial.financeCategory ?? "");
      setCoverImage(initial.coverImage ?? null);
      setImages(initial.images ?? []);
    } else {
      setTitle(""); setDestination(""); setDescription("");
      setStatus("planning"); setStartDate(""); setEndDate("");
      setPlannedBudget(""); setCurrency("IDR");
      setFinanceCategory(""); setCoverImage(null); setImages([]);
    }
  }, [initial, open]);

  async function handlePickCover() {
    const file = await pickImageFile();
    if (!file) return;
    const data = await compressImage(file, 1200, 0.75);
    setCoverImage(data);
  }

  async function handleAddCollectionImage() {
    const file = await pickImageFile();
    if (!file) return;
    const data = await compressImage(file, 1200, 0.72);
    setImages((prev) => [...prev, data]);
  }

  function handleRemoveImage(idx) {
    setImages((prev) => prev.filter((_, i) => i !== idx));
  }

  async function handleSave() {
    setUploading(true);
    try {
      // Pre-assign the trip ID so Storage paths are deterministic even for new trips.
      const tripId = initial?.id ?? crypto.randomUUID();

      // Upload any base64 images to Supabase Storage; leave existing URLs untouched.
      const uploadIfNeeded = async (src) => {
        if (!src || !src.startsWith("data:")) return src;
        return uploadTripImage(src, user.id, tripId);
      };

      const [finalCover, ...finalImages] = await Promise.all([
        uploadIfNeeded(coverImage),
        ...images.map(uploadIfNeeded),
      ]);

      onSave({
        id: tripId,
        title: title.trim(),
        destination: destination.trim(),
        description: description.trim(),
        status,
        startDate: startDate || null,
        endDate: endDate || null,
        plannedBudget: plannedBudget !== "" ? Number(plannedBudget) : null,
        currency,
        financeCategory: financeCategory.trim(),
        coverImage: finalCover ?? null,
        images: finalImages.filter(Boolean),
      });
      onClose();
    } finally {
      setUploading(false);
    }
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{initial ? "Edit Trip" : "New Trip"}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          {/* Cover image */}
          <Box
            onClick={handlePickCover}
            sx={{
              height: 140, borderRadius: 2, cursor: "pointer", overflow: "hidden",
              bgcolor: "action.hover", border: "1px dashed", borderColor: "divider",
              display: "flex", alignItems: "center", justifyContent: "center",
              backgroundImage: coverImage ? `url(${coverImage})` : "none",
              backgroundSize: "cover", backgroundPosition: "center",
            }}
          >
            {!coverImage && (
              <Stack alignItems="center" spacing={0.5} color="text.secondary">
                <AddPhotoAlternateIcon />
                <Typography variant="caption">Add cover photo</Typography>
              </Stack>
            )}
          </Box>

          {/* Photo collection */}
          <Box>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Photo collection ({images.length})
            </Typography>
            <Grid container spacing={1}>
              {images.map((src, idx) => (
                <Grid item xs={4} key={idx}>
                  <Box sx={{ position: "relative", paddingTop: "100%", borderRadius: 1, overflow: "hidden" }}>
                    <Box
                      component="img"
                      src={src}
                      sx={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
                    />
                    <IconButton
                      size="small"
                      onClick={() => handleRemoveImage(idx)}
                      sx={{
                        position: "absolute", top: 2, right: 2,
                        bgcolor: "rgba(0,0,0,0.55)", color: "#fff",
                        "&:hover": { bgcolor: "rgba(0,0,0,0.8)" },
                      }}
                    >
                      <CloseIcon fontSize="small" />
                    </IconButton>
                  </Box>
                </Grid>
              ))}
              <Grid item xs={4}>
                <Box
                  onClick={handleAddCollectionImage}
                  sx={{
                    paddingTop: "100%", position: "relative", cursor: "pointer",
                    bgcolor: "action.hover", borderRadius: 1,
                    border: "1px dashed", borderColor: "divider",
                  }}
                >
                  <Box sx={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <AddPhotoAlternateIcon fontSize="small" color="action" />
                  </Box>
                </Box>
              </Grid>
            </Grid>
          </Box>

          <TextField label="Trip title" value={title} onChange={(e) => setTitle(e.target.value)} required fullWidth />
          <TextField label="Destination" value={destination} onChange={(e) => setDestination(e.target.value)} fullWidth />
          <TextField label="Description" value={description} onChange={(e) => setDescription(e.target.value)} multiline rows={2} fullWidth />

          <Stack direction="row" spacing={1.5}>
            <TextField label="Start date" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} InputLabelProps={{ shrink: true }} fullWidth />
            <TextField label="End date" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} InputLabelProps={{ shrink: true }} fullWidth />
          </Stack>

          <TextField select label="Status" value={status} onChange={(e) => setStatus(e.target.value)} fullWidth>
            {STATUSES.map((s) => <MenuItem key={s.value} value={s.value}>{s.label}</MenuItem>)}
          </TextField>

          <Stack direction="row" spacing={1.5}>
            <TextField
              label="Planned budget"
              type="number"
              value={plannedBudget}
              onChange={(e) => setPlannedBudget(e.target.value)}
              inputProps={{ min: 0 }}
              sx={{ flex: 2 }}
            />
            <TextField select label="Currency" value={currency} onChange={(e) => setCurrency(e.target.value)} sx={{ flex: 1 }}>
              {CURRENCIES.map((c) => <MenuItem key={c} value={c}>{c}</MenuItem>)}
            </TextField>
          </Stack>

          <TextField
            label="Finance category (optional)"
            value={financeCategory}
            onChange={(e) => setFinanceCategory(e.target.value)}
            helperText="Link to a Finance app category name for budget cross-reference"
            fullWidth
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={uploading}>Cancel</Button>
        <Button variant="contained" onClick={handleSave} disabled={!title.trim() || uploading}>
          {uploading ? <CircularProgress size={20} /> : "Save"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
