import { NextRequest, NextResponse } from "next/server"
import { aiComplete } from "@/lib/ai/provider"
import { loadAIConfig } from "@/lib/ai/config"

const DEV = process.env.NODE_ENV === "development"

export async function POST(request: NextRequest) {
  try {
    const config = await loadAIConfig()
    if (!config.apiKey) return NextResponse.json({ error: "IA não configurada. Vá em Configurações > Inteligência Artificial." }, { status: 503 })
    if (!config.describeEnabled) return NextResponse.json({ error: "Geração de descrições desabilitada." }, { status: 503 })

    const { productName, category, keywords, unitQuantity, unitMeasure, sku } = await request.json()

    if (!productName?.trim()) {
      return NextResponse.json({ error: "Nome do produto é obrigatório" }, { status: 400 })
    }

    if (DEV) console.log("[AI Describe] Generating for:", productName)

    const unitInfo =
      unitQuantity && unitMeasure
        ? `Quantidade/unidade: ${unitQuantity} ${unitMeasure}`
        : unitMeasure
          ? `Unidade de venda: ${unitMeasure}`
          : ""

    const prompt = [
      `Você é um copywriter especializado em e-commerce brasileiro.`,
      `Gere uma descrição de produto curta e persuasiva para o seguinte produto:`,
      ``,
      `Nome: ${productName}`,
      category ? `Categoria: ${category}` : "",
      unitInfo ? unitInfo : "",
      sku ? `SKU: ${sku}` : "",
      keywords?.length ? `Palavras-chave: ${keywords.join(", ")}` : "",
      ``,
      `Regras:`,
      `- Use português brasileiro`,
      `- Tom profissional mas amigável`,
      `- Destaque benefícios, não apenas características`,
      `- Máximo 200 caracteres`,
      `- Não invente informações técnicas que não foram fornecidas`,
      `- Retorne APENAS a descrição, sem prefácio ou formatação`,
    ].filter(Boolean).join("\n")

    const result = await aiComplete({
      model: config.provider as any,
      apiKey: config.apiKey,
      modelName: config.model || undefined,
      messages: [
        { role: "system", content: "Você é um copywriter de e-commerce brasileiro." },
        { role: "user", content: prompt },
      ],
      maxTokens: config.maxTokens,
      temperature: config.temperature,
    })

    if (DEV) console.log("[AI Describe] Done:", result.content.slice(0, 80))
    return NextResponse.json({ description: result.content.trim() })
  } catch (e) {
    if (DEV) console.error("[AI Describe] Error:", e)
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Erro ao gerar descrição" },
      { status: 500 }
    )
  }
}
