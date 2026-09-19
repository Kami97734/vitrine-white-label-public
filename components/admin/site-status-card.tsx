"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AlertCircle, CheckCircle2, RefreshCw, Database, Mail, Settings, Package, FolderTree, Image as ImageIcon } from "lucide-react"

interface SiteStatus {
  timestamp: string
  database: { connected: boolean; error?: string }
  smtp: { configured: boolean }
  content: {
    products: number
    categories: number
    banners: number
  }
  admin: {
    count: number
    last_login?: string
  }
  site_settings: {
    configured: boolean
  }
}

export function SiteStatusCard() {
  const [status, setStatus] = useState<SiteStatus | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const res = await fetch("/api/admin/status")
        if (res.ok) {
          const data = await res.json()
          setStatus(data)
        }
      } catch (err) {
        console.error("[status] erro:", err)
      } finally {
        setLoading(false)
      }
    }

    fetchStatus()
    const interval = setInterval(fetchStatus, 60000) // Atualiza a cada 60s

    return () => clearInterval(interval)
  }, [])

  if (loading || !status) {
    return (
      <Card className="col-span-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="w-4 h-4 animate-spin" />
            Carregando status...
          </CardTitle>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card className="col-span-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Status da Vitrine</span>
          <Badge variant={status.database.connected ? "default" : "destructive"}>
            {status.database.connected ? "Online" : "Offline"}
          </Badge>
        </CardTitle>
        <CardDescription>Última atualização: {new Date(status.timestamp).toLocaleTimeString()}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          {/* Database */}
          <div className="flex items-start gap-3 p-3 border rounded-lg">
            <Database className={`w-5 h-5 flex-shrink-0 ${status.database.connected ? "text-green-600" : "text-red-600"}`} />
            <div>
              <p className="text-sm font-medium">Banco de Dados</p>
              <p className="text-xs text-gray-600">
                {status.database.connected ? "Conectado" : `Erro: ${status.database.error}`}
              </p>
            </div>
          </div>

          {/* SMTP */}
          <div className="flex items-start gap-3 p-3 border rounded-lg">
            <Mail className={`w-5 h-5 flex-shrink-0 ${status.smtp.configured ? "text-green-600" : "text-yellow-600"}`} />
            <div>
              <p className="text-sm font-medium">SMTP</p>
              <p className="text-xs text-gray-600">{status.smtp.configured ? "Configurado" : "Não configurado"}</p>
            </div>
          </div>

          {/* Site Settings */}
          <div className="flex items-start gap-3 p-3 border rounded-lg">
            <Settings className={`w-5 h-5 flex-shrink-0 ${status.site_settings.configured ? "text-green-600" : "text-yellow-600"}`} />
            <div>
              <p className="text-sm font-medium">Configurações</p>
              <p className="text-xs text-gray-600">
                {status.site_settings.configured ? "Completas" : "Incompletas"}
              </p>
            </div>
          </div>

          {/* Admin Users */}
          <div className="flex items-start gap-3 p-3 border rounded-lg">
            <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-blue-600" />
            <div>
              <p className="text-sm font-medium">Admins</p>
              <p className="text-xs text-gray-600">{status.admin.count} usuário(s)</p>
              {status.admin.last_login && (
                <p className="text-xs text-gray-500">
                  Último acesso: {new Date(status.admin.last_login).toLocaleDateString()}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Content Summary */}
        <div className="mt-6 pt-6 border-t">
          <p className="text-sm font-semibold mb-4">Resumo do Catálogo</p>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <div className="flex flex-col items-center justify-center p-6 bg-blue-50 rounded-lg border border-blue-100 hover:border-blue-300 transition">
              <Package className="w-8 h-8 text-blue-600 mb-2" />
              <p className="text-3xl font-bold text-blue-600">{status.content.products}</p>
              <p className="text-sm text-blue-600 font-medium">Produtos</p>
            </div>
            <div className="flex flex-col items-center justify-center p-6 bg-purple-50 rounded-lg border border-purple-100 hover:border-purple-300 transition">
              <FolderTree className="w-8 h-8 text-purple-600 mb-2" />
              <p className="text-3xl font-bold text-purple-600">{status.content.categories}</p>
              <p className="text-sm text-purple-600 font-medium">Categorias</p>
            </div>
            <div className="flex flex-col items-center justify-center p-6 bg-orange-50 rounded-lg border border-orange-100 hover:border-orange-300 transition col-span-2 md:col-span-1">
              <ImageIcon className="w-8 h-8 text-orange-600 mb-2" />
              <p className="text-3xl font-bold text-orange-600">{status.content.banners}</p>
              <p className="text-sm text-orange-600 font-medium">Banners</p>
            </div>
          </div>
        </div>

        {!status.database.connected && (
          <div className="mt-4 flex gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>Vitrine offline. Verifique a conexão com o banco de dados.</span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
