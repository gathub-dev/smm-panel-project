"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  RefreshCw, 
  Database, 
  TrendingUp, 
  Activity, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  Zap,
  BarChart3,
  Settings
} from "lucide-react"
import { getSystemStats, runManualSync, runManualMonitoring, updatePricesManually } from "@/lib/sync-admin-actions"

interface SystemStats {
  services: {
    total: number
    active: number
    inactive: number
  }
  categories: {
    total: number
    active: number
  }
  orders: {
    total: number
    today: number
  }
  lastSync: string
  lastMonitoring: string
}

export function AdminSyncPanel() {
  const [stats, setStats] = useState<SystemStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [syncLoading, setSyncLoading] = useState(false)
  const [monitoringLoading, setMonitoringLoading] = useState(false)
  const [pricesLoading, setPricesLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  // Carregar estatísticas
  const loadStats = async () => {
    try {
      const result = await getSystemStats()
      if (result.success) {
        setStats(result.data)
      } else {
        setMessage({ type: 'error', text: result.message })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Erro ao carregar estatísticas' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadStats()
  }, [])

  // Executar sincronização manual
  const handleManualSync = async () => {
    setSyncLoading(true)
    setMessage(null)
    
    try {
      const result = await runManualSync()
      setMessage({ 
        type: result.success ? 'success' : 'error', 
        text: result.message 
      })
      
      if (result.success) {
        await loadStats() // Recarregar estatísticas
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Erro na sincronização' })
    } finally {
      setSyncLoading(false)
    }
  }

  // Executar monitoramento manual
  const handleManualMonitoring = async () => {
    setMonitoringLoading(true)
    setMessage(null)
    
    try {
      const result = await runManualMonitoring()
      setMessage({ 
        type: result.success ? 'success' : 'error', 
        text: result.message 
      })
      
      if (result.success) {
        await loadStats() // Recarregar estatísticas
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Erro no monitoramento' })
    } finally {
      setMonitoringLoading(false)
    }
  }

  // Atualizar preços manualmente
  const handleUpdatePrices = async () => {
    setPricesLoading(true)
    setMessage(null)
    
    try {
      const result = await updatePricesManually()
      setMessage({ 
        type: result.success ? 'success' : 'error', 
        text: result.message 
      })
      
      if (result.success) {
        await loadStats() // Recarregar estatísticas
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Erro na atualização de preços' })
    } finally {
      setPricesLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    if (dateString === 'Nunca') return 'Nunca'
    try {
      return new Date(dateString).toLocaleString('pt-BR')
    } catch {
      return 'Data inválida'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="h-8 w-8 animate-spin" />
        <span className="ml-2">Carregando estatísticas...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Mensagens */}
      {message && (
        <Alert className={message.type === 'success' ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
          {message.type === 'success' ? (
            <CheckCircle className="h-4 w-4 text-green-600" />
          ) : (
            <AlertCircle className="h-4 w-4 text-red-600" />
          )}
          <AlertDescription className={message.type === 'success' ? 'text-green-800' : 'text-red-800'}>
            {message.text}
          </AlertDescription>
        </Alert>
      )}

      {/* Estatísticas do Sistema */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Serviços</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.services.total || 0}</div>
            <div className="flex gap-2 mt-2">
              <Badge variant="default" className="text-xs">
                {stats?.services.active || 0} ativos
              </Badge>
              <Badge variant="secondary" className="text-xs">
                {stats?.services.inactive || 0} inativos
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Categorias</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.categories.total || 0}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.categories.active || 0} ativas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pedidos</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.orders.total || 0}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.orders.today || 0} hoje
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Status</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold text-green-600">Online</div>
            <p className="text-xs text-muted-foreground">
              Sistema operacional
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Painel de Sincronização */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Painel de Sincronização
          </CardTitle>
          <CardDescription>
            Gerencie a sincronização de serviços e monitoramento do sistema
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Informações de Última Sincronização */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Última Sincronização</p>
                <p className="text-xs text-muted-foreground">
                  {formatDate(stats?.lastSync || 'Nunca')}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Último Monitoramento</p>
                <p className="text-xs text-muted-foreground">
                  {formatDate(stats?.lastMonitoring || 'Nunca')}
                </p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Botões de Ação */}
          <div className="grid gap-3 md:grid-cols-3">
            <Button 
              onClick={handleManualSync}
              disabled={syncLoading}
              className="flex items-center gap-2"
            >
              {syncLoading ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Database className="h-4 w-4" />
              )}
              {syncLoading ? 'Sincronizando...' : 'Sincronizar Serviços'}
            </Button>

            <Button 
              onClick={handleManualMonitoring}
              disabled={monitoringLoading}
              variant="outline"
              className="flex items-center gap-2"
            >
              {monitoringLoading ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Activity className="h-4 w-4" />
              )}
              {monitoringLoading ? 'Monitorando...' : 'Executar Monitoramento'}
            </Button>

            <Button 
              onClick={handleUpdatePrices}
              disabled={pricesLoading}
              variant="secondary"
              className="flex items-center gap-2"
            >
              {pricesLoading ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Zap className="h-4 w-4" />
              )}
              {pricesLoading ? 'Atualizando...' : 'Atualizar Preços'}
            </Button>
          </div>

          {/* Descrições das Ações */}
          <div className="grid gap-3 md:grid-cols-3 text-xs text-muted-foreground">
            <div>
              <strong>Sincronizar Serviços:</strong> Busca novos serviços da API e atualiza os existentes
            </div>
            <div>
              <strong>Executar Monitoramento:</strong> Verifica status dos serviços e detecta problemas
            </div>
            <div>
              <strong>Atualizar Preços:</strong> Recalcula preços com base na taxa de câmbio atual
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Botão para Recarregar Estatísticas */}
      <div className="flex justify-center">
        <Button 
          onClick={loadStats}
          variant="ghost"
          size="sm"
          className="flex items-center gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          Atualizar Estatísticas
        </Button>
      </div>
    </div>
  )
}
