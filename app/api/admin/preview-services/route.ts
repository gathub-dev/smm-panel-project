import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { previewServicesFromAPI } from '@/lib/preview-services-actions'

export async function POST(request: NextRequest) {
  try {
    const { provider, onlyNew } = await request.json()

    // Verificar se usuário está autenticado
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({
        success: false,
        error: 'Usuário não autenticado'
      }, { status: 401 })
    }

    // Verificação de admin removida - qualquer usuário autenticado pode acessar

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
