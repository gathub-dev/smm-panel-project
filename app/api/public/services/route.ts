import { NextRequest, NextResponse } from 'next/server'
import { getPublicServices } from '@/lib/public-service-actions'

export async function GET(request: NextRequest) {
  try {
    console.log('🌐 [API] Buscando serviços públicos...')
    
    const services = await getPublicServices()
    
    console.log(`🌐 [API] Encontrados ${services.length} serviços públicos`)
    
    return NextResponse.json({
      success: true,
      services,
      count: services.length
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

