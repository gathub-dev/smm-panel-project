"use server"

import { createClient } from "@supabase/supabase-js"
import { getExchangeRate } from "@/lib/currency-actions"
import { getSetting } from "@/lib/settings-actions"

// Cliente com service role para operações admin
function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  )
}

interface RecalculateResult {
  success: boolean
  message?: string
  error?: string
  data?: {
    servicesUpdated: number
    exchangeRate: number
    markup: number
  }
}

/**
 * Recalcular preços de todos os serviços baseado nas configurações atuais
 */
export async function recalculateAllServicesPrices(): Promise<RecalculateResult> {
  try {
    console.log(`💰 [recalculateAllServicesPrices] Iniciando recálculo de preços...`)
    
    // Buscar configurações atuais
    const markupResult = await getSetting('markup_percentage')
    const markup = parseFloat(markupResult.success ? markupResult.data?.value || '20' : '20')
    
    console.log(`📊 [recalculateAllServicesPrices] Markup configurado: ${markup}%`)
    
    // Buscar cotação atual
    const exchangeRate = await getExchangeRate()
    console.log(`💱 [recalculateAllServicesPrices] Cotação atual: ${exchangeRate}`)
    
    const supabase = createAdminClient()
    
    // Buscar todos os serviços ativos
    const { data: services, error: selectError } = await supabase
      .from('services')
      .select('id, provider_service_id, provider_rate, name')
      .eq('status', 'active')
      .not('provider_rate', 'is', null)
    
    if (selectError) {
      console.log(`❌ [recalculateAllServicesPrices] Erro ao buscar serviços:`, selectError)
      throw selectError
    }
    
    if (!services || services.length === 0) {
      return {
        success: false,
        error: "Nenhum serviço encontrado para recalcular"
      }
    }
    
    console.log(`🔢 [recalculateAllServicesPrices] Encontrados ${services.length} serviços para recalcular`)
    
    let updatedCount = 0
    
    // Recalcular preços de cada serviço
    for (const service of services) {
      try {
        const providerRateUSD = parseFloat(service.provider_rate) || 0
        
        if (providerRateUSD <= 0) {
          console.log(`⚠️ [recalculateAllServicesPrices] Pulando serviço ${service.id} - provider_rate inválido: ${providerRateUSD}`)
          continue
        }
        
        // Calcular novo preço
        const providerRateBRL = providerRateUSD * exchangeRate
        const finalRateBRL = providerRateBRL * (1 + markup / 100)
        
        console.log(`🔄 [recalculateAllServicesPrices] ${service.name}: $${providerRateUSD} → R$ ${finalRateBRL.toFixed(4)}`)
        
        // Atualizar serviço
        const { error: updateError } = await supabase
          .from('services')
          .update({
            rate: parseFloat(finalRateBRL.toFixed(4)),
            markup_value: markup,
            markup_type: 'percentage',
            exchange_rate: exchangeRate,
            provider_rate_brl: parseFloat(providerRateBRL.toFixed(4)),
            updated_at: new Date().toISOString()
          })
          .eq('id', service.id)
        
        if (updateError) {
          console.log(`❌ [recalculateAllServicesPrices] Erro ao atualizar serviço ${service.id}:`, updateError)
        } else {
          updatedCount++
        }
        
      } catch (serviceError) {
        console.log(`❌ [recalculateAllServicesPrices] Erro no serviço ${service.id}:`, serviceError)
      }
    }
    
    console.log(`✅ [recalculateAllServicesPrices] Concluído! ${updatedCount} serviços atualizados`)
    
    return {
      success: true,
      message: `${updatedCount} serviços tiveram seus preços recalculados`,
      data: {
        servicesUpdated: updatedCount,
        exchangeRate,
        markup
      }
    }
    
  } catch (error: any) {
    console.log(`❌ [recalculateAllServicesPrices] Erro geral:`, error)
    return { 
      success: false, 
      error: `Erro ao recalcular preços: ${error.message}` 
    }
  }
}

/**
 * Recalcular preços de serviços específicos
 */
export async function recalculateSpecificServicesPrices(serviceIds: string[]): Promise<RecalculateResult> {
  try {
    console.log(`💰 [recalculateSpecificServicesPrices] Recalculando ${serviceIds.length} serviços específicos...`)
    
    // Buscar configurações atuais
    const markupResult = await getSetting('markup_percentage')
    const markup = parseFloat(markupResult.success ? markupResult.data?.value || '20' : '20')
    
    // Buscar cotação atual
    const exchangeRate = await getExchangeRate()
    
    const supabase = createAdminClient()
    
    // Buscar serviços específicos
    const { data: services, error: selectError } = await supabase
      .from('services')
      .select('id, provider_service_id, provider_rate, name')
      .in('id', serviceIds)
      .not('provider_rate', 'is', null)
    
    if (selectError) throw selectError
    
    if (!services || services.length === 0) {
      return {
        success: false,
        error: "Nenhum serviço válido encontrado para recalcular"
      }
    }
    
    let updatedCount = 0
    
    // Recalcular preços
    for (const service of services) {
      const providerRateUSD = parseFloat(service.provider_rate) || 0
      
      if (providerRateUSD <= 0) continue
      
      const providerRateBRL = providerRateUSD * exchangeRate
      const finalRateBRL = providerRateBRL * (1 + markup / 100)
      
      const { error: updateError } = await supabase
        .from('services')
        .update({
          rate: parseFloat(finalRateBRL.toFixed(4)),
          markup_value: markup,
          markup_type: 'percentage',
          exchange_rate: exchangeRate,
          provider_rate_brl: parseFloat(providerRateBRL.toFixed(4)),
          updated_at: new Date().toISOString()
        })
        .eq('id', service.id)
      
      if (!updateError) updatedCount++
    }
    
    return {
      success: true,
      message: `${updatedCount} serviços específicos recalculados`,
      data: {
        servicesUpdated: updatedCount,
        exchangeRate,
        markup
      }
    }
    
  } catch (error: any) {
    return { 
      success: false, 
      error: `Erro ao recalcular serviços específicos: ${error.message}` 
    }
  }
}
