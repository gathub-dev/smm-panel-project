"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
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
  Settings,
  Download,
  Eye,
  Filter,
  Search,
  Play,
  Pause,
  Package,
  Globe
} from "lucide-react"
import { getSystemStats, runManualSync, runManualMonitoring, updatePricesManually } from "@/lib/sync-admin-actions"
import { syncAllServices } from "@/lib/service-actions"
import { previewServicesFromAPI, getAvailableCategories } from "@/lib/preview-services-actions"

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
  
  // Estados para importação controlada
  const [showImportDialog, setShowImportDialog] = useState(false)
  const [previewServices, setPreviewServices] = useState<any[]>([])
  const [previewLoading, setPreviewLoading] = useState(false)
  const [availableCategories, setAvailableCategories] = useState<string[]>([])
  const [importSettings, setImportSettings] = useState({
    provider: 'all' as 'all' | 'mtp' | 'jap',
    category: 'all',
    maxServices: 50,
    previewOnly: true,
    autoActivate: false,
    updateExisting: true
  })
  const [previewStats, setPreviewStats] = useState<{
    total: number
    mtp: number
    jap: number
  } | null>(null)

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

  // Carregar categorias disponíveis
  const loadAvailableCategories = async () => {
    try {
      const result = await getAvailableCategories()
      if (result.success) {
        setAvailableCategories(result.categories)
      }
    } catch (error) {
      console.log('Erro ao carregar categorias:', error)
    }
  }

  // Preview de serviços antes de importar
  const handlePreviewServices = async () => {
    setPreviewLoading(true)
    setPreviewServices([])
    setPreviewStats(null)
    
    try {
      const result = await previewServicesFromAPI({
        provider: importSettings.provider,
        maxServices: importSettings.maxServices,
        category: importSettings.category === 'all' ? undefined : importSettings.category
      })
      
      if (result.success) {
        setPreviewServices(result.services)
        setPreviewStats({
          total: result.total,
          mtp: result.providers.mtp,
          jap: result.providers.jap
        })
        setMessage({ 
          type: 'success', 
          text: `Preview carregado: ${result.total} serviços encontrados (MTP: ${result.providers.mtp}, JAP: ${result.providers.jap})` 
        })
      } else {
        setMessage({ type: 'error', text: result.error || 'Erro no preview' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Erro ao carregar preview' })
    } finally {
      setPreviewLoading(false)
    }
  }

  // Carregar categorias quando o diálogo abrir
  useEffect(() => {
    if (showImportDialog && availableCategories.length === 0) {
      loadAvailableCategories()
    }
  }, [showImportDialog])

  // Importação controlada
  const handleControlledImport = async () => {
    setSyncLoading(true)
    setMessage(null)
    
    try {
      const result = await syncAllServices()
      
      if (result.success) {
        setMessage({ 
          type: 'success', 
          text: `${result.synced} serviços importados com sucesso!` 
        })
        await loadStats()
        setShowImportDialog(false)
      } else {
        setMessage({ type: 'error', text: result.error || 'Erro na importação' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Erro na importação controlada' })
    } finally {
      setSyncLoading(false)
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
          <div className="grid gap-3 md:grid-cols-4">
            <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
              <DialogTrigger asChild>
                <Button 
                  className="flex items-center gap-2"
                  variant="default"
                >
                  <Download className="h-4 w-4" />
                  Importação Controlada
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    Importação Controlada de Serviços
                  </DialogTitle>
                  <DialogDescription>
                    Configure e visualize os serviços antes de importar para seu painel
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-6">
                  {/* Configurações de Importação */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">⚙️ Configurações</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label>Provedor</Label>
                          <Select
                            value={importSettings.provider}
                            onValueChange={(value: 'all' | 'mtp' | 'jap') => 
                              setImportSettings(prev => ({ ...prev, provider: value }))
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">🌐 Todos os Provedores</SelectItem>
                              <SelectItem value="mtp">📊 MoreThanPanel (MTP)</SelectItem>
                              <SelectItem value="jap">🔥 JustAnotherPanel (JAP)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div className="space-y-2">
                          <Label>Categoria</Label>
                          <Select
                            value={importSettings.category}
                            onValueChange={(value) => 
                              setImportSettings(prev => ({ ...prev, category: value }))
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">📂 Todas as Categorias</SelectItem>
                              {availableCategories.map(category => (
                                <SelectItem key={category} value={category}>
                                  {category}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      
                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label>Máximo de Serviços</Label>
                          <Input
                            type="number"
                            value={importSettings.maxServices}
                            onChange={(e) => 
                              setImportSettings(prev => ({ 
                                ...prev, 
                                maxServices: parseInt(e.target.value) || 50 
                              }))
                            }
                            min="1"
                            max="1000"
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label>Filtros Adicionais</Label>
                          <div className="text-sm text-muted-foreground">
                            {previewStats ? (
                              <div className="space-y-1">
                                <div>📊 Total: {previewStats.total} serviços</div>
                                <div>🔵 MTP: {previewStats.mtp} | 🟡 JAP: {previewStats.jap}</div>
                              </div>
                            ) : (
                              'Carregue o preview para ver estatísticas'
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="space-y-3">
                        <div className="flex items-center space-x-2">
                          <Switch
                            id="auto-activate"
                            checked={importSettings.autoActivate}
                            onCheckedChange={(checked) => 
                              setImportSettings(prev => ({ ...prev, autoActivate: checked }))
                            }
                          />
                          <Label htmlFor="auto-activate">✅ Ativar serviços automaticamente</Label>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Switch
                            id="update-existing"
                            checked={importSettings.updateExisting}
                            onCheckedChange={(checked) => 
                              setImportSettings(prev => ({ ...prev, updateExisting: checked }))
                            }
                          />
                          <Label htmlFor="update-existing">🔄 Atualizar serviços existentes</Label>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  {/* Preview dos Serviços */}
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                      <CardTitle className="text-base">👁️ Preview dos Serviços</CardTitle>
                      <Button
                        onClick={handlePreviewServices}
                        disabled={previewLoading}
                        variant="outline"
                        size="sm"
                      >
                        {previewLoading ? (
                          <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                        ) : (
                          <Eye className="h-4 w-4 mr-2" />
                        )}
                        {previewLoading ? 'Carregando...' : 'Carregar Preview'}
                      </Button>
                    </CardHeader>
                    <CardContent>
                      {previewServices.length > 0 ? (
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <div className="text-sm text-muted-foreground">
                              Mostrando {Math.min(previewServices.length, 15)} de {previewServices.length} serviços encontrados
                            </div>
                            <div className="flex gap-2">
                              <Badge variant="outline">
                                🔵 MTP: {previewServices.filter(s => s.provider === 'mtp').length}
                              </Badge>
                              <Badge variant="outline">
                                🟡 JAP: {previewServices.filter(s => s.provider === 'jap').length}
                              </Badge>
                            </div>
                          </div>
                          <div className="border rounded-lg max-h-80 overflow-y-auto">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Serviço</TableHead>
                                  <TableHead>Provedor</TableHead>
                                  <TableHead>Categoria</TableHead>
                                  <TableHead>Preço USD</TableHead>
                                  <TableHead>Min-Max</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {previewServices.slice(0, 15).map((service, index) => (
                                  <TableRow key={index}>
                                    <TableCell className="font-medium">
                                      <div className="max-w-60">
                                        <div className="truncate">{service.name}</div>
                                        <div className="text-xs text-muted-foreground">ID: {service.id}</div>
                                      </div>
                                    </TableCell>
                                    <TableCell>
                                      <Badge variant={service.provider === 'mtp' ? 'default' : 'secondary'}>
                                        {service.provider?.toUpperCase()}
                                      </Badge>
                                    </TableCell>
                                    <TableCell>
                                      <div className="text-sm">{service.category}</div>
                                    </TableCell>
                                    <TableCell>
                                      <div className="font-mono">${service.rate?.toFixed(4) || '0.0000'}</div>
                                    </TableCell>
                                    <TableCell>
                                      <div className="text-xs text-muted-foreground">
                                        {service.min_quantity?.toLocaleString()} - {service.max_quantity?.toLocaleString()}
                                      </div>
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                          {previewServices.length > 15 && (
                            <div className="text-center text-sm text-muted-foreground">
                              ... e mais {previewServices.length - 15} serviços
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="text-center py-8 text-muted-foreground">
                          <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                          <p>Clique em "Carregar Preview" para visualizar os serviços</p>
                          <p className="text-sm mt-2">
                            Você poderá revisar antes de importar
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
                
                <DialogFooter className="gap-2">
                  <Button 
                    variant="outline" 
                    onClick={() => setShowImportDialog(false)}
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleControlledImport}
                    disabled={syncLoading}
                    className="flex items-center gap-2"
                  >
                    {syncLoading ? (
                      <RefreshCw className="h-4 w-4 animate-spin" />
                    ) : (
                      <Download className="h-4 w-4" />
                    )}
                    {syncLoading ? 'Importando...' : 'Importar Serviços'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Button 
              onClick={handleManualSync}
              disabled={syncLoading}
              variant="outline"
              className="flex items-center gap-2"
            >
              {syncLoading ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Database className="h-4 w-4" />
              )}
              {syncLoading ? 'Sincronizando...' : 'Sync Completo'}
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
              {monitoringLoading ? 'Monitorando...' : 'Monitoramento'}
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
          <div className="grid gap-3 md:grid-cols-4 text-xs text-muted-foreground">
            <div>
              <strong>Importação Controlada:</strong> Visualize e configure antes de importar serviços seletivamente
            </div>
            <div>
              <strong>Sync Completo:</strong> Importa todos os serviços disponíveis dos provedores ativos
            </div>
            <div>
              <strong>Monitoramento:</strong> Verifica status dos serviços e detecta problemas
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
