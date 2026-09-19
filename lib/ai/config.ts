import { prisma } from "@/lib/prisma"

export type AIConfig = {
  provider: string
  apiKey: string
  model: string
  temperature: number
  maxTokens: number
  chatEnabled: boolean
  describeEnabled: boolean
  recommendEnabled: boolean
}

export async function loadAIConfig(): Promise<AIConfig> {
  try {
    const settings = await prisma.siteSettings.findFirst()
    const s = settings as any
    return {
      provider: s?.aiProvider?.trim() || "groq",
      apiKey: s?.aiApiKey?.trim() || "",
      model: s?.aiModel?.trim() || "",
      temperature: Number(s?.aiTemperature ?? 0.7),
      maxTokens: Number(s?.aiMaxTokens ?? 1024),
      chatEnabled: Boolean(s?.aiChatEnabled ?? false),
      describeEnabled: Boolean(s?.aiDescribeEnabled ?? true),
      recommendEnabled: Boolean(s?.aiRecommendEnabled ?? false),
    }
  } catch {
    return {
      provider: "groq",
      apiKey: process.env.GROQ_API_KEY?.trim() || "",
      model: "",
      temperature: 0.7,
      maxTokens: 1024,
      chatEnabled: false,
      describeEnabled: true,
      recommendEnabled: false,
    }
  }
}
