import StairsIcon from "@mui/icons-material/Stairs";
import FitnessCenterIcon from "@mui/icons-material/FitnessCenter";
import DirectionsWalkIcon from "@mui/icons-material/DirectionsWalk";
import DirectionsRunIcon from "@mui/icons-material/DirectionsRun";

export const TYPE_CONFIG = {
  stairs: {
    label: "Stairs",
    Icon: StairsIcon,
    color: "#1976d2",
    chartLabel: "Floors",
    getMetric: (r) => {
      // legacy records used rounds + floorsClimbed
      if (r.floorsUp != null || r.floorsDown != null) {
        return (r.floorsUp ?? 0) + (r.floorsDown ?? 0);
      }
      return r.floorsClimbed ?? (r.rounds ?? 0) * 5;
    },
    getSummary: (r) => {
      if (r.floorsUp != null || r.floorsDown != null) {
        const parts = [];
        if (r.floorsUp)   parts.push(`↑ ${r.floorsUp} floors`);
        if (r.floorsDown) parts.push(`↓ ${r.floorsDown} floors`);
        return parts.join(" · ") || "—";
      }
      // legacy
      const rounds = r.rounds ?? 1;
      return `${rounds} round${rounds !== 1 ? "s" : ""} · ${r.floorsClimbed ?? 0} floors`;
    },
  },
  treadmill: {
    label: "Treadmill",
    Icon: FitnessCenterIcon,
    color: "#7b1fa2",
    chartLabel: "Minutes",
    getMetric: (r) => r.durationMinutes ?? 0,
    getSummary: (r) =>
      [
        r.durationMinutes ? `${r.durationMinutes} min` : null,
        r.distanceKm != null ? `${r.distanceKm} km` : null,
        r.speedKmh != null ? `${r.speedKmh} km/h` : null,
        r.inclinePct != null ? `${r.inclinePct}% incline` : null,
      ]
        .filter(Boolean)
        .join(" · "),
  },
  walking: {
    label: "Walking",
    Icon: DirectionsWalkIcon,
    color: "#388e3c",
    chartLabel: "Minutes",
    getMetric: (r) => r.durationMinutes ?? 0,
    getSummary: (r) =>
      [
        r.durationMinutes ? `${r.durationMinutes} min` : null,
        r.distanceKm != null ? `${r.distanceKm} km` : null,
        r.steps != null ? `${Number(r.steps).toLocaleString()} steps` : null,
      ]
        .filter(Boolean)
        .join(" · "),
  },
  running: {
    label: "Running",
    Icon: DirectionsRunIcon,
    color: "#d32f2f",
    chartLabel: "Minutes",
    getMetric: (r) => r.durationMinutes ?? 0,
    getSummary: (r) =>
      [
        r.durationMinutes ? `${r.durationMinutes} min` : null,
        r.distanceKm != null ? `${r.distanceKm} km` : null,
        r.paceMinPerKm != null ? `${r.paceMinPerKm} min/km` : null,
      ]
        .filter(Boolean)
        .join(" · "),
  },
};

export const ORDERED_TYPES = ["stairs", "treadmill", "walking", "running"];

