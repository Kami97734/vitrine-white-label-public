"use client"

import Image from "next/image"
import Link from "next/link"
import { ShoppingCart, Plus, Minus, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { useCart } from "@/lib/cart-context"
import { useSettings } from "@/components/providers/settings-provider"
import { useLocale } from "@/components/providers/locale-provider"

export function CartDrawer() {
  const { items, itemCount, total, removeItem, updateQuantity, generateWhatsAppMessage } = useCart()
  const settings = useSettings()
  const { t } = useLocale()

  if (!settings.cartEnabled) return null

  function handleWhatsAppCheckout() {
    const msg = generateWhatsAppMessage(settings.whatsappNumber, settings.siteName)
    const url = `https://wa.me/${settings.whatsappNumber}?text=${encodeURIComponent(msg)}`
    window.open(url, "_blank")
  }

  const totalStr = total.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" aria-label={t("cart.title")}>
          <ShoppingCart className="h-5 w-5" />
          {itemCount > 0 && (
            <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
              {itemCount > 99 ? "99+" : itemCount}
            </span>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="flex w-full flex-col sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            {t("cart.title")} ({itemCount})
          </SheetTitle>
        </SheetHeader>

        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
            <ShoppingCart className="h-12 w-12 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground">{t("cart.empty")}</p>
            <Button variant="outline" asChild>
              <Link href="/">{t("catalog.all")}</Link>
            </Button>
          </div>
        ) : (
          <>
            <div className="flex-1 space-y-3 overflow-y-auto py-4">
              {items.map((item) => {
                const itemTotal = item.price * item.quantity
                return (
                  <div
                    key={item.productId}
                    className="flex items-start gap-3 rounded-lg border bg-card p-3"
                  >
                    <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-md bg-muted">
                      {item.image ? (
                        <Image
                          src={item.image}
                          alt={item.name}
                          fill
                          className="object-cover"
                          onError={(e) => { (e.target as HTMLImageElement).style.display = "none" }}
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-muted-foreground text-xs">
                          ? 
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {item.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {item.price.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                      </p>
                      <div className="mt-1 flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="w-6 text-center text-sm font-medium">{item.quantity}</span>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                        <span className="ml-auto text-sm font-semibold">
                          {itemTotal.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                        </span>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 shrink-0 text-muted-foreground"
                      onClick={() => removeItem(item.productId)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                )
              })}
            </div>

            <div className="border-t pt-4 space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{t("cart.total")}</span>
                <span className="text-lg font-bold">{totalStr}</span>
              </div>
              <Button
                className="w-full gap-2"
                size="lg"
                onClick={handleWhatsAppCheckout}
              >
                <ShoppingCart className="h-4 w-4" />
                {t("cart.checkout")}
              </Button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}
