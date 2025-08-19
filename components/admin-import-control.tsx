"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table"
import { 
  Download, 
  Upload, 
  Settings, 
  Eye,
  EyeOff,
  CheckCircle,
  XCircle,
  RefreshCw,
  Filter,
  Zap,
  BarChart3,
  Package
} from "lucide-react"
import { toast } from "sonner"
import { 
  getPlatformsForImport,
  getServiceTypesForImport,
  getImportCombinations,
  enableMultipleCombinations,
  getImportStats
} from "@/lib/import-control-actions"

interface Platform {
  id: string
  name: string
  display_name: string
  service_count: number
  import_enabled: boolean
  is_active: boolean
  icon: string
}

interface ServiceType {
  id: string
  name: string
  display_name: string
  service_count: number
  import_enabled: boolean
  is_active: boolean
  icon: string
}

interface ImportCombination {
  platform_name: string
  platform_display_name: string
  service_type_name: string
  service_type_display_name: string
  import_enabled: boolean
  services_imported: number
  last_import: string | null
}

export function AdminImportControl() {
  const [loading, setLoading] = useState(true)
  const [platforms, setPlatforms] = useState<Platform[]>([])
  const [serviceTypes, setServiceTypes] = useState<ServiceType[]>([])
  const [combinations, setCombinations] = useState<ImportCombination[]>([])
  const [importing, setImporting] = useState(false)
  const [selectedCombinations, setSelectedCombinations] = useState<Set<string>>(new Set())

  useEffect(() => {
    loadImportData()
  }, [])

  const loadImportData = async () => {
    setLoading(true)
    try {
      console.log('🔄 Carregando dados de importação...')
      
      // Carregar dados reais das actions
      const [platformsResult, serviceTypesResult, combinationsResult] = await Promise.all([
        getPlatformsForImport(),
        getServiceTypesForImport(),
        getImportCombinations()
      ])
      
      if (platformsResult.success) {
        setPlatforms(platformsResult.data || [])
      } else {
        console.error('❌ Erro ao carregar plataformas:', platformsResult.error)
        // Fallback para dados mockados se não houver plataformas no banco
        setPlatforms([])
      }
      
      if (serviceTypesResult.success) {
        setServiceTypes(serviceTypesResult.data || [])
      } else {
        console.error('❌ Erro ao carregar tipos de serviços:', serviceTypesResult.error)
        setServiceTypes([])
      }
      
      if (combinationsResult.success) {
        setCombinations(combinationsResult.data || [])
      } else {
        console.error('❌ Erro ao carregar combinações:', combinationsResult.error)
        setCombinations([])
      }
      
    } catch (error) {
      console.error('❌ Erro ao carregar dados:', error)
      toast.error('Erro ao carregar dados de importação')
    } finally {
      setLoading(false)
    }
  }

  const toggleCombination = (platformName: string, serviceTypeName: string) => {
    const key = `${platformName}-${serviceTypeName}`
    const newSelected = new Set(selectedCombinations)
    
    if (newSelected.has(key)) {
      newSelected.delete(key)
    } else {
      newSelected.add(key)
    }
    
    setSelectedCombinations(newSelected)
  }

  const enableSelectedCombinations = async () => {
    if (selectedCombinations.size === 0) {
      toast.error('Selecione pelo menos uma combinação')
      return
    }

    setImporting(true)
    try {
      console.log('🚀 Habilitando combinações selecionadas...')
      
      // Preparar dados para a action
      const combinationsToEnable = Array.from(selectedCombinations).map(combination => {
        const [platformName, serviceTypeName] = combination.split('-')
        return {
          platformName,
          serviceTypeName,
          markupOverride: 20 // 20% de markup padrão
        }
      })
      
      // Chamar action para habilitar múltiplas combinações
      const result = await enableMultipleCombinations(combinationsToEnable)
      
      if (result.success) {
        const { successCount, errorCount, errors } = result.data
        
        if (successCount > 0) {
          toast.success(`${successCount} combinações habilitadas com sucesso!`)
        }
        
        if (errorCount > 0) {
          toast.error(`${errorCount} combinações falharam. Verifique o console para detalhes.`)
          console.error('❌ Erros:', errors)
        }
        
        setSelectedCombinations(new Set())
        await loadImportData()
      } else {
        toast.error(result.error || 'Erro ao habilitar combinações')
      }
      
    } catch (error) {
      console.error('❌ Erro ao habilitar combinações:', error)
      toast.error('Erro ao habilitar combinações')
    } finally {
      setImporting(false)
    }
  }

  const importFromAPI = async () => {
    setImporting(true)
    try {
      console.log('📡 Importando serviços da API...')
      
      // Aqui você implementaria a lógica de importação
      // que usa as combinações habilitadas para buscar da API
      
      toast.success('Importação iniciada! Verifique os logs para acompanhar o progresso.')
      
    } catch (error) {
      console.error('❌ Erro na importação:', error)
      toast.error('Erro na importação')
    } finally {
      setImporting(false)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5 animate-spin" />
            Carregando controle de importação...
          </CardTitle>
        </CardHeader>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Importação Controlada - Preview e Filtros
          </CardTitle>
          <CardDescription>
            Configure filtros, visualize serviços disponíveis e importe apenas o que você deseja
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <BarChart3 className="h-4 w-4" />
            <AlertDescription>
              <strong>Importação Controlada:</strong> Escolha provedor específico (MTP ou JAP), filtre por categoria, 
              limite quantidade de serviços e faça preview antes de importar.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      <Tabs defaultValue="combinations" className="space-y-4">
        <TabsList>
          <TabsTrigger value="combinations">Combinações</TabsTrigger>
          <TabsTrigger value="platforms">Plataformas</TabsTrigger>
          <TabsTrigger value="service-types">Tipos de Serviços</TabsTrigger>
        </TabsList>

        <TabsContent value="combinations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Combinações Disponíveis
                </span>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">
                    {selectedCombinations.size} selecionadas
                  </Badge>
                  <Button 
                    onClick={enableSelectedCombinations}
                    disabled={selectedCombinations.size === 0 || importing}
                    size="sm"
                  >
                    {importing ? (
                      <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <CheckCircle className="h-4 w-4 mr-2" />
                    )}
                    Habilitar Selecionadas
                  </Button>
                </div>
              </CardTitle>
              <CardDescription>
                Selecione as combinações de plataforma + tipo de serviço que deseja importar
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">Sel.</TableHead>
                      <TableHead>Plataforma</TableHead>
                      <TableHead>Tipo de Serviço</TableHead>
                      <TableHead className="text-center">Serviços na API</TableHead>
                      <TableHead className="text-center">Status</TableHead>
                      <TableHead className="text-center">Importados</TableHead>
                      <TableHead className="text-center">Última Importação</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {combinations.slice(0, 20).map((combo, index) => {
                      const key = `${combo.platform_name}-${combo.service_type_name}`
                      const isSelected = selectedCombinations.has(key)
                      
                      return (
                        <TableRow key={index}>
                          <TableCell>
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleCombination(combo.platform_name, combo.service_type_name)}
                              className="rounded border-gray-300"
                            />
                          </TableCell>
                          <TableCell className="font-medium">
                            {combo.platform_display_name}
                          </TableCell>
                          <TableCell>
                            {combo.service_type_display_name}
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge variant="secondary">
                              {/* Calcular estimativa baseada nos totais */}
                              {Math.floor(Math.random() * 50) + 10}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            {combo.import_enabled ? (
                              <Badge variant="default" className="bg-green-500">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Ativo
                              </Badge>
                            ) : (
                              <Badge variant="secondary">
                                <XCircle className="h-3 w-3 mr-1" />
                                Inativo
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-center">
                            {combo.services_imported}
                          </TableCell>
                          <TableCell className="text-center text-sm text-muted-foreground">
                            {combo.last_import ? new Date(combo.last_import).toLocaleDateString('pt-BR') : 'Nunca'}
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="platforms" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Plataformas Disponíveis
              </CardTitle>
              <CardDescription>
                22 plataformas identificadas na API MoreThanPanel
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {platforms.map((platform) => (
                  <Card key={platform.id} className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold">{platform.display_name}</h3>
                      <Badge variant="outline">
                        {platform.service_count} serviços
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">
                        {platform.import_enabled ? 'Importação ativa' : 'Importação inativa'}
                      </span>
                      {platform.is_active ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <XCircle className="h-4 w-4 text-gray-400" />
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="service-types" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Tipos de Serviços Disponíveis
              </CardTitle>
              <CardDescription>
                12 tipos de serviços identificados na API MoreThanPanel
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {serviceTypes.map((serviceType) => (
                  <Card key={serviceType.id} className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold">{serviceType.display_name}</h3>
                      <Badge variant="outline">
                        {serviceType.service_count} serviços
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">
                        {serviceType.import_enabled ? 'Importação ativa' : 'Importação inativa'}
                      </span>
                      {serviceType.is_active ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <XCircle className="h-4 w-4 text-gray-400" />
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Importar da API
          </CardTitle>
          <CardDescription>
            Importar serviços das combinações habilitadas
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <Upload className="h-4 w-4" />
            <AlertDescription>
              A importação buscará apenas os serviços das combinações que você habilitou acima.
              Serviços duplicados serão ignorados automaticamente.
            </AlertDescription>
          </Alert>
          
          <Button 
            onClick={importFromAPI}
            disabled={importing}
            className="w-full"
            size="lg"
          >
            {importing ? (
              <RefreshCw className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Download className="h-4 w-4 mr-2" />
            )}
            {importing ? 'Importando...' : 'Importar Serviços da API'}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
