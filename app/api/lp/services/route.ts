import { NextRequest, NextResponse } from 'next/server'
import { getLPServicesByVisiblePlatforms } from '@/lib/lp-platform-actions'

export async function GET(request: NextRequest) {
  try {
    console.log('🛍️ [API-LP] Buscando serviços das plataformas visíveis na LP...')
    
    const result = await getLPServicesByVisiblePlatforms()
    
    if (result.success) {
      console.log(`🛍️ [API-LP] Retornando ${result.services?.length || 0} serviços`)
      
      return NextResponse.json({
        success: true,
        services: result.services || [],
        count: result.services?.length || 0
      })
    } else {
      console.error('❌ [API-LP] Erro:', result.error)
      
      return NextResponse.json({
        success: false,
        error: result.error || 'Erro interno do servidor',
        services: []
      }, { status: 500 })
    }
  } catch (error: any) {
    console.error('❌ [API-LP] Erro geral:', error)
    
    return NextResponse.json({
      success: false,
      error: error.message || 'Erro interno do servidor',
      services: []
    }, { status: 500 })
  }
}
