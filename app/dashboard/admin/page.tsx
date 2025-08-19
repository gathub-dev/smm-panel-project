"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Switch } from "@/components/ui/switch"
import { toast } from "sonner"
import {
  Users,
  ShoppingCart,
  DollarSign,
  TrendingUp,
  AlertTriangle,
  Plus,
  BarChart3,
  UserCheck,
  Package,
  Settings,
  Key,
  RefreshCw,
  Eye,
  Edit,
  Trash2,
  Download,
  Upload,
  Globe,
  Zap,
  Shield,
  Activity,
  Clock,
  CheckCircle,
  XCircle,
  Pause,
  Play,
  RotateCcw,
  Filter,
  Search,
  MoreHorizontal,
  ExternalLink,
  Copy,
  AlertCircle,
  Info,
  Star,
  Target,
  Users2,
  TrendingDown,
  Calendar,
  CreditCard,
  Wallet,
  Database,
  Server,
  Network,
} from "lucide-react"
import { AdminUserManagement } from "@/components/admin-user-management"
import { AdminNavigation } from "@/components/admin-navigation"
import { 
  syncAllServices, 
  updateService, 
  setBulkMarkup, 
  getServiceStats,
  testAPIConnections,
  getServicesList,
  getServiceCategories
} from "@/lib/service-actions"
import { 
  saveAPIKey, 
  toggleAPIKey, 
  removeAPIKey, 
  testAllAPIKeys,
  getAPIKeysInfo,
  syncProviderBalances 
} from "@/lib/api-key-actions"
import { 
  syncAllOrdersStatus, 
  getSyncStats 
} from "@/lib/order-sync-actions"
import { 
  testAPIDirectly, 
  testMultipleAPIKeys 
} from "@/lib/test-api-actions"

const AdminPage = () => {
  const [activeTab, setActiveTab] = useState("overview")
  const [loading, setLoading] = useState(false)
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    totalOrders: 0,
    pendingOrders: 0,
    totalRevenue: 0,
    monthlyRevenue: 0,
    totalServices: 0,
    activeServices: 0,
  })
  const [serviceStats, setServiceStats] = useState<any>(null)
  const [apiKeys, setApiKeys] = useState<any[]>([])
  const [syncStats, setSyncStats] = useState<any>(null)
  const [apiConnections, setApiConnections] = useState<any>(null)
  const [providerBalances, setProviderBalances] = useState<any>(null)
  const [servicesList, setServicesList] = useState<any[]>([])
  const [servicesLoading, setServicesLoading] = useState(false)
  const [servicesPagination, setServicesPagination] = useState<any>(null)
  const [servicesFilters, setServicesFilters] = useState({
    provider: 'all',
    status: 'all',
    category: 'all',
    search: '',
    page: 1
  })
  const [categories, setCategories] = useState<string[]>([])
  const [editingService, setEditingService] = useState<any>(null)
  const [showEditSheet, setShowEditSheet] = useState(false)
  const [editForm, setEditForm] = useState({
    name: '',
    category: '',
    rate: 0,
    markup_type: 'percentage' as 'percentage' | 'fixed',
    markup_value: 20,
    status: 'active' as 'active' | 'inactive'
  })

  // Estados para modais
  const [showAPIKeyModal, setShowAPIKeyModal] = useState(false)
  const [showTestModal, setShowTestModal] = useState(false)
  const [selectedProvider, setSelectedProvider] = useState<'mtp' | 'jap'>('mtp')
  const [apiKeyInput, setApiKeyInput] = useState('')
  const [testResults, setTestResults] = useState<any>(null)

  // Função de teste para debug
  const testSyncFunction = async () => {
    console.log('🧪 TESTE: Função de sincronização chamada diretamente')
    try {
      const result = await syncAllServices()
      console.log('📊 TESTE: Resultado:', result)
      return result
    } catch (error) {
      console.log('❌ TESTE: Erro:', error)
      throw error
    }
  }

  // Expor função para teste no console
  useEffect(() => {
    // @ts-ignore
    window.testSync = testSyncFunction
    console.log('🔧 DEBUG: Função testSync() disponível no console')
  }, [])

  useEffect(() => {
    loadInitialData()
    loadServicesList()
  }, [])

  useEffect(() => {
    loadServicesList(servicesFilters)
  }, [servicesFilters])

  const loadServicesList = async (filters = servicesFilters) => {
    setServicesLoading(true)
    try {
      const result = await getServicesList(filters)
      if (result.success) {
        setServicesList(result.services)
        setServicesPagination(result.pagination)
      }
    } catch (error) {
      console.error('Erro ao carregar serviços:', error)
    } finally {
      setServicesLoading(false)
    }
  }

  const loadInitialData = async () => {
    console.log('🔄 CARREGANDO DADOS INICIAIS...')
    try {
      // Carregar estatísticas de serviços
      console.log('📊 Carregando estatísticas de serviços...')
      const serviceResult = await getServiceStats()
      console.log('Resultado serviços:', serviceResult)
      if (serviceResult.success) {
        setServiceStats(serviceResult.stats)
      }

      // Carregar categorias
      console.log('📂 Carregando categorias...')
      const categoriesResult = await getServiceCategories()
      if (categoriesResult.success) {
        setCategories(categoriesResult.categories.map(cat => cat.pt))
      }

      // Carregar informações das API keys
      console.log('🔑 Carregando API keys...')
      const apiResult = await getAPIKeysInfo()
      console.log('Resultado API keys:', apiResult)
      if (apiResult.success) {
        setApiKeys(apiResult.apiKeys)
        console.log('✅ API Keys carregadas:', apiResult.apiKeys.length, 'chaves')
      } else {
        console.log('❌ Erro ao carregar API keys:', apiResult.error)
      }

      // Carregar estatísticas de sincronização
      console.log('🔄 Carregando stats de sync...')
      const syncResult = await getSyncStats()
      console.log('Resultado sync:', syncResult)
      if (syncResult.success) {
        setSyncStats(syncResult.stats)
      }

      // Testar conexões
      console.log('🧪 Testando conexões...')
      const connectionResult = await testAllAPIKeys()
      console.log('Resultado conexões:', connectionResult)
      if (connectionResult.success) {
        setApiConnections(connectionResult.connections)
        setProviderBalances(connectionResult.balances)
        console.log('✅ Conexões testadas:', connectionResult.connections)
      } else {
        console.log('❌ Erro ao testar conexões:', connectionResult.error)
      }
      
      console.log('🏁 DADOS CARREGADOS COM SUCESSO')
    } catch (error) {
      console.error('💥 ERRO FATAL ao carregar dados:', error)
    }
  }

  const handleSyncServices = async () => {
    console.log('🎯 BOTÃO SINCRONIZAR CLICADO!')
    console.log('Loading atual:', loading)
    
    setLoading(true)
    
    // Configurar atualização automática das estatísticas durante a sincronização
    const updateInterval = setInterval(async () => {
      console.log('🔄 Atualizando estatísticas durante sincronização...')
      try {
        const serviceResult = await getServiceStats()
        if (serviceResult.success) {
          setServiceStats(serviceResult.stats)
          console.log('📊 Estatísticas atualizadas:', serviceResult.stats)
        }
      } catch (error) {
        console.log('⚠️ Erro ao atualizar estatísticas:', error)
      }
    }, 3000) // Atualizar a cada 3 segundos
    
    try {
      console.log('📡 Chamando syncAllServices...')
      toast.info('Iniciando sincronização... O painel será atualizado automaticamente.')
      
      const result = await syncAllServices()
      console.log('📊 Resultado da sincronização:', result)
      
      if (result.success) {
        toast.success(`${result.synced} serviços sincronizados com sucesso!`)
        console.log('✅ Sucesso! Recarregando dados finais...')
      } else {
        console.log('❌ Erro na sincronização:', result.error)
        toast.error(result.error)
      }
    } catch (error) {
      console.log('💥 Erro fatal:', error)
      toast.error('Erro na sincronização')
    } finally {
      // Parar atualização automática
      clearInterval(updateInterval)
      
      // Fazer uma atualização final completa
      await loadInitialData()
      
      setLoading(false)
      console.log('🏁 Sincronização finalizada')
    }
  }

  const handleSyncOrders = async () => {
    setLoading(true)
    try {
      const result = await syncAllOrdersStatus()
      if (result.success) {
        toast.success(result.message)
        loadInitialData()
      } else {
        toast.error(result.error)
      }
    } catch (error) {
      toast.error('Erro na sincronização')
    } finally {
      setLoading(false)
    }
  }

  const handleSaveAPIKey = async () => {
    if (!apiKeyInput.trim()) {
      toast.error('Digite uma chave de API válida')
      return
    }

    console.log('🔍 INICIANDO SALVAMENTO DE CHAVE')
    console.log('Provider:', selectedProvider)
    console.log('Chave (primeiros 8 chars):', apiKeyInput.substring(0, 8) + '...')

    setLoading(true)
    try {
      console.log('📡 Chamando saveAPIKey...')
      const result = await saveAPIKey(selectedProvider, apiKeyInput)
      
      console.log('📊 RESULTADO DO SALVAMENTO:', result)
      
      if (result.success) {
        console.log('✅ SUCESSO! Chave salva')
        toast.success(result.message)
        setShowAPIKeyModal(false)
        setApiKeyInput('')
        
        console.log('🔄 Recarregando dados...')
        await loadInitialData()
        console.log('✅ Dados recarregados')
      } else {
        console.log('❌ ERRO no salvamento:', result.error)
        toast.error(result.error)
      }
    } catch (error) {
      console.log('💥 ERRO FATAL:', error)
      toast.error('Erro ao salvar chave')
    } finally {
      setLoading(false)
      console.log('🏁 Salvamento finalizado')
    }
  }

  const handleTestConnections = async () => {
    setLoading(true)
    try {
      const result = await testAllAPIKeys()
      if (result.success) {
        setApiConnections(result.connections)
        setProviderBalances(result.balances)
        toast.success(result.message)
      } else {
        toast.error(result.error)
      }
    } catch (error) {
      toast.error('Erro ao testar conexões')
    } finally {
      setLoading(false)
    }
  }

  const handleTestDirectAPI = async () => {
    if (!apiKeyInput.trim()) {
      toast.error('Digite uma chave de API para testar')
      return
    }

    setLoading(true)
    try {
      const result = await testAPIDirectly(selectedProvider, apiKeyInput)
      setTestResults(result)
      
      if (result.success && result.isValid) {
        toast.success(`✅ ${selectedProvider.toUpperCase()}: Chave válida!`)
      } else {
        toast.error(`❌ ${selectedProvider.toUpperCase()}: Chave inválida`)
      }
    } catch (error) {
      toast.error('Erro no teste')
      setTestResults({ success: false, error: String(error) })
    } finally {
      setLoading(false)
    }
  }

  const handleToggleServiceStatus = async (serviceId: string, newStatus: 'active' | 'inactive') => {
    try {
      const result = await updateService(serviceId, { status: newStatus })
      if (result.success) {
        toast.success(`Serviço ${newStatus === 'active' ? 'ativado' : 'desativado'} com sucesso`)
        loadServicesList(servicesFilters)
        loadInitialData() // Atualizar estatísticas
      } else {
        toast.error(result.error)
      }
    } catch (error) {
      toast.error('Erro ao alterar status do serviço')
    }
  }

  const handleEditService = (service: any) => {
    setEditingService(service)
    setEditForm({
      name: service.name,
      category: service.category,
      rate: service.rate,
      markup_type: service.markup_type,
      markup_value: service.markup_value,
      status: service.status
    })
    setShowEditSheet(true)
  }

  const handleSaveService = async () => {
    if (!editingService) return

    try {
      const result = await updateService(editingService.id, {
        name: editForm.name,
        description: editingService.description,
        markup_type: editForm.markup_type,
        markup_value: editForm.markup_value,
        status: editForm.status
      })

      if (result.success) {
        toast.success('Serviço atualizado com sucesso!')
        setShowEditSheet(false)
        setEditingService(null)
        loadServicesList(servicesFilters)
        loadInitialData()
      } else {
        toast.error(result.error)
      }
    } catch (error) {
      toast.error('Erro ao salvar serviço')
    }
  }

  const calculateFinalRate = () => {
    if (!editingService) return { brl: 0, usd: 0 }
    // Usar valor dinâmico se disponível, senão fallback
    const baseRateBRL = editingService.provider_rate_brl || (editingService.provider_rate * (editingService.exchange_rate || 5.5))
    const baseRateUSD = editingService.provider_rate
    const currentExchangeRate = editingService.exchange_rate || 5.5
    
    let finalBRL, finalUSD
    
    if (editForm.markup_type === 'percentage') {
      finalBRL = baseRateBRL * (1 + editForm.markup_value / 100)
      finalUSD = baseRateUSD * (1 + editForm.markup_value / 100)
    } else {
      finalBRL = baseRateBRL + editForm.markup_value
      finalUSD = baseRateUSD + (editForm.markup_value / currentExchangeRate) // Converter markup para USD
    }
    
    return { brl: finalBRL, usd: finalUSD }
  }

  return (
    <div className="space-y-6">
      {/* Navigation */}
      <AdminNavigation />
      
      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Serviços Ativos</CardTitle>
            <Package className={`h-4 w-4 ${loading ? 'text-blue-500 animate-pulse' : 'text-muted-foreground'}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{serviceStats?.active || 0}</div>
            <p className="text-xs text-muted-foreground">
              de {serviceStats?.total || 0} total
              {loading && <span className="text-blue-500 ml-1">• Sincronizando...</span>}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Provedores</CardTitle>
            <Globe className={`h-4 w-4 ${loading ? 'text-blue-500 animate-pulse' : 'text-muted-foreground'}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(serviceStats?.mtp || 0) + (serviceStats?.jap || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              MTP: {serviceStats?.mtp || 0} | JAP: {serviceStats?.jap || 0}
              {loading && <span className="text-blue-500 block">⚡ Importando serviços...</span>}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pedidos Pendentes</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{syncStats?.pendingSync || 0}</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-red-600">{syncStats?.errorOrders || 0}</span> com erro
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Status APIs</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                <div className={`w-2 h-2 rounded-full ${apiConnections?.mtp ? 'bg-green-500' : 'bg-red-500'}`} />
                <span className="text-xs">MTP</span>
              </div>
              <div className="flex items-center gap-1">
                <div className={`w-2 h-2 rounded-full ${apiConnections?.jap ? 'bg-green-500' : 'bg-red-500'}`} />
                <span className="text-xs">JAP</span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {apiConnections?.mtp && apiConnections?.jap ? 'Todas conectadas' : 'Verificar conexões'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Admin Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="apis">APIs</TabsTrigger>
          <TabsTrigger value="services">Serviços</TabsTrigger>
          <TabsTrigger value="orders">Pedidos</TabsTrigger>
          <TabsTrigger value="users">Usuários</TabsTrigger>
          <TabsTrigger value="reports">Relatórios</TabsTrigger>
        </TabsList>

        <TabsContent value="apis" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Key className="h-5 w-5" />
                  <span>Chaves de API</span>
                </CardTitle>
                <CardDescription>Configure e gerencie as chaves dos provedores</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {apiKeys.map((key) => (
                  <div key={key.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <div className="flex items-center gap-2">
                        <Badge variant={key.provider === 'mtp' ? 'default' : 'secondary'}>
                          {key.provider.toUpperCase()}
                        </Badge>
                        <span className="font-mono text-sm">{key.api_key}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Atualizada: {key.updated_at ? new Date(key.updated_at).toLocaleDateString('pt-BR') : 'Nunca'}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${
                        apiConnections?.[key.provider] ? 'bg-green-500' : 'bg-red-500'
                      }`} />
                      <Switch
                        checked={key.is_active}
                        onCheckedChange={(checked) => toggleAPIKey(key.provider, checked)}
                      />
                    </div>
                  </div>
                ))}
                
                <div className="flex gap-2">
                  <Button 
                    onClick={() => setShowAPIKeyModal(true)} 
                    className="flex-1"
                    variant="outline"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar Chave
                  </Button>
                  <Dialog open={showTestModal} onOpenChange={setShowTestModal}>
                    <DialogTrigger asChild>
                      <Button variant="outline" className="flex-1">
                        <Zap className="h-4 w-4 mr-2" />
                        Testar Chave
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>🧪 Teste Direto de API</DialogTitle>
                        <DialogDescription>
                          Teste suas chaves de API sem problemas de CORS (servidor-side)
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="test-provider">Provedor</Label>
                            <Select value={selectedProvider} onValueChange={(value: 'mtp' | 'jap') => setSelectedProvider(value)}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="mtp">MoreThanPanel (MTP)</SelectItem>
                                <SelectItem value="jap">JustAnotherPanel (JAP)</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label htmlFor="test-apikey">Chave de API</Label>
                            <Input
                              id="test-apikey"
                              type="text"
                              value={apiKeyInput}
                              onChange={(e) => setApiKeyInput(e.target.value)}
                              placeholder="Cole sua chave aqui"
                            />
                          </div>
                        </div>
                        
                        <Button 
                          onClick={handleTestDirectAPI} 
                          disabled={loading || !apiKeyInput.trim()}
                          className="w-full"
                        >
                          <Zap className={`h-4 w-4 mr-2 ${loading ? 'animate-pulse' : ''}`} />
                          {loading ? 'Testando...' : 'Testar Agora'}
                        </Button>

                        {testResults && (
                          <div className="mt-4 p-4 border rounded-lg">
                            <div className="flex items-center gap-2 mb-2">
                              {testResults.success && testResults.isValid ? (
                                <CheckCircle className="h-5 w-5 text-green-600" />
                              ) : (
                                <XCircle className="h-5 w-5 text-red-600" />
                              )}
                              <span className="font-medium">
                                {testResults.success && testResults.isValid ? 'Sucesso!' : 'Falha'}
                              </span>
                            </div>
                            
                            <div className="text-sm space-y-2">
                              <div>
                                <strong>Provedor:</strong> {testResults.provider?.toUpperCase()}
                              </div>
                              {testResults.status && (
                                <div>
                                  <strong>Status HTTP:</strong> {testResults.status}
                                </div>
                              )}
                              {testResults.response && (
                                <div>
                                  <strong>Resposta:</strong>
                                  <pre className="mt-1 p-2 bg-muted rounded text-xs overflow-auto">
                                    {JSON.stringify(testResults.response, null, 2)}
                                  </pre>
                                </div>
                              )}
                              {testResults.error && (
                                <div>
                                  <strong>Erro:</strong> 
                                  <span className="text-red-600 ml-1">{testResults.error}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => {
                          setShowTestModal(false)
                          setTestResults(null)
                          setApiKeyInput('')
                        }}>
                          Fechar
                        </Button>
                        {testResults?.success && testResults?.isValid && (
                          <Button onClick={() => {
                            setShowTestModal(false)
                            setShowAPIKeyModal(true)
                          }}>
                            Salvar Esta Chave
                          </Button>
                        )}
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Activity className="h-5 w-5" />
                  <span>Status dos Provedores</span>
                </CardTitle>
                <CardDescription>Conectividade e saldos dos provedores</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${
                        apiConnections?.mtp ? 'bg-green-500' : 'bg-red-500'
                      }`} />
                      <div>
                        <p className="font-medium">MoreThanPanel</p>
                        <p className="text-xs text-muted-foreground">morethanpanel.com</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">
                        ${typeof providerBalances?.mtp === 'number' ? providerBalances.mtp.toFixed(2) : '0.00'}
                      </p>
                      <p className="text-xs text-muted-foreground">Saldo</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${
                        apiConnections?.jap ? 'bg-green-500' : 'bg-red-500'
                      }`} />
                      <div>
                        <p className="font-medium">JustAnotherPanel</p>
                        <p className="text-xs text-muted-foreground">justanotherpanel.com</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">
                        ${typeof providerBalances?.jap === 'number' ? providerBalances.jap.toFixed(2) : '0.00'}
                      </p>
                      <p className="text-xs text-muted-foreground">Saldo</p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button 
                    onClick={handleTestConnections} 
                    disabled={loading}
                    className="flex-1"
                    variant="outline"
                  >
                    <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                    Testar Conexões
                  </Button>
                  <Button 
                    onClick={syncProviderBalances} 
                    disabled={loading}
                    className="flex-1"
                    variant="outline"
                  >
                    <Wallet className="h-4 w-4 mr-2" />
                    Atualizar Saldos
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <TrendingUp className="h-5 w-5" />
                  <span>Atividade Recente</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <UserCheck className="h-4 w-4 text-green-600" />
                    <span className="text-sm">Novo usuário registrado</span>
                  </div>
                  <span className="text-xs text-muted-foreground">2 min atrás</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <ShoppingCart className="h-4 w-4 text-blue-600" />
                    <span className="text-sm">Pedido #1234 completado</span>
                  </div>
                  <span className="text-xs text-muted-foreground">5 min atrás</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <DollarSign className="h-4 w-4 text-green-600" />
                    <span className="text-sm">Depósito de R$ 150,00</span>
                  </div>
                  <span className="text-xs text-muted-foreground">8 min atrás</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <AlertTriangle className="h-5 w-5" />
                  <span>Alertas do Sistema</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Badge variant="destructive">Alto</Badge>
                    <span className="text-sm">Serviço Instagram indisponível</span>
                  </div>
                  <Button variant="outline" size="sm">
                    Resolver
                  </Button>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Badge variant="secondary">Médio</Badge>
                    <span className="text-sm">23 pedidos pendentes</span>
                  </div>
                  <Button variant="outline" size="sm">
                    Ver
                  </Button>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline">Baixo</Badge>
                    <span className="text-sm">Atualização disponível</span>
                  </div>
                  <Button variant="outline" size="sm">
                    Atualizar
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="users" className="space-y-4">
          <AdminUserManagement users={[]} />
        </TabsContent>

        <TabsContent value="services" className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium">Gerenciamento de Serviços</h3>
              <p className="text-sm text-muted-foreground">
                Sincronize, configure preços e gerencie todos os serviços SMM
              </p>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleSyncServices} disabled={loading} variant="outline">
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Sincronizar
              </Button>
              <Button onClick={handleSyncOrders} disabled={loading} variant="outline">
                <Activity className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Sync Pedidos
              </Button>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Estatísticas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Total:</span>
                  <span className="font-medium">{serviceStats?.total || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Ativos:</span>
                  <span className="font-medium text-green-600">{serviceStats?.active || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Inativos:</span>
                  <span className="font-medium text-red-600">{serviceStats?.inactive || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">MTP:</span>
                  <span className="font-medium">{serviceStats?.mtp || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">JAP:</span>
                  <span className="font-medium">{serviceStats?.jap || 0}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  {loading ? 'Sincronização em Andamento' : 'Última Sincronização'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  {loading ? (
                    <>
                      <RefreshCw className="h-8 w-8 mx-auto text-blue-500 mb-2 animate-spin" />
                      <p className="text-sm text-blue-600 font-medium">
                        Importando serviços...
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        O painel atualiza automaticamente
                      </p>
                    </>
                  ) : (
                    <>
                      <Clock className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                      <p className="text-sm text-muted-foreground">
                        {serviceStats?.lastSync 
                          ? new Date(serviceStats.lastSync).toLocaleString('pt-BR')
                          : 'Nunca sincronizado'
                        }
                      </p>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Ações Rápidas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button 
                  onClick={() => setBulkMarkup([], 'percentage', 20)} 
                  className="w-full" 
                  variant="outline"
                  size="sm"
                >
                  <Target className="h-4 w-4 mr-2" />
                  Markup 20% (Todos)
                </Button>
                <Button 
                  onClick={() => setBulkMarkup([], 'percentage', 30)} 
                  className="w-full" 
                  variant="outline"
                  size="sm"
                >
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Markup 30% (Todos)
                </Button>
                <Button 
                  onClick={() => setBulkMarkup([], 'fixed', 0.5)} 
                  className="w-full" 
                  variant="outline"
                  size="sm"
                >
                  <DollarSign className="h-4 w-4 mr-2" />
                  +$0.50 (Todos)
                </Button>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Lista de Serviços</span>
                <Badge variant="secondary">{servicesPagination?.total || 0} serviços</Badge>
              </CardTitle>
              <CardDescription>
                Gerencie preços, status e configurações dos serviços
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Filtros */}
              <div className="flex gap-4 mb-6 flex-wrap">
                <div className="flex-1 min-w-64">
                  <Input
                    placeholder="Buscar serviços..."
                    value={servicesFilters.search}
                    onChange={(e) => setServicesFilters(prev => ({ ...prev, search: e.target.value, page: 1 }))}
                  />
                </div>
                <Select
                  value={servicesFilters.provider}
                  onValueChange={(value) => setServicesFilters(prev => ({ ...prev, provider: value, page: 1 }))}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Provider" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="mtp">MTP</SelectItem>
                    <SelectItem value="jap">JAP</SelectItem>
                  </SelectContent>
                </Select>
                <Select
                  value={servicesFilters.status}
                  onValueChange={(value) => setServicesFilters(prev => ({ ...prev, status: value, page: 1 }))}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="active">Ativo</SelectItem>
                    <SelectItem value="inactive">Inativo</SelectItem>
                  </SelectContent>
                </Select>
                <Select
                  value={servicesFilters.category}
                  onValueChange={(value) => setServicesFilters(prev => ({ ...prev, category: value, page: 1 }))}
                >
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    {categories.map(category => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Tabela de Serviços */}
              {servicesLoading ? (
                <div className="text-center py-8">
                  <RefreshCw className="h-8 w-8 mx-auto animate-spin text-muted-foreground mb-2" />
                  <p className="text-muted-foreground">Carregando serviços...</p>
                </div>
              ) : servicesList.length > 0 ? (
                <div className="space-y-4">
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Serviço</TableHead>
                          <TableHead>Provider</TableHead>
                                                <TableHead>Categoria</TableHead>
                      <TableHead>Preço Original (BRL/USD)</TableHead>
                      <TableHead>Preço Final (BRL/USD)</TableHead>
                          <TableHead>Markup</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {servicesList.map((service) => (
                          <TableRow key={service.id}>
                            <TableCell>
                              <div>
                                <p className="font-medium text-sm">{service.name.substring(0, 60)}...</p>
                                <p className="text-xs text-muted-foreground">ID: {service.provider_service_id}</p>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant={service.provider === 'mtp' ? 'default' : 'secondary'}>
                                {service.provider.toUpperCase()}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="text-sm">{service.category}</div>
                            </TableCell>
                            <TableCell>
                              <div className="space-y-1">
                                <div className="font-mono text-sm">R$ {(service.provider_rate_brl || (service.provider_rate * 5.5)).toFixed(4)}</div>
                                <div className="font-mono text-xs text-muted-foreground">${service.provider_rate}</div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="space-y-1">
                                <div className="font-mono text-sm font-medium text-green-600">R$ {service.rate?.toFixed(4) || '0.0000'}</div>
                                <div className="font-mono text-xs text-muted-foreground">${(service.rate / (service.exchange_rate || 5.5)).toFixed(4)}</div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <span className="text-sm">
                                {service.markup_type === 'percentage' ? `${service.markup_value}%` : `+$${service.markup_value}`}
                              </span>
                            </TableCell>
                            <TableCell>
                              <Badge variant={service.status === 'active' ? 'default' : 'secondary'}>
                                {service.status === 'active' ? 'Ativo' : 'Inativo'}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-1">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleToggleServiceStatus(service.id, service.status === 'active' ? 'inactive' : 'active')}
                                >
                                  {service.status === 'active' ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => handleEditService(service)}
                                >
                                  <Edit className="h-3 w-3" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Paginação */}
                  {servicesPagination && servicesPagination.totalPages > 1 && (
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-muted-foreground">
                        Mostrando {((servicesPagination.page - 1) * 50) + 1} a {Math.min(servicesPagination.page * 50, servicesPagination.total)} de {servicesPagination.total} serviços
                      </p>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={servicesPagination.page <= 1}
                          onClick={() => setServicesFilters(prev => ({ ...prev, page: prev.page - 1 }))}
                        >
                          Anterior
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={servicesPagination.page >= servicesPagination.totalPages}
                          onClick={() => setServicesFilters(prev => ({ ...prev, page: prev.page + 1 }))}
                        >
                          Próxima
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhum serviço encontrado</p>
                  <p className="text-sm mt-2">
                    Ajuste os filtros ou sincronize serviços dos provedores
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="orders" className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium">Gerenciamento de Pedidos</h3>
              <p className="text-sm text-muted-foreground">
                Monitore, sincronize e gerencie todos os pedidos do sistema
              </p>
            </div>
            <Button onClick={handleSyncOrders} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Sincronizar Status
            </Button>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Pedidos Pendentes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">
                    {syncStats?.pendingSync || 0}
                  </div>
                  <p className="text-sm text-muted-foreground">Aguardando sincronização</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Pedidos com Erro</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">
                    {syncStats?.errorOrders || 0}
                  </div>
                  <p className="text-sm text-muted-foreground">Requerem atenção</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Última Verificação</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <Clock className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">
                    {syncStats?.lastSync 
                      ? new Date(syncStats.lastSync).toLocaleString('pt-BR')
                      : 'Nunca verificado'
                    }
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Lista de Pedidos</CardTitle>
              <CardDescription>
                Visualize e gerencie todos os pedidos com filtros avançados
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <ShoppingCart className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Interface de gerenciamento de pedidos será implementada aqui</p>
                <p className="text-sm mt-2">
                  Incluirá filtros por status, usuário, provedor, refill manual, cancelamento
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <BarChart3 className="h-5 w-5" />
                <span>Relatórios e Análises</span>
              </CardTitle>
              <CardDescription>Visualize estatísticas detalhadas e relatórios do sistema</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                Relatórios e gráficos analíticos serão implementados aqui
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Sheet de Edição de Serviço */}
      <Sheet open={showEditSheet} onOpenChange={setShowEditSheet}>
        <SheetContent className="w-[400px] sm:w-[540px]">
          <SheetHeader>
            <SheetTitle>Editar Serviço</SheetTitle>
            <SheetDescription>
              Modifique as configurações do serviço selecionado
            </SheetDescription>
          </SheetHeader>
          
          {editingService && (
            <div className="space-y-6 py-6">
              {/* Informações do Serviço */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Informações Básicas</Label>
                <div className="p-3 bg-muted rounded-lg space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Provider:</span>
                    <Badge variant={editingService.provider === 'mtp' ? 'default' : 'secondary'}>
                      {editingService.provider.toUpperCase()}
                    </Badge>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">ID:</span>
                    <span className="font-mono">{editingService.provider_service_id}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Preço Original:</span>
                    <div className="text-right">
                      <div className="font-mono">R$ {(editingService.provider_rate_brl || (editingService.provider_rate * 5.5)).toFixed(4)}</div>
                      <div className="font-mono text-xs text-muted-foreground">${editingService.provider_rate}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Nome do Serviço */}
              <div className="space-y-2">
                <Label htmlFor="service-name">Nome do Serviço</Label>
                <Input
                  id="service-name"
                  value={editForm.name}
                  onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Nome do serviço"
                />
              </div>

              {/* Categoria */}
              <div className="space-y-2">
                <Label htmlFor="service-category">Categoria</Label>
                <Select
                  value={editForm.category}
                  onValueChange={(value) => setEditForm(prev => ({ ...prev, category: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(category => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Configuração de Preço */}
              <div className="space-y-4">
                <Label className="text-sm font-medium">Configuração de Preço</Label>
                
                {/* Tipo de Markup */}
                <div className="space-y-2">
                  <Label>Tipo de Markup</Label>
                  <Select
                    value={editForm.markup_type}
                    onValueChange={(value: 'percentage' | 'fixed') => setEditForm(prev => ({ ...prev, markup_type: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percentage">Porcentagem (%)</SelectItem>
                      <SelectItem value="fixed">Valor Fixo ($)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Valor do Markup */}
                <div className="space-y-2">
                  <Label>Valor do Markup</Label>
                  <Input
                    type="number"
                    value={editForm.markup_value}
                    onChange={(e) => setEditForm(prev => ({ ...prev, markup_value: parseFloat(e.target.value) || 0 }))}
                    placeholder={editForm.markup_type === 'percentage' ? '20' : '0.50'}
                  />
                  <p className="text-xs text-muted-foreground">
                    {editForm.markup_type === 'percentage' 
                      ? 'Porcentagem de markup sobre o preço original'
                      : 'Valor em dólares a ser adicionado ao preço original'
                    }
                  </p>
                </div>

                {/* Preço Final Calculado */}
                <div className="p-3 bg-muted rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Preço Final:</span>
                    <div className="text-right">
                      <div className="text-lg font-bold text-green-600">
                        R$ {calculateFinalRate().brl.toFixed(4)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        ${calculateFinalRate().usd.toFixed(4)}
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Preço que será cobrado dos clientes (em Reais)
                  </p>
                </div>
              </div>

              {/* Status */}
              <div className="space-y-2">
                <Label>Status do Serviço</Label>
                <Select
                  value={editForm.status}
                  onValueChange={(value: 'active' | 'inactive') => setEditForm(prev => ({ ...prev, status: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Ativo</SelectItem>
                    <SelectItem value="inactive">Inativo</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Botões de Ação */}
              <div className="flex gap-2 pt-4">
                <Button 
                  onClick={handleSaveService}
                  className="flex-1"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Salvar Alterações
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setShowEditSheet(false)}
                  className="flex-1"
                >
                  Cancelar
                </Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Hidden modals for functionality */}
      <Dialog open={showAPIKeyModal} onOpenChange={setShowAPIKeyModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Configurar Chave de API</DialogTitle>
            <DialogDescription>
              Adicione ou atualize as chaves de API dos provedores MTP e JAP
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="provider">Provedor</Label>
              <Select value={selectedProvider} onValueChange={(value: 'mtp' | 'jap') => setSelectedProvider(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mtp">MoreThanPanel (MTP)</SelectItem>
                  <SelectItem value="jap">JustAnotherPanel (JAP)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="apikey">Chave de API</Label>
              <Input
                id="apikey"
                type="password"
                value={apiKeyInput}
                onChange={(e) => setApiKeyInput(e.target.value)}
                placeholder="Digite a chave de API"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAPIKeyModal(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveAPIKey} disabled={loading}>
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default AdminPage
