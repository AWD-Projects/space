import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getBillingOverview, getAvailablePlans } from "@/lib/actions/billing";
import { PlanCard } from "@/components/billing/plan-card";
import { UsageCard } from "@/components/billing/usage-card";
import { TrialBanner } from "@/components/billing/trial-banner";
import { ManageSubscriptionButton } from "@/components/billing/manage-subscription-button";
import { Badge } from "@/components/ui/badge";
import { PLAN_MARKETING } from "@/lib/constants/plans";
import type { PlanCode, SubscriptionStatus } from "@/lib/types/database";
import { isPaidPlan } from "@/lib/utils/billing";

export const metadata: Metadata = {
  title: "Planes y Facturación · SPACE",
};

const statusLabels: Record<SubscriptionStatus, string> = {
  trialing: "Prueba activa",
  active: "Activo",
  past_due: "Pago pendiente",
  canceled: "Cancelado",
};

function formatDate(value?: string | null) {
  if (!value) return null;
  return new Intl.DateTimeFormat("es-MX", { dateStyle: "long" }).format(new Date(value));
}

export default async function BillingPage() {
  const [{ data: overview }, { data: plans }] = await Promise.all([
    getBillingOverview(),
    getAvailablePlans(),
  ]);

  if (!overview || !plans) {
    redirect("/home");
  }

  const currentPlanCode = overview.plan.code as PlanCode;
  const currentMarketing = PLAN_MARKETING[currentPlanCode];
  const nextRenewal = formatDate(overview.subscription.current_period_ends_at);
  const shouldShowPortal = !!overview.subscription.stripe_customer_id || isPaidPlan(currentPlanCode);
  const formattedPrice =
    overview.plan.monthly_price_mxn === 0
      ? "Gratis"
      : `${new Intl.NumberFormat("es-MX", {
          style: "currency",
          currency: "MXN",
          maximumFractionDigits: 0,
        }).format(overview.plan.monthly_price_mxn)} / mes`;

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm uppercase tracking-wide text-muted-foreground">Facturación</p>
          <h1 className="text-3xl font-semibold text-ink">Planes y suscripción</h1>
          <p className="text-sm text-muted-foreground">
            Gestiona tus planes, revisa límites y actualiza tu suscripción cuando lo necesites.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Badge
            variant={overview.subscription.status === "past_due" ? "destructive" : "secondary"}
            className="text-sm"
          >
            {statusLabels[overview.subscription.status]}
          </Badge>
          <ManageSubscriptionButton disabled={!shouldShowPortal} />
        </div>
      </div>

      <TrialBanner trialDaysLeft={overview.trialDaysLeft} trialEndsAt={overview.subscription.trial_ends_at} />

      <div className="grid gap-4 lg:grid-cols-2">
        <UsageCard plan={overview.plan} usage={overview.usage} />
        <div className="rounded-2xl border border-spaceMist/80 bg-white p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm uppercase tracking-wide text-muted-foreground">Plan actual</p>
              <h2 className="text-2xl font-semibold text-ink">{currentMarketing?.title}</h2>
              <p className="text-sm text-muted-foreground mt-1">{currentMarketing?.description}</p>
            </div>
            <div className="text-right text-sm text-muted-foreground">
              <p>{formattedPrice}</p>
              {nextRenewal && (
                <p className="text-xs text-slate">
                  Próximo cobro: <span className="font-medium text-ink">{nextRenewal}</span>
                </p>
              )}
            </div>
          </div>
          <div className="mt-6 space-y-3">
            {currentMarketing?.highlights?.map((highlight) => (
              <div key={highlight} className="flex items-center gap-3 text-sm text-ink/90">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                {highlight}
              </div>
            ))}
          </div>
          <div className="mt-6 rounded-xl bg-slate-50 p-4 text-sm text-slate-700">
            Nuevas cuentas comienzan con 30 días de SPACE Pro. Si no agregas un método de pago,
            continuarás en el plan Starter gratis con límites reducidos.
          </div>
        </div>
      </div>

      <section className="space-y-6" id="plan-grid">
        <div>
          <p className="text-sm uppercase tracking-wide text-muted-foreground">Planes disponibles</p>
          <h2 className="text-2xl font-semibold text-ink">Cambia o mejora tu plan</h2>
          <p className="text-sm text-muted-foreground">
            Elige el plan que mejor se adapte a tu operación. Puedes actualizar o cancelar en cualquier momento.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {plans.map((plan) => {
            const planCode = plan.code as PlanCode;
            const marketing = PLAN_MARKETING[planCode] ?? {
              title: plan.name,
              description: "",
              highlights: [],
            };
            return (
              <PlanCard
                key={plan.code}
                plan={plan}
                marketing={marketing}
                planCode={planCode}
                currentPlanCode={currentPlanCode}
                status={overview.subscription.status}
                trialDaysLeft={overview.trialDaysLeft}
              />
            );
          })}
        </div>
      </section>
    </div>
  );
}
