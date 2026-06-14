const CURRENCY_CONFIG = {
  IDR: { locale: "id-ID", maximumFractionDigits: 0 },
  SGD: { locale: "en-SG", maximumFractionDigits: 2 },
  USD: { locale: "en-US", maximumFractionDigits: 2 },
};

export const INVESTMENT_CURRENCIES = [
  { code: "IDR", label: "Indonesian Rupiah (IDR)" },
  { code: "SGD", label: "Singapore Dollar (SGD)" },
  { code: "USD", label: "US Dollar (USD)" },
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

function toIDR(amount, currency, rates) {
  if (currency === "SGD") return amount * rates.sgdToIdr;
  if (currency === "USD") return amount * rates.usdToIdr;
  return amount;
}

function fromIDR(amount, currency, rates) {
  if (currency === "SGD") return amount / rates.sgdToIdr;
  if (currency === "USD") return amount / rates.usdToIdr;
  return amount;
}

// Converts an amount between IDR/SGD/USD via IDR as the pivot currency.
// `rates` = { sgdToIdr, usdToIdr }, the shared admin-managed exchange rates.
export function convertAmount(amount, fromCurrency, toCurrency, rates) {
  if (fromCurrency === toCurrency) return amount ?? 0;
  return fromIDR(toIDR(amount ?? 0, fromCurrency, rates), toCurrency, rates);
}
