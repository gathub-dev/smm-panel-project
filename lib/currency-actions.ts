"use server"

import { createClient } from "@supabase/supabase-js"

// URLs das APIs de câmbio
const EXCHANGE_APIS = {
  "exchangerate-api": "https://api.exchangerate-api.com/v4/latest/USD",
  "fixer": "https://api.fixer.io/latest?base=USD&symbols=BRL",
  "currencylayer": "https://api.currencylayer.com/live?source=USD&currencies=BRL"
}

/**
 * Buscar configuração do sistema
 */
async function getSetting(key: string): Promise<string | null> {
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
    console.log(`🔍 [getSetting] Buscando configuração: ${key}`)
    
    const { data, error } = await supabase
      .from('settings')
      .select('value')
      .eq('key', key)
      .single()

    if (error || !data) {
      console.log(`⚠️ [getSetting] Configuração ${key} não encontrada`)
      return null
    }
    
    console.log(`✅ [getSetting] ${key} = ${data.value}`)
    return data.value
  } catch (error) {
    console.error(`❌ [getSetting] Erro ao buscar configuração ${key}:`, error)
    return null
  }
}

/**
 * Salvar configuração no sistema
 */
async function saveSetting(key: string, value: string): Promise<void> {
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
    await supabase
      .from('settings')
      .upsert({
        key,
        value,
        updated_at: new Date().toISOString()
      })
  } catch (error) {
    console.error(`❌ Erro ao salvar configuração ${key}:`, error)
  }
}

/**
 * Buscar cotação da API externa
 */
async function fetchFromAPI(provider: string, apiKey?: string, timeout: number = 10): Promise<number> {
  const apiUrl = EXCHANGE_APIS[provider as keyof typeof EXCHANGE_APIS]
  if (!apiUrl) {
    throw new Error(`Provedor de API inválido: ${provider}`)
  }

  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeout * 1000)

    let url = apiUrl
    if (provider === "fixer" && apiKey) {
      url += `&access_key=${apiKey}`
    } else if (provider === "currencylayer" && apiKey) {
      url += `&access_key=${apiKey}`
    }

    const response = await fetch(url, {
      signal: controller.signal,
      next: { revalidate: 3600 } // Cache por 1 hora
    })
    
    clearTimeout(timeoutId)
    
    if (!response.ok) {
      throw new Error(`Erro HTTP: ${response.status}`)
    }
    
    const data = await response.json()
    let brlRate: number

    // Processar resposta baseada no provedor
    switch (provider) {
      case "exchangerate-api":
        brlRate = data.rates?.BRL
        break
      case "fixer":
        brlRate = data.rates?.BRL
        break
      case "currencylayer":
        brlRate = data.quotes?.USDBRL
        break
      default:
        throw new Error(`Provedor não suportado: ${provider}`)
    }
    
    if (!brlRate || isNaN(brlRate)) {
      throw new Error('Cotação BRL não encontrada ou inválida')
    }
    
    console.log(`💱 Cotação da API (${provider}): 1 USD = ${brlRate} BRL`)
    return parseFloat(brlRate.toFixed(4))
  } catch (error) {
    console.error(`❌ Erro ao buscar cotação da API ${provider}:`, error)
    throw error
  }
}

/**
 * Buscar cotação atual USD → BRL
 */
export async function getCurrentExchangeRate(): Promise<number> {
  try {
    console.log(`💱 [getCurrentExchangeRate] Iniciando busca da cotação...`)
    
    // Buscar configurações simplificadas
    const currencyMode = await getSetting('currency_mode') || 'manual'
    const fallbackRate = parseFloat(await getSetting('usd_brl_rate') || '5.50')
    
    console.log(`💱 [getCurrentExchangeRate] Modo: ${currencyMode}, Fallback: ${fallbackRate}`)
    
    if (currencyMode === 'manual') {
      // Usar valor manual
      console.log(`💱 Usando cotação manual: 1 USD = ${fallbackRate} BRL`)
      return fallbackRate
    }

    // Usar API automática
    console.log(`💱 [getCurrentExchangeRate] Modo automático, buscando da API...`)
    
    try {
      const rate = await fetchFromAPI('exchangerate-api', '', 10)
      
      console.log(`💱 [getCurrentExchangeRate] Cotação da API: ${rate}`)
      
      // Salvar timestamp da última atualização nas configurações
      await saveSetting('currency_last_update', new Date().toISOString())
      
      return rate
    } catch (apiError) {
      console.warn(`⚠️ [getCurrentExchangeRate] API falhou, usando fallback: ${fallbackRate}`)
      return fallbackRate
    }
  } catch (error) {
    console.error('❌ [getCurrentExchangeRate] Erro geral:', error)
    // Fallback final
    return 5.50
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
  try {
    console.log(`💰 [getExchangeRate] Iniciando busca da taxa de câmbio...`)
    
    const currencyMode = await getSetting('currency_mode') || 'manual'
    
    console.log(`💰 [getExchangeRate] Modo configurado: ${currencyMode}`)
    
    if (currencyMode === 'manual') {
      // Se é manual, sempre usar o valor das configurações
      return await getCurrentExchangeRate()
    }

    // Para modo automático, verificar cache primeiro
    console.log(`💰 [getExchangeRate] Modo automático, verificando cache...`)
    
  const cachedRate = await getCachedExchangeRate()
    if (cachedRate) {
      console.log(`💰 [getExchangeRate] Usando taxa do cache: ${cachedRate}`)
      return cachedRate
    }

    // Se não tem cache, buscar nova cotação
    console.log(`💰 [getExchangeRate] Cache vazio, buscando nova cotação...`)
  const currentRate = await getCurrentExchangeRate()
  
    // Salvar no cache se for modo automático
    if (currencyMode === 'auto') {
  await saveExchangeRate(currentRate)
    }
  
  return currentRate
  } catch (error) {
    console.error('❌ [getExchangeRate] Erro ao buscar cotação:', error)
    // Fallback final
    const fallbackRate = parseFloat(await getSetting('usd_brl_rate') || '5.50')
    return fallbackRate
  }
}

/**
 * Forçar atualização da cotação (ignora cache)
 */
export async function forceUpdateExchangeRate(): Promise<{ success: boolean, rate?: number, error?: string }> {
  try {
    const sourceType = await getSetting('currency_source_type') || 'manual'
    
    if (sourceType === 'manual') {
      const manualRate = await getSetting('usd_brl_manual_rate') || '5.50'
      const rate = parseFloat(manualRate)
      return { success: true, rate }
    }

    // Forçar busca da API
    const rate = await getCurrentExchangeRate()
    
    // Salvar no cache
    await saveExchangeRate(rate)
    
    return { success: true, rate }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

/**
 * Obter informações sobre a última atualização
 */
export async function getExchangeRateInfo(): Promise<{
  rate: number
  source: 'manual' | 'api' | 'cache'
  lastUpdate?: string
  provider?: string
}> {
  try {
    console.log(`📊 [getExchangeRateInfo] Buscando informações da cotação...`)
    
    const currencyMode = await getSetting('currency_mode') || 'manual'
    const rate = await getExchangeRate()
    
    console.log(`📊 [getExchangeRateInfo] Modo: ${currencyMode}, Taxa: ${rate}`)
    
    if (currencyMode === 'manual') {
      return {
        rate,
        source: 'manual'
      }
    }

    // Modo automático
    const lastUpdate = await getSetting('currency_last_update') || undefined
    const provider = 'exchangerate-api' // Usando sempre a API gratuita
    
    // Verificar se está usando cache
    const cachedRate = await getCachedExchangeRate()
    const source = cachedRate ? 'cache' : 'api'

    console.log(`📊 [getExchangeRateInfo] Resultado: source=${source}, lastUpdate=${lastUpdate}`)

    return {
      rate,
      source,
      lastUpdate,
      provider
    }
  } catch (error) {
    console.error('❌ [getExchangeRateInfo] Erro ao obter informações da cotação:', error)
    return {
      rate: 5.50,
      source: 'manual'
    }
  }
} 