import { NextResponse, type NextRequest } from "next/server"

export async function updateSession(request: NextRequest) {
  // Simplesmente passar a requisição adiante por enquanto
  // Isso resolve o problema do edge runtime
  return NextResponse.next()
}