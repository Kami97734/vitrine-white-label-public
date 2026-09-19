import { NextRequest, NextResponse } from "next/server"
import { aiComplete } from "@/lib/ai/provider"
import { loadAIConfig } from "@/lib/ai/config"
import { prisma } from "@/lib/prisma"

const DEV = process.env.NODE_ENV === "development"

export async function POST(request: NextRequest) {
  try {
    const config = await loadAIConfig()
    if (!config.apiKey) return NextResponse.json({ error: "IA não configurada. Vá em Configurações > Inteligência Artificial." }, { status: 503 })
    if (!config.chatEnabled) return NextResponse.json({ error: "Chat desabilitado." }, { status: 503 })

    const body = await request.json()
    const { message, history } = body
    if (!message?.trim()) return NextResponse.json({ error: "Mensagem é obrigatória" }, { status: 400 })

    let catalogText = ""
    try {
      const categories = await prisma.category.findMany({
        include: {
          products: {
            include: {
              prices: { orderBy: { effectiveAt: "desc" }, take: 1 },
            },
            take: 50,
          },
        },
      })
      catalogText = categories.map((cat) => {
        const products = cat.products.map((p) => {
          const price = p.prices[0]?.value
          return `- ${p.name}${p.code ? ` (${p.code})` : ""}${price != null ? ` - R$ ${price.toFixed(2)}` : ""}`
        }).join("\n")
        return `## ${cat.title}\n${products || "  (sem produtos)"}`
      }).join("\n\n")
    } catch { catalogText = "Catálogo temporariamente indisponível." }

    const systemPrompt = `Você é um assistente virtual de uma loja online brasileira. Você ajuda clientes a encontrar produtos e tirar dúvidas.

CATÁLOGO DA LOJA:
${catalogText || "Nenhum produto cadastrado ainda."}

REGRAS:
- Responda sempre em português brasileiro, de forma educada e objetiva
- Consulte o catálogo acima para responder sobre produtos e preços
- Se não encontrar o produto no catálogo, informe educadamente que não está disponível
- Para fechar pedido, informe que o WhatsApp da loja está disponível para atendimento
- Seja breve (máximo 3-4 frases por resposta)
- Não invente informações que não estão no catálogo`

    const messages = [
      { role: "system" as const, content: systemPrompt },
      ...(Array.isArray(history) ? history.slice(-10) : []),
      { role: "user" as const, content: message },
    ]

    const result = await aiComplete({
      model: config.provider as any,
      apiKey: config.apiKey,
      modelName: config.model || undefined,
      messages,
      maxTokens: config.maxTokens,
      temperature: config.temperature,
    })

    return NextResponse.json({
      reply: result.content.trim() || "Desculpe, não consegui gerar uma resposta agora. Tente novamente.",
    })
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Erro desconhecido"
    if (DEV) console.error("[AI Chat] Error:", e)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
