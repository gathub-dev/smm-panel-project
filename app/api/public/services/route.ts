import { NextRequest, NextResponse } from 'next/server'
import { getPublicServices } from '@/lib/public-service-actions'

export async function GET(request: NextRequest) {
  try {
    
    const result = await getPublicServices()
    
    // Verificar se houve erro na função
    if ('error' in result) {
      return NextResponse.json({
        success: false,
        error: result.error,
        services: []
      }, { status: 500 })
    }
    
    // Sucesso - extrair services do resultado
    const services = result.services || []
    
    return NextResponse.json({
      success: true,
      services,
      count: services.length,
      pagination: result.pagination
    })
  } catch (error: any) {
        
    return NextResponse.json({
      success: false,
      error: error.message || 'Erro interno do servidor',
      services: []
    }, { status: 500 })
  }
}

