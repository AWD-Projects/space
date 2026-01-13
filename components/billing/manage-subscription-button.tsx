"use client";

import { useTransition } from "react";
import { Settings } from "lucide-react";
import { createCustomerPortalSession } from "@/lib/actions/billing";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast-provider";

type Props = {
  disabled?: boolean;
};

export function ManageSubscriptionButton({ disabled }: Props) {
  const [pending, startTransition] = useTransition();
  const { addToast } = useToast();

  const handleClick = () => {
    if (pending || disabled) return;

    startTransition(async () => {
      const result = await createCustomerPortalSession();
      if ("error" in result || !result.data?.url) {
        addToast({
          title: "No se pudo abrir Stripe",
          description: "error" in result ? result.error : "Inténtalo de nuevo en unos segundos.",
          variant: "error",
        });
        return;
      }

      window.location.href = result.data.url;
    });
  };

  return (
    <Button
      variant="outline"
      className="gap-2"
      disabled={pending || disabled}
      onClick={handleClick}
    >
      <Settings className="h-4 w-4" />
      {pending ? "Abriendo..." : "Administrar en Stripe"}
    </Button>
  );
}
