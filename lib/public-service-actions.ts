"use server"

import { createClient } from "@supabase/supabase-js"
import { getExchangeRate } from "@/lib/currency-actions"
import { getSetting } from "@/lib/settings-actions"

/**
 * Buscar serviços públicos para exibição aos clientes
 */
export async function getPublicServices(filters?: {
  category?: string
  search?: string
  page?: number
  limit?: number
}) {
  // Usar service role para garantir acesso aos dados
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
    const page = filters?.page || 1
    const limit = filters?.limit || 50
    const offset = (page - 1) * limit

    let query = supabase
      .from('services_with_combined_category')
      .select(`
        id,
        provider,
        provider_service_id,
        name,
        description,
        category,
        platform,
        shop_category,
        combined_category,
        provider_rate,
        rate,
        markup_type,
        markup_value,
        min_quantity,
        max_quantity,
        status,
        created_at,
        featured,
        lp_visible,
        quantities
      `)
      .eq('status', 'active') // Apenas serviços ativos
      .order('created_at', { ascending: false })

    // Aplicar filtros
    if (filters?.category && filters.category !== 'Todos') {
      query = query.eq('category', filters.category)
    }

    if (filters?.search) {
      query = query.ilike('name', `%${filters.search}%`)
    }

    // Executar query com paginação
    const { data: services, error: servicesError } = await query
      .range(offset, offset + limit - 1)

    if (servicesError) {
      throw servicesError
    }

    // Buscar configurações atuais para cálculo dinâmico
    const markupResult = await getSetting('markup_percentage')
    const markup = parseFloat(markupResult.success ? markupResult.data?.value || '20' : '20')
    const exchangeRate = await getExchangeRate()
    

    // Recalcular preços dinamicamente
    const servicesWithDynamicPrices = services?.map(service => {
      const providerRateUSD = parseFloat(service.provider_rate) || 0
      
      if (providerRateUSD > 0) {
        const providerRateBRL = providerRateUSD * exchangeRate
        
        // LÓGICA HIERÁRQUICA DE MARKUP:
        // 1. Se serviço tem markup personalizado (diferente do padrão) → usa esse
        // 2. Se não tem ou é igual ao padrão antigo → usa padrão atual
        const serviceMarkupType = service.markup_type || 'percentage'
        const serviceMarkupValue = parseFloat(service.markup_value) || 0
        
        // Considerar como padrão se:
        // - Não tem markup_value definido (null/0)
        // - Ou tem markup igual aos padrões antigos (20, 100)
        // - Ou é tipo percentage e valor é um dos padrões comuns
        const isUsingDefault = !serviceMarkupValue || 
                              serviceMarkupValue === 20 || 
                              serviceMarkupValue === 100 ||
                              (serviceMarkupType === 'percentage' && [20, 25, 30, 50].includes(serviceMarkupValue))
        
        const finalMarkupValue = isUsingDefault ? markup : serviceMarkupValue
        const hasCustomMarkup = !isUsingDefault
        
        let finalRateBRL
        
        if (hasCustomMarkup && serviceMarkupType === 'fixed') {
          // Valor fixo em BRL - PREÇO FINAL EXATO
          finalRateBRL = finalMarkupValue
        } else {
          // Porcentagem (personalizada ou padrão)
          finalRateBRL = providerRateBRL * (1 + finalMarkupValue / 100)
        }
        
        return {
          ...service,
          provider_rate_brl: parseFloat(providerRateBRL.toFixed(4)), // Preço original em BRL (dinâmico)
          rate: parseFloat(finalRateBRL.toFixed(4)), // Preço final em BRL (dinâmico)
          markup_value: finalMarkupValue, // Markup usado (personalizado ou padrão)
          markup_type: serviceMarkupType, // Tipo do markup
          exchange_rate: exchangeRate // Taxa atual
        }
      }
      
      return service
    }) || []

    // Contar total para paginação
    let countQuery = supabase
      .from('services')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active')

    if (filters?.category && filters.category !== 'Todos') {
      countQuery = countQuery.eq('category', filters.category)
    }

    if (filters?.search) {
      countQuery = countQuery.ilike('name', `%${filters.search}%`)
    }

    const { count: totalCount, error: countError } = await countQuery

    if (countError) {
      throw countError
    }

    return {
      success: true,
      services: servicesWithDynamicPrices,
      pagination: {
        page,
        limit,
        total: totalCount || 0,
        totalPages: Math.ceil((totalCount || 0) / limit)
      }
    }
      } catch (error) {
    return { error: `Erro ao buscar serviços: ${error}` }
  }
}

/**
 * Buscar categorias públicas
 */
export async function getPublicCategories() {
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
    const { data: services, error } = await supabase
      .from('services')
      .select('category')
      .eq('status', 'active')

    if (error) throw error

    // Obter categorias únicas
    const categories = [...new Set(services?.map(s => s.category).filter(Boolean))] as string[]
    
    return {
      success: true,
      categories: ['Todos', ...categories.sort()]
    }
  } catch (error) {
    return { error: `Erro ao buscar categorias: ${error}` }
  }
} 