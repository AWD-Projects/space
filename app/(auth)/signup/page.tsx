"use client";

import { Suspense, useEffect, useMemo, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { Chrome, Eye, EyeOff, ClipboardCheck, Palette, TrendingUp, Loader2 } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useToast } from "@/components/ui/toast-provider";
import { useSignUp } from "@clerk/nextjs";

function SignUpContent() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [email, setEmail] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [step, setStep] = useState<"signup" | "verify">("signup");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { addToast } = useToast();
  const { signUp, setActive, isLoaded } = useSignUp();

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

    startTransition(() => {
      handlePasswordSignUp();
    });
  }

  async function handlePasswordSignUp() {
    if (!isLoaded || !signUp) return;
    setIsSubmitting(true);
    try {
      const result = await signUp.create({
        emailAddress: email,
        password,
      });

      if (result.status === "complete") {
        await setActive({ session: result.createdSessionId });
        router.push("/onboarding");
        return;
      }

      await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
      setStep("verify");
      addToast({ title: "Revisa tu email", description: "Ingresa el código de verificación enviado." });
    } catch (err: any) {
      addToast({
        title: "Error al crear la cuenta",
        description: err?.errors?.[0]?.message ?? "No pudimos registrarte.",
        variant: "error",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleVerifyCode() {
    if (!isLoaded || !signUp) return;
    setIsVerifying(true);
    try {
      const result = await signUp.attemptEmailAddressVerification({ code: verificationCode });
      if (result.status === "complete") {
        await setActive({ session: result.createdSessionId });
        router.push("/onboarding");
        return;
      }
      addToast({ title: "Código inválido", description: "Intenta nuevamente.", variant: "error" });
    } catch (err: any) {
      addToast({
        title: "No se pudo verificar",
        description: err?.errors?.[0]?.message ?? "Intenta nuevamente.",
        variant: "error",
      });
    } finally {
      setIsVerifying(false);
    }
  }

  async function handleResendCode() {
    if (!isLoaded || !signUp) return;
    setIsResending(true);
    try {
      await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
      addToast({ title: "Código reenviado", description: "Revisa tu correo para el nuevo código." });
    } catch (err: any) {
      addToast({
        title: "No pudimos reenviar el código",
        description: err?.errors?.[0]?.message ?? "Intenta nuevamente en unos segundos.",
        variant: "error",
      });
    } finally {
      setIsResending(false);
    }
  }

  async function handleGoogle() {
    if (!isLoaded || !signUp) return;
    await signUp.authenticateWithRedirect({
      strategy: "oauth_google",
      redirectUrl: "/signup",
      redirectUrlComplete: "/onboarding",
    });
  }

  const otpDigits = useMemo(() => {
    const chars = verificationCode.split("");
    return Array.from({ length: 6 }, (_, index) => chars[index] || "");
  }, [verificationCode]);

  function handleOtpChange(index: number, value: string) {
    const cleaned = value.replace(/\D/g, "").slice(0, 1);
    const next = otpDigits.slice();
    next[index] = cleaned;
    const combined = next.join("");
    setVerificationCode(combined);

    if (cleaned) {
      const nextInput = document.getElementById(`otp-${index + 1}`) as HTMLInputElement | null;
      nextInput?.focus();
    }
  }

  function handleOtpKeyDown(index: number, event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key !== "Backspace" || otpDigits[index]) return;
    const prevInput = document.getElementById(`otp-${index - 1}`) as HTMLInputElement | null;
    prevInput?.focus();
  }

  function handleOtpPaste(event: React.ClipboardEvent<HTMLInputElement>) {
    const pasted = event.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pasted) return;
    setVerificationCode(pasted);
    const nextIndex = Math.min(pasted.length, 5);
    const nextInput = document.getElementById(`otp-${nextIndex}`) as HTMLInputElement | null;
    nextInput?.focus();
    event.preventDefault();
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

            {step === "signup" ? (
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

                <div id="clerk-captcha" />

                <Button type="submit" className="w-full" disabled={isPending || isSubmitting}>
                  {isPending || isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creando cuenta...
                    </>
                  ) : (
                    "Crear cuenta"
                  )}
                </Button>

                <Button type="button" variant="outline" className="w-full" onClick={handleGoogle} disabled={isPending || isSubmitting}>
                  <Chrome className="mr-2 h-4 w-4" />
                  Continuar con Google
                </Button>

                <p className="text-sm text-center text-slate">
                  ¿Ya tienes cuenta?{" "}
                  <Link href="/login" className="font-semibold text-spaceBlue hover:underline">
                    Inicia sesión
                  </Link>
                </p>
              </form>
            ) : (
              <div className="space-y-6">
                <div className="space-y-2">
                  <div className="mx-auto inline-flex items-center gap-2 rounded-full bg-spaceMist px-4 py-1 text-xs font-semibold text-spaceBlue">
                    Verificar email
                  </div>
                  <h2 className="text-3xl font-semibold">Ingresa tu código</h2>
                  <p className="text-slate">Te enviamos un código a {email}. Pégalo o escríbelo para continuar.</p>
                </div>

                {error && (
                  <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                    {error}
                  </div>
                )}

                <div className="space-y-2">
                  <Label>Código de verificación</Label>
                  <div className="flex items-center justify-between gap-2">
                    {otpDigits.map((digit, index) => (
                      <Input
                        key={`otp-${index}`}
                        id={`otp-${index}`}
                        value={digit}
                        onChange={(event) => handleOtpChange(index, event.target.value)}
                        onKeyDown={(event) => handleOtpKeyDown(index, event)}
                        onPaste={index === 0 ? handleOtpPaste : undefined}
                        inputMode="numeric"
                        autoComplete="one-time-code"
                        maxLength={1}
                        className="h-12 w-12 rounded-xl bg-cloud text-center text-lg font-semibold"
                        disabled={isPending || isVerifying}
                      />
                    ))}
                  </div>
                </div>

                <Button type="button" className="w-full" onClick={handleVerifyCode} disabled={isPending || isVerifying || verificationCode.length < 6}>
                  {isVerifying ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Verificando...
                    </>
                  ) : (
                    "Verificar email"
                  )}
                </Button>

                <div className="grid gap-2 sm:grid-cols-2">
                  <Button type="button" variant="outline" className="w-full" onClick={handleResendCode} disabled={isPending || isVerifying || isResending}>
                    {isResending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Reenviando...
                      </>
                    ) : (
                      "Reenviar código"
                    )}
                  </Button>
                  <Button type="button" variant="ghost" className="w-full" onClick={() => setStep("signup")} disabled={isPending || isVerifying || isResending}>
                    Volver
                  </Button>
                </div>
              </div>
            )}
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
