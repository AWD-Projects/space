import { auth, clerkClient } from "@clerk/nextjs/server";

export async function getAuthUserId() {
  const { userId } = await auth();
  return userId ?? null;
}

export async function requireAuthUserId() {
  const userId = await getAuthUserId();
  if (!userId) {
    throw new Error("No autenticado");
  }
  return userId;
}

export async function getClerkProfile(userId: string) {
  const client = await clerkClient();
  const user = await client.users.getUser(userId);
  const primaryEmail = user.emailAddresses.find((email) => email.id === user.primaryEmailAddressId);
  const email = primaryEmail?.emailAddress ?? user.emailAddresses[0]?.emailAddress ?? null;
  const fullName =
    user.fullName ??
    (`${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() || null);

  return {
    id: user.id,
    email,
    fullName,
  };
}
