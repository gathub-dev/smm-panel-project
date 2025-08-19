import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 Preview API - Início da requisição')
    const { provider } = await request.json()
    console.log('📝 Provider recebido:', provider)

    // Verificar se é admin
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({
        success: false,
        error: 'Usuário não autenticado'
      }, { status: 401 })
    }

    // Temporariamente removendo verificação de admin para debug
    console.log('⚠️ MODO DEBUG: Pulando verificação de admin')
    
    // const { data: userData } = await supabase
    //   .from("users")
    //   .select("role")
    //   .eq("id", user.id)
    //   .single()

    // if (userData?.role !== "admin") {
    //   return NextResponse.json({
    //     success: false,
    //     error: 'Acesso negado - apenas administradores'
    //   }, { status: 403 })
    // }
    
    // Buscar chave da API
    console.log('🔍 Buscando chave de API para provider:', provider)
    const { data: apiKey, error: apiKeyError } = await supabase
      .from('api_keys')
      .select('*')
      .eq('provider', provider)
      .single()
    
    console.log('📊 Resultado da busca da chave:', { apiKey: apiKey ? 'encontrada' : 'não encontrada', error: apiKeyError })
    
    if (!apiKey) {
      console.log('❌ Chave de API não encontrada para provider:', provider)
      return NextResponse.json({
        success: false,
        error: `Chave de API do ${provider.toUpperCase()} não encontrada ou inativa`
      }, { status: 400 })
    }
    
    console.log('✅ Chave de API encontrada para provider:', provider)
    
    // Fazer requisição para a API do provedor
    const apiUrl = apiKey.api_url || (provider === 'mtp' ? 'https://morethanpanel.com/api/v2' : 'https://justanotherpanel.com/api/v2')
    console.log('🌐 URL da API:', apiUrl)
    
    const body = new URLSearchParams({
      key: apiKey.api_key,
      action: 'services'
    }).toString()
    
    console.log('📤 Fazendo requisição para a API externa...')
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'SMM-Panel-Preview/1.0'
      },
      body: body
    })
    
    console.log('📥 Resposta recebida - Status:', response.status)
    
    if (!response.ok) {
      throw new Error(`Erro HTTP: ${response.status} ${response.statusText}`)
    }
    
    const responseText = await response.text()
    console.log('📄 Resposta da API (primeiros 200 chars):', responseText.substring(0, 200))
    
    let services
    try {
      services = JSON.parse(responseText)
      console.log('✅ JSON parseado com sucesso - Total de serviços:', Array.isArray(services) ? services.length : 'não é array')
    } catch (parseError) {
      console.log('❌ Erro ao parsear JSON:', parseError)
      return NextResponse.json({
        success: false,
        error: 'Resposta inválida da API do provedor'
      }, { status: 500 })
    }
    
    if (!Array.isArray(services)) {
      console.log('❌ Resposta não é um array:', typeof services)
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
    
    console.log('🎉 Processamento concluído - Enviando resposta com', processedServices.length, 'serviços')
    
    return NextResponse.json({
      success: true,
      services: processedServices,
      count: processedServices.length,
      provider: provider.toUpperCase()
    })
    
  } catch (error: any) {
    console.log('💥 Erro na API de preview:', error)
    return NextResponse.json({
      success: false,
      error: error.message || 'Erro interno do servidor'
    }, { status: 500 })
  }
}
