import { NextRequest, NextResponse } from 'next/server'
import { getPublicServices } from '@/lib/public-service-actions'

export async function GET(request: NextRequest) {
  try {
    console.log('🌐 [API] Buscando serviços públicos...')
    
    const result = await getPublicServices()
    
    // Verificar se houve erro na função
    if ('error' in result) {
      console.error('❌ [API] Erro retornado pela função getPublicServices:', result.error)
      return NextResponse.json({
        success: false,
        error: result.error,
        services: []
      }, { status: 500 })
    }
    
    // Sucesso - extrair services do resultado
    const services = result.services || []
    console.log(`🌐 [API] Encontrados ${services.length} serviços públicos`)
    
    return NextResponse.json({
      success: true,
      services,
      count: services.length,
      pagination: result.pagination
    })
  } catch (error: any) {
    console.error('❌ [API] Erro ao buscar serviços públicos:', error)
    
    return NextResponse.json({
      success: false,
      error: error.message || 'Erro interno do servidor',
      services: []
    }, { status: 500 })
  }
}

