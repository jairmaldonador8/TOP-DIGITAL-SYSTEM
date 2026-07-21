import Link from "next/link";
import {
  ArrowRight,
  KanbanSquare,
  MessageCircle,
  Rocket,
  Sparkles,
} from "lucide-react";

import { Button } from "@/components/ui/button";

/**
 * Landing pública (ruta `/`). Presenta el sistema con la esencia de la
 * marca — fondo casi negro, degradado violeta → magenta → naranja — y un
 * único CTA que lleva a /login. Los usuarios con sesión nunca la ven:
 * `src/app/page.tsx` los redirige a su área antes de renderizar.
 */
export function Landing() {
  return (
    <main className="relative flex min-h-svh flex-col overflow-hidden bg-background">
      {/* ===== Atmósfera: resplandores de marca + retícula sutil ===== */}
      <div
        aria-hidden
        className="absolute -top-40 -left-32 size-[30rem] rounded-full bg-marca-violeta/20 blur-[140px]"
      />
      <div
        aria-hidden
        className="absolute top-24 -right-40 size-[26rem] rounded-full bg-marca-magenta/10 blur-[140px]"
      />
      <div
        aria-hidden
        className="absolute inset-0 [background-image:radial-gradient(rgba(244,241,247,0.05)_1px,transparent_1px)] [background-size:28px_28px] [mask-image:radial-gradient(ellipse_70%_60%_at_50%_0%,black,transparent)]"
      />
      {/* Horizonte: el atardecer magenta/naranja de la referencia */}
      <div
        aria-hidden
        className="absolute inset-x-0 -bottom-32 h-96 bg-gradient-to-t from-marca-naranja/35 via-marca-magenta/20 to-transparent blur-3xl"
      />

      {/* ===== Barra superior ===== */}
      <header className="relative z-10 mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-6">
        <div className="flex items-center gap-3">
          <span
            aria-hidden
            className="bg-marca flex size-9 items-center justify-center rounded-xl text-base font-extrabold text-white"
          >
            T
          </span>
          <span className="font-heading text-sm font-bold tracking-[0.22em]">
            TOP DIGITAL
          </span>
        </div>
        <Button
          render={<Link href="/login" />}
          nativeButton={false}
          variant="secondary"
          className="rounded-full border border-border bg-card/70 backdrop-blur"
        >
          Iniciar sesión
        </Button>
      </header>

      {/* ===== Hero ===== */}
      <section className="relative z-10 mx-auto flex w-full max-w-5xl flex-col items-center px-6 pt-14 text-center sm:pt-20">
        <p className="animate-in fade-in slide-in-from-bottom-4 fill-mode-both flex items-center gap-2 rounded-full border border-border bg-card/80 py-1.5 pr-4 pl-1.5 text-xs font-medium text-muted-foreground backdrop-blur duration-700">
          <span
            aria-hidden
            className="bg-marca flex size-6 items-center justify-center rounded-full text-white"
          >
            <Sparkles className="size-3.5" />
          </span>
          El sistema de tu agencia, en vivo
        </p>

        <h1 className="animate-in fade-in slide-in-from-bottom-6 fill-mode-both mt-8 font-heading text-4xl leading-tight font-bold tracking-tight delay-100 duration-700 sm:text-6xl">
          Leads, campañas y ventas
          <br />
          <span className="text-marca">en un solo lugar</span>
        </h1>

        <p className="animate-in fade-in slide-in-from-bottom-6 fill-mode-both mt-6 max-w-xl text-base text-muted-foreground delay-200 duration-700 sm:text-lg">
          Sigue cada lead desde el primer contacto hasta la venta, mira tus
          campañas en tiempo real y habla con tu agencia sin salir del
          sistema.
        </p>

        <div className="animate-in fade-in slide-in-from-bottom-6 fill-mode-both mt-10 delay-300 duration-700">
          <Button
            render={<Link href="/login" />}
            nativeButton={false}
            size="lg"
            className="bg-marca h-13 gap-2 rounded-full border-0 px-8 text-base font-semibold text-white shadow-[0_8px_40px_-8px_rgba(240,51,141,0.55)] transition-transform hover:scale-[1.03]"
          >
            Comenzar
            <ArrowRight aria-hidden className="size-5" />
          </Button>
        </div>

        <ul className="animate-in fade-in fill-mode-both mt-12 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm text-muted-foreground delay-500 duration-700">
          <li className="flex items-center gap-2">
            <KanbanSquare aria-hidden className="size-4 text-marca-violeta" />
            CRM de leads
          </li>
          <li className="flex items-center gap-2">
            <Rocket aria-hidden className="size-4 text-marca-magenta" />
            Campañas en vivo
          </li>
          <li className="flex items-center gap-2">
            <MessageCircle aria-hidden className="size-4 text-marca-naranja" />
            Chat directo
          </li>
        </ul>
      </section>

      {/* ===== Vista previa del producto (decorativa) ===== */}
      <div
        aria-hidden
        className="animate-in fade-in slide-in-from-bottom-10 fill-mode-both relative z-10 mx-auto mt-14 w-full max-w-4xl px-6 delay-500 duration-1000 [perspective:1600px]"
      >
        <div className="relative rounded-t-3xl border border-b-0 border-border/80 bg-card/80 p-4 backdrop-blur [transform:rotateX(14deg)] [transform-origin:bottom] sm:p-5">
          {/* Halo del panel */}
          <div className="bg-marca absolute inset-x-10 -top-px h-px opacity-70" />

          {/* Barra de ventana */}
          <div className="flex items-center gap-1.5 pb-4">
            <span className="size-2.5 rounded-full bg-marca-violeta/60" />
            <span className="size-2.5 rounded-full bg-marca-magenta/60" />
            <span className="size-2.5 rounded-full bg-marca-naranja/60" />
            <span className="ml-3 h-4 w-40 max-w-[40%] rounded-full bg-secondary" />
          </div>

          {/* Métricas */}
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            <div className="min-w-0 rounded-2xl border border-border bg-background/60 p-3 text-left sm:p-4">
              <p className="truncate text-[11px] text-muted-foreground">
                Leads del mes
              </p>
              <p className="mt-1 truncate text-xl font-bold">48</p>
              <p className="text-marca truncate text-[11px] font-semibold">
                +38%
              </p>
            </div>
            <div className="min-w-0 rounded-2xl border border-border bg-background/60 p-3 text-left sm:p-4">
              <p className="truncate text-[11px] text-muted-foreground">
                Ventas
              </p>
              <p className="mt-1 truncate text-xl font-bold">$86,500</p>
              <p className="text-marca truncate text-[11px] font-semibold">
                +21%
              </p>
            </div>
            <div className="min-w-0 rounded-2xl border border-border bg-background/60 p-3 text-left sm:p-4">
              <p className="truncate text-[11px] text-muted-foreground">
                Campañas activas
              </p>
              <p className="mt-1 truncate text-xl font-bold">3</p>
              <p className="truncate text-[11px] font-semibold text-marca-naranja">
                2 en Meta Ads
              </p>
            </div>
          </div>

          {/* Mini kanban */}
          <div className="mt-2 grid grid-cols-3 gap-2 sm:mt-3 sm:gap-3">
            {[
              {
                etapa: "Nuevo",
                color: "bg-marca-violeta",
                tarjetas: ["María — WhatsApp", "Luis — Meta Ads"],
              },
              {
                etapa: "Interesado",
                color: "bg-marca-magenta",
                tarjetas: ["Carlos — Referido"],
              },
              {
                etapa: "Ganado",
                color: "bg-marca-naranja",
                tarjetas: ["Sofía — $12,400"],
              },
            ].map(({ etapa, color, tarjetas }) => (
              <div
                key={etapa}
                className="min-w-0 rounded-2xl border border-border bg-background/60 p-3 text-left"
              >
                <p className="flex items-center gap-1.5 text-[11px] font-semibold">
                  <span className={`size-1.5 shrink-0 rounded-full ${color}`} />
                  <span className="truncate">{etapa}</span>
                </p>
                <div className="mt-2 space-y-2">
                  {tarjetas.map((t) => (
                    <div
                      key={t}
                      className="truncate rounded-lg border border-border bg-card px-2.5 py-2 text-[10px] text-muted-foreground"
                    >
                      {t}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <footer className="relative z-10 pb-6 text-center text-xs text-muted-foreground/70">
        © {new Date().getFullYear()} Top Digital — Marketing que se mide.
      </footer>
    </main>
  );
}
