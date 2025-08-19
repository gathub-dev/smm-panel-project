import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { previewServicesFromAPI } from '@/lib/preview-services-actions'

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 Preview API - Início da requisição')
    const { provider, onlyNew } = await request.json()
    console.log('📝 Parâmetros recebidos:', { provider, onlyNew })

    // Verificar se é admin
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({
        success: false,
        error: 'Usuário não autenticado'
      }, { status: 401 })
    }

    // Usar a função de preview que já tem todos os filtros implementados
    const result = await previewServicesFromAPI({
      provider: provider,
      maxServices: undefined, // Sem limite - mostrar todos os serviços
      onlyNew: onlyNew
    })
    
    if (!result.success) {
      return NextResponse.json({
        success: false,
        error: result.error
      }, { status: 500 })
    }
    
    // Converter para o formato esperado pelo componente
    const processedServices = (result.services || []).map(service => ({
      service: service.id,
      name: service.name,
      type: service.status, // Usando status como type para compatibilidade
      category: service.category,
      rate: service.rate.toString(),
      min: service.min_quantity.toString(),
      max: service.max_quantity.toString(),
      dripfeed: false,
      refill: false,
      cancel: false
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
