import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function AuthLayout({ children }: { children: ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const { data: store } = await supabase
      .from("stores")
      .select("id, status")
      .eq("owner_id", user.id)
      .maybeSingle<{ id: string; status: "draft" | "published" }>();

    if (!store || store.status !== "published") {
      redirect("/onboarding");
    }

    redirect("/home");
  }

  return <>{children}</>;
}
