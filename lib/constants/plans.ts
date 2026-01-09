import type { PlanCode } from "@/lib/types/database";

export const PLAN_CODES: PlanCode[] = ["starter", "growth", "pro"];

export type PlanMarketing = {
  title: string;
  description: string;
  badge?: string;
  featured?: boolean;
  highlights: string[];
};

export const PLAN_MARKETING: Record<PlanCode, PlanMarketing> = {
  starter: {
    title: "Starter",
    description: "Crea tu catálogo sin costo. Perfecto para validar tus productos.",
    highlights: [
      "1 tienda + 2 catálogos",
      "Hasta 20 productos",
      "Branding SPACE visible",
      "Analytics esenciales",
    ],
  },
  growth: {
    title: "Growth",
    description: "Escala tu operación y personaliza la experiencia de compra.",
    badge: "Más popular",
    featured: true,
    highlights: [
      "Hasta 200 productos",
      "10 catálogos organizados",
      "Personalización sin branding",
      "Analytics nivel 2 + soporte prioritario",
    ],
  },
  pro: {
    title: "Pro",
    description: "Todo el poder de SPACE: ilimitado y con soporte premium.",
    highlights: [
      "Productos y catálogos ilimitados",
      "Analytics avanzadas nivel 3",
      "White-label completo + CTA avanzados",
      "Onboarding y soporte premium",
    ],
  },
};

export function getPlanLabel(code: PlanCode) {
  return PLAN_MARKETING[code]?.title ?? code;
}
