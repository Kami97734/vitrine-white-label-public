"use client"

import { useState, useEffect } from "react"
import { ChevronUp } from "lucide-react"
import { cn } from "@/lib/utils"

export function ScrollToTop() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    function onScroll() {
      setVisible(window.scrollY > 400)
    }
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  function scrollToTop() {
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  return (
    <button
      onClick={scrollToTop}
      aria-label="Voltar ao topo"
      className={cn(
        "fixed bottom-4 left-4 z-[9995] flex h-10 w-10 items-center justify-center rounded-full bg-slate-800 text-white shadow-lg transition-all hover:bg-slate-700 active:scale-90",
        "sm:bottom-6 md:bottom-8",
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none",
      )}
    >
      <ChevronUp className="h-5 w-5" />
    </button>
  )
}
