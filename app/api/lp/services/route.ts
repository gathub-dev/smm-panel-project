import { NextRequest, NextResponse } from 'next/server'
import { getLPServicesByVisiblePlatforms } from '@/lib/lp-platform-actions'

export async function GET(request: NextRequest) {
  try {
    
    const result = await getLPServicesByVisiblePlatforms()
    
    if (result.success) {
      
      return NextResponse.json({
        success: true,
        services: result.services || [],
        count: result.services?.length || 0
      })
    } else {
      
      return NextResponse.json({
        success: false,
        error: result.error || 'Erro interno do servidor',
        services: []
      }, { status: 500 })
    }
  } catch (error: any) {
      
    return NextResponse.json({
      success: false,
      error: error.message || 'Erro interno do servidor',
      services: []
    }, { status: 500 })
  }
}
