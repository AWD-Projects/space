"use client";

import { Suspense, useEffect, useState, useTransition } from "react";
import { signUp } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { Eye, EyeOff, ClipboardCheck, Palette, TrendingUp, Loader2 } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useToast } from "@/components/ui/toast-provider";

function SignUpContent() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { addToast } = useToast();

  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    const errorParamRaw = searchParams.get("error");
    const errorParam = errorParamRaw ? decodeURIComponent(errorParamRaw) : null;
    if (errorParam) {
      addToast({ title: "Error al crear la cuenta", description: errorParam, variant: "error" });
      params.delete("error");
    }

    if (errorParam) {
      const query = params.toString();
      router.replace(query ? `/signup?${query}` : "/signup");
    }
  }, [searchParams, addToast, router]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden");
      addToast({ title: "Contraseñas distintas", description: "Revisa que ambas coincidan", variant: "error" });
      return;
    }

    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres");
      addToast({ title: "Contraseña insegura", description: "Debe tener mínimo 6 caracteres", variant: "error" });
      return;
    }

    const formData = new FormData(e.currentTarget);
    startTransition(() => {
      signUp(formData);
    });
  }

  const valueProps = [
    { icon: ClipboardCheck, title: "Onboarding curado", text: "Entra y publica en 5 pasos guiados." },
    { icon: Palette, title: "Branding sin límites", text: "Define colores, CTAs y layouts desde el dashboard." },
    { icon: TrendingUp, title: "Insights al instante", text: "Métricas accionables para escalar tu tienda." },
  ];

  return (
    <div className="admin-theme min-h-screen bg-cloud text-ink">
      <div className="grid min-h-screen lg:grid-cols-[1fr_0.95fr]">
        <section className="flex flex-col justify-center px-6 py-12 sm:px-10 lg:px-16 bg-white">
          <div className="mx-auto w-full max-w-md">
            <div className="mb-10 text-center">
              <div className="mx-auto mb-4 inline-flex items-center gap-2 rounded-full bg-spaceMist px-4 py-1 text-xs font-semibold text-spaceBlue">
                Crear cuenta
              </div>
              <h2 className="text-3xl font-semibold">Desbloquea tu catálogo premium</h2>
              <p className="mt-2 text-slate">La experiencia completa de SPACE en minutos.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="tu@email.com"
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
                    placeholder="Mínimo 6 caracteres"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={isPending}
                    className="pr-10 bg-cloud"
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

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmar contraseña</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirma tu contraseña"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    disabled={isPending}
                    className="pr-10 bg-cloud"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate hover:text-ink"
                    disabled={isPending}
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={isPending}>
                {isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creando cuenta...
                  </>
                ) : (
                  "Crear cuenta"
                )}
              </Button>

              <p className="text-sm text-center text-slate">
                ¿Ya tienes cuenta?{" "}
                <Link href="/login" className="font-semibold text-spaceBlue hover:underline">
                  Inicia sesión
                </Link>
              </p>
            </form>
          </div>
        </section>

        <section className="relative hidden lg:flex flex-col justify-between bg-spaceBlue text-white px-12 py-10 overflow-hidden">
          <div className="absolute inset-6 border border-white/20 rounded-3xl" />
          <div className="relative z-10">
            <p className="text-sm uppercase tracking-[0.4em] text-white/70">Tu nuevo HQ</p>
            <h1 className="mt-6 text-4xl font-semibold leading-tight">
              Lanza, personaliza y escala un catálogo con ADN SaaS.
            </h1>
            <p className="mt-4 text-white/80 text-lg max-w-lg">
              Plantillas premium, analytics en tiempo real y flujos diseñados para founders que cuidan cada detalle.
            </p>
          </div>
          <div className="relative z-10 grid gap-5 text-sm">
            {valueProps.map((item) => (
              <div key={item.title} className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur">
                <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/15">
                  <item.icon className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-semibold">{item.title}</h3>
                <p className="text-white/80 text-sm mt-1">{item.text}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

export default function SignUpPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-cloud text-ink" />}>
      <SignUpContent />
    </Suspense>
  );
}
