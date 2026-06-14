import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabase";

// Fetches the shared, admin-managed SGD/USD -> IDR exchange rates once.
export function useExchangeRates() {
  const [rates, setRates] = useState({ sgdToIdr: 1, usdToIdr: 1 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    supabase
      .from("currency_rates")
      .select("sgd_to_idr, usd_to_idr")
      .eq("id", 1)
      .single()
      .then(({ data, error }) => {
        if (!active) return;
        if (!error) {
          setRates({ sgdToIdr: Number(data.sgd_to_idr), usdToIdr: Number(data.usd_to_idr) });
        }
        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  return { ...rates, loading };
}
