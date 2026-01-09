import type { Plan } from "@/lib/types/database";
import { formatLimit, getUsageRatio, withinLimit } from "@/lib/utils/billing";

type UsageCardProps = {
  plan: Plan;
  usage: {
    products: number;
    catalogs: number;
  };
};

const progressClasses = "h-2 rounded-full bg-spaceMist/50";

export function UsageCard({ plan, usage }: UsageCardProps) {
  const productsRatio = getUsageRatio(usage.products, plan.max_products);
  const catalogsRatio = getUsageRatio(usage.catalogs, plan.max_catalogs);

  const productLimitOk = withinLimit(usage.products, plan.max_products);
  const catalogLimitOk = withinLimit(usage.catalogs, plan.max_catalogs);

  return (
    <div className="rounded-2xl border border-spaceMist/80 bg-white p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm uppercase tracking-wide text-muted-foreground">Uso del plan</p>
          <h3 className="text-xl font-semibold text-ink">{plan.name}</h3>
        </div>
        <span className="text-sm text-muted-foreground">
          Analytics: nivel {plan.analytics_level}
        </span>
      </div>

      <div className="mt-6 space-y-6">
        <div>
          <div className="flex items-center justify-between text-sm font-medium text-ink/80">
            <span>Productos</span>
            <span>
              {usage.products} / {formatLimit(plan.max_products)}
            </span>
          </div>
          <div className="mt-2">
            <div className={progressClasses}>
              <div
                className={`h-2 rounded-full transition-all ${
                  productLimitOk ? "bg-spaceBlue" : "bg-red-500"
                }`}
                style={{ width: `${productLimitOk ? productsRatio : 100}%` }}
              />
            </div>
            {!productLimitOk && (
              <p className="mt-2 text-sm text-red-600">
                Llegaste al límite de productos. Actualiza tu plan para seguir agregando.
              </p>
            )}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between text-sm font-medium text-ink/80">
            <span>Catálogos</span>
            <span>
              {usage.catalogs} / {formatLimit(plan.max_catalogs)}
            </span>
          </div>
          <div className="mt-2">
            <div className={progressClasses}>
              <div
                className={`h-2 rounded-full transition-all ${
                  catalogLimitOk ? "bg-spaceBlue" : "bg-red-500"
                }`}
                style={{ width: `${catalogLimitOk ? catalogsRatio : 100}%` }}
              />
            </div>
            {!catalogLimitOk && (
              <p className="mt-2 text-sm text-red-600">
                Alcanzaste el máximo de catálogos. Cambia de plan para liberar más espacios.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
