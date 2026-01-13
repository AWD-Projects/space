"use client";

import Link from "next/link";
import { AlertTriangle, ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { PlanCode } from "@/lib/types/database";
import { PLAN_MARKETING } from "@/lib/constants/plans";

type PlanLimitBannerProps = {
  planCode?: PlanCode;
  resource: "products" | "catalogs";
  used: number;
  limit: number | null;
};

export function PlanLimitBanner({ planCode, resource, used, limit }: PlanLimitBannerProps) {
  if (!planCode || !limit || limit <= 0) {
    return null;
  }

  const ratio = limit ? used / limit : 0;
  const atLimit = used >= limit;
  const isStarter = planCode === "starter";
  const isGrowth = planCode === "growth";

  const shouldShow =
    (isStarter && (atLimit || ratio >= 0.75)) ||
    (isGrowth && (atLimit || ratio >= 0.9));

  if (!shouldShow) {
    return null;
  }

  const planLabel = PLAN_MARKETING[planCode]?.title ?? planCode;
  const resourceLabel = resource === "products" ? "productos" : "catálogos";
  const remaining = Math.max(limit - used, 0);
  const upgradeTarget = planCode === "starter" ? "Growth" : "Pro";

  const message = atLimit
    ? `Plan ${planLabel}: ya alcanzaste el máximo de ${resourceLabel}. Actualiza a ${upgradeTarget} para seguir creciendo.`
    : `Plan ${planLabel}: te quedan ${remaining} ${remaining === 1 ? resourceLabel.slice(0, -1) : resourceLabel}. Cambia a ${upgradeTarget} para desbloquear más.`;

  return (
    <div className="rounded-3xl border border-amber-200 bg-amber-50/80 p-4 sm:p-5 text-amber-900">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="rounded-full bg-white/70 p-2 text-amber-600">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-amber-700">
              {planLabel} · {resource === "products" ? "Productos" : "Catálogos"}
            </p>
            <p className="text-sm">{message}</p>
          </div>
        </div>
        <Button asChild variant="outline" className="border-amber-300 text-amber-800 hover:bg-amber-100">
          <Link href="/app/billing" className="flex items-center gap-2 text-sm font-semibold">
            Actualizar plan
            <ArrowUpRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>
    </div>
  );
}
