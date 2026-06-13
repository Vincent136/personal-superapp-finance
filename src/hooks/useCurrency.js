import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { useProfile } from "./useProfile";
import { convertFromIDR, convertToIDR, formatCurrency } from "../lib/format";

// All amounts in the database are stored in IDR. This hook exposes the
// current user's display currency and the shared SGD <-> IDR rate, plus
// helpers to convert amounts for display and input.
export function useCurrency() {
  const { profile, loading: profileLoading } = useProfile();
  const [sgdToIdr, setSgdToIdr] = useState(null);
  const [rateLoading, setRateLoading] = useState(true);

  useEffect(() => {
    let active = true;

    supabase
      .from("currency_rates")
      .select("sgd_to_idr")
      .eq("id", 1)
      .single()
      .then(({ data, error }) => {
        if (!active) return;
        if (!error) setSgdToIdr(Number(data.sgd_to_idr));
        setRateLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const currency = profile?.currency ?? "IDR";
  const rate = sgdToIdr ?? 1;

  return {
    currency,
    rate,
    loading: profileLoading || rateLoading,
    fromBase: (amount) => convertFromIDR(amount, currency, rate),
    toBase: (amount) => convertToIDR(amount, currency, rate),
    format: (amount) => formatCurrency(convertFromIDR(amount, currency, rate), currency),
  };
}
