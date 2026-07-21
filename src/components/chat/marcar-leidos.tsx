'use client'

import * as React from 'react'

/**
 * Al montarse con mensajes pendientes, los marca leídos (server action).
 * Solo dispara cuando hayNoLeidos pasa a true: los refresh posteriores del
 * mismo hilo (mensajes nuevos en vivo) vuelven a activarlo sin bucles.
 */
export function MarcarLeidos({
  hayNoLeidos,
  action,
}: {
  hayNoLeidos: boolean
  action: () => Promise<void>
}) {
  const actionRef = React.useRef(action)
  React.useEffect(() => {
    actionRef.current = action
  })

  React.useEffect(() => {
    if (hayNoLeidos) void actionRef.current()
  }, [hayNoLeidos])

  return null
}
