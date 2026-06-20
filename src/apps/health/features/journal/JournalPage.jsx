import { useState, useMemo } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  CardActionArea,
  Chip,
  Divider,
  IconButton,
  Stack,
  TextField,
  Typography,
  Collapse,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import CheckIcon from "@mui/icons-material/Check";
import PageHeader from "../../../../components/common/PageHeader";
import { useHealthData } from "../../hooks/useHealthData";
import { today, formatDisplayDate } from "../../utils/dates";

const MOODS = [
  { value: "poor",  label: "😔 Poor"  },
  { value: "fair",  label: "😐 Fair"  },
  { value: "good",  label: "🙂 Good"  },
  { value: "great", label: "😄 Great" },
];

const ENERGY_LEVELS = [1, 2, 3, 4, 5];

function MoodChip({ value, selected, onClick }) {
  const mood = MOODS.find((m) => m.value === value);
  return (
    <Chip
      label={mood?.label ?? value}
      onClick={onClick}
      color={selected ? "primary" : "default"}
      variant={selected ? "filled" : "outlined"}
      size="small"
    />
  );
}

function EnergySelector({ value, onChange }) {
  return (
    <Stack direction="row" spacing={0.75} alignItems="center">
      <Typography variant="body2" color="text.secondary" mr={0.5}>
        Energy:
      </Typography>
      {ENERGY_LEVELS.map((level) => (
        <Box
          key={level}
          onClick={() => onChange(level)}
          sx={{
            width: 28,
            height: 28,
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            bgcolor: level <= value ? "primary.main" : "action.hover",
            color: level <= value ? "primary.contrastText" : "text.secondary",
            fontSize: 12,
            fontWeight: 700,
            transition: "all 0.15s",
          }}
        >
          {level}
        </Box>
      ))}
    </Stack>
  );
}

function JournalEditor({ entry, onSave, onCancel }) {
  const [date, setDate] = useState(entry?.date ?? today());
  const [mood, setMood] = useState(entry?.mood ?? "good");
  const [energy, setEnergy] = useState(entry?.energyLevel ?? 3);
  const [content, setContent] = useState(entry?.content ?? "");

  function handleSave() {
    onSave({ date, mood, energyLevel: energy, content: content.trim() });
  }

  return (
    <Card>
      <CardContent>
        <Stack spacing={2}>
          <TextField
            label="Date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
            size="small"
            sx={{ maxWidth: 200 }}
          />

          <Box>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Mood
            </Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap" gap={1}>
              {MOODS.map((m) => (
                <MoodChip
                  key={m.value}
                  value={m.value}
                  selected={mood === m.value}
                  onClick={() => setMood(m.value)}
                />
              ))}
            </Stack>
          </Box>

          <EnergySelector value={energy} onChange={setEnergy} />

          <TextField
            label="How are you feeling? What happened today?"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            multiline
            rows={5}
            fullWidth
            placeholder="Write about your condition, workout experience, energy, recovery..."
          />

          <Stack direction="row" spacing={1} justifyContent="flex-end">
            {onCancel && (
              <Button onClick={onCancel} size="small">
                Cancel
              </Button>
            )}
            <Button
              variant="contained"
              startIcon={<CheckIcon />}
              onClick={handleSave}
              disabled={!date}
              size="small"
            >
              Save Entry
            </Button>
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  );
}

function JournalCard({ entry, onEdit, onDelete }) {
  const mood = MOODS.find((m) => m.value === entry.mood);
  const preview = entry.content.length > 120 ? entry.content.slice(0, 120) + "…" : entry.content;

  return (
    <Card>
      <CardContent>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <Box>
            <Typography variant="caption" color="text.secondary">
              {formatDisplayDate(entry.date)}
            </Typography>
            <Stack direction="row" spacing={1} alignItems="center" mt={0.25}>
              <Chip label={mood?.label ?? entry.mood} size="small" variant="outlined" />
              <Typography variant="caption" color="text.secondary">
                Energy {entry.energyLevel}/5
              </Typography>
            </Stack>
          </Box>
          <Stack direction="row">
            <IconButton size="small" onClick={() => onEdit(entry)}>
              <EditIcon fontSize="small" />
            </IconButton>
            <IconButton size="small" onClick={() => onDelete(entry.id)}>
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Stack>
        </Box>

        {entry.content && (
          <Typography variant="body2" color="text.primary" mt={1} sx={{ whiteSpace: "pre-line" }}>
            {preview}
          </Typography>
        )}
      </CardContent>
    </Card>
  );
}

export default function JournalPage() {
  const { records, add, update, remove } = useHealthData("health_journal");
  const [editingEntry, setEditingEntry] = useState(null);
  const [showEditor, setShowEditor] = useState(false);

  const sorted = useMemo(
    () => [...records].sort((a, b) => b.date.localeCompare(a.date)),
    [records],
  );

  const todayEntry = sorted.find((r) => r.date === today());
  const pastEntries = sorted.filter((r) => r.date !== today());

  function handleSave(data) {
    if (editingEntry) {
      update(editingEntry.id, data);
      setEditingEntry(null);
    } else {
      add(data);
      setShowEditor(false);
    }
  }

  function handleEdit(entry) {
    setEditingEntry(entry);
    setShowEditor(false);
  }

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, pb: 10 }}>
      <PageHeader
        title="Journal"
        subtitle="Daily condition log"
        action={
          !showEditor && !editingEntry && !todayEntry && (
            <Button variant="contained" size="small" onClick={() => setShowEditor(true)}>
              Write Today
            </Button>
          )
        }
      />

      {/* Today's section */}
      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
        Today
      </Typography>

      {editingEntry && editingEntry.date === today() ? (
        <Box sx={{ mb: 2 }}>
          <JournalEditor
            entry={editingEntry}
            onSave={handleSave}
            onCancel={() => setEditingEntry(null)}
          />
        </Box>
      ) : todayEntry && !editingEntry ? (
        <Box sx={{ mb: 2 }}>
          <JournalCard
            entry={todayEntry}
            onEdit={handleEdit}
            onDelete={remove}
          />
        </Box>
      ) : showEditor ? (
        <Box sx={{ mb: 2 }}>
          <JournalEditor onSave={handleSave} onCancel={() => setShowEditor(false)} />
        </Box>
      ) : (
        <Card sx={{ mb: 2 }}>
          <CardActionArea onClick={() => setShowEditor(true)}>
            <CardContent sx={{ textAlign: "center", py: 3 }}>
              <Typography color="text.secondary">Tap to write today's entry</Typography>
            </CardContent>
          </CardActionArea>
        </Card>
      )}

      {/* Past entries */}
      {pastEntries.length > 0 && (
        <>
          <Typography variant="subtitle2" color="text.secondary" gutterBottom sx={{ mt: 1 }}>
            Past entries
          </Typography>
          <Stack spacing={1.5}>
            {pastEntries.map((entry) =>
              editingEntry?.id === entry.id ? (
                <JournalEditor
                  key={entry.id}
                  entry={entry}
                  onSave={handleSave}
                  onCancel={() => setEditingEntry(null)}
                />
              ) : (
                <JournalCard
                  key={entry.id}
                  entry={entry}
                  onEdit={handleEdit}
                  onDelete={remove}
                />
              ),
            )}
          </Stack>
        </>
      )}

      {records.length === 0 && !showEditor && (
        <Card>
          <CardContent sx={{ textAlign: "center", py: 4 }}>
            <Typography color="text.secondary" gutterBottom>
              Start journaling your health condition daily.
            </Typography>
            <Button variant="outlined" onClick={() => setShowEditor(true)}>
              Write First Entry
            </Button>
          </CardContent>
        </Card>
      )}
    </Box>
  );
}
