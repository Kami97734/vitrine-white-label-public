"use client"

import { MessageCircle } from "lucide-react"
import { useSettings } from "@/components/providers/settings-provider"

export function WhatsAppFab() {
  const { whatsappNumber, siteName, fabWhatsappText } = useSettings()
  const message = encodeURIComponent(fabWhatsappText.replaceAll("{siteName}", siteName))

  return (
    <a
      href={`https://wa.me/${whatsappNumber}?text=${message}`}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Fale conosco no WhatsApp"
      title="Fale conosco ou faça seu pedido pelo WhatsApp"
      className="fixed bottom-4 right-4 z-[9997] flex h-14 w-14 items-center justify-center rounded-full bg-whatsapp text-whatsapp-foreground shadow-lg transition-all hover:scale-110 hover:shadow-xl active:scale-95 md:h-16 md:w-16"
    >
      <MessageCircle className="h-7 w-7 md:h-8 md:w-8" />
    </a>
  )
}
