import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { previewServicesFromAPI } from '@/lib/preview-services-actions'
import { checkIsAdmin } from '@/lib/admin-actions'

export async function POST(request: NextRequest) {
  try {
    const { provider, onlyNew } = await request.json()

    // Verificar se o usuário é admin
    const isAdmin = await checkIsAdmin()
    if (!isAdmin) {
      return NextResponse.json(
        {
          success: false,
          error: "Acesso negado - apenas administradores",
        },
        { status: 403 }
      )
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
