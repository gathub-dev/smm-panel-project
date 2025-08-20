import { NextRequest, NextResponse } from "next/server"
import { translateExistingServices, getTranslationStats } from "@/lib/service-actions"
import { checkIsAdmin } from "@/lib/admin-actions"

/**
 * 🌍 API para tradução automática de serviços em segundo plano
 */
export async function POST(request: NextRequest) {
  try {
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

    const stats = await getTranslationStats()
    
    return NextResponse.json(stats)
  } catch (error) {
    return NextResponse.json(
      { error: `Erro ao obter estatísticas: ${error}` },
      { status: 500 }
    )
  }
}
