"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SpaceLogo } from "@/brand/space/SpaceLogo";
import { Button } from "@/components/ui/button";

gsap.registerPlugin(ScrollTrigger);

const heroStats = [
  { label: "Catálogos publicados", value: "2,100+" },
  { label: "Tiempo promedio de setup", value: "8 min" },
  { label: "Actualizaciones al mes", value: "20+" },
];

const featureHighlights = [
  {
    title: "Panel diseñado para escalar",
    desc: "Visualiza métricas, inventario y engagement en un dashboard creado para founders que iteran rápido.",
    badge: "Control total",
  },
  {
    title: "Branding preciso desde el onboarding",
    desc: "Define colores, CTAs y storytelling una sola vez; Space sincroniza tu identidad en todo el journey.",
    badge: "Experiencia coherente",
  },
  {
    title: "Automations y analítica nativa",
    desc: "Registra vistas, clics y búsquedas sin integraciones extra: cada catálogo aprende de tus usuarios.",
    badge: "Insights en tiempo real",
  },
];

const ecosystem = [
  { title: "Automatiza lanzamiento y updates", body: "Cada cambio se publica con un solo clic: onboarding → branding → catálogo público." },
  { title: "Integraciones preparadas", body: "REST hooks y Supabase events listos para conectar pagos, CRM o ERP sin fricción." },
  { title: "Soporte de clase enterprise", body: "Alertas proactivas, health checks y roadmap público para que sepas qué sigue." },
];

export default function LandingPage() {
  const cardsRef = useRef<HTMLDivElement[]>([]);

  useEffect(() => {
    cardsRef.current.forEach((card) => {
      if (!card) return;
      gsap.fromTo(
        card,
        { y: 60, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.9,
          ease: "power3.out",
          scrollTrigger: {
            trigger: card,
            start: "top 85%",
          },
        }
      );
    });
  }, []);

  return (
    <main className="min-h-screen bg-cloud text-ink overflow-hidden">
      <section className="relative px-6 py-16 sm:py-24 md:py-28">
        <div className="mx-auto max-w-6xl">
          <div className="flex items-center gap-3 text-sm text-slate">
            <SpaceLogo variant="mark" size={32} />
            <span className="tracking-[0.3em] uppercase text-xs">SPACE</span>
          </div>
          <div className="mt-10 grid gap-10 lg:grid-cols-[1.1fr_0.9fr]">
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="space-y-8"
            >
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-semibold leading-tight text-ink">
                Tu catálogo más ambicioso merece una plataforma del mismo nivel.
              </h1>
              <p className="text-lg text-slate max-w-2xl">
                SPACE es el HQ para diseñar, lanzar y optimizar catálogos digitales sin fricción. Onboarding guiado, branding preciso y analítica en cada paso.
              </p>
              <div className="flex flex-wrap gap-4">
                <Button asChild size="lg" className="bg-spaceBlue text-white hover:bg-spaceBlue/80">
                  <Link href="/signup">Crear mi Space</Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="border-spaceMist text-ink">
                  <Link href="/login">Entrar al dashboard</Link>
                </Button>
              </div>
              <div className="grid gap-6 sm:grid-cols-3 py-6 border-t border-b border-spaceMist">
                {heroStats.map((stat) => (
                  <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                  >
                    <p className="text-2xl font-semibold text-ink">{stat.value}</p>
                    <p className="text-sm text-slate">{stat.label}</p>
                  </motion.div>
                ))}
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1, duration: 0.7 }}
              className="relative rounded-[32px] border border-spaceMist bg-white shadow-[0_20px_70px_rgba(79,107,255,0.12)] overflow-hidden"
            >
              <Image
                src="https://images.unsplash.com/photo-1556740749-887f6717d7e4?auto=format&fit=crop&w=1200&q=80"
                alt="SPACE dashboard preview"
                width={1200}
                height={900}
                className="h-full w-full object-cover"
                priority
              />
            </motion.div>
          </div>
        </div>
      </section>

      <section className="px-6 py-20 sm:py-28 bg-white">
        <div className="mx-auto max-w-6xl space-y-12">
          <div className="text-center space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full bg-spaceMist px-4 py-1 text-xs font-semibold text-spaceBlue">
              Flujo inteligente
            </div>
            <h2 className="text-3xl sm:text-4xl font-semibold text-ink">Un onboarding que ya piensa en tu marca</h2>
            <p className="text-slate max-w-2xl mx-auto">
              Cada paso está diseñado para capturar identidad, contenido y operaciones en minutos. Sin plantillas genéricas.
            </p>
          </div>
          <div className="grid gap-6 lg:grid-cols-3">
            {featureHighlights.map((feature, i) => (
              <div
                key={feature.title}
                ref={(el) => {
                  cardsRef.current[i] = el!;
                }}
                className="rounded-3xl border border-spaceMist bg-cloud/70 p-6 backdrop-blur flex flex-col gap-4"
              >
                <span className="text-xs font-semibold text-spaceBlue uppercase tracking-wide">{feature.badge}</span>
                <h3 className="text-xl font-semibold text-ink">{feature.title}</h3>
                <p className="text-sm text-slate">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-6 py-20 sm:py-28 bg-cloud">
        <div className="mx-auto max-w-6xl grid gap-12 md:grid-cols-[1fr_0.9fr] items-center">
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="space-y-6"
          >
            <div className="inline-flex items-center gap-2 rounded-full bg-spaceMist px-4 py-1 text-xs font-semibold text-spaceBlue">
              Ecosistema SPACE
            </div>
            <h2 className="text-3xl sm:text-4xl font-semibold text-ink">
              Una plataforma creada para convencer clientes y escalar contigo
            </h2>
            <p className="text-slate">
              Más que un builder. Space alinea operaciones, contenido vivo y analítica para que cada interacción transmita confianza.
            </p>
            <ul className="space-y-3 text-sm text-ink">
              <li>• Personaliza CTA, colores y layout una sola vez; Space lo replica en cada vista del catálogo.</li>
              <li>• Publicaciones optimizadas para buscadores y dispositivos móviles sin configuraciones extra.</li>
              <li>• Microinteracciones que elevan la percepción y refuerzan la lectura editorial de tu catálogo.</li>
            </ul>
          </motion.div>
          <div className="space-y-5">
            {ecosystem.map((item, i) => (
              <motion.div
                key={item.title}
                className="rounded-3xl border border-spaceMist bg-white p-5 shadow-sm"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <p className="text-xs uppercase tracking-[0.3em] text-spaceBlue mb-2">Valor {i + 1}</p>
                <h3 className="text-lg font-semibold text-ink">{item.title}</h3>
                <p className="text-sm text-slate mt-1">{item.body}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-6 py-24 sm:py-32 bg-white">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mx-auto max-w-5xl flex flex-col gap-6 text-center"
        >
          <h2 className="text-3xl sm:text-4xl font-semibold text-ink">
            Tu catálogo es la primera impresión; haz que transmita el nivel de tu marca con SPACE.
          </h2>
          <div className="flex flex-wrap justify-center gap-4">
            <Button asChild size="lg" className="bg-spaceBlue text-white hover:bg-spaceBlue/80">
              <Link href="/signup">Probar Space</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="border-spaceMist text-ink">
              <Link href="/login">Entrar al dashboard</Link>
            </Button>
          </div>
        </motion.div>
      </section>

      <footer className="px-6 py-8 bg-white text-ink border-t border-spaceMist">
        <div className="mx-auto max-w-6xl flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-slate">
          <div className="flex items-center gap-2">
            <SpaceLogo variant="wordmark" size={28} />
            <span>Space®</span>
          </div>
          <p>© {new Date().getFullYear()} Space. Todos los derechos reservados.</p>
          <p>
            Powered by{" "}
            <Link href="https://amoxtli.tech" target="_blank" className="font-semibold text-ink hover:underline">
              Amoxtli®
            </Link>
          </p>
        </div>
      </footer>
    </main>
  );
}
