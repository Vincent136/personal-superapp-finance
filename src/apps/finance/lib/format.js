const CURRENCY_CONFIG = {
  IDR: { locale: "id-ID", maximumFractionDigits: 0 },
  SGD: { locale: "en-SG", maximumFractionDigits: 2 },
};

export const CURRENCIES = [
  { code: "IDR", label: "Indonesian Rupiah (IDR)" },
  { code: "SGD", label: "Singapore Dollar (SGD)" },
];

export function formatCurrency(amount, currency = "IDR") {
  const config = CURRENCY_CONFIG[currency] ?? CURRENCY_CONFIG.IDR;
  const formatter = new Intl.NumberFormat(config.locale, {
    style: "currency",
    currency,
    maximumFractionDigits: config.maximumFractionDigits,
  });
  return formatter.format(amount ?? 0);
}

// Amounts are always stored in IDR. These convert to/from a display currency
// using the SGD <-> IDR rate from the currency_rates table.
export function convertFromIDR(amount, currency, sgdToIdr) {
  if (currency === "SGD") return (amount ?? 0) / sgdToIdr;
  return amount ?? 0;
}

export function convertToIDR(amount, currency, sgdToIdr) {
  if (currency === "SGD") return (amount ?? 0) * sgdToIdr;
  return amount ?? 0;
}

// Pay periods run from the 25th of one month to the 24th of the next
// (inclusive). Period "2026-06" covers 2026-05-25..2026-06-24, and payday
// for that period (and the start of the next one) is 2026-06-25.
export const PAYDAY = 25;

const MONTH_NAMES = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

function toISODate(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

// "2026-06" -> { year: 2026, month: 6 } (month is 1-based)
function periodToYearMonth(period) {
  const [year, month] = period.split("-").map(Number);
  return { year, month };
}

function yearMonthToPeriod(year, month) {
  // Date normalises out-of-range months (e.g. month 0 or 13), so build a
  // Date and read it back to land on the right year/month.
  const d = new Date(year, month - 1, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

// "YYYY-MM" for the pay period containing today.
export function currentPeriod() {
  const now = new Date();
  return now.getDate() < PAYDAY
    ? yearMonthToPeriod(now.getFullYear(), now.getMonth() + 1)
    : yearMonthToPeriod(now.getFullYear(), now.getMonth() + 2);
}

// "YYYY-MM" -> "YYYY-MM-01", the storage key used for budget_items.month.
export function periodKey(period) {
  return `${period}-01`;
}

// "YYYY-MM" -> { start, end } ISO dates (both inclusive) for occurred_on queries.
export function periodRange(period) {
  const { year, month } = periodToYearMonth(period);
  const start = new Date(year, month - 2, PAYDAY);
  const end = new Date(year, month - 1, PAYDAY - 1);
  return { start: toISODate(start), end: toISODate(end) };
}

// Days remaining until the payday that ends the given period (always >= 1).
export function daysUntilPayday(period = currentPeriod()) {
  const { year, month } = periodToYearMonth(period);
  const payday = new Date(year, month - 1, PAYDAY);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((payday - today) / 86400000);
}

export function previousPeriod(period) {
  const { year, month } = periodToYearMonth(period);
  return yearMonthToPeriod(year, month - 1);
}

export function nextPeriod(period) {
  const { year, month } = periodToYearMonth(period);
  return yearMonthToPeriod(year, month + 1);
}

// Inclusive list of "YYYY-MM" periods from `from` to `to` (order-independent).
export function periodsBetween(from, to) {
  let [a, b] = from <= to ? [from, to] : [to, from];

  const periods = [];
  let cursor = a;
  while (cursor <= b) {
    periods.push(cursor);
    cursor = nextPeriod(cursor);
  }
  return periods;
}

// "2026-06" -> "25 May – 24 Jun 2026"
export function formatPeriodRange(period) {
  const { start, end } = periodRange(period);
  const [, startMonth, startDay] = start.split("-").map(Number);
  const [endYear, endMonth, endDay] = end.split("-").map(Number);
  return `${startDay} ${MONTH_NAMES[startMonth - 1]} – ${endDay} ${MONTH_NAMES[endMonth - 1]} ${endYear}`;
}

// "2026-06" -> "Jun 2026" (short label for chart axes etc.)
export function formatPeriodShort(period) {
  const { year, month } = periodToYearMonth(period);
  return `${MONTH_NAMES[month - 1]} ${year}`;
}

// "2026-06" -> "25 Jun 2026" (the payday date for that period)
export function formatPayday(period = currentPeriod()) {
  const { year, month } = periodToYearMonth(period);
  return `${PAYDAY} ${MONTH_NAMES[month - 1]} ${year}`;
}
