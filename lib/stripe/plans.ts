import type { PlanCode } from "@/lib/types/database";

const priceMap: Record<PlanCode, string | undefined> = {
  starter: undefined,
  growth: process.env.STRIPE_PRICE_GROWTH,
  pro: process.env.STRIPE_PRICE_PRO,
};

export function getPriceIdForPlan(planCode: PlanCode): string | null {
  return priceMap[planCode] ?? null;
}

export function getPlanCodeFromPriceId(priceId?: string | null): PlanCode | null {
  if (!priceId) {
    return null;
  }

  const entry = (Object.entries(priceMap) as [PlanCode, string | undefined][]).find(
    ([, value]) => value === priceId
  );

  return entry ? entry[0] : null;
}
