"use client";

import { Suspense, useEffect, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { Chrome, Eye, EyeOff, Sparkles, Shield, LayoutGrid, Loader2 } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useToast } from "@/components/ui/toast-provider";
import { useSignIn } from "@clerk/nextjs";
import { getPostAuthRedirect } from "@/lib/actions/session";

function LoginContent() {
  const [showPassword, setShowPassword] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const searchParams = useSearchParams();
  const router = useRouter();
  const { addToast } = useToast();
  const { signIn, setActive, isLoaded } = useSignIn();

  useEffect(() => {
    const errorParam = searchParams.get("error");
    const messageParam = searchParams.get("message");
    const params = new URLSearchParams(searchParams.toString());

    const error = errorParam ? decodeURIComponent(errorParam) : null;
    if (error) {
      addToast({ title: "Error al iniciar sesión", description: error, variant: "error" });
      params.delete("error");
    }

    const message = messageParam ? decodeURIComponent(messageParam) : null;
    if (message) {
      addToast({ title: message });
      params.delete("message");
    }

    if (error || message) {
      const query = params.toString();
      router.replace(query ? `/login?${query}` : "/login");
    }
  }, [searchParams, addToast, router]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    startTransition(() => {
      handlePasswordSignIn();
    });
  }

  async function handlePasswordSignIn() {
    if (!isLoaded || !signIn) return;
    setIsSubmitting(true);
    try {
      let result = await signIn.create({
        identifier: email,
        password,
      });

      if (result.status === "needs_first_factor") {
        result = await result.attemptFirstFactor({
          strategy: "password",
          password,
        });
      }

      if (result.status === "complete") {
        await setActive({ session: result.createdSessionId });
        const redirectResult = await getPostAuthRedirect();
        router.push(redirectResult?.redirectTo ?? "/app/home");
      } else {
        addToast({
          title: "Revisa tu cuenta",
          description: "Completa el inicio de sesión en Clerk.",
          variant: "error",
        });
      }
    } catch (error: any) {
      addToast({
        title: "Error al iniciar sesión",
        description: error?.errors?.[0]?.message ?? "No pudimos autenticarte.",
        variant: "error",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleGoogle() {
    if (!isLoaded || !signIn) return;
    await signIn.authenticateWithRedirect({
      strategy: "oauth_google",
      redirectUrl: "/login",
      redirectUrlComplete: "/app/home",
    });
  }

  const highlights = [
    { icon: Sparkles, text: "Onboarding guiado en 5 pasos" },
    { icon: Shield, text: "Seguridad y control multi-tenant" },
    { icon: LayoutGrid, text: "Dashboard premium optimizado" },
  ];

  return (
    <div className="admin-theme min-h-screen bg-cloud text-ink">
      <div className="grid min-h-screen lg:grid-cols-[0.85fr_1fr]">
        <section className="relative hidden lg:flex flex-col justify-between bg-spaceBlue text-white px-12 py-10 overflow-hidden">
          <div className="absolute inset-6 border border-white/20 rounded-3xl" />
          <div className="relative z-10">
            <p className="text-sm uppercase tracking-[0.4em] text-white/70">SPACE</p>
            <h1 className="mt-6 text-4xl font-semibold leading-tight">
              Administra tu catálogo digital con herramientas diseñadas para equipos exigentes.
            </h1>
            <p className="mt-4 text-white/80 text-lg max-w-lg">
              Monitoriza inventario, personaliza el branding y publica en segundos sin depender de integraciones complejas.
            </p>
          </div>
          <div className="relative z-10 grid gap-4 text-sm">
            {highlights.map((item) => (
              <div key={item.text} className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/15">
                  <item.icon className="h-5 w-5" />
                </div>
                <span className="text-base font-medium">{item.text}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="flex flex-col justify-center px-6 py-12 sm:px-10 lg:px-16 bg-white">
          <div className="mx-auto w-full max-w-md">
            <div className="mb-10 text-center">
              <div className="mx-auto mb-4 inline-flex items-center gap-2 rounded-full bg-spaceMist px-4 py-1 text-xs font-semibold text-spaceBlue">
                Acceso seguro
              </div>
              <h2 className="text-3xl font-semibold">Bienvenido de vuelta</h2>
              <p className="mt-2 text-slate">Inicia sesión para continuar construyendo tu catálogo.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="tu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isPending}
                className="bg-cloud"
              />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Contraseña</Label>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    required
                    disabled={isPending}
                    className="pr-10 bg-cloud"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate hover:text-ink"
                    disabled={isPending}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div id="clerk-captcha" />

              <Button type="submit" className="w-full" disabled={isPending || isSubmitting}>
                {isPending || isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin text-primary" />
                    Iniciando sesión...
                  </>
                ) : (
                  "Iniciar sesión"
                )}
              </Button>

              <Button type="button" variant="outline" className="w-full" onClick={handleGoogle} disabled={isPending || isSubmitting}>
                <Chrome className="mr-2 h-4 w-4" />
                Continuar con Google
              </Button>

              <p className="text-sm text-center text-slate">
                ¿No tienes cuenta?{" "}
                <Link href="/signup" className="font-semibold text-spaceBlue hover:underline">
                  Regístrate
                </Link>
              </p>
            </form>
          </div>
        </section>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-cloud text-ink" />}>
      <LoginContent />
    </Suspense>
  );
}
