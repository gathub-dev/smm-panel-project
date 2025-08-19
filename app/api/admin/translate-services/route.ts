import { NextRequest, NextResponse } from "next/server"
import { translateExistingServices, getTranslationStats } from "@/lib/service-actions"

/**
 * 🌍 API para tradução automática de serviços em segundo plano
 */
export async function POST(request: NextRequest) {
  try {
    const { batchSize = 50 } = await request.json()
    
    const result = await translateExistingServices(batchSize)
    
    return NextResponse.json(result)
  } catch (error) {
    return NextResponse.json(
      { error: `Erro na tradução: ${error}` },
      { status: 500 }
    )
  }
}

/**
 * Obter estatísticas de tradução
 */
export async function GET() {
  try {
    const stats = await getTranslationStats()
    
    return NextResponse.json(stats)
  } catch (error) {
    return NextResponse.json(
      { error: `Erro ao obter estatísticas: ${error}` },
      { status: 500 }
    )
  }
}
