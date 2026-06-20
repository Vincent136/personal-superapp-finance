import { useState } from "react";
import {
  Box, Card, CardContent, CircularProgress, Dialog, Fab, Grid,
  IconButton, Typography,
} from "@mui/material";
import AddPhotoAlternateIcon from "@mui/icons-material/AddPhotoAlternate";
import CloseIcon from "@mui/icons-material/Close";
import DeleteIcon from "@mui/icons-material/Delete";
import { useAuth } from "../../../../hooks/useAuth";
import { compressImage, pickImageFile, uploadTripImage, deleteTripImage } from "../../utils/imageUtils";

export default function GalleryTab({ trip, onChange }) {
  const { user } = useAuth();
  const images = trip.images ?? [];
  const [preview, setPreview]   = useState(null);
  const [uploading, setUploading] = useState(false);

  async function handleAdd() {
    const file = await pickImageFile();
    if (!file) return;
    setUploading(true);
    try {
      const base64 = await compressImage(file, 1200, 0.72);
      const url    = await uploadTripImage(base64, user.id, trip.id);
      onChange({ images: [...images, url] });
    } finally {
      setUploading(false);
    }
  }

  function handleDelete(idx) {
    const url = images[idx];
    if (url?.startsWith?.("http")) deleteTripImage(url).catch(console.error);
    const next = images.filter((_, i) => i !== idx);
    onChange({ images: next });
    if (preview === idx) setPreview(null);
  }

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, pb: 10 }}>
      {images.length === 0 ? (
        <Card>
          <CardContent sx={{ textAlign: "center", py: 6 }}>
            <AddPhotoAlternateIcon sx={{ fontSize: 48, color: "text.disabled", mb: 1 }} />
            <Typography color="text.secondary" gutterBottom>No photos yet.</Typography>
            <Typography variant="caption" color="text.secondary">
              Tap + to add your trip memories.
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <Grid container spacing={1}>
          {images.map((src, idx) => (
            <Grid item xs={4} sm={3} key={idx}>
              <Box
                sx={{
                  position: "relative",
                  paddingTop: "100%",
                  borderRadius: 1,
                  overflow: "hidden",
                  cursor: "pointer",
                  "&:hover .delete-btn": { opacity: 1 },
                }}
                onClick={() => setPreview(idx)}
              >
                <Box
                  component="img"
                  src={src}
                  sx={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
                />
                <IconButton
                  className="delete-btn"
                  size="small"
                  onClick={(e) => { e.stopPropagation(); handleDelete(idx); }}
                  sx={{
                    position: "absolute", top: 4, right: 4,
                    bgcolor: "rgba(0,0,0,0.55)", color: "#fff", opacity: 0,
                    transition: "opacity 0.15s",
                    "&:hover": { bgcolor: "rgba(0,0,0,0.8)" },
                  }}
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Box>
            </Grid>
          ))}
        </Grid>
      )}

      <Fab
        color="primary"
        sx={{ position: "fixed", bottom: { xs: 72, md: 24 }, right: 24 }}
        onClick={handleAdd}
        disabled={uploading}
      >
        {uploading ? <CircularProgress size={24} color="inherit" /> : <AddPhotoAlternateIcon />}
      </Fab>

      {/* Full-screen preview */}
      <Dialog open={preview !== null} onClose={() => setPreview(null)} maxWidth="lg" fullWidth>
        <Box sx={{ position: "relative", bgcolor: "#000" }}>
          <IconButton
            onClick={() => setPreview(null)}
            sx={{ position: "absolute", top: 8, right: 8, color: "#fff", zIndex: 1 }}
          >
            <CloseIcon />
          </IconButton>
          <IconButton
            onClick={() => handleDelete(preview)}
            sx={{ position: "absolute", top: 8, left: 8, color: "#fff", zIndex: 1 }}
          >
            <DeleteIcon />
          </IconButton>
          {preview !== null && images[preview] && (
            <Box
              component="img"
              src={images[preview]}
              sx={{ width: "100%", maxHeight: "85vh", objectFit: "contain", display: "block" }}
            />
          )}
        </Box>
      </Dialog>
    </Box>
  );
}
