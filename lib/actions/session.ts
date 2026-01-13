"use server";

import { getAuthUserId } from "@/lib/auth";
import { getStoreByOwnerId } from "@/lib/db/queries/store";

export async function getPostAuthRedirect() {
  const userId = await getAuthUserId();
  if (!userId) {
    return { redirectTo: "/login" };
  }

  const store = await getStoreByOwnerId(userId);
  const status = store?.status as "draft" | "published" | undefined;

  if (!store || status !== "published") {
    return { redirectTo: "/onboarding" };
  }

  return { redirectTo: "/app/home" };
}
