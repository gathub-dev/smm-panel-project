"use client"

import React, { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
  Zap,
  TrendingUp
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
}

interface ServicesByCategory {
  [key: string]: Service[]
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

export default function LojaPage() {
  const [services, setServices] = useState<Service[]>([])
  const [servicesByCategory, setServicesByCategory] = useState<ServicesByCategory>({})
  const [loading, setLoading] = useState(true)
  const [selectedQuantities, setSelectedQuantities] = useState<{[key: string]: number}>({})

  useEffect(() => {
    loadServices()
  }, [])

  const loadServices = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/public/services')
      const data = await response.json()
      
      if (data.success) {
        // Filtrar apenas serviços visíveis na LP
        const lpServices = data.services.filter((service: Service) => service.lp_visible)
        setServices(lpServices)
        
        // Organizar por categoria
        const categorized = lpServices.reduce((acc: ServicesByCategory, service: Service) => {
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

  const handleQuantitySelect = (serviceId: string, quantity: number) => {
    setSelectedQuantities(prev => ({
      ...prev,
      [serviceId]: quantity
    }))
  }

  const calculatePrice = (service: Service, quantity: number) => {
    const unitPrice = service.rate || 0
    const totalPrice = (unitPrice * quantity) / 1000 // Assumindo que rate é por 1000
    return totalPrice
  }

  const handleBuyNow = (service: Service) => {
    const quantity = selectedQuantities[service.id]
    if (!quantity) {
      toast.error('Selecione uma quantidade primeiro')
      return
    }
    
    const price = calculatePrice(service, quantity)
    toast.success(`Redirecionando para pagamento: ${quantity} ${service.name} - R$ ${price.toFixed(2)}`)
    // Aqui você implementaria a lógica de pagamento
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando serviços...</p>
        </div>
      </div>
    )
  }

  const categories = Object.keys(servicesByCategory)
  const featuredServices = services.filter(service => service.featured)

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              🚀 SMM Panel - Loja
            </h1>
            <p className="text-gray-600 text-lg">
              Aumente a credibilidade do seu perfil com curtidas de alta qualidade
            </p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Mais Vendidos */}
        {featuredServices.length > 0 && (
          <div className="mb-12">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-2 flex items-center justify-center gap-2">
                <Star className="h-8 w-8 text-yellow-500" />
                Mais Vendidos
              </h2>
              <p className="text-gray-600">Nossos produtos mais populares</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredServices.map((service) => (
                <Card key={service.id} className="relative overflow-hidden border-2 border-yellow-200 bg-gradient-to-br from-yellow-50 to-orange-50">
                  <div className="absolute top-2 right-2">
                    <Badge className="bg-yellow-500 text-white">
                      <Star className="h-3 w-3 mr-1" />
                      Destaque
                    </Badge>
                  </div>
                  
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      {React.createElement(categoryIcons[service.shop_category as keyof typeof categoryIcons] || Package, { className: "h-5 w-5" })}
                      {service.name.substring(0, 40)}...
                    </CardTitle>
                    <CardDescription>
                      {service.description?.substring(0, 80)}...
                    </CardDescription>
                  </CardHeader>
                  
                  <CardContent>
                    <div className="space-y-4">
                      <div className="text-center">
                        <p className="text-sm text-gray-600 mb-2">Escolha a quantidade</p>
                        <div className="grid grid-cols-3 gap-2">
                          {service.quantities.slice(0, 6).map((qty) => (
                            <Button
                              key={qty}
                              size="sm"
                              variant={selectedQuantities[service.id] === qty ? "default" : "outline"}
                              onClick={() => handleQuantitySelect(service.id, qty)}
                              className="text-xs"
                            >
                              {qty.toLocaleString()}
                            </Button>
                          ))}
                        </div>
                      </div>
                      
                      {selectedQuantities[service.id] && (
                        <div className="text-center space-y-2">
                          <div className="text-sm text-gray-500 line-through">
                            De: R$ {(calculatePrice(service, selectedQuantities[service.id]) * 1.3).toFixed(2)}
                          </div>
                          <div className="text-2xl font-bold text-purple-600">
                            Por: R$ {calculatePrice(service, selectedQuantities[service.id]).toFixed(2)}
                          </div>
                          <div className="text-xs text-green-600 font-medium">
                            Promoção!
                          </div>
                        </div>
                      )}
                      
                      <Button 
                        className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                        onClick={() => handleBuyNow(service)}
                        disabled={!selectedQuantities[service.id]}
                      >
                        <ShoppingCart className="h-4 w-4 mr-2" />
                        COMPRAR AGORA
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Categorias */}
        <Tabs defaultValue={categories[0]} className="w-full">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-3 lg:grid-cols-6 mb-8">
            {categories.map((category) => {
              const Icon = categoryIcons[category as keyof typeof categoryIcons] || Package
              return (
                <TabsTrigger key={category} value={category} className="flex items-center gap-2">
                  <Icon className="h-4 w-4" />
                  {categoryNames[category as keyof typeof categoryNames] || category}
                </TabsTrigger>
              )
            })}
          </TabsList>

          {categories.map((category) => (
            <TabsContent key={category} value={category}>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {servicesByCategory[category].map((service) => (
                  <Card key={service.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        {React.createElement(categoryIcons[service.shop_category as keyof typeof categoryIcons] || Package, { className: "h-5 w-5" })}
                        {service.name.substring(0, 40)}...
                      </CardTitle>
                      <CardDescription>
                        {service.description?.substring(0, 80)}...
                      </CardDescription>
                    </CardHeader>
                    
                    <CardContent>
                      <div className="space-y-4">
                        <div className="text-center">
                          <p className="text-sm text-gray-600 mb-2">Escolha a quantidade</p>
                          <div className="grid grid-cols-3 gap-2">
                            {service.quantities.slice(0, 6).map((qty) => (
                              <Button
                                key={qty}
                                size="sm"
                                variant={selectedQuantities[service.id] === qty ? "default" : "outline"}
                                onClick={() => handleQuantitySelect(service.id, qty)}
                                className="text-xs"
                              >
                                {qty.toLocaleString()}
                              </Button>
                            ))}
                          </div>
                        </div>
                        
                        {selectedQuantities[service.id] && (
                          <div className="text-center space-y-2">
                            <div className="text-sm text-gray-500 line-through">
                              De: R$ {(calculatePrice(service, selectedQuantities[service.id]) * 1.3).toFixed(2)}
                            </div>
                            <div className="text-2xl font-bold text-purple-600">
                              Por: R$ {calculatePrice(service, selectedQuantities[service.id]).toFixed(2)}
                            </div>
                            <div className="text-xs text-green-600 font-medium">
                              Promoção!
                            </div>
                          </div>
                        )}
                        
                        <Button 
                          className="w-full"
                          onClick={() => handleBuyNow(service)}
                          disabled={!selectedQuantities[service.id]}
                        >
                          <ShoppingCart className="h-4 w-4 mr-2" />
                          COMPRAR AGORA
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
          ))}
        </Tabs>

        {/* Benefícios */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          <Card className="text-center">
            <CardContent className="pt-6">
              <Heart className="h-12 w-12 text-pink-500 mx-auto mb-4" />
              <h3 className="font-semibold mb-2">Curtidas</h3>
              <p className="text-sm text-gray-600">Aumente o engajamento do seu perfil com curtidas de qualidade</p>
            </CardContent>
          </Card>
          
          <Card className="text-center">
            <CardContent className="pt-6">
              <Users className="h-12 w-12 text-blue-500 mx-auto mb-4" />
              <h3 className="font-semibold mb-2">Seguidores</h3>
              <p className="text-sm text-gray-600">Expanda seu alcance com seguidores reais e ativos</p>
            </CardContent>
          </Card>
          
          <Card className="text-center">
            <CardContent className="pt-6">
              <Eye className="h-12 w-12 text-purple-500 mx-auto mb-4" />
              <h3 className="font-semibold mb-2">Visualizações</h3>
              <p className="text-sm text-gray-600">Impulsione a visibilidade dos seus Reels e Stories</p>
            </CardContent>
          </Card>
          
          <Card className="text-center">
            <CardContent className="pt-6">
              <MessageCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <h3 className="font-semibold mb-2">Comentários</h3>
              <p className="text-sm text-gray-600">Aumente a interação e o engajamento com comentários</p>
            </CardContent>
          </Card>
          
          <Card className="text-center">
            <CardContent className="pt-6">
              <BarChart3 className="h-12 w-12 text-orange-500 mx-auto mb-4" />
              <h3 className="font-semibold mb-2">Estatísticas</h3>
              <p className="text-sm text-gray-600">Serviços de estatísticas</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

