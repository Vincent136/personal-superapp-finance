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

// "2026-06" (as produced by <input type="month">) for the current month.
export function currentMonthString() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

// "2026-06" -> "2026-06-01"
export function monthToDate(monthString) {
  return `${monthString}-01`;
}

// "2026-06" -> "2026-06-30" (last day of that month)
export function endOfMonth(monthString) {
  const [year, month] = monthString.split("-").map(Number);
  const lastDay = new Date(year, month, 0).getDate();
  return `${monthString}-${String(lastDay).padStart(2, "0")}`;
}

export function daysInMonth(monthString) {
  const [year, month] = monthString.split("-").map(Number);
  return new Date(year, month, 0).getDate();
}
