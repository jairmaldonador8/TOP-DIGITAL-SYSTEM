import { Label } from '@/components/ui/label'

/**
 * Campo de formulario con etiqueta, descripción opcional y error por
 * campo. El error se renderiza con id `error-${id}`: el control interior
 * debe apuntarlo con `aria-describedby={error ? `error-${id}` : undefined}`
 * (ver ayuda `describedBy`).
 */
export function Campo({
  id,
  etiqueta,
  error,
  descripcion,
  children,
}: {
  id: string
  etiqueta: string
  error?: string
  descripcion?: string
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={id}>{etiqueta}</Label>
      {children}
      {descripcion && !error ? (
        <p className="text-xs text-muted-foreground">{descripcion}</p>
      ) : null}
      {error ? (
        <p id={`error-${id}`} role="alert" className="text-xs text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  )
}

/** Id del párrafo de error de un Campo, para `aria-describedby`. */
export function describedBy(id: string, error?: string): string | undefined {
  return error ? `error-${id}` : undefined
}
