"use server"

import { createServerActionClient } from "@supabase/auth-helpers-nextjs"
import { createClient } from "@supabase/supabase-js"
import { cookies } from "next/headers"
import { revalidatePath } from "next/cache"
import { APIManager } from "./providers/api-manager"
import { getExchangeRate } from "./currency-actions"
import { convertUsdToBrl, formatBRL, formatUSD } from "./currency-utils"
import { translateCategory, getBothCategoryVersions } from "./category-translations"
import { getSetting } from "./settings-actions"

/**
 * Sincronizar todos os serviços dos provedores
 */
export async function syncAllServices() {
  console.log('🚀 INICIANDO SINCRONIZAÇÃO DE SERVIÇOS')
  console.log('=' .repeat(50))
  
  const supabase = createServerActionClient({ cookies })

  try {
    // Verificar se está autenticado
    console.log('👤 Verificando autenticação...')
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      console.log('❌ Usuário não autenticado')
      return { error: "Não autenticado" }
    }
    console.log('✅ Usuário autenticado:', user.id)

    // Obter chaves de API ativas
    console.log('🔑 Buscando chaves de API ativas...')
    const { data: apiKeys, error: keysError } = await supabase
      .from('api_keys')
      .select('*')
      .eq('is_active', true)

    if (keysError) {
      console.log('❌ Erro ao buscar chaves:', keysError)
      return { error: `Erro ao buscar chaves: ${keysError.message}` }
    }

    if (!apiKeys || apiKeys.length === 0) {
      console.log('⚠️ Nenhuma chave de API ativa encontrada')
      return { error: "Nenhuma chave de API configurada. Configure as chaves primeiro." }
    }

    console.log(`📊 Encontradas ${apiKeys.length} chaves ativas:`)
    apiKeys.forEach(key => {
      console.log(`   • ${key.provider.toUpperCase()}: ${key.api_key.substring(0, 8)}...`)
    })

    const mtpKey = apiKeys.find(key => key.provider === 'mtp')?.api_key
    const japKey = apiKeys.find(key => key.provider === 'jap')?.api_key

    console.log('🔧 Inicializando APIManager...')
    const apiManager = new APIManager(mtpKey, japKey)

    // Criar cliente Supabase com service role para operações administrativas
    const adminSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    let totalSynced = 0

    // Sincronizar MTP se disponível
    if (mtpKey) {
      console.log('\n🔄 SINCRONIZANDO MTP...')
      try {
        console.log('📡 Fazendo requisição para MTP...')
        const mtpServices = await apiManager.getServices('mtp')
        console.log(`📊 MTP retornou ${mtpServices.length} serviços`)
        
        if (mtpServices.length > 0) {
          console.log('📝 Primeiros 3 serviços MTP:')
          mtpServices.slice(0, 3).forEach((service, i) => {
            console.log(`   ${i+1}. ID: ${service.service}, Nome: ${service.name}, Preço: $${service.rate}`)
          })
        }

        const synced = await syncServicesFromProvider('mtp', mtpServices, adminSupabase)
        console.log(`✅ MTP: ${synced} serviços sincronizados`)
        totalSynced += synced
      } catch (error) {
        console.log('❌ Erro ao sincronizar MTP:', error)
        console.log('Stack trace:', error instanceof Error ? error.stack : 'N/A')
      }
    } else {
      console.log('⚠️ Chave MTP não configurada - pulando')
    }

    // Sincronizar JAP se disponível
    if (japKey) {
      console.log('\n🔄 SINCRONIZANDO JAP...')
      try {
        console.log('📡 Fazendo requisição para JAP...')
        const japServices = await apiManager.getServices('jap')
        console.log(`📊 JAP retornou ${japServices.length} serviços`)
        
        if (japServices.length > 0) {
          console.log('📝 Primeiros 3 serviços JAP:')
          japServices.slice(0, 3).forEach((service, i) => {
            console.log(`   ${i+1}. ID: ${service.service}, Nome: ${service.name}, Preço: $${service.rate}`)
          })
        }

        const synced = await syncServicesFromProvider('jap', japServices, adminSupabase)
        console.log(`✅ JAP: ${synced} serviços sincronizados`)
        totalSynced += synced
      } catch (error) {
        console.log('❌ Erro ao sincronizar JAP:', error)
        console.log('Stack trace:', error instanceof Error ? error.stack : 'N/A')
      }
    } else {
      console.log('⚠️ Chave JAP não configurada - pulando')
    }

    console.log('\n🏁 SINCRONIZAÇÃO CONCLUÍDA')
    console.log(`📊 Total sincronizado: ${totalSynced} serviços`)
    
    revalidatePath("/dashboard/admin")
    return { 
      success: true, 
      synced: totalSynced,
      message: `${totalSynced} serviços sincronizados com sucesso`
    }
  } catch (error) {
    console.error('💥 ERRO FATAL na sincronização:', error)
    console.error('Stack trace:', error instanceof Error ? error.stack : 'N/A')
    return { error: `Erro na sincronização: ${error instanceof Error ? error.message : String(error)}` }
  }
}

/**
 * Sincronizar serviços de um provedor específico
 */
async function syncServicesFromProvider(
  provider: 'mtp' | 'jap', 
  services: any[], 
  supabase: any
): Promise<number> {
  console.log(`\n📝 Salvando ${services.length} serviços do ${provider.toUpperCase()} no banco...`)
  
  // Buscar cotação atual USD → BRL
  console.log('💱 Buscando cotação USD → BRL...')
  const exchangeRate = await getExchangeRate()
  console.log(`💰 Cotação atual: 1 USD = ${exchangeRate} BRL`)
  
  let syncedCount = 0

  for (const service of services) {
    try {
      console.log(`   💾 Salvando serviço ${service.service}: ${service.name}`)
      
      // Verificar se já existe
      const { data: existing } = await supabase
        .from('services')
        .select('id')
        .eq('provider_service_id', service.service)
        .eq('provider', provider)
        .single()

      // Processar categoria bilíngue
      const originalCategory = service.category || 'Other'
      const categoryVersions = getBothCategoryVersions(originalCategory)
      
      // Converter preços para BRL
      const providerRateUSD = parseFloat(service.rate)
      const providerRateBRL = convertUsdToBrl(providerRateUSD, exchangeRate)
      const finalRateBRL = providerRateBRL * 1.2 // 20% markup padrão

      const serviceData = {
        provider,
        provider_service_id: service.service,
        name: service.name,
        description: service.description || '',
        category: categoryVersions.pt, // Categoria em português
        provider_rate: providerRateUSD, // Preço original em USD
        rate: finalRateBRL, // Preço final em BRL
        markup_type: 'percentage',
        markup_value: 20,
        min_quantity: parseInt(service.min) || 1,
        max_quantity: parseInt(service.max) || 10000,
        status: 'active',
        sync_enabled: true,
        last_sync: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      if (existing) {
        // Atualizar existente
        const { error } = await supabase
          .from('services')
          .update(serviceData)
          .eq('id', existing.id)

        if (error) {
          console.log(`     ❌ Erro ao atualizar: ${error.message}`)
        } else {
          console.log(`     ✅ Atualizado`)
          syncedCount++
        }
      } else {
        // Criar novo
        const { error } = await supabase
          .from('services')
          .insert({
            ...serviceData,
            created_at: new Date().toISOString()
          })

        if (error) {
          console.log(`     ❌ Erro ao criar: ${error.message}`)
        } else {
          console.log(`     ✅ Criado`)
          syncedCount++
        }
      }
    } catch (error) {
      console.log(`     💥 Erro fatal no serviço ${service.service}:`, error)
    }
  }

  console.log(`📊 ${provider.toUpperCase()}: ${syncedCount}/${services.length} serviços salvos`)
  return syncedCount
}

/**
 * Atualizar configurações de um serviço
 */
export async function updateService(serviceId: string, data: {
  name?: string
  description?: string
  markup_type?: 'percentage' | 'fixed'
  markup_value?: number
  status?: 'active' | 'inactive'
  category_id?: string
}) {
  const supabase = createServerActionClient({ cookies })

  try {
    // Verificar se é admin
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: "Não autenticado" }

    const { data: userData } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single()

    if (userData?.role !== "admin") {
      return { error: "Acesso negado" }
    }

    const { error } = await supabase
      .from('services')
      .update({
        ...data,
        updated_at: new Date().toISOString()
      })
      .eq('id', serviceId)

    if (error) throw error

    revalidatePath("/dashboard/admin")
    revalidatePath("/dashboard/services")

    return { success: true }
  } catch (error) {
    return { error: `Erro ao atualizar serviço: ${error}` }
  }
}

/**
 * Ativar/desativar serviço
 */
export async function toggleServiceStatus(serviceId: string, status: 'active' | 'inactive') {
  return updateService(serviceId, { status })
}

/**
 * Definir markup em lote para múltiplos serviços
 */
export async function setBulkMarkup(
  serviceIds: string[],
  markupType: 'percentage' | 'fixed',
  markupValue: number
) {
  const supabase = createServerActionClient({ cookies })

  try {
    // Verificar se é admin
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: "Não autenticado" }

    const { data: userData } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single()

    if (userData?.role !== "admin") {
      return { error: "Acesso negado" }
    }

    // Atualizar todos os serviços selecionados
    for (const serviceId of serviceIds) {
      await supabase
        .from('services')
        .update({
          markup_type: markupType,
          markup_value: markupValue,
          updated_at: new Date().toISOString()
        })
        .eq('id', serviceId)
    }

    revalidatePath("/dashboard/admin")
    revalidatePath("/dashboard/services")

    return { success: true, updated: serviceIds.length }
  } catch (error) {
    return { error: `Erro ao definir markup: ${error}` }
  }
}

/**
 * Obter estatísticas dos serviços
 */
export async function getServiceStats() {
  // Usar service role para garantir acesso completo aos dados
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
    // Total de serviços
    const { count: totalServices } = await supabase
      .from('services')
      .select('*', { count: 'exact', head: true })

    // Serviços ativos
    const { count: activeServices } = await supabase
      .from('services')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active')

    // Serviços por provedor
    const { data: providerStats } = await supabase
      .from('services')
      .select('provider')
      .eq('status', 'active')

    const mtpCount = providerStats?.filter(s => s.provider === 'mtp').length || 0
    const japCount = providerStats?.filter(s => s.provider === 'jap').length || 0

    // Última sincronização
    const { data: lastSync } = await supabase
      .from('services')
      .select('last_sync')
      .order('last_sync', { ascending: false })
      .limit(1)
      .single()

    return {
      success: true,
      stats: {
        total: totalServices || 0,
        active: activeServices || 0,
        inactive: (totalServices || 0) - (activeServices || 0),
        mtp: mtpCount,
        jap: japCount,
        lastSync: lastSync?.last_sync
      }
    }
  } catch (error) {
    return { error: `Erro ao obter estatísticas: ${error}` }
  }
}

/**
 * Testar conectividade com APIs
 */
export async function testAPIConnections() {
  // Usar service role para garantir acesso completo
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

    // Obter chaves de API
    const { data: apiKeys } = await supabase
      .from("api_keys")
      .select("*")
      .eq("is_active", true)

    if (!apiKeys || apiKeys.length === 0) {
      return { error: "Nenhuma chave de API configurada" }
    }

    const mtpKey = apiKeys.find(key => key.provider === 'mtp')?.api_key
    const japKey = apiKeys.find(key => key.provider === 'jap')?.api_key

    const apiManager = new APIManager(mtpKey, japKey)
    const results = await apiManager.testAllConnections()

    return { success: true, connections: results }
  } catch (error) {
    return { error: `Erro ao testar conexões: ${error}` }
  }
}

/**
 * Obter lista de serviços com filtros
 */
export async function getServicesList(filters?: {
  provider?: string
  status?: string
  category?: string
  search?: string
  page?: number
  limit?: number
}) {
  // Usar service role para garantir acesso completo
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
      .from('services')
      .select(`
        id,
        provider,
        provider_service_id,
        name,
        description,
        category,
        provider_rate,
        rate,
        markup_type,
        markup_value,
        min_quantity,
        max_quantity,
        status,
        sync_enabled,
        last_sync,
        created_at,
        updated_at
      `)
      .order('created_at', { ascending: false })

    // Aplicar filtros
    if (filters?.provider && filters.provider !== 'all') {
      query = query.eq('provider', filters.provider)
    }

    if (filters?.status && filters.status !== 'all') {
      query = query.eq('status', filters.status)
    }

    if (filters?.category && filters.category !== 'all') {
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
    console.log('💰 [getServicesList] Buscando configurações para cálculo dinâmico...')
    const markupResult = await getSetting('markup_percentage')
    const markup = parseFloat(markupResult.success ? markupResult.data?.value || '20' : '20')
    const exchangeRate = await getExchangeRate()
    
    console.log(`💱 [getServicesList] Cotação: ${exchangeRate}, Markup: ${markup}%`)

    // Recalcular preços dinamicamente para admin
    const servicesWithDynamicPrices = services?.map(service => {
      const providerRateUSD = parseFloat(service.provider_rate) || 0
      
      if (providerRateUSD > 0) {
        const providerRateBRL = providerRateUSD * exchangeRate
        const finalRateBRL = providerRateBRL * (1 + markup / 100)
        
        return {
          ...service,
          provider_rate_brl: parseFloat(providerRateBRL.toFixed(4)), // Preço original em BRL (dinâmico)
          rate: parseFloat(finalRateBRL.toFixed(4)), // Preço final em BRL (dinâmico)
          markup_value: markup, // Markup atual
          exchange_rate: exchangeRate // Taxa atual
        }
      }
      
      return service
    }) || []

    // Contar total para paginação
    let countQuery = supabase
      .from('services')
      .select('*', { count: 'exact', head: true })

    if (filters?.provider && filters.provider !== 'all') {
      countQuery = countQuery.eq('provider', filters.provider)
    }

    if (filters?.status && filters.status !== 'all') {
      countQuery = countQuery.eq('status', filters.status)
    }

    if (filters?.category && filters.category !== 'all') {
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
 * Obter categorias únicas dos serviços
 */
export async function getServiceCategories() {
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

    // Criar mapa de categorias únicas
    const categoryMap = new Map<string, { en: string; pt: string }>()
    
    services?.forEach(service => {
      if (service.category) {
        // Como estamos salvando em PT, vamos detectar o idioma
        const categoryVersions = getBothCategoryVersions(service.category)
        categoryMap.set(service.category, categoryVersions)
      }
    })

    const categories = Array.from(categoryMap.values()).sort((a, b) => a.pt.localeCompare(b.pt))
    
    return {
      success: true,
      categories: categories
    }
  } catch (error) {
    return { error: `Erro ao buscar categorias: ${error}` }
  }
} 