import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

interface PricingConfigRow {
  early_adopter_price: number;
  normal_price: number;
  early_adopter_limit: number;
  early_adopter_count: number;
  early_adopter_active: boolean;
}

export interface PricingConfig extends PricingConfigRow {
  spots_left: number;
}

export function usePricing() {
  const [pricing, setPricing] = useState<PricingConfig | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    supabase
      .from("pricing_config")
      .select(
        "early_adopter_price, normal_price, early_adopter_limit, early_adopter_count, early_adopter_active"
      )
      .single()
      .then(({ data }) => {
        if (!mounted) return;
        if (data) {
          const row = data as PricingConfigRow;
          setPricing({
            ...row,
            spots_left: Math.max(
              0,
              row.early_adopter_limit - row.early_adopter_count
            ),
          });
        } else {
          setPricing(null);
        }
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const isEarlyAdopter =
    !!pricing?.early_adopter_active && (pricing?.spots_left ?? 0) > 0;

  const currentPrice = isEarlyAdopter
    ? pricing?.early_adopter_price ?? 4.99
    : pricing?.normal_price ?? 7.99;

  return { pricing, loading, isEarlyAdopter, currentPrice };
}

