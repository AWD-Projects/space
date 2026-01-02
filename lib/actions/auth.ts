"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { z } from "zod";

const signUpSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
});

const signInSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(1, "La contraseña es requerida"),
});

export async function signUp(formData: FormData) {
  const supabase = await createClient();

  const data = {
    email: formData.get("email") as string,
    password: formData.get("password") as string,
  };

  const validation = signUpSchema.safeParse(data);
  if (!validation.success) {
    // In production, you might want to use cookies or searchParams to pass errors
    redirect("/signup?error=" + encodeURIComponent(validation.error.issues[0].message));
  }

  // Sign up with auto-confirm (requires Supabase project settings to disable email confirmation)
  const { error: signUpError } = await supabase.auth.signUp({
    email: data.email,
    password: data.password,
    options: {
      // This will skip email confirmation if your Supabase project has it disabled
      emailRedirectTo: undefined,
    },
  });

  if (signUpError) {
    redirect("/signup?error=" + encodeURIComponent(signUpError.message));
  }

  // Automatically sign in the user after successful signup
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: data.email,
    password: data.password,
  });

  if (signInError) {
    // If auto-login fails, redirect to login page
    redirect("/login?message=" + encodeURIComponent("Cuenta creada. Por favor inicia sesión."));
  }

  redirect("/onboarding");
}

export async function signIn(formData: FormData) {
  const supabase = await createClient();

  const data = {
    email: formData.get("email") as string,
    password: formData.get("password") as string,
  };

  const validation = signInSchema.safeParse(data);
  if (!validation.success) {
    redirect("/login?error=" + encodeURIComponent(validation.error.issues[0].message));
  }

  const { error } = await supabase.auth.signInWithPassword({
    email: data.email,
    password: data.password,
  });

  if (error) {
    redirect("/login?error=" + encodeURIComponent(error.message));
  }

  // Check if user has completed onboarding
  const { data: store } = await supabase
    .from("stores")
    .select("id, status")
    .single();

  if (!store) {
    redirect("/onboarding");
  }

  redirect("/home");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export async function getUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}
