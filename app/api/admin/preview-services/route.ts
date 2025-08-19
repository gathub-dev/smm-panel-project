import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const { provider } = await request.json()

    // Verificar se é admin
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({
        success: false,
        error: 'Usuário não autenticado'
      }, { status: 401 })
    }

    const { data: userData } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single()

    if (userData?.role !== "admin") {
      return NextResponse.json({
        success: false,
        error: 'Acesso negado - apenas administradores'
      }, { status: 403 })
    }
    
    // Buscar chave da API
        const { data: apiKey } = await (supabase
      .from('api_keys')
      .select('*')
      .eq('provider', provider)
      .single())
    
    if (!apiKey) {
      return NextResponse.json({
        success: false,
        error: `Chave de API do ${provider.toUpperCase()} não encontrada ou inativa`
      }, { status: 400 })
    }
    
    // Fazer requisição para a API do provedor
    const apiUrl = apiKey.api_url || (provider === 'mtp' ? 'https://morethanpanel.com/api/v2' : 'https://justanotherpanel.com/api/v2')
    
    const body = new URLSearchParams({
      key: apiKey.api_key,
      action: 'services'
    }).toString()
    
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'SMM-Panel-Preview/1.0'
      },
      body: body
    })
    
    if (!response.ok) {
      throw new Error(`Erro HTTP: ${response.status} ${response.statusText}`)
    }
    
    const responseText = await response.text()
    
    let services
    try {
      services = JSON.parse(responseText)
    } catch (parseError) {
      return NextResponse.json({
        success: false,
        error: 'Resposta inválida da API do provedor'
      }, { status: 500 })
    }
    
    if (!Array.isArray(services)) {
      return NextResponse.json({
        success: false,
        error: 'Formato de resposta inválido da API'
      }, { status: 500 })
    }
    
    // Processar serviços para garantir campos obrigatórios
    const processedServices = services.map(service => ({
      service: service.service || service.id || 'unknown',
      name: service.name || 'Serviço sem nome',
      type: service.type || 'Default',
      category: service.category || 'Sem categoria',
      rate: service.rate || '0',
      min: service.min || '1',
      max: service.max || '1000',
      dripfeed: service.dripfeed || false,
      refill: service.refill || false,
      cancel: service.cancel || false
    }))
    
    return NextResponse.json({
      success: true,
      services: processedServices,
      count: processedServices.length,
      provider: provider.toUpperCase()
    })
    
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message || 'Erro interno do servidor'
    }, { status: 500 })
  }
}
