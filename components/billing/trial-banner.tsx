"use client";

import { useCallback } from "react";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

type TrialBannerProps = {
  trialDaysLeft: number;
  trialEndsAt?: string | null;
};

export function TrialBanner({ trialDaysLeft, trialEndsAt }: TrialBannerProps) {
  const handleClick = useCallback(() => {
    const element = document.getElementById("plan-grid");
    element?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  if (!trialEndsAt || trialDaysLeft <= 0) {
    return null;
  }

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-amber-200 bg-amber-50/80 p-5 text-amber-900 md:flex-row md:items-center md:justify-between">
      <div className="flex items-start gap-3">
        <div className="rounded-full bg-white/60 p-2 text-amber-600">
          <Sparkles className="h-5 w-5" />
        </div>
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-amber-700">Prueba activa</p>
          <p className="text-base font-medium">
            Disfruta de SPACE Pro durante {trialDaysLeft} {trialDaysLeft === 1 ? "día" : "días"} más.
          </p>
          <p className="text-sm text-amber-800/80">Al terminar la prueba, pasas automáticamente al plan Starter gratis si no eliges un plan de pago.</p>
        </div>
      </div>
    </div>
  );
}
