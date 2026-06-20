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
  Divider,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { today } from "../../utils/dates";

function NumField({ label, value, onChange, unit, helperText }) {
  return (
    <TextField
      label={unit ? `${label} (${unit})` : label}
      type="number"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      helperText={helperText}
      inputProps={{ step: 0.1 }}
      fullWidth
      size="small"
    />
  );
}

export default function LogBodyDialog({ open, onClose, onSave, initial }) {
  const [date, setDate] = useState(initial?.date ?? today());
  const [weight, setWeight] = useState(initial?.weight ?? "");
  const [bmi, setBmi] = useState(initial?.bmi ?? "");
  const [bodyFat, setBodyFat] = useState(initial?.bodyFatPercent ?? "");
  const [visceralFat, setVisceralFat] = useState(initial?.visceralFat ?? "");
  const [muscleMass, setMuscleMass] = useState(initial?.muscleMass ?? "");
  const [boneMass, setBoneMass] = useState(initial?.boneMass ?? "");
  const [waterPercent, setWaterPercent] = useState(initial?.waterPercent ?? "");
  const [metabolicAge, setMetabolicAge] = useState(initial?.metabolicAge ?? "");
  const [bmr, setBmr] = useState(initial?.bmr ?? "");
  const [notes, setNotes] = useState(initial?.notes ?? "");

  function num(v) { return v !== "" ? parseFloat(v) : null; }

  function handleSave() {
    onSave({
      date,
      weight: num(weight),
      bmi: num(bmi),
      bodyFatPercent: num(bodyFat),
      visceralFat: num(visceralFat),
      muscleMass: num(muscleMass),
      boneMass: num(boneMass),
      waterPercent: num(waterPercent),
      metabolicAge: num(metabolicAge),
      bmr: num(bmr),
      notes: notes.trim(),
    });
    onClose();
  }

  const canSave = date && weight !== "";

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>{initial ? "Edit Measurement" : "Log Body Measurement"}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <TextField
            label="Date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
            fullWidth
            size="small"
          />

          <Divider>
            <Typography variant="caption" color="text.secondary">Primary</Typography>
          </Divider>

          <NumField label="Weight" unit="kg" value={weight} onChange={setWeight} />
          <NumField label="BMI" value={bmi} onChange={setBmi} />
          <NumField label="Body Fat" unit="%" value={bodyFat} onChange={setBodyFat} />
          <NumField
            label="Visceral Fat"
            value={visceralFat}
            onChange={setVisceralFat}
            helperText="Level 1–20 (Hyundai scale)"
          />

          <Accordion disableGutters elevation={0} sx={{ border: "1px solid", borderColor: "divider", borderRadius: "8px !important" }}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="body2">More metrics</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Stack spacing={2}>
                <NumField label="Muscle Mass" unit="kg" value={muscleMass} onChange={setMuscleMass} />
                <NumField label="Bone Mass" unit="kg" value={boneMass} onChange={setBoneMass} />
                <NumField label="Body Water" unit="%" value={waterPercent} onChange={setWaterPercent} />
                <NumField label="Metabolic Age" unit="years" value={metabolicAge} onChange={setMetabolicAge} />
                <NumField label="Basal Metabolic Rate" unit="kcal" value={bmr} onChange={setBmr} />
              </Stack>
            </AccordionDetails>
          </Accordion>

          <TextField
            label="Notes (optional)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            multiline
            rows={2}
            fullWidth
            size="small"
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={handleSave} disabled={!canSave}>
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
}
