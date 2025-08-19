"use client"

import { useState, useEffect } from "react"
import { getPublicServices, getPublicCategories } from "@/lib/public-service-actions"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import { Search, Star, Info, TrendingUp, Users, Heart, Eye, MessageCircle } from "lucide-react"

// Simulação de dados dos serviços (em produção viria da API)
const mockServices = [
  {
    id: "1032",
    name: "🇧🇷 Seguidores Brasileiros 🔥 R30 ⚡ (S2) ⚡",
    category: "Instagram Seguidores",
    price: 46.50,
    min: 10,
    max: 10000,
    description: "Seguidores brasileiros de alta qualidade com garantia de 30 dias",
    details: {
      startTime: "Instantâneo (pode mudar em atualizações)",
      speed: "~10.000/hora",
      exclusive: true,
      dropRate: "~0-5%",
      refill: "30 dias",
      quality: "Seguidores reais mistos"
    }
  },
  {
    id: "997",
    name: "📱 Seguidores Mistos reais (🔥R365) ⚡ (S1) ⚡",
    category: "Instagram Seguidores", 
    price: 28.20,
    min: 50,
    max: 20000,
    description: "Seguidores mistos reais com garantia de 365 dias",
    details: {
      startTime: "0-1 hora",
      speed: "1-5K/dia",
      exclusive: false,
      dropRate: "~0-3%",
      refill: "365 dias",
      quality: "Seguidores reais mistos"
    }
  },
  {
    id: "1000",
    name: "📱 Seguidores Mistos reais (🔥R365) ⚡ (S2) ⚡",
    category: "Instagram Seguidores",
    price: 27.46,
    min: 50,
    max: 1000000,
    description: "Seguidores mistos reais premium com garantia estendida",
    details: {
      startTime: "0-1 hora",
      speed: "2-10K/dia", 
      exclusive: false,
      dropRate: "~0-2%",
      refill: "365 dias",
      quality: "Seguidores reais mistos premium"
    }
  },
  {
    id: "996",
    name: "📹 Visualizações em REELS S1 ⚡",
    category: "Instagram Views",
    price: 0.14,
    min: 100,
    max: 2147483647,
    description: "Visualizações para Reels do Instagram com entrega rápida",
    details: {
      startTime: "0-30 minutos",
      speed: "100K-1M/dia",
      exclusive: false,
      dropRate: "~0%",
      refill: "Não",
      quality: "Visualizações reais"
    }
  },
  {
    id: "1035",
    name: "💖 Curtidas Brasileiras ⚡ 🔥 (S1)",
    category: "Instagram Curtidas",
    price: 10.85,
    min: 10,
    max: 6000,
    description: "Curtidas de usuários brasileiros reais",
    details: {
      startTime: "0-1 hora",
      speed: "500-2K/dia",
      exclusive: false,
      dropRate: "~0-1%",
      refill: "Não",
      quality: "Curtidas brasileiras reais"
    }
  },
  {
    id: "913",
    name: "TikTok 🎬 Seguidores Brasileiros | 🔥 R30 | ⚡",
    category: "TikTok Seguidores",
    price: 26.50,
    min: 10,
    max: 1000000,
    description: "Seguidores brasileiros para TikTok com garantia",
    details: {
      startTime: "0-2 horas",
      speed: "1-5K/dia",
      exclusive: false,
      dropRate: "~0-3%",
      refill: "30 dias",
      quality: "Seguidores brasileiros reais"
    }
  },
  {
    id: "975",
    name: "Tik Tok 💜 Curtidas Mistas Reais | ⚡ {R30}",
    category: "TikTok Curtidas",
    price: 0.33,
    min: 10,
    max: 100000,
    description: "Curtidas mistas reais para TikTok",
    details: {
      startTime: "0-1 hora",
      speed: "10-50K/dia",
      exclusive: false,
      dropRate: "~0-2%",
      refill: "30 dias",
      quality: "Curtidas mistas reais"
    }
  }
]

export default function ServicesPage() {
  const [services, setServices] = useState<any[]>([])
  const [categories, setCategories] = useState<string[]>(["Todos"])
  const [selectedCategory, setSelectedCategory] = useState("Todos")
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedService, setSelectedService] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [pagination, setPagination] = useState<any>(null)

  const getCategoryIcon = (category: string) => {
    if (category.includes("Seguidores")) return <Users className="h-5 w-5" />
    if (category.includes("Curtidas")) return <Heart className="h-5 w-5" />
    if (category.includes("Views") || category.includes("Visualizações")) return <Eye className="h-5 w-5" />
    if (category.includes("Comentários")) return <MessageCircle className="h-5 w-5" />
    return <TrendingUp className="h-5 w-5" />
  }

  const formatPrice = (price: number) => {
    return `R$ ${price.toFixed(2)}`
  }

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`
    }
    if (num >= 1000) {
      return `${(num / 1000).toFixed(0)}K`
    }
    return num.toString()
  }

  // Carregar dados iniciais
  useEffect(() => {
    loadInitialData()
  }, [])

  // Recarregar quando filtros mudarem
  useEffect(() => {
    if (!loading) {
      loadServices()
    }
  }, [selectedCategory, searchTerm])

  const loadInitialData = async () => {
    try {
      // Carregar categorias
      const categoriesResult = await getPublicCategories()
      if (categoriesResult.success) {
        setCategories(categoriesResult.categories)
      }

      // Carregar serviços iniciais
      await loadServices()
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadServices = async () => {
    try {
      const result = await getPublicServices({
        category: selectedCategory,
        search: searchTerm,
        page: 1,
        limit: 50
      })

      if (result.success) {
        setServices(result.services)
        setPagination(result.pagination)
      }
    } catch (error) {
      console.error('Erro ao carregar serviços:', error)
    }
  }



  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900">
      {/* Header */}
      <header className="border-b border-white/10 bg-black/20 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-6">
          <div className="text-center mb-6">
            <h1 className="text-4xl font-bold text-white">
              SMM Panel Brasil
            </h1>
            <p className="text-gray-300 mt-2">Serviços de Marketing Digital - Mais Barato do Brasil</p>
          </div>

          {/* Filtros */}
          <div className="flex flex-col md:flex-row gap-4 items-center justify-center">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Buscar serviços..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-64">
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
        </div>
      </header>

      {/* Seção Promocional */}
      <section className="py-8">
        <div className="container mx-auto px-4">
          <Card className="bg-gradient-to-r from-orange-500 to-red-500 text-white border-0 mb-8">
            <CardHeader>
              <CardTitle className="text-2xl flex items-center gap-2">
                🔥 Promoção SMM Panel 🎉
                <Badge variant="secondary" className="bg-white text-orange-600">
                  BARATO
                </Badge>
              </CardTitle>
              <CardDescription className="text-orange-100">
                Os melhores preços do mercado brasileiro! Serviços de alta qualidade com garantia.
              </CardDescription>
            </CardHeader>
          </Card>

          {/* Lista de Serviços Organizados por Categoria */}
          <div className="space-y-6">
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto"></div>
                <p className="mt-4 text-gray-300">Carregando serviços...</p>
              </div>
            ) : (
              (() => {
                // Agrupar serviços por categoria
                const servicesByCategory = services.reduce((acc: any, service: any) => {
                  const category = service.category || 'Outros'
                  if (!acc[category]) {
                    acc[category] = []
                  }
                  acc[category].push(service)
                  return acc
                }, {})

                // Cores para as categorias
                const categoryColors = [
                  'from-blue-600 to-purple-600',
                  'from-green-600 to-blue-600', 
                  'from-purple-600 to-pink-600',
                  'from-orange-600 to-red-600',
                  'from-cyan-600 to-blue-600',
                  'from-indigo-600 to-purple-600',
                  'from-emerald-600 to-teal-600',
                  'from-rose-600 to-pink-600'
                ]

                return Object.entries(servicesByCategory).map(([category, categoryServices]: [string, any], categoryIndex) => (
                  <div key={category} className="space-y-4">
                    {/* Header da Categoria */}
                    <div className={`bg-gradient-to-r ${categoryColors[categoryIndex % categoryColors.length]} p-4 rounded-lg`}>
                      <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        {getCategoryIcon(category)}
                        {category}
                        <span className="text-sm font-normal opacity-80">({categoryServices.length} serviços)</span>
                      </h2>
                    </div>

                    {/* Serviços da Categoria */}
                    <div className="space-y-3">
                      {categoryServices.map((service: any) => (
              <Card key={service.id} className="bg-white/5 border-white/10 hover:bg-white/10 transition-all duration-200 border-l-4 border-l-blue-500">
                <CardContent className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                    {/* ID */}
                    <div className="md:col-span-1">
                      <Badge variant="outline" className="font-mono text-blue-300 border-blue-500/30">
                        {service.provider_service_id}
                      </Badge>
                    </div>

                    {/* Serviço */}
                    <div className="md:col-span-5">
                      <div className="flex items-start gap-2">
                        <div className="text-blue-400">
                          {getCategoryIcon(service.category)}
                        </div>
                        <div>
                          <h3 className="font-semibold text-sm leading-tight text-white">
                            {service.name}
                          </h3>
                          <Badge variant="secondary" className="text-xs mt-1 bg-blue-500/20 text-blue-300 border-blue-500/30">
                            {service.category}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    {/* Preço */}
                    <div className="md:col-span-2 text-center">
                      <div className="text-2xl font-bold text-green-400">
                        {formatPrice(service.rate)}
                      </div>
                      <div className="text-xs text-gray-400">por 1000</div>
                    </div>

                    {/* Min/Max */}
                    <div className="md:col-span-2 text-center">
                      <div className="text-sm">
                        <div className="text-green-400 font-semibold">{service.min_quantity}</div>
                        <div className="text-xs text-gray-400">mín</div>
                      </div>
                      <Separator className="my-1 bg-white/20" />
                      <div className="text-sm">
                        <div className="text-red-400 font-semibold">{formatNumber(service.max_quantity)}</div>
                        <div className="text-xs text-gray-400">máx</div>
                      </div>
                    </div>

                    {/* Ações */}
                    <div className="md:col-span-2 text-center">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => setSelectedService(service)}
                            className="w-full border-white/20 text-white hover:bg-white/10"
                          >
                            <Info className="h-4 w-4 mr-2" />
                            Informações
                          </Button>
                        </DialogTrigger>
                      <DialogContent className="max-w-md bg-gray-900 border-white/20">
                        <DialogHeader>
                          <DialogTitle className="text-lg text-white">
                            {selectedService?.name}
                          </DialogTitle>
                          <DialogDescription className="text-gray-300">
                            Detalhes completos do serviço
                          </DialogDescription>
                        </DialogHeader>
                        
                        {selectedService && (
                          <div className="space-y-4">
                            {/* Informações Básicas */}
                            <div className="bg-white/5 p-4 rounded-lg border border-white/10">
                              <div className="grid grid-cols-2 gap-2 text-sm">
                                <div>
                                  <span className="text-gray-400">ID:</span>
                                  <span className="font-mono ml-2 text-blue-300">{selectedService.provider_service_id}</span>
                                </div>
                                <div>
                                  <span className="text-gray-400">Preço:</span>
                                  <span className="font-bold text-green-400 ml-2">
                                    {formatPrice(selectedService.rate)}
                                  </span>
                                </div>
                                <div>
                                  <span className="text-gray-400">Mínimo:</span>
                                  <span className="ml-2 text-white">{selectedService.min_quantity}</span>
                                </div>
                                <div>
                                  <span className="text-gray-400">Máximo:</span>
                                  <span className="ml-2 text-white">{formatNumber(selectedService.max_quantity)}</span>
                                </div>
                              </div>
                            </div>

                            {/* Detalhes Técnicos */}
                            <div className="space-y-3">
                              <div className="flex items-center gap-2">
                                <span className="text-green-500">🟢</span>
                                <span className="text-sm">
                                  <strong>Tempo Médio de Início:</strong> Instantâneo (pode mudar em atualizações)
                                </span>
                              </div>
                              
                              <div className="flex items-center gap-2">
                                <span className="text-blue-500">🚀</span>
                                <span className="text-sm">
                                  <strong>Velocidade média:</strong> ~10.000/hora
                                </span>
                              </div>

                              <div className="flex items-center gap-2">
                                <span className="text-orange-500">🔥</span>
                                <span className="text-sm">
                                  <strong>Serviço exclusivo</strong>
                                </span>
                              </div>

                              <div className="flex items-center gap-2">
                                <span className="text-red-500">📉</span>
                                <span className="text-sm">
                                  <strong>Quedas:</strong> ~0-5%
                                </span>
                              </div>

                              <div className="flex items-center gap-2">
                                <span className="text-green-500">🔄</span>
                                <span className="text-sm">
                                  <strong>Reposição:</strong> {selectedService.category.includes('Seguidores') ? '30 dias' : 'Não'}
                                </span>
                              </div>

                              <div className="flex items-center gap-2">
                                <span className="text-purple-500">👥</span>
                                <span className="text-sm">
                                  <strong>Qualidade:</strong> {selectedService.category.includes('Brasileiros') ? 'Usuários brasileiros reais' : 'Usuários reais mistos'}
                                </span>
                              </div>
                            </div>

                            {/* Descrição */}
                            <div className="bg-white/5 p-3 rounded-lg border border-white/10">
                              <p className="text-sm text-gray-300">
                                {selectedService.description || selectedService.name}
                              </p>
                            </div>

                            {/* Instruções */}
                            <div className="bg-yellow-500/10 p-3 rounded-lg border border-yellow-500/20">
                              <h4 className="font-semibold text-sm mb-2 text-yellow-400">📝 Instruções:</h4>
                              <ul className="text-xs space-y-1 text-gray-300">
                                <li>🔗 Coloque o link ou @ do perfil</li>
                                <li>⚠️ Exemplo: https://instagram.com/seuusuario ou @seuusuario</li>
                                <li>🔓 O perfil precisa estar público, não funciona em perfil privado</li>
                                <li>⚠️ Atenção ao mínimo e máximo, dúvidas chame nosso suporte!</li>
                              </ul>
                            </div>

                            {/* Call to Action */}
                            <div className="text-center pt-4">
                              <Button className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                                <Star className="h-4 w-4 mr-2" />
                                Fazer Pedido
                              </Button>
                              <p className="text-xs text-gray-400 mt-2">
                                Faça login para realizar pedidos
                              </p>
                            </div>
                          </div>
                        )}
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              </CardContent>
                                    </Card>
                      ))}
                    </div>
                  </div>
                ))
              })()
            )}
          </div>

          {/* Mensagem se não encontrar serviços */}
          {!loading && services.length === 0 && (
            <Card className="bg-white/5 border-white/10 text-center py-12">
              <CardContent>
                <div className="text-gray-300">
                  <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <h3 className="text-lg font-semibold mb-2 text-white">Serviço não encontrado!</h3>
                  <p>Por favor, tente novamente com outra palavra.</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 bg-black/20 backdrop-blur-sm py-8 mt-12">
        <div className="container mx-auto px-4 text-center">
          <h3 className="text-xl font-bold mb-4 text-white">SMM Panel Brasil</h3>
          <p className="text-gray-400 mb-4">
            Siga-nos nas redes sociais!
          </p>
          <div className="text-sm text-gray-400">
            © 2024 SMM Panel Brasil. Todos os direitos reservados.
          </div>
          <div className="mt-4 space-x-4 text-sm">
            <a href="/auth/login" className="text-gray-400 hover:text-blue-400">Fazer Login</a>
            <span className="text-gray-600">|</span>
            <a href="/services" className="text-gray-400 hover:text-blue-400">Serviços</a>
            <span className="text-gray-600">|</span>
            <a href="/" className="text-gray-400 hover:text-blue-400">Início</a>
            <span className="text-gray-600">|</span>
            <a href="/auth/sign-up" className="text-gray-400 hover:text-blue-400">Cadastrar</a>
          </div>
        </div>
      </footer>
    </div>
  )
} 