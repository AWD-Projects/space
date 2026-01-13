import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { getStoreByOwnerId } from "@/lib/db/queries/store";

export default async function AuthLayout({ children }: { children: ReactNode }) {
  const { userId } = await auth();

  if (userId) {
    const store = await getStoreByOwnerId(userId);
    const status = store?.status as "draft" | "published" | undefined;

    if (!store || status !== "published") {
      redirect("/onboarding");
    }

    redirect("/app/home");
  }

  return <>{children}</>;
}
