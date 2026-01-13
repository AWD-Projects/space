import { createClient } from "@supabase/supabase-js";

const storageUrl = process.env.NEXT_PUBLIC_STORAGE_SUPABASE_URL;
const serviceRoleKey = process.env.STORAGE_SUPABASE_SERVICE_ROLE_KEY;

if (!storageUrl) {
  throw new Error("NEXT_PUBLIC_STORAGE_SUPABASE_URL is not defined");
}

if (!serviceRoleKey) {
  throw new Error("STORAGE_SUPABASE_SERVICE_ROLE_KEY is not defined");
}

export const storageAdminClient = createClient(storageUrl, serviceRoleKey, {
  auth: {
    persistSession: false,
  },
});
