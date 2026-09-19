"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { MessageCircle, X, Send, Bot, User, Sparkles, RefreshCw } from "lucide-react"
import { cn } from "@/lib/utils"
import { useSettings } from "@/components/providers/settings-provider"

type ChatMessage = {
  role: "user" | "assistant"
  content: string
  error?: boolean
}

const WELCOME_MESSAGE: ChatMessage = {
  role: "assistant",
  content: "Ola! Como posso ajudar? Pergunte sobre nossos produtos, precos ou tire duvidas!",
}

const ERROR_MESSAGE = "Desculpe, nao consegui processar sua pergunta. Tente novamente ou reformule."
const NETWORK_ERROR = "Sem conexao com o servidor. Verifique sua internet e tente novamente."

const DEV = process.env.NODE_ENV === "development"

function log(...args: unknown[]) {
  if (DEV) console.log("[AI Chat]", ...args)
}

export function AiChatButton() {
  const pathname = usePathname()
  const settings = useSettings()
  const isAdmin = pathname?.startsWith("/admin")
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME_MESSAGE])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [typingText, setTypingText] = useState("")
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, typingText])

  useEffect(() => {
    if (open) inputRef.current?.focus()
  }, [open])

  const sendMessage = useCallback(async (content: string, retryCount = 0, history: ChatMessage[] = []) => {
    setLoading(true)
    setTypingText("Digitando...")

    try {
      const chatHistory = history
        .filter((m) => !m.error)
        .slice(1)
        .map((m) => ({ role: m.role, content: m.content }))

      log("Sending:", { message: content, historyLength: chatHistory.length, retryCount })

      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 30000)

      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: content, history: chatHistory }),
        signal: controller.signal,
      })
      clearTimeout(timeoutId)

      log("Response status:", res.status)

      const data = await res.json()

      if (!res.ok) {
        log("API error:", data)
        throw new Error(data.error ?? `HTTP ${res.status}`)
      }

      if (!data.reply?.trim()) {
        log("Empty reply from API")
        throw new Error("Resposta vazia")
      }

      log("Reply received:", data.reply.slice(0, 100))
      setTypingText("")
      setMessages((prev) => [...prev, { role: "assistant", content: data.reply.trim() }])
    } catch (err) {
      log("Error:", err)

      if (retryCount < 2 && err instanceof DOMException && err.name === "AbortError") {
        log("Timeout, retrying...")
        setTypingText("Conexao lenta, tentando novamente...")
        await new Promise((r) => setTimeout(r, 1000))
        setTypingText("")
        return sendMessage(content, retryCount + 1, history)
      }

      const isNetworkError = err instanceof TypeError && err.message === "Failed to fetch"
      setTypingText("")
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: isNetworkError ? NETWORK_ERROR : ERROR_MESSAGE,
          error: true,
        },
      ])
    } finally {
      setLoading(false)
      setTypingText("")
    }
  }, [])

  async function handleSend(e: React.FormEvent) {
    e.preventDefault()
    const text = input.trim()
    if (!text || loading) return

    const currentMessages = [...messages]
    setInput("")
    setMessages((prev) => [...prev, { role: "user", content: text }])
    await sendMessage(text, 0, currentMessages)
  }

  function handleRetry() {
    const lastUserMsg = [...messages].reverse().find((m) => m.role === "user")
    const lastAssistantIsError = messages[messages.length - 1]?.error

    if (lastUserMsg && lastAssistantIsError) {
      setMessages((prev) => prev.slice(0, -1))
      sendMessage(lastUserMsg.content, 0, messages.slice(0, -1))
    }
  }

  if (isAdmin) return null
  if (!(settings as any).aiChatEnabled) return null

  return (
    <>
      {open && (
        <div
          className="fixed bottom-20 right-4 z-[9998] w-[360px] max-w-[calc(100vw-32px)] max-h-[calc(100dvh-160px)] rounded-xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900 overflow-hidden sm:bottom-20 md:bottom-24 md:right-6 lg:right-8"
        >
          <div className="flex items-center justify-between bg-primary px-4 py-3 text-primary-foreground">
            <div className="flex items-center gap-2">
              <Bot className="h-5 w-5 shrink-0" />
              <span className="font-semibold text-sm">Atendente IA</span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-primary-foreground hover:bg-primary/80 shrink-0"
              onClick={() => setOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex flex-col gap-3 p-4 h-[clamp(300px,50vh,420px)] overflow-y-auto">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={cn("flex gap-2 items-start", msg.role === "user" ? "justify-end" : "justify-start")}
              >
                {msg.role === "assistant" && (
                  <div className="flex-shrink-0 h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center mt-0.5">
                    <Sparkles className="h-4 w-4 text-primary" />
                  </div>
                )}
                <div
                  className={cn(
                    "max-w-[80%] rounded-xl px-3 py-2 text-sm break-words",
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground rounded-br-sm"
                      : msg.error
                        ? "bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800 rounded-bl-sm"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-bl-sm",
                  )}
                >
                  {msg.content}
                  {msg.error && (
                    <button
                      onClick={handleRetry}
                      className="flex items-center gap-1 mt-2 text-xs text-red-600 dark:text-red-400 hover:underline"
                    >
                      <RefreshCw className="h-3 w-3" />
                      Tentar novamente
                    </button>
                  )}
                </div>
                {msg.role === "user" && (
                  <div className="flex-shrink-0 h-8 w-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center mt-0.5">
                    <User className="h-4 w-4 text-slate-600 dark:text-slate-300" />
                  </div>
                )}
              </div>
            ))}

            {typingText && (
              <div className="flex gap-2 justify-start items-start">
                <div className="flex-shrink-0 h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center mt-0.5">
                  <Sparkles className="h-4 w-4 text-primary" />
                </div>
                <div className="bg-slate-100 dark:bg-slate-800 rounded-xl rounded-bl-sm px-3 py-2 text-sm text-slate-500 flex items-center gap-2">
                  <span className="animate-pulse">{typingText}</span>
                  <span className="flex gap-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: "300ms" }} />
                  </span>
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          <form onSubmit={handleSend} className="flex gap-2 border-t border-slate-200 dark:border-slate-700 p-3">
            <Input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Digite sua mensagem..."
              className="flex-1 min-w-0"
              disabled={loading}
            />
            <Button type="submit" size="icon" disabled={loading || !input.trim()} className="shrink-0">
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      )}

      <Button
        className={cn(
          "fixed bottom-20 right-4 z-[9996] h-12 w-12 rounded-full shadow-lg",
          "md:bottom-24 md:right-6 lg:right-8",
          open && "hidden",
        )}
        onClick={() => setOpen(true)}
        aria-label="Abrir chat"
      >
        <MessageCircle className="h-6 w-6" />
      </Button>
    </>
  )
}
