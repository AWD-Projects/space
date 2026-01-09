import type { PlanCode } from "@/lib/types/database";

export const PLAN_CODES: PlanCode[] = ["starter", "growth", "pro"];

export type PlanMarketing = {
  title: string;
  description: string;
  badge?: string;
  featured?: boolean;
  highlights: string[];
  price_mxn: number;
  tagline: string;
};

export const PLAN_MARKETING: Record<PlanCode, PlanMarketing> = {
  starter: {
    title: "Starter",
    description: "Crea tu catálogo sin costo. Perfecto para validar tus productos.",
    tagline: "Ideal para validar tu catálogo",
    price_mxn: 0,
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
    tagline: "Optimiza operación y marca",
    price_mxn: 149,
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
    tagline: "Todo ilimitado y soporte premium",
    price_mxn: 299,
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
