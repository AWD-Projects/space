import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getUser } from "@/lib/actions/auth";

export default async function OnboardingLayout({ children }: { children: ReactNode }) {
  const user = await getUser();
  if (!user) {
    redirect("/login");
  }

  return <>{children}</>;
}
