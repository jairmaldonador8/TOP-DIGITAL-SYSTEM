import { ViewTransition } from 'react'

/**
 * Template del portal: se remonta en cada navegación, así la vista
 * anterior sale (vista-sale) y la nueva entra enfocándose (vista-entra) —
 * reglas en globals.css. `default="none"` evita animar en transiciones que
 * no son de navegación.
 */
export default function TemplatePortal({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ViewTransition enter="vista-entra" exit="vista-sale" default="none">
      <div>{children}</div>
    </ViewTransition>
  )
}
