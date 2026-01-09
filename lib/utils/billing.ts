import { differenceInCalendarDays, formatDistanceToNowStrict, isFuture } from "date-fns";
import type { Plan, PlanCode, Subscription } from "@/lib/types/database";

export function isTrialing(subscription?: Subscription | null) {
  return subscription?.status === "trialing" && !!subscription.trial_ends_at;
}

export function getTrialDaysLeft(subscription?: Subscription | null) {
  if (!subscription?.trial_ends_at) return 0;
  const endsAt = new Date(subscription.trial_ends_at);
  if (!isFuture(endsAt)) return 0;
  return differenceInCalendarDays(endsAt, new Date());
}

export function getTrialCountdown(subscription?: Subscription | null) {
  if (!subscription?.trial_ends_at) return null;
  return formatDistanceToNowStrict(new Date(subscription.trial_ends_at), { addSuffix: true, roundingMethod: "ceil" });
}

export function isPaidPlan(planCode: PlanCode) {
  return planCode !== "starter";
}

export function formatLimit(limit: number | null) {
  if (!limit) return "Ilimitado";
  return new Intl.NumberFormat("es-MX").format(limit);
}

export function getUsageRatio(usage: number, limit: number | null) {
  if (!limit || limit <= 0) return 0;
  return Math.min(100, Math.round((usage / limit) * 100));
}

export function withinLimit(usage: number, limit: number | null) {
  if (!limit || limit <= 0) return true;
  return usage <= limit;
}

export function getPlanAnalyticsLabel(plan: Plan) {
  switch (plan.analytics_level) {
    case 3:
      return "Analytics avanzadas";
    case 2:
      return "Analytics optimizadas";
    default:
      return "Analytics esenciales";
  }
}
