"use client";

import { useTransition } from "react";
import type { Plan, PlanCode, SubscriptionStatus } from "@/lib/types/database";
import type { PlanMarketing } from "@/lib/constants/plans";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast-provider";
import { createCheckoutSession } from "@/lib/actions/billing";
import { isPaidPlan } from "@/lib/utils/billing";

type PlanCardProps = {
  plan: Plan;
  marketing: PlanMarketing;
  planCode: PlanCode;
  currentPlanCode: PlanCode;
  status: SubscriptionStatus;
  trialDaysLeft: number;
};

export function PlanCard({
  plan,
  marketing,
  planCode,
  currentPlanCode,
  status,
  trialDaysLeft,
}: PlanCardProps) {
  const [pending, startTransition] = useTransition();
  const { addToast } = useToast();

  const isCurrent = currentPlanCode === planCode;
  const paidPlan = isPaidPlan(planCode);
  const priceLabel =
    plan.monthly_price_mxn === 0
      ? "Gratis"
      : `${new Intl.NumberFormat("es-MX", {
          style: "currency",
          currency: "MXN",
          maximumFractionDigits: 0,
        }).format(plan.monthly_price_mxn)} / mes`;

  const showTrialBadge = isCurrent && status === "trialing";

  const handleSelect = () => {
    if (pending || isCurrent || !paidPlan) return;

    startTransition(async () => {
      const result = await createCheckoutSession(planCode);

      if (result?.error || !result?.data?.url) {
        addToast({
          title: "No se pudo iniciar el checkout",
          description: result?.error ?? "Intenta de nuevo en unos minutos.",
          variant: "error",
        });
        return;
      }

      window.location.href = result.data.url;
    });
  };

  return (
    <div
      className="flex flex-col rounded-2xl border border-spaceMist/80 bg-white p-5 shadow-sm"
      data-current={isCurrent}
    >
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="text-sm uppercase tracking-wide text-muted-foreground">Plan</p>
          <h3 className="text-2xl font-semibold text-ink">{marketing.title}</h3>
        </div>
        <div className="text-right">
          {marketing.badge && (
            <span className="inline-flex items-center rounded-full bg-spaceBlue/10 px-3 py-1 text-xs font-semibold text-spaceBlue">
              {marketing.badge}
            </span>
          )}
          {showTrialBadge && (
            <span className="ml-2 inline-flex items-center rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
              Prueba · {trialDaysLeft} días restantes
            </span>
          )}
        </div>
      </div>

      <p className="mt-4 text-sm text-slate">{marketing.description}</p>

      <div className="mt-6 flex items-end gap-2">
        <span className="text-3xl font-bold text-ink">{priceLabel}</span>
      </div>

      <ul className="mt-6 space-y-2 text-sm text-ink/90">
        {marketing.highlights.map((feature) => (
          <li key={feature} className="flex items-center gap-2">
            <span className="block h-1.5 w-1.5 rounded-full bg-spaceBlue" />
            {feature}
          </li>
        ))}
      </ul>

      <Button
        className="mt-8 w-full"
        disabled={pending || isCurrent || !paidPlan}
        onClick={handleSelect}
      >
        {isCurrent
          ? "Plan actual"
          : paidPlan
            ? pending
              ? "Redirigiendo..."
              : "Elegir plan"
            : "Incluido"}
      </Button>
    </div>
  );
}
