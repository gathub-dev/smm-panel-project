"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { 
  Download, 
  RefreshCw,
  Filter,
  CheckCircle,
  XCircle,
  Eye,
  Package,
  Shield,
  Clock
} from "lucide-react"
import { toast } from "sonner"
import { translateCategory, translateCategorySync } from "@/lib/category-translations"

interface APIService {
  service: string
  name: string
  type: string
  category: string
  originalCategory?: string
  originalName?: string
  rate: string
  min: string
  max: string
  dripfeed: boolean
  refill: boolean
  cancel: boolean
}

interface AdminImportPreviewProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AdminImportPreview({ open, onOpenChange }: AdminImportPreviewProps) {
  const [loading, setLoading] = useState(false)
  const [services, setServices] = useState<APIService[]>([])
  const [filteredServices, setFilteredServices] = useState<APIService[]>([])
  const [selectedServices, setSelectedServices] = useState<Set<string>>(new Set())
  const [categories, setCategories] = useState<string[]>([])
  
  const [providerFilter, setProviderFilter] = useState<'mtp' | 'jap'>('mtp')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [searchFilter, setSearchFilter] = useState('')
  const [limitFilter, setLimitFilter] = useState('100')

  useEffect(() => {
    if (open) {
      loadServicesFromAPI()
    }
  }, [providerFilter, open])

  useEffect(() => {
    applyFilters()
  }, [services, categoryFilter, searchFilter, limitFilter])

  const loadServicesFromAPI = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/admin/preview-services', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          provider: providerFilter,
          action: 'services'
        })
      })
      
      if (!response.ok) {
        throw new Error(`Erro HTTP: ${response.status}`)
      }
      
      const data = await response.json()
      
      if (data.success && Array.isArray(data.services)) {
        // Aplicar tradução rápida (síncrona) primeiro
        const translatedServices = data.services.map((service: APIService) => {
          const originalCategory = service.category
          const originalName = service.name
          const translatedCategory = translateCategorySync(service.category)
          const translatedName = translateCategorySync(service.name)
          
          return {
            ...service,
            name: translatedName,
            category: translatedCategory,
            originalCategory: originalCategory,
            originalName: originalName
          }
        })
        
        setTimeout(async () => {
          try {
            const improvedServices = await Promise.all(
              translatedServices.map(async (service: APIService) => {
                const betterCategoryTranslation = await translateCategory((service as any).originalCategory || service.category)
                const betterNameTranslation = await translateCategory((service as any).originalName || service.name)
                
                let hasImprovements = false
                const improvedService = { ...service }
                
                if (betterCategoryTranslation !== service.category) {
                  console.log(`🔄 Melhorando categoria: "${service.category}" → "${betterCategoryTranslation}"`)
                  improvedService.category = betterCategoryTranslation
                  hasImprovements = true
                }
                
                if (betterNameTranslation !== service.name) {
                  console.log(`🔄 Melhorando nome: "${service.name}" → "${betterNameTranslation}"`)
                  improvedService.name = betterNameTranslation
                  hasImprovements = true
                }
                
                return improvedService
              })
            )
            
            // Atualizar apenas se houve melhorias
            const hasImprovements = improvedServices.some((service, index) => 
              service.category !== translatedServices[index].category ||
              service.name !== translatedServices[index].name
            )
            
            if (hasImprovements) {
              setServices(improvedServices)
              const uniqueCategories = [...new Set(improvedServices.map(s => s.category))] as string[]
              setCategories(uniqueCategories.sort())
            }
          } catch (error) {
          }
        }, 100) // Executar após 100ms
        
        setServices(translatedServices)
        
        const uniqueCategories = [...new Set(translatedServices.map((s: APIService) => s.category))] as string[]
        setCategories(uniqueCategories.sort())
        
        toast.success(`${data.services.length} serviços carregados da API ${providerFilter.toUpperCase()} (traduzindo...)`)
      } else {
        throw new Error(data.error || 'Resposta inválida da API')
      }
      
    } catch (error: any) {
      toast.error(`Erro ao carregar serviços: ${error.message}`)
      setServices([])
      setCategories([])
    } finally {
      setLoading(false)
    }
  }

  const applyFilters = () => {
    let filtered = [...services]
    
    // Filtro por categoria
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(service => service.category === categoryFilter)
    }
    
    // Filtro por busca
    if (searchFilter.trim()) {
      const search = searchFilter.toLowerCase()
      filtered = filtered.filter(service => 
        service.name.toLowerCase().includes(search) ||
        service.category.toLowerCase().includes(search)
      )
    }
    
    // Limite de resultados
    const limit = parseInt(limitFilter) || 100
    filtered = filtered.slice(0, limit)
    
    setFilteredServices(filtered)
  }

  const toggleService = (serviceId: string) => {
    const newSelected = new Set(selectedServices)
    if (newSelected.has(serviceId)) {
      newSelected.delete(serviceId)
    } else {
      newSelected.add(serviceId)
    }
    setSelectedServices(newSelected)
  }

  const toggleAll = () => {
    if (selectedServices.size === filteredServices.length) {
      setSelectedServices(new Set())
    } else {
      setSelectedServices(new Set(filteredServices.map(s => s.service)))
    }
  }

  const importSelectedServices = async () => {
    if (selectedServices.size === 0) {
      toast.error('Selecione pelo menos um serviço para importar')
      return
    }

    setLoading(true)
    try {
      const servicesToImport = filteredServices.filter(s => selectedServices.has(s.service))
      
      const response = await fetch('/api/admin/import-services', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          provider: providerFilter,
          services: servicesToImport
        })
      })
      
      const result = await response.json()
      
      if (result.success) {
        toast.success(`${result.imported || selectedServices.size} serviços importados com sucesso!`)
        setSelectedServices(new Set())
        // Fechar o modal após importação bem-sucedida
        setTimeout(() => {
          onOpenChange(false)
        }, 1500)
      } else {
        throw new Error(result.error || 'Erro na importação')
      }
      
    } catch (error: any) {  
      toast.error(`Erro na importação: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[90vw] !max-w-none h-full overflow-y-auto sm:w-[85vw]" side="right">
        <SheetHeader className="px-6 py-4 border-b">
          <SheetTitle className="text-xl">Importar Serviços da API</SheetTitle>
          <SheetDescription className="text-base">
            Visualize e selecione serviços para importar do provedor escolhido
          </SheetDescription>
        </SheetHeader>
        
        <div className="space-y-6 mt-6 h-full overflow-y-auto pb-6 px-6">
          {/* Filtros em Layout Horizontal */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              <h3 className="text-lg font-semibold">Filtros de Importação</h3>
            </div>
        
            <div className="grid grid-cols-4 gap-4">
            {/* Provedor */}
            <div className="space-y-2">
              <Label>Provedor</Label>
              <Select value={providerFilter} onValueChange={(value: 'mtp' | 'jap') => setProviderFilter(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mtp">MoreThanPanel (MTP)</SelectItem>
                  <SelectItem value="jap">JustAnotherPanel (JAP)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Categoria */}
            <div className="space-y-2">
              <Label>Categoria</Label>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as Categorias</SelectItem>
                  {categories.map(category => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Busca */}
            <div className="space-y-2">
              <Label>Buscar</Label>
              <Input
                placeholder="Nome do serviço..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
              />
            </div>

            {/* Limite */}
            <div className="space-y-2">
              <Label>Limite</Label>
              <Select value={limitFilter} onValueChange={setLimitFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="50">50 serviços</SelectItem>
                  <SelectItem value="100">100 serviços</SelectItem>
                  <SelectItem value="250">250 serviços</SelectItem>
                  <SelectItem value="500">500 serviços</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4 pt-4 pb-2 border-b">
            <div className="flex items-center gap-3">
              <Button onClick={loadServicesFromAPI} disabled={loading} variant="outline" size="sm">
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Recarregar
              </Button>
              
              <Badge variant="outline" className="text-sm px-3 py-1">
                {filteredServices.length} de {services.length}
              </Badge>
              
              {selectedServices.size > 0 && (
                <Badge variant="default" className="text-sm px-3 py-1">
                  {selectedServices.size} selecionados
                </Badge>
              )}
            </div>
            
            <div className="flex items-center gap-3">
              <Button
                onClick={toggleAll}
                variant="outline"
                disabled={filteredServices.length === 0}
                size="sm"
              >
                {selectedServices.size === filteredServices.length ? 'Desmarcar' : 'Selecionar'} Todos
              </Button>
              <Button
                onClick={importSelectedServices}
                disabled={selectedServices.size === 0 || loading}
                className="min-w-[160px]"
              >
                {loading ? (
                  <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Download className="h-4 w-4 mr-2" />
                )}
                Importar ({selectedServices.size})
              </Button>
            </div>
          </div>
        </div>

      {/* Preview dos Serviços */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Eye className="h-5 w-5" />
          <h3 className="text-lg font-semibold">Preview dos Serviços</h3>
          {filteredServices.length > 0 && (
            <Badge variant="outline" className="ml-2">
              {filteredServices.length} serviços
            </Badge>
          )}
        </div>
        
        <div className="border rounded-lg">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-8 w-8 animate-spin mr-2" />
              <span>Carregando serviços da API...</span>
            </div>
          ) : filteredServices.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhum serviço encontrado com os filtros aplicados</p>
              <p className="text-sm mt-2">Tente ajustar os filtros ou recarregar os dados</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table className="min-w-full">
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12 min-w-12">
                      <input
                        type="checkbox"
                        checked={selectedServices.size === filteredServices.length && filteredServices.length > 0}
                        onChange={toggleAll}
                        className="rounded border-gray-300"
                      />
                    </TableHead>
                    <TableHead className="w-20 min-w-20">ID</TableHead>
                    <TableHead className="min-w-[350px] max-w-[450px]">Nome do Serviço</TableHead>
                    <TableHead className="min-w-[400px] max-w-[500px]">Categoria</TableHead>
                    <TableHead className="w-24 min-w-24">Tipo</TableHead>
                    <TableHead className="w-24 min-w-24 text-right">Preço</TableHead>
                    <TableHead className="w-32 min-w-32 text-center">Min/Max</TableHead>
                    <TableHead className="w-28 min-w-28 text-center">Recursos</TableHead>
                  </TableRow>
                </TableHeader>
              <TableBody>
                {filteredServices.map((service) => (
                  <TableRow key={service.service} className="hover:bg-muted/50">
                    <TableCell>
                      <input
                        type="checkbox"
                        checked={selectedServices.has(service.service)}
                        onChange={() => toggleService(service.service)}
                        className="rounded border-gray-300"
                      />
                    </TableCell>
                    <TableCell className="font-mono text-sm font-medium min-w-20">
                      {service.service}
                    </TableCell>
                    <TableCell className="min-w-[400px] max-w-[500px]">
                      <div className="text-sm leading-relaxed truncate pr-2" title={service.name}>
                        {service.name}
                      </div>
                    </TableCell>
                    <TableCell className="min-w-[300px] max-w-[400px]">
                      <div className="pr-2">
                        <Badge variant="outline" className="text-xs max-w-full">
                          {service.category}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell className="min-w-24">
                      <Badge variant="secondary" className="text-xs px-2 py-1 whitespace-nowrap">
                        {service.type}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm font-bold text-green-600 min-w-24">
                      <div className="whitespace-nowrap">${service.rate}</div>
                    </TableCell>
                    <TableCell className="text-center text-sm min-w-32">
                      <div className="text-sm font-medium whitespace-nowrap">
                        {parseInt(service.min).toLocaleString()} - {parseInt(service.max).toLocaleString()}
                      </div>
                    </TableCell>
                    <TableCell className="text-center min-w-28">
                      <div className="flex items-center justify-center gap-1 flex-wrap">
                        {service.refill && (
                          <div className="flex items-center gap-1 bg-green-100 px-1.5 py-0.5 rounded-full whitespace-nowrap">
                            <Shield className="h-3 w-3 text-green-600" />
                            <span className="text-xs text-green-700 font-medium">Refill</span>
                          </div>
                        )}
                        {service.cancel && (
                          <div className="flex items-center gap-1 bg-red-100 px-1.5 py-0.5 rounded-full whitespace-nowrap">
                            <XCircle className="h-3 w-3 text-red-600" />
                            <span className="text-xs text-red-700 font-medium">Cancel</span>
                          </div>
                        )}
                        {service.dripfeed && (
                          <div className="flex items-center gap-1 bg-blue-100 px-1.5 py-0.5 rounded-full whitespace-nowrap">
                            <Clock className="h-3 w-3 text-blue-600" />
                            <span className="text-xs text-blue-700 font-medium">Drip</span>
                          </div>
                        )}
                        {!service.refill && !service.cancel && !service.dripfeed && (
                          <span className="text-xs text-muted-foreground whitespace-nowrap">Nenhum</span>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
              </Table>
            </div>
          )}
        </div>
      </div>

      {/* Resumo da Importação */}
      {selectedServices.size > 0 && (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle className="h-5 w-5 text-blue-600" />
            <span className="font-semibold text-blue-900">Resumo da Importação</span>
          </div>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-blue-700 font-medium">Serviços selecionados:</span>
              <div className="text-lg font-bold text-blue-900">{selectedServices.size}</div>
            </div>
            <div>
              <span className="text-blue-700 font-medium">Provedor:</span>
              <div className="text-lg font-bold text-blue-900">{providerFilter.toUpperCase()}</div>
            </div>
            <div>
              <span className="text-blue-700 font-medium">Markup aplicado:</span>
              <div className="text-lg font-bold text-blue-900">20%</div>
            </div>
          </div>
          <p className="text-xs text-blue-600 mt-3">
            Os serviços serão criados com status ativo e poderão ser editados após a importação.
          </p>
        </div>
      )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
