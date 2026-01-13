"use server";

import { currentUser } from "@clerk/nextjs/server";

export async function getUser() {
  return currentUser();
}
