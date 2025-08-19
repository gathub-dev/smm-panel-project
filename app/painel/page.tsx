"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import {
  Users,
  Heart,
  Eye,
  MessageCircle,
  BarChart3,
  Package,
  Star,
  ShoppingCart,
  Search,
  Filter,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  DollarSign
} from "lucide-react"

interface Service {
  id: string
  name: string
  description: string
  provider: string
  shop_category: string
  quantities: number[]
  rate: number
  provider_rate: number
  exchange_rate: number
  featured: boolean
  lp_visible: boolean
  min_quantity: number
  max_quantity: number
  status: string
}

interface ServicesByCategory {
  [key: string]: Service[]
}

interface Order {
  id: string
  service_name: string
  quantity: number
  total_price: number
  status: string
  created_at: string
  link?: string
}

const categoryIcons = {
  seguidores: Users,
  curtidas: Heart,
  visualizacoes: Eye,
  comentarios: MessageCircle,
  estatisticas: BarChart3,
  outros: Package
}

const categoryNames = {
  seguidores: "Seguidores",
  curtidas: "Curtidas", 
  visualizacoes: "Visualizações",
  comentarios: "Comentários",
  estatisticas: "Estatísticas",
  outros: "Outros"
}

const statusColors = {
  pending: "bg-yellow-100 text-yellow-800",
  processing: "bg-blue-100 text-blue-800",
  completed: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
  refunded: "bg-gray-100 text-gray-800"
}

const statusNames = {
  pending: "Pendente",
  processing: "Processando",
  completed: "Concluído",
  cancelled: "Cancelado",
  refunded: "Reembolsado"
}

export default function PainelPage() {
  const [services, setServices] = useState<Service[]>([])
  const [filteredServices, setFilteredServices] = useState<Service[]>([])
  const [servicesByCategory, setServicesByCategory] = useState<ServicesByCategory>({})
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [selectedProvider, setSelectedProvider] = useState<string>("all")
  const [priceRange, setPriceRange] = useState<string>("all")
  const [showFeaturedOnly, setShowFeaturedOnly] = useState(false)
  const [selectedQuantity, setSelectedQuantity] = useState<{[key: string]: number}>({})
  const [orderLink, setOrderLink] = useState<{[key: string]: string}>({})
  const [showOrderDialog, setShowOrderDialog] = useState(false)
  const [selectedService, setSelectedService] = useState<Service | null>(null)

  useEffect(() => {
    loadServices()
    loadOrders()
  }, [])

  useEffect(() => {
    applyFilters()
  }, [services, searchTerm, selectedCategory, selectedProvider, priceRange, showFeaturedOnly])

  const loadServices = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/public/services')
      const data = await response.json()
      
      if (data.success) {
        setServices(data.services)
        
        // Organizar por categoria
        const categorized = data.services.reduce((acc: ServicesByCategory, service: Service) => {
          const category = service.shop_category || 'outros'
          if (!acc[category]) {
            acc[category] = []
          }
          acc[category].push(service)
          return acc
        }, {})
        
        setServicesByCategory(categorized)
      } else {
        toast.error('Erro ao carregar serviços')
      }
    } catch (error) {
      console.error('Erro ao carregar serviços:', error)
      toast.error('Erro ao carregar serviços')
    } finally {
      setLoading(false)
    }
  }

  const loadOrders = async () => {
    try {
      // Simular carregamento de pedidos do usuário
      // Em uma implementação real, isso viria de uma API
      const mockOrders: Order[] = [
        {
          id: "1",
          service_name: "Instagram Curtidas | Garantia Vitalícia",
          quantity: 1000,
          total_price: 29.70,
          status: "completed",
          created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          link: "https://instagram.com/p/example1"
        },
        {
          id: "2",
          service_name: "Instagram Seguidores | Velocidade Rápida",
          quantity: 500,
          total_price: 88.11,
          status: "processing",
          created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
          link: "https://instagram.com/user/example"
        }
      ]
      setOrders(mockOrders)
    } catch (error) {
      console.error('Erro ao carregar pedidos:', error)
    }
  }

  const applyFilters = () => {
    let filtered = services

    // Filtro de busca
    if (searchTerm) {
      filtered = filtered.filter(service => 
        service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        service.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        service.id.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Filtro de categoria
    if (selectedCategory !== "all") {
      filtered = filtered.filter(service => service.shop_category === selectedCategory)
    }

    // Filtro de provedor
    if (selectedProvider !== "all") {
      filtered = filtered.filter(service => service.provider === selectedProvider)
    }

    // Filtro de preço
    if (priceRange !== "all") {
      filtered = filtered.filter(service => {
        const price = service.rate
        switch (priceRange) {
          case "low": return price < 5
          case "medium": return price >= 5 && price < 20
          case "high": return price >= 20
          default: return true
        }
      })
    }

    // Filtro de destaque
    if (showFeaturedOnly) {
      filtered = filtered.filter(service => service.featured)
    }

    setFilteredServices(filtered)
  }

  const handleQuantitySelect = (serviceId: string, quantity: number) => {
    setSelectedQuantity(prev => ({
      ...prev,
      [serviceId]: quantity
    }))
  }

  const handleLinkChange = (serviceId: string, link: string) => {
    setOrderLink(prev => ({
      ...prev,
      [serviceId]: link
    }))
  }

  const calculatePrice = (service: Service, quantity: number) => {
    const unitPrice = service.rate || 0
    const totalPrice = (unitPrice * quantity) / 1000
    return totalPrice
  }

  const handleOrderNow = (service: Service) => {
    const quantity = selectedQuantity[service.id]
    const link = orderLink[service.id]
    
    if (!quantity) {
      toast.error('Selecione uma quantidade primeiro')
      return
    }
    
    if (!link) {
      toast.error('Informe o link do post/perfil')
      return
    }
    
    setSelectedService(service)
    setShowOrderDialog(true)
  }

  const confirmOrder = async () => {
    if (!selectedService) return
    
    const quantity = selectedQuantity[selectedService.id]
    const link = orderLink[selectedService.id]
    const price = calculatePrice(selectedService, quantity)
    
    try {
      // Aqui você implementaria a lógica de criar o pedido
      toast.success(`Pedido criado: ${quantity} ${selectedService.name} - R$ ${price.toFixed(2)}`)
      setShowOrderDialog(false)
      setSelectedService(null)
      
      // Recarregar pedidos
      loadOrders()
    } catch (error) {
      toast.error('Erro ao criar pedido')
    }
  }

  const getUniqueProviders = () => {
    const providers = [...new Set(services.map(s => s.provider))]
    return providers.filter(Boolean)
  }

  const getUniqueCategories = () => {
    const categories = [...new Set(services.map(s => s.shop_category))]
    return categories.filter(Boolean)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando painel...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                🚀 SMM Panel - Painel Completo
              </h1>
              <p className="text-gray-600">
                Encontre o serviço perfeito para impulsionar suas redes sociais
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">Saldo disponível</p>
              <p className="text-2xl font-bold text-green-600">R$ 150,00</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <Tabs defaultValue="services" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="services">Serviços</TabsTrigger>
            <TabsTrigger value="orders">Meus Pedidos</TabsTrigger>
          </TabsList>

          <TabsContent value="services">
            {/* Filtros */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Filter className="h-5 w-5" />
                  Filtros de Busca
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                  <div className="space-y-2">
                    <Label>Buscar</Label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <Input
                        placeholder="Nome, descrição ou ID..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Categoria</Label>
                    <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                      <SelectTrigger>
                        <SelectValue placeholder="Todas" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todas as Categorias</SelectItem>
                        {getUniqueCategories().map(category => (
                          <SelectItem key={category} value={category}>
                            {categoryNames[category as keyof typeof categoryNames] || category}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Provedor</Label>
                    <Select value={selectedProvider} onValueChange={setSelectedProvider}>
                      <SelectTrigger>
                        <SelectValue placeholder="Todos" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos os Provedores</SelectItem>
                        {getUniqueProviders().map(provider => (
                          <SelectItem key={provider} value={provider}>
                            {provider.toUpperCase()}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Faixa de Preço</Label>
                    <Select value={priceRange} onValueChange={setPriceRange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Todos" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos os Preços</SelectItem>
                        <SelectItem value="low">Até R$ 5,00</SelectItem>
                        <SelectItem value="medium">R$ 5,00 - R$ 20,00</SelectItem>
                        <SelectItem value="high">Acima de R$ 20,00</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Filtros Especiais</Label>
                    <Button
                      variant={showFeaturedOnly ? "default" : "outline"}
                      onClick={() => setShowFeaturedOnly(!showFeaturedOnly)}
                      className="w-full"
                    >
                      <Star className="h-4 w-4 mr-2" />
                      {showFeaturedOnly ? "Todos" : "Só Destaques"}
                    </Button>
                  </div>
                </div>
                
                <div className="mt-4 flex items-center justify-between">
                  <p className="text-sm text-gray-600">
                    Mostrando {filteredServices.length} de {services.length} serviços
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSearchTerm("")
                      setSelectedCategory("all")
                      setSelectedProvider("all")
                      setPriceRange("all")
                      setShowFeaturedOnly(false)
                    }}
                  >
                    Limpar Filtros
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Lista de Serviços */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredServices.map((service) => (
                <Card key={service.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-lg flex items-center gap-2">
                        {React.createElement(categoryIcons[service.shop_category as keyof typeof categoryIcons] || Package, { className: "h-5 w-5" })}
                        {service.name.substring(0, 40)}...
                      </CardTitle>
                      {service.featured && (
                        <Badge className="bg-yellow-500 text-white">
                          <Star className="h-3 w-3 mr-1" />
                          Destaque
                        </Badge>
                      )}
                    </div>
                    <CardDescription>
                      <div className="space-y-1">
                        <p>{service.description?.substring(0, 80)}...</p>
                        <div className="flex items-center gap-2 text-xs">
                          <Badge variant="outline">{service.provider.toUpperCase()}</Badge>
                          <Badge variant="outline">ID: {service.id.substring(0, 8)}</Badge>
                          <Badge variant="outline">
                            {service.min_quantity.toLocaleString()} - {service.max_quantity.toLocaleString()}
                          </Badge>
                        </div>
                      </div>
                    </CardDescription>
                  </CardHeader>
                  
                  <CardContent>
                    <div className="space-y-4">
                      {/* Link do Post/Perfil */}
                      <div className="space-y-2">
                        <Label className="text-sm">Link do Post/Perfil</Label>
                        <Input
                          placeholder="https://instagram.com/p/..."
                          value={orderLink[service.id] || ""}
                          onChange={(e) => handleLinkChange(service.id, e.target.value)}
                        />
                      </div>
                      
                      {/* Quantidade */}
                      <div className="space-y-2">
                        <Label className="text-sm">Quantidade</Label>
                        <div className="grid grid-cols-3 gap-2">
                          {service.quantities.slice(0, 6).map((qty) => (
                            <Button
                              key={qty}
                              size="sm"
                              variant={selectedQuantity[service.id] === qty ? "default" : "outline"}
                              onClick={() => handleQuantitySelect(service.id, qty)}
                              className="text-xs"
                            >
                              {qty.toLocaleString()}
                            </Button>
                          ))}
                        </div>
                        
                        {service.quantities.length > 6 && (
                          <p className="text-xs text-gray-500">
                            +{service.quantities.length - 6} opções disponíveis
                          </p>
                        )}
                      </div>
                      
                      {/* Preço */}
                      {selectedQuantity[service.id] && (
                        <div className="text-center space-y-1">
                          <div className="text-2xl font-bold text-purple-600">
                            R$ {calculatePrice(service, selectedQuantity[service.id]).toFixed(2)}
                          </div>
                          <div className="text-xs text-gray-500">
                            Por {selectedQuantity[service.id].toLocaleString()} unidades
                          </div>
                        </div>
                      )}
                      
                      <Button 
                        className="w-full"
                        onClick={() => handleOrderNow(service)}
                        disabled={!selectedQuantity[service.id] || !orderLink[service.id]}
                      >
                        <ShoppingCart className="h-4 w-4 mr-2" />
                        FAZER PEDIDO
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="orders">
            {/* Lista de Pedidos */}
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Meus Pedidos
                  </CardTitle>
                  <CardDescription>
                    Acompanhe o status dos seus pedidos
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {orders.length === 0 ? (
                    <div className="text-center py-8">
                      <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">Você ainda não fez nenhum pedido</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {orders.map((order) => (
                        <Card key={order.id}>
                          <CardContent className="pt-4">
                            <div className="flex items-center justify-between">
                              <div className="space-y-1">
                                <h3 className="font-medium">{order.service_name}</h3>
                                <div className="flex items-center gap-4 text-sm text-gray-500">
                                  <span>Quantidade: {order.quantity.toLocaleString()}</span>
                                  <span>R$ {order.total_price.toFixed(2)}</span>
                                  <span>{new Date(order.created_at).toLocaleDateString('pt-BR')}</span>
                                </div>
                                {order.link && (
                                  <p className="text-xs text-blue-600 truncate max-w-md">
                                    {order.link}
                                  </p>
                                )}
                              </div>
                              <Badge className={statusColors[order.status as keyof typeof statusColors]}>
                                {statusNames[order.status as keyof typeof statusNames]}
                              </Badge>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Dialog de Confirmação de Pedido */}
      <Dialog open={showOrderDialog} onOpenChange={setShowOrderDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Pedido</DialogTitle>
            <DialogDescription>
              Revise os detalhes do seu pedido antes de confirmar
            </DialogDescription>
          </DialogHeader>
          
          {selectedService && (
            <div className="space-y-4">
              <div>
                <h3 className="font-medium">{selectedService.name}</h3>
                <p className="text-sm text-gray-600">{selectedService.description}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Quantidade</Label>
                  <p className="text-lg font-medium">{selectedQuantity[selectedService.id]?.toLocaleString()}</p>
                </div>
                <div>
                  <Label>Total</Label>
                  <p className="text-lg font-medium text-green-600">
                    R$ {calculatePrice(selectedService, selectedQuantity[selectedService.id] || 0).toFixed(2)}
                  </p>
                </div>
              </div>
              
              <div>
                <Label>Link</Label>
                <p className="text-sm text-blue-600 break-all">{orderLink[selectedService.id]}</p>
              </div>
              
              <div className="flex gap-2 pt-4">
                <Button variant="outline" onClick={() => setShowOrderDialog(false)}>
                  Cancelar
                </Button>
                <Button onClick={confirmOrder} className="flex-1">
                  <DollarSign className="h-4 w-4 mr-2" />
                  Confirmar Pedido
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
