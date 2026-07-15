'use client'

import { useActionState } from 'react'

import { iniciarSesion } from './actions'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function PaginaLogin() {
  const [estado, accion, pendiente] = useActionState(iniciarSesion, null)

  return (
    <main className="flex min-h-svh items-center justify-center bg-background p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <h1 className="font-heading text-2xl leading-snug font-semibold tracking-tight">
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
                aria-describedby={estado?.error ? 'error-login' : undefined}
                required
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                aria-describedby={estado?.error ? 'error-login' : undefined}
                required
              />
            </div>
            {estado?.error ? (
              <p id="error-login" role="alert" className="text-sm text-destructive">
                {estado.error}
              </p>
            ) : null}
            <Button type="submit" disabled={pendiente} className="w-full">
              {pendiente ? 'Iniciando sesión…' : 'Iniciar sesión'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  )
}
