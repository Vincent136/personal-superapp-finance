import { useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "./useAuth";

export const CURRENCIES = [
  { code: "IDR", label: "Indonesian Rupiah", symbol: "Rp",  flag: "🇮🇩", locked: true  },
  { code: "USD", label: "US Dollar",         symbol: "$",   flag: "🇺🇸", locked: false },
  { code: "SGD", label: "Singapore Dollar",  symbol: "S$",  flag: "🇸🇬", locked: false },
  { code: "EUR", label: "Euro",              symbol: "€",   flag: "🇪🇺", locked: false },
  { code: "MYR", label: "Malaysian Ringgit", symbol: "RM",  flag: "🇲🇾", locked: false },
  { code: "JPY", label: "Japanese Yen",      symbol: "¥",   flag: "🇯🇵", locked: false },
  { code: "AUD", label: "Australian Dollar", symbol: "A$",  flag: "🇦🇺", locked: false },
];

export const DEFAULT_RATES = {
  IDR: 1, USD: 16000, SGD: 12000, EUR: 17000, MYR: 3500, JPY: 107, AUD: 10500,
};

export function useCurrencyConfig() {
  const { user } = useAuth();
  const [config, setConfig] = useState({
    rates:     DEFAULT_RATES,
    wallets:   {},
    updatedAt: null,
  });

  useEffect(() => {
    if (!user) return;
    supabase
      .from("wallet_config")
      .select("rates, wallets, updated_at")
      .eq("user_id", user.id)
      .single()
      .then(({ data }) => {
        if (data) {
          setConfig({
            rates:     { ...DEFAULT_RATES, ...(data.rates   ?? {}) },
            wallets:   data.wallets   ?? {},
            updatedAt: data.updated_at,
          });
        }
      });
  }, [user]);

  const persist = useCallback(async (next) => {
    if (!user) return;
    setConfig(next); // optimistic
    await supabase
      .from("wallet_config")
      .upsert({ user_id: user.id, rates: next.rates, wallets: next.wallets });
  }, [user]);

  const updateRate = useCallback((code, rateToIDR) => {
    if (code === "IDR") return;
    setConfig((prev) => {
      const next = { ...prev, rates: { ...prev.rates, [code]: Number(rateToIDR) || 1 } };
      persist(next);
      return next;
    });
  }, [persist]);

  const updateWallet = useCallback((code, balance) => {
    setConfig((prev) => {
      const next = { ...prev, wallets: { ...prev.wallets, [code]: Number(balance) || 0 } };
      persist(next);
      return next;
    });
  }, [persist]);

  const toIDR = useCallback((amount, currency) => {
    const rate = config.rates[currency] ?? DEFAULT_RATES[currency] ?? 1;
    return (amount ?? 0) * rate;
  }, [config.rates]);

  const fromIDR = useCallback((idrAmount, targetCurrency) => {
    const rate = config.rates[targetCurrency] ?? DEFAULT_RATES[targetCurrency] ?? 1;
    return rate === 0 ? 0 : (idrAmount ?? 0) / rate;
  }, [config.rates]);

  const formatIDR = (amount) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency", currency: "IDR", maximumFractionDigits: 0,
    }).format(amount ?? 0);

  const formatAmount = (amount, currency) => {
    const locale   = currency === "IDR" ? "id-ID" : "en-US";
    const decimals = currency === "IDR" || currency === "JPY" ? 0 : 2;
    return new Intl.NumberFormat(locale, {
      style: "currency", currency, maximumFractionDigits: decimals,
    }).format(amount ?? 0);
  };

  return {
    currencies: CURRENCIES,
    rates:      config.rates,
    wallets:    config.wallets,
    updatedAt:  config.updatedAt,
    updateRate,
    updateWallet,
    toIDR,
    fromIDR,
    formatIDR,
    formatAmount,
  };
}
