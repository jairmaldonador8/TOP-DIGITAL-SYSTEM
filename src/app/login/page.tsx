"use client";

import { useActionState, useState } from "react";
import { Eye, EyeOff } from "lucide-react";

import { iniciarSesion } from "./actions";
import { RegistroDialog } from "@/components/inicio/registro-dialog";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function PaginaLogin() {
  const [estado, accion, pendiente] = useActionState(iniciarSesion, null);
  const [verPassword, setVerPassword] = useState(false);

  return (
    <main className="relative flex min-h-svh items-center justify-center overflow-hidden bg-background p-4">
      {/* Resplandores del degradado de marca, muy difuminados, como fondo */}
      <div
        aria-hidden
        className="absolute -top-32 -left-24 size-96 rounded-full bg-marca-violeta/25 blur-[120px]"
      />
      <div
        aria-hidden
        className="absolute -right-24 -bottom-32 size-96 rounded-full bg-marca-naranja/20 blur-[120px]"
      />
      <div
        aria-hidden
        className="absolute top-1/2 left-1/2 size-72 -translate-x-1/2 -translate-y-1/2 rounded-full bg-marca-magenta/15 blur-[100px]"
      />
      {/* Halo: borde de degradado fino alrededor de la tarjeta */}
      <div className="bg-marca relative w-full max-w-sm rounded-[calc(var(--radius)+2px)] p-[1.5px]">
        <Card className="w-full border-0">
          <CardHeader className="items-center text-center">
            <span
              aria-hidden
              className="bg-marca mx-auto mb-2 flex size-12 items-center justify-center rounded-2xl text-lg font-extrabold text-white"
            >
              T
            </span>
            <h1 className="font-heading text-2xl leading-snug font-bold tracking-[0.18em]">
              TOP DIGITAL
            </h1>
            <CardDescription>
              Ingresa tus datos para acceder al sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form action={accion} className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="email">Correo electrónico</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder="nombre@empresa.com"
                  aria-describedby={estado?.error ? "error-login" : undefined}
                  required
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="password">Contraseña</Label>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={verPassword ? "text" : "password"}
                    autoComplete="current-password"
                    aria-describedby={estado?.error ? "error-login" : undefined}
                    required
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setVerPassword((v) => !v)}
                    aria-label={
                      verPassword ? "Ocultar contraseña" : "Mostrar contraseña"
                    }
                    className="absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {verPassword ? (
                      <EyeOff className="size-4" />
                    ) : (
                      <Eye className="size-4" />
                    )}
                  </button>
                </div>
              </div>
              {estado?.error ? (
                <p
                  id="error-login"
                  role="alert"
                  className="text-sm text-destructive"
                >
                  {estado.error}
                </p>
              ) : null}
              <Button
                type="submit"
                disabled={pendiente}
                className="bg-marca w-full border-0 text-white"
              >
                {pendiente ? "Iniciando sesión…" : "Iniciar sesión"}
              </Button>
            </form>
            <p className="mt-4 text-center text-sm text-muted-foreground">
              ¿Aún no tienes cuenta? <RegistroDialog />
            </p>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
