import { useState } from "react";
import {
  Box, Button, IconButton, Stack, Tab, Tabs, Typography,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import { useNavigate, useParams } from "react-router-dom";
import OverviewTab    from "./OverviewTab";
import ItineraryTab   from "./ItineraryTab";
import PlacesTab      from "./PlacesTab";
import ExpensesTab    from "./ExpensesTab";
import GalleryTab     from "./GalleryTab";
import TripFormDialog from "../list/TripFormDialog";
import { useTripData } from "../../hooks/useTripData";

const TABS = [
  { label: "Overview"  },
  { label: "Itinerary" },
  { label: "Places"    },
  { label: "Expenses"  },
  { label: "Gallery"   },
];

export default function TripDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { trips, updateTrip, deleteTrip } = useTripData();
  const [tab, setTab] = useState(0);
  const [editOpen, setEditOpen] = useState(false);

  const trip = trips.find((t) => t.id === id);

  if (!trip) {
    return (
      <Box sx={{ p: 3, textAlign: "center" }}>
        <Typography color="text.secondary">Trip not found.</Typography>
        <Button onClick={() => navigate("/trip")} sx={{ mt: 2 }}>Back to trips</Button>
      </Box>
    );
  }

  function handleChange(changes) {
    updateTrip(id, changes);
  }

  function handleDelete() {
    if (!window.confirm(`Delete "${trip.title}"? This cannot be undone.`)) return;
    deleteTrip(id);
    navigate("/trip");
  }

  function handleEditSave(data) {
    updateTrip(id, data);
    setEditOpen(false);
  }

  return (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* Page header */}
      <Box
        sx={{
          px: 2, py: 1.5,
          borderBottom: "1px solid", borderColor: "divider",
          display: "flex", alignItems: "center", gap: 1,
          bgcolor: "background.paper",
        }}
      >
        <IconButton onClick={() => navigate("/trip")} size="small">
          <ArrowBackIcon />
        </IconButton>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="h6" fontWeight={700} noWrap>{trip.title}</Typography>
          {trip.destination && (
            <Typography variant="caption" color="text.secondary" noWrap display="block">
              📍 {trip.destination}
            </Typography>
          )}
        </Box>
        <Stack direction="row">
          <IconButton size="small" onClick={() => setEditOpen(true)}>
            <EditIcon fontSize="small" />
          </IconButton>
          <IconButton size="small" color="error" onClick={handleDelete}>
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Stack>
      </Box>

      {/* Tabs */}
      <Box sx={{ borderBottom: "1px solid", borderColor: "divider", bgcolor: "background.paper" }}>
        <Tabs
          value={tab}
          onChange={(_, v) => setTab(v)}
          variant="scrollable"
          scrollButtons="auto"
        >
          {TABS.map((t, i) => <Tab key={i} label={t.label} />)}
        </Tabs>
      </Box>

      {/* Tab content */}
      <Box sx={{ flex: 1, overflow: "auto" }}>
        {tab === 0 && <OverviewTab  trip={trip} onChange={handleChange} />}
        {tab === 1 && <ItineraryTab trip={trip} onChange={handleChange} />}
        {tab === 2 && <PlacesTab    trip={trip} onChange={handleChange} />}
        {tab === 3 && <ExpensesTab  trip={trip} onChange={handleChange} onEdit={() => setEditOpen(true)} />}
        {tab === 4 && <GalleryTab   trip={trip} onChange={handleChange} />}
      </Box>

      <TripFormDialog
        open={editOpen}
        onClose={() => setEditOpen(false)}
        onSave={handleEditSave}
        initial={trip}
      />
    </Box>
  );
}
