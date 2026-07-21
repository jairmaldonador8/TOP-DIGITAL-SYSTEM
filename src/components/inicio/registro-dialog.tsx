"use client";

import { MessageCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const WHATSAPP_URL =
  "https://wa.me/5212206020831?text=" +
  encodeURIComponent(
    "Hola, vengo del sitio de Top Digital y quiero pedir informes."
  );

/**
 * "Registrarse" en el login: no hay alta autoservicio — Top Digital
 * acepta pocos proyectos al mes, así que el registro es una invitación a
 * pedir informes por WhatsApp.
 */
export function RegistroDialog() {
  return (
    <Dialog>
      <DialogTrigger
        render={
          <Button
            variant="link"
            className="text-marca-magenta h-auto p-0 text-sm font-semibold"
          />
        }
      >
        Registrarse
      </DialogTrigger>
      <DialogContent className="text-center">
        <DialogHeader className="items-center gap-3 pt-2">
          <span
            aria-hidden
            className="bg-marca flex size-12 items-center justify-center rounded-2xl text-white"
          >
            <MessageCircle className="size-6" />
          </span>
          <DialogTitle className="text-lg">Cupo limitado</DialogTitle>
          <DialogDescription className="text-balance">
            Top Digital trabaja con pocos proyectos al mes para ofrecer un
            servicio de calidad. Escríbenos por WhatsApp para pedir informes
            y apartar un lugar para tu negocio.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col items-center gap-2 pb-1">
          <Button
            render={
              <a
                href={WHATSAPP_URL}
                target="_blank"
                rel="noopener noreferrer"
              />
            }
            nativeButton={false}
            className="bg-marca w-full border-0 font-semibold text-white"
          >
            <MessageCircle aria-hidden className="size-4" />
            Pedir informes por WhatsApp
          </Button>
          <p className="text-xs text-muted-foreground">+52 1 220 602 0831</p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
