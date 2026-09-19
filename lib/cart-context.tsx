"use client"

import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react"

export type CartItem = {
  productId: string
  name: string
  price: number
  quantity: number
  image: string
  code?: string
}

type CartContextType = {
  items: CartItem[]
  itemCount: number
  total: number
  addItem: (item: Omit<CartItem, "quantity">) => void
  removeItem: (productId: string) => void
  updateQuantity: (productId: string, quantity: number) => void
  clearCart: () => void
  generateWhatsAppMessage: (whatsappNumber: string, siteName: string) => string
}

const CartContext = createContext<CartContextType | null>(null)

const STORAGE_KEY = "product-catalog-cart"

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) setItems(JSON.parse(stored))
    } catch { /* ignore */ }
  }, [])

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
    } catch { /* ignore */ }
  }, [items])

  const itemCount = items.reduce((acc, i) => acc + i.quantity, 0)
  const total = items.reduce((acc, i) => acc + i.price * i.quantity, 0)

  const addItem = useCallback((item: Omit<CartItem, "quantity">) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.productId === item.productId)
      if (existing) {
        return prev.map((i) =>
          i.productId === item.productId ? { ...i, quantity: i.quantity + 1 } : i
        )
      }
      return [...prev, { ...item, quantity: 1 }]
    })
  }, [])

  const removeItem = useCallback((productId: string) => {
    setItems((prev) => prev.filter((i) => i.productId !== productId))
  }, [])

  const updateQuantity = useCallback((productId: string, quantity: number) => {
    if (quantity <= 0) {
      setItems((prev) => prev.filter((i) => i.productId !== productId))
      return
    }
    setItems((prev) =>
      prev.map((i) => (i.productId === productId ? { ...i, quantity } : i))
    )
  }, [])

  const clearCart = useCallback(() => {
    setItems([])
  }, [])

  function generateWhatsAppMessage(whatsappNumber: string, siteName: string): string {
    const lines: string[] = []
    lines.push(`Olá! Quero fazer um pedido do catálogo ${siteName}:`)
    lines.push("")
    for (const item of items) {
      const subtotal = item.price * item.quantity
      const priceStr = item.price.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
      const subtotalStr = subtotal.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
      lines.push(`${item.quantity}x ${item.name} - ${priceStr} cada = ${subtotalStr}`)
    }
    lines.push("")
    const totalStr = total.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
    lines.push(`Total: ${totalStr}`)
    return lines.join("\n")
  }

  return (
    <CartContext.Provider
      value={{ items, itemCount, total, addItem, removeItem, updateQuantity, clearCart, generateWhatsAppMessage }}
    >
      {children}
    </CartContext.Provider>
  )
}

export function useCart(): CartContextType {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error("useCart must be used within CartProvider")
  return ctx
}
