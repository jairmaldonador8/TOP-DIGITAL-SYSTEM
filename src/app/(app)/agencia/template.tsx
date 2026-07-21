/**
 * Template de la zona agencia: se remonta en cada navegación, así cada
 * sección entra con un fade + deslizamiento sutil (sensación de app viva).
 */
export default function TemplateAgencia({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 fill-mode-both duration-300">
      {children}
    </div>
  )
}
