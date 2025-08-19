"use server"

import { createClient } from "@supabase/supabase-js"

// Usar API gratuita para cotação USD/BRL
const EXCHANGE_API_URL = "https://api.exchangerate-api.com/v4/latest/USD"

/**
 * Buscar cotação atual USD → BRL
 */
export async function getCurrentExchangeRate(): Promise<number> {
  try {
    const response = await fetch(EXCHANGE_API_URL, {
      next: { revalidate: 3600 } // Cache por 1 hora
    })
    
    if (!response.ok) {
      throw new Error('Erro ao buscar cotação')
    }
    
    const data = await response.json()
    const brlRate = data.rates?.BRL
    
    if (!brlRate) {
      throw new Error('Cotação BRL não encontrada')
    }
    
    console.log(`💱 Cotação atual: 1 USD = ${brlRate} BRL`)
    return parseFloat(brlRate)
  } catch (error) {
    console.error('❌ Erro ao buscar cotação:', error)
    // Fallback para cotação padrão se API falhar
    return 5.50 // Valor aproximado como fallback
  }
}



/**
 * Salvar cotação no banco para cache
 */
export async function saveExchangeRate(rate: number) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  )

  try {
    const { error } = await supabase
      .from('exchange_rates')
      .upsert({
        currency_pair: 'USD_BRL',
        rate: rate,
        updated_at: new Date().toISOString()
      })

    if (error) throw error
    
    console.log(`💾 Cotação salva: ${rate}`)
    return { success: true }
  } catch (error) {
    console.error('❌ Erro ao salvar cotação:', error)
    return { error: `Erro ao salvar cotação: ${error}` }
  }
}

/**
 * Buscar cotação do cache (banco)
 */
export async function getCachedExchangeRate(): Promise<number | null> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  )

  try {
    const { data, error } = await supabase
      .from('exchange_rates')
      .select('rate, updated_at')
      .eq('currency_pair', 'USD_BRL')
      .order('updated_at', { ascending: false })
      .limit(1)
      .single()

    if (error || !data) return null

    // Verificar se a cotação não está muito antiga (mais de 1 hora)
    const updatedAt = new Date(data.updated_at)
    const now = new Date()
    const hoursDiff = (now.getTime() - updatedAt.getTime()) / (1000 * 60 * 60)

    if (hoursDiff > 1) {
      console.log('⏰ Cotação em cache muito antiga, buscando nova...')
      return null
    }

    console.log(`📋 Usando cotação do cache: ${data.rate}`)
    return data.rate
  } catch (error) {
    console.error('❌ Erro ao buscar cotação do cache:', error)
    return null
  }
}

/**
 * Buscar cotação (cache primeiro, depois API)
 */
export async function getExchangeRate(): Promise<number> {
  // Tentar cache primeiro
  const cachedRate = await getCachedExchangeRate()
  if (cachedRate) return cachedRate

  // Se não tem cache, buscar da API
  const currentRate = await getCurrentExchangeRate()
  
  // Salvar no cache
  await saveExchangeRate(currentRate)
  
  return currentRate
} 