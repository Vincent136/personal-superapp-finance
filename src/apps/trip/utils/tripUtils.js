export const STATUS_CONFIG = {
  planning:  { label: "Planning",  color: "default"  },
  upcoming:  { label: "Upcoming",  color: "primary"  },
  ongoing:   { label: "On Trip",   color: "warning"  },
  completed: { label: "Completed", color: "success"  },
};

export const EXPENSE_CATEGORIES = [
  { id: "accommodation", label: "Accommodation", icon: "🏨" },
  { id: "food",          label: "Food & Drink",  icon: "🍜" },
  { id: "transport",     label: "Transport",     icon: "✈️" },
  { id: "activity",      label: "Activities",    icon: "🎡" },
  { id: "shopping",      label: "Shopping",      icon: "🛍️" },
  { id: "health",        label: "Health",        icon: "💊" },
  { id: "other",         label: "Other",         icon: "📦" },
];

export const PLACE_CATEGORIES = [
  { id: "accommodation", label: "Accommodation", icon: "🏨" },
  { id: "food",          label: "Food",          icon: "🍜" },
  { id: "attraction",    label: "Attraction",    icon: "🏛️" },
  { id: "transport",     label: "Transport Hub", icon: "🚌" },
  { id: "shopping",      label: "Shopping",      icon: "🛍️" },
  { id: "other",         label: "Other",         icon: "📍" },
];

export function formatCurrency(amount, currency = "IDR") {
  if (amount == null || amount === "") return "—";
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function getDaysBetween(startDate, endDate) {
  if (!startDate || !endDate) return [];
  const days = [];
  const cur = new Date(startDate + "T00:00:00");
  const end = new Date(endDate + "T00:00:00");
  while (cur <= end) {
    days.push(cur.toISOString().slice(0, 10));
    cur.setDate(cur.getDate() + 1);
  }
  return days;
}

export function tripDuration(startDate, endDate) {
  if (!startDate || !endDate) return null;
  const diff = new Date(endDate) - new Date(startDate);
  const days = Math.round(diff / 86400000) + 1;
  return `${days} day${days !== 1 ? "s" : ""}`;
}

export function formatDateRange(startDate, endDate) {
  if (!startDate) return "Dates not set";
  const opts = { month: "short", day: "numeric", year: "numeric" };
  const s = new Date(startDate + "T00:00:00").toLocaleDateString("en-US", opts);
  if (!endDate) return s;
  const e = new Date(endDate + "T00:00:00").toLocaleDateString("en-US", opts);
  return `${s} – ${e}`;
}
