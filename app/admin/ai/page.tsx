"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { useToast } from "@/hooks/use-toast"
import { Bot, Zap, EyeOff, Eye, Loader2 } from "lucide-react"

const PROVIDERS = [
  { value: "groq", label: "Groq", desc: "Rápido e gratuito (Llama 3, Mixtral)" },
  { value: "openai", label: "OpenAI", desc: "GPT-4o mini, GPT-4" },
  { value: "anthropic", label: "Anthropic", desc: "Claude 3 Haiku" },
  { value: "mistral", label: "Mistral", desc: "Mistral Small" },
  { value: "google", label: "Google Gemini", desc: "Gemini 1.5 Flash" },
]

export default function AdminAiPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)
  const [showKey, setShowKey] = useState(false)
  const [provider, setProvider] = useState("groq")
  const [apiKey, setApiKey] = useState("")
  const [model, setModel] = useState("")
  const [temperature, setTemperature] = useState(0.7)
  const [maxTokens, setMaxTokens] = useState(1024)
  const [chatEnabled, setChatEnabled] = useState(false)
  const [describeEnabled, setDescribeEnabled] = useState(true)
  const [recommendEnabled, setRecommendEnabled] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    fetch("/api/settings", { credentials: "include" })
      .then((r) => r.json())
      .then((data) => {
        setProvider(data.aiProvider || "groq")
        setApiKey(data.aiApiKey || "")
        setModel(data.aiModel || "")
        setTemperature(data.aiTemperature ?? 0.7)
        setMaxTokens(data.aiMaxTokens ?? 1024)
        setChatEnabled(Boolean(data.aiChatEnabled))
        setDescribeEnabled(Boolean(data.aiDescribeEnabled ?? true))
        setRecommendEnabled(Boolean(data.aiRecommendEnabled))
      })
      .finally(() => setLoading(false))
  }, [])

  async function handleSave() {
    setSaving(true)
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          aiProvider: provider,
          aiApiKey: apiKey,
          aiModel: model,
          aiTemperature: temperature,
          aiMaxTokens: maxTokens,
          aiChatEnabled: chatEnabled,
          aiDescribeEnabled: describeEnabled,
          aiRecommendEnabled: recommendEnabled,
        }),
        credentials: "include",
      })
      if (!res.ok) throw new Error((await res.json()).error)
      toast({ title: "Configurações de IA salvas!" })
    } catch (err: any) {
      toast({ title: err.message || "Erro ao salvar", variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }

  async function handleTest() {
    setTesting(true)
    try {
      const res = await fetch("/api/ai/describe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productName: "Produto teste de conexão" }),
      })
      const data = await res.json()
      if (res.ok) {
        toast({ title: "✅ Conexão OK! " + data.description.slice(0, 60) })
      } else {
        toast({ title: "❌ " + (data.error || "Erro"), variant: "destructive" })
      }
    } catch {
      toast({ title: "❌ Erro de conexão", variant: "destructive" })
    } finally {
      setTesting(false)
    }
  }

  if (loading) return <div className="flex items-center justify-center py-12 text-muted-foreground">Carregando...</div>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Bot className="h-6 w-6" />
            Inteligência Artificial
          </h1>
          <p className="text-sm text-muted-foreground">Configure o provedor de IA para o chat e geração de descrições</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleTest} disabled={testing}>
            {testing ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Zap className="h-4 w-4 mr-1" />}
            Testar
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Salvando..." : "Salvar"}
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Provedor</CardTitle>
          <CardDescription>Escolha qual serviço de IA será usado no catálogo</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Provedor ativo</Label>
            <Select value={provider} onValueChange={setProvider}>
              <SelectTrigger className="w-full max-w-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PROVIDERS.map((p) => (
                  <SelectItem key={p.value} value={p.value}>
                    {p.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              {PROVIDERS.find((p) => p.value === provider)?.desc}
            </p>
          </div>

          <div className="space-y-2">
            <Label>Chave da API</Label>
            <div className="flex gap-2">
              <div className="relative flex-1 max-w-md">
                <Input
                  type={showKey ? "text" : "password"}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder={showKey ? "sk-..." : "••••••••••••"}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <Button variant="outline" size="icon" onClick={() => { setApiKey(""); toast({ title: "Chave removida" }) }}>
                ✕
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              {provider === "groq" && "Obtenha em: https://console.groq.com/keys"}
              {provider === "openai" && "Obtenha em: https://platform.openai.com/api-keys"}
              {provider === "anthropic" && "Obtenha em: https://console.anthropic.com/"}
              {provider === "mistral" && "Obtenha em: https://console.mistral.ai/"}
              {provider === "google" && "Obtenha em: https://aistudio.google.com/app/apikey"}
            </p>
          </div>

          <div className="space-y-2">
            <Label>
              Modelo
              <span className="text-xs text-muted-foreground ml-2">(opcional — deixe vazio para usar o padrão)</span>
            </Label>
            <Input
              value={model}
              onChange={(e) => setModel(e.target.value)}
              placeholder={provider === "groq" ? "llama-3.3-70b-versatile" : "gpt-4o-mini"}
              className="max-w-md"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recursos</CardTitle>
          <CardDescription>Ative ou desative cada funcionalidade de IA</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div>
              <p className="font-medium">Gerar descrições de produtos</p>
              <p className="text-sm text-muted-foreground">Bot&atilde;o &ldquo;Gerar com IA&rdquo; no formul&aacute;rio de produtos</p>
            </div>
            <Switch checked={describeEnabled} onCheckedChange={setDescribeEnabled} />
          </div>
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div>
              <p className="font-medium">Chat no site</p>
              <p className="text-sm text-muted-foreground">Botão flutuante de atendimento por IA na vitrine</p>
            </div>
            <Switch checked={chatEnabled} onCheckedChange={setChatEnabled} />
          </div>
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div>
              <p className="font-medium">Recomendação de produtos</p>
              <p className="text-sm text-muted-foreground">Se&ccedil;&atilde;o &ldquo;Produtos recomendados&rdquo; na p&aacute;gina do produto</p>
            </div>
            <Switch checked={recommendEnabled} onCheckedChange={setRecommendEnabled} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Parâmetros</CardTitle>
          <CardDescription>Ajuste o comportamento da IA</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Temperatura: {temperature.toFixed(1)}</Label>
              <span className="text-xs text-muted-foreground">
                {temperature < 0.3 ? "Mais preciso" : temperature > 0.8 ? "Mais criativo" : "Equilibrado"}
              </span>
            </div>
            <Slider
              value={[temperature]}
              onValueChange={([v]) => setTemperature(v)}
              min={0}
              max={2}
              step={0.1}
              className="max-w-xs"
            />
          </div>
          <div className="space-y-2">
            <Label>Máximo de tokens: {maxTokens}</Label>
            <div className="flex gap-2 items-center max-w-xs">
              <Input
                type="number"
                value={maxTokens}
                onChange={(e) => setMaxTokens(Number(e.target.value))}
                min={100}
                max={4096}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
