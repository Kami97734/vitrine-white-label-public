export type AIModel = "groq" | "openai" | "anthropic" | "mistral" | "google"

export interface AIMessage {
  role: "system" | "user" | "assistant"
  content: string
}

export interface AIRequest {
  model: AIModel
  messages: AIMessage[]
  apiKey: string
  modelName?: string
  maxTokens?: number
  temperature?: number
}

export interface AIResponse {
  content: string
  model: string
  usage?: {
    promptTokens: number
    completionTokens: number
  }
}

const DEFAULT_MODELS: Record<AIModel, string> = {
  groq: "llama-3.3-70b-versatile",
  openai: "gpt-4o-mini",
  anthropic: "claude-3-haiku-20240307",
  mistral: "mistral-small-latest",
  google: "gemini-1.5-flash",
}

const PROVIDER_URLS: Record<AIModel, string> = {
  groq: "https://api.groq.com/openai/v1/chat/completions",
  openai: "https://api.openai.com/v1/chat/completions",
  anthropic: "https://api.anthropic.com/v1/messages",
  mistral: "https://api.mistral.ai/v1/chat/completions",
  google: "https://generativelanguage.googleapis.com/v1beta/models",
}

async function fetchOpenAILike(url: string, apiKey: string, req: AIRequest): Promise<AIResponse> {
  const model = req.modelName || DEFAULT_MODELS[req.model]
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: req.messages,
      max_tokens: req.maxTokens ?? 1024,
      temperature: req.temperature ?? 0.7,
    }),
    signal: AbortSignal.timeout(30000),
  })
  if (!res.ok) throw new Error(`${req.model} API error (${res.status}): ${await res.text()}`)
  const data = await res.json()
  return {
    content: data.choices?.[0]?.message?.content ?? "",
    model: data.model,
    usage: {
      promptTokens: data.usage?.prompt_tokens ?? 0,
      completionTokens: data.usage?.completion_tokens ?? 0,
    },
  }
}

async function anthropicComplete(apiKey: string, req: AIRequest): Promise<AIResponse> {
  const model = req.modelName || DEFAULT_MODELS.anthropic
  const systemMsg = req.messages.find((m) => m.role === "system")?.content ?? ""
  const userMsgs = req.messages.filter((m) => m.role !== "system")

  const res = await fetch(PROVIDER_URLS.anthropic, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model,
      system: systemMsg,
      messages: userMsgs.map((m) => ({ role: m.role, content: m.content })),
      max_tokens: req.maxTokens ?? 1024,
      temperature: req.temperature ?? 0.7,
    }),
    signal: AbortSignal.timeout(30000),
  })
  if (!res.ok) throw new Error(`Anthropic API error (${res.status}): ${await res.text()}`)
  const data = await res.json()
  return {
    content: data.content?.[0]?.text ?? "",
    model: data.model,
    usage: { promptTokens: 0, completionTokens: 0 },
  }
}

async function googleComplete(apiKey: string, req: AIRequest): Promise<AIResponse> {
  const model = req.modelName || DEFAULT_MODELS.google
  const url = `${PROVIDER_URLS.google}/${model}:generateContent?key=${apiKey}`
  const contents = req.messages.map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }))

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ contents }),
    signal: AbortSignal.timeout(30000),
  })
  if (!res.ok) throw new Error(`Google API error (${res.status}): ${await res.text()}`)
  const data = await res.json()
  return {
    content: data.candidates?.[0]?.content?.parts?.[0]?.text ?? "",
    model,
    usage: { promptTokens: 0, completionTokens: 0 },
  }
}

export async function aiComplete(req: AIRequest): Promise<AIResponse> {
  if (!req.apiKey) throw new Error("API key não configurada. Vá em Configurações > Inteligência Artificial.")

  switch (req.model) {
    case "groq":
    case "openai":
    case "mistral":
      return fetchOpenAILike(PROVIDER_URLS[req.model], req.apiKey, req)
    case "anthropic":
      return anthropicComplete(req.apiKey, req)
    case "google":
      return googleComplete(req.apiKey, req)
    default:
      throw new Error(`Provedor desconhecido: ${req.model}`)
  }
}
