import { createClient, isSupabaseConfigured } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { Instagram, Facebook, Twitter, Youtube, Music, Linkedin, Zap, Shield, Clock, TrendingUp, Users, Heart, Eye, Star } from "lucide-react"
import { getPublicServices } from "@/lib/public-service-actions"

export default async function Home() {
  // If Supabase is not configured, show setup message
  if (!isSupabaseConfigured) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold">Setup Required</CardTitle>
            <CardDescription>Connect Supabase to get started</CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  // Check if user is already logged in
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // If user is logged in, redirect to dashboard
  if (user) {
    redirect("/dashboard")
  }

  // Buscar serviços populares para exibir na home
  const servicesResult = await getPublicServices({ limit: 8 })
  const popularServices = servicesResult.success ? servicesResult.services : []

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900">
      {/* Header */}
      <header className="border-b border-white/10 bg-black/20 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                <Zap className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold text-white">SMM Panel Brasil</span>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/auth/login">
                <Button variant="ghost" className="text-white hover:bg-white/10">
                  Login
                </Button>
              </Link>
              <Link href="/auth/sign-up">
                <Button className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white">
                  Cadastrar
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20">
        <div className="container mx-auto px-4 text-center">
          <Badge className="mb-6 bg-blue-500/20 text-blue-300 border-blue-500/30">Serviços SMM Profissionais</Badge>
          <h1 className="text-5xl font-bold text-white mb-6 leading-tight">
            Impulsione Suas Redes Sociais
            <br />
            <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              Hoje Mesmo
            </span>
          </h1>
          <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
            Obtenha seguidores, curtidas, visualizações e engajamento de alta qualidade em todas as principais plataformas de redes sociais. Entrega rápida, preços competitivos e suporte 24/7.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/services">
              <Button
                size="lg"
                className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-8 py-3 text-lg"
              >
                Ver Serviços Agora
              </Button>
            </Link>
            <Link href="/auth/login">
              <Button
                size="lg"
                variant="outline"
                className="border-white/20 text-white hover:bg-white/10 px-8 py-3 text-lg bg-transparent"
              >
                Fazer Login
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Platforms Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-white text-center mb-12">Plataformas Suportadas</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
            {[
              { icon: Instagram, name: "Instagram", color: "from-pink-500 to-purple-600" },
              { icon: Facebook, name: "Facebook", color: "from-blue-600 to-blue-700" },
              { icon: Twitter, name: "Twitter", color: "from-blue-400 to-blue-500" },
              { icon: Youtube, name: "YouTube", color: "from-red-500 to-red-600" },
              { icon: Music, name: "TikTok", color: "from-black to-gray-800" },
              { icon: Linkedin, name: "LinkedIn", color: "from-blue-700 to-blue-800" },
            ].map((platform) => (
              <Card key={platform.name} className="bg-white/5 border-white/10 hover:bg-white/10 transition-colors">
                <CardContent className="p-6 text-center">
                  <div
                    className={`w-12 h-12 rounded-lg bg-gradient-to-r ${platform.color} flex items-center justify-center mx-auto mb-3`}
                  >
                    <platform.icon className="h-6 w-6 text-white" />
                  </div>
                  <p className="text-white font-medium">{platform.name}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Popular Services Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white mb-4">Serviços Populares</h2>
            <p className="text-gray-300 text-lg">Os serviços mais procurados com os melhores preços do Brasil</p>
          </div>
          
          {popularServices.length > 0 ? (
                         <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 auto-rows-fr">
              {popularServices.map((service: any) => {
                const getCategoryIcon = (category: string) => {
                  if (category.includes("Seguidores")) return <Users className="h-5 w-5" />
                  if (category.includes("Curtidas")) return <Heart className="h-5 w-5" />
                  if (category.includes("Views") || category.includes("Visualizações")) return <Eye className="h-5 w-5" />
                  return <Star className="h-5 w-5" />
                }

                const formatPrice = (price: number) => {
                  return `R$ ${price.toFixed(2)}`
                }

                const formatNumber = (num: number) => {
                  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
                  if (num >= 1000) return `${(num / 1000).toFixed(0)}K`
                  return num.toString()
                }

                return (
                                    <Card key={service.id} className="bg-white/5 border-white/10 hover:bg-white/10 transition-all duration-200 group">
                    <CardContent className="p-4">
                      {/* Header com ícone e ID */}
                      <div className="flex items-center justify-between mb-3">
                        <div className="p-2 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 text-white">
                          {getCategoryIcon(service.category)}
                        </div>
                        <Badge variant="secondary" className="text-xs bg-blue-500/20 text-blue-300 border-blue-500/30">
                          ID: {service.provider_service_id}
                        </Badge>
                      </div>

                      {/* Nome do serviço */}
                      <h3 className="text-white font-semibold text-sm mb-3 h-10 overflow-hidden leading-tight">
                        {service.name.length > 45 ? service.name.substring(0, 45) + '...' : service.name}
                      </h3>

                      {/* Preço */}
                      <div className="text-center mb-3">
                        <div className="text-xl font-bold text-green-400">
                          {formatPrice(service.rate)}
                        </div>
                        <div className="text-xs text-gray-400">por 1000</div>
                      </div>
                      
                      {/* Min/Max */}
                      <div className="flex justify-between text-sm mb-3">
                        <div className="text-center">
                          <div className="text-green-400 font-semibold">{service.min_quantity}</div>
                          <div className="text-xs text-gray-400">mín</div>
                        </div>
                        <div className="text-center">
                          <div className="text-red-400 font-semibold">{formatNumber(service.max_quantity)}</div>
                          <div className="text-xs text-gray-400">máx</div>
                        </div>
                      </div>

                      {/* Categoria */}
                      <div className="text-center mb-4">
                        <Badge variant="outline" className="text-xs text-gray-300 border-gray-600">
                          {service.category.length > 20 ? service.category.substring(0, 20) + '...' : service.category}
                        </Badge>
                      </div>

                      {/* Botão */}
                      <Link href="/services" className="block">
                        <Button className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white text-xs">
                          Ver Detalhes
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-4">
                <Star className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Carregando serviços...</p>
              </div>
            </div>
          )}

          {/* Call to Action */}
          <div className="text-center">
            <Link href="/services">
              <Button size="lg" className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white px-8 py-3">
                Ver Todos os Serviços
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-white text-center mb-12">Por Que Escolher o SMM Panel Pro?</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="bg-white/5 border-white/10">
              <CardHeader>
                <div className="w-12 h-12 rounded-lg bg-gradient-to-r from-green-500 to-emerald-600 flex items-center justify-center mb-4">
                  <Clock className="h-6 w-6 text-white" />
                </div>
                <CardTitle className="text-white">Entrega Rápida</CardTitle>
                <CardDescription className="text-gray-300">
                  A maioria dos pedidos começam em minutos e são concluídos em 24 horas
                </CardDescription>
              </CardHeader>
            </Card>
            <Card className="bg-white/5 border-white/10">
              <CardHeader>
                <div className="w-12 h-12 rounded-lg bg-gradient-to-r from-blue-500 to-cyan-600 flex items-center justify-center mb-4">
                  <Shield className="h-6 w-6 text-white" />
                </div>
                <CardTitle className="text-white">Seguro e Protegido</CardTitle>
                <CardDescription className="text-gray-300">
                  Processamento de pagamento 100% seguro e proteção da conta garantida
                </CardDescription>
              </CardHeader>
            </Card>
            <Card className="bg-white/5 border-white/10">
              <CardHeader>
                <div className="w-12 h-12 rounded-lg bg-gradient-to-r from-purple-500 to-pink-600 flex items-center justify-center mb-4">
                  <TrendingUp className="h-6 w-6 text-white" />
                </div>
                <CardTitle className="text-white">Alta Qualidade</CardTitle>
                <CardDescription className="text-gray-300">
                  Serviços de qualidade premium de contas reais e ativas de redes sociais
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 bg-black/20 backdrop-blur-sm py-8">
        <div className="container mx-auto px-4 text-center">
          <p className="text-gray-400">© 2024 SMM Panel Brasil. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  )
}
