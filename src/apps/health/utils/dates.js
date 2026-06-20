export function toLocalDateStr(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function today() {
  return toLocalDateStr();
}

export function getWeekDays(ref = new Date()) {
  const day = ref.getDay();
  const monday = new Date(ref);
  monday.setDate(ref.getDate() - ((day + 6) % 7));
  monday.setHours(0, 0, 0, 0);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return toLocalDateStr(d);
  });
}

export function getMonthDays(ref = new Date()) {
  const y = ref.getFullYear();
  const mo = ref.getMonth();
  const days = new Date(y, mo + 1, 0).getDate();
  return Array.from({ length: days }, (_, i) => toLocalDateStr(new Date(y, mo, i + 1)));
}

export function getYearMonths(ref = new Date()) {
  const y = ref.getFullYear();
  return Array.from({ length: 12 }, (_, i) => `${y}-${String(i + 1).padStart(2, "0")}`);
}

export function formatDisplayDate(dateStr) {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function calcStreak(records, dateField = "date") {
  const dateSet = new Set(records.map((r) => r[dateField]));
  let streak = 0;
  const d = new Date();
  if (!dateSet.has(toLocalDateStr(d))) {
    d.setDate(d.getDate() - 1);
  }
  while (dateSet.has(toLocalDateStr(d))) {
    streak++;
    d.setDate(d.getDate() - 1);
  }
  return streak;
}

export function calcSleepHours(bedtime, wakeTime) {
  if (!bedtime || !wakeTime) return 0;
  const [bh, bm] = bedtime.split(":").map(Number);
  const [wh, wm] = wakeTime.split(":").map(Number);
  let bedMins = bh * 60 + bm;
  let wakeMins = wh * 60 + wm;
  if (wakeMins <= bedMins) wakeMins += 24 * 60;
  return (wakeMins - bedMins) / 60;
}
