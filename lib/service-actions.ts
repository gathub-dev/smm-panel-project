"use server"

import { createServerActionClient } from "@supabase/auth-helpers-nextjs"
import { createClient } from "@supabase/supabase-js"
import { cookies } from "next/headers"
import { revalidatePath } from "next/cache"
import { APIManager } from "./providers/api-manager"
import { getExchangeRate } from "./currency-actions"
import { convertUsdToBrl, formatBRL, formatUSD } from "./currency-utils"
import { getBothCategoryVersions } from "./category-translations"
import { getSetting } from "./settings-actions"
import { translationService } from "./translation-service"

/**
 * Sincronizar todos os serviços dos provedores
 */
export async function syncAllServices() {
  const supabase = createServerActionClient({ cookies })

  try {
    // Verificar autenticação
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: "Não autenticado" }

    // Obter chaves de API ativas
    const { data: apiKeys, error: keysError } = await supabase
      .from('api_keys')
      .select('*')
      .eq('is_active', true)

    if (keysError) return { error: `Erro ao buscar chaves: ${keysError.message}` }
    if (!apiKeys?.length) return { error: "Nenhuma chave de API configurada" }

    const mtpKey = apiKeys.find(key => key.provider === 'mtp')?.api_key
    const japKey = apiKeys.find(key => key.provider === 'jap')?.api_key
    const apiManager = new APIManager(mtpKey, japKey)

    // Cliente admin para operações
    const adminSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    let totalSynced = 0

    // Sincronizar provedores em paralelo
    const syncPromises = []
    
    if (mtpKey) {
      syncPromises.push(
        apiManager.getServices('mtp')
          .then(services => syncServicesFromProvider('mtp', services, adminSupabase))
          .catch(() => 0)
      )
    }

    if (japKey) {
      syncPromises.push(
        apiManager.getServices('jap')
          .then(services => syncServicesFromProvider('jap', services, adminSupabase))
          .catch(() => 0)
      )
    }

    const results = await Promise.all(syncPromises)
    totalSynced = results.reduce((sum, count) => sum + count, 0)
    
    revalidatePath("/dashboard/admin")
    return { 
      success: true, 
      synced: totalSynced,
      message: `${totalSynced} serviços sincronizados com sucesso`
    }
  } catch (error) {
    return { error: `Erro na sincronização: ${error instanceof Error ? error.message : String(error)}` }
  }
}

/**
 * Extrair informações dinamicamente do serviço
 */
function extractServiceInfo(serviceName: string, category: string) {
  // Usar a categoria (já traduzida) como base
  const originalCategory = category || 'Other'
  const categoryVersions = getBothCategoryVersions(originalCategory)
  
  return {
    platform: categoryVersions.pt, // Usar categoria traduzida como plataforma
    serviceType: 'geral', // Tipo genérico, será refinado dinamicamente
    category: categoryVersions.pt
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
  if (!services?.length) return 0
  
  // Buscar configurações globais uma vez
  const [exchangeRate, markupSetting] = await Promise.all([
    getExchangeRate(),
    getSetting('markup_percentage')
  ])
  
  const globalMarkup = parseFloat(markupSetting.success ? markupSetting.data?.value || '20' : '20')
  const now = new Date().toISOString()
  
  // Processar serviços em lotes
  const batchSize = 50
  let syncedCount = 0
  
  for (let i = 0; i < services.length; i += batchSize) {
    const batch = services.slice(i, i + batchSize)
    const processedServices = await Promise.all(
      batch.map(service => processService(service, provider, exchangeRate, globalMarkup, now, supabase))
    )
    
    syncedCount += processedServices.filter(Boolean).length
  }

  return syncedCount
}

/**
 * Processar um serviço individual
 */
async function processService(
  service: any, 
  provider: string, 
  exchangeRate: number, 
  globalMarkup: number, 
  now: string, 
  supabase: any
): Promise<boolean> {
  try {
    // Verificar se já existe
    const { data: existing } = await supabase
      .from('services')
      .select('id')
      .eq('provider_service_id', service.service)
      .eq('provider', provider)
      .single()

    // 🌍 TRADUÇÃO AUTOMÁTICA - Traduzir dados do serviço para português
    const translatedData = await translationService.translateServiceData({
      name: service.name,
      description: service.description,
      category: service.category
    })

    // Extrair informações dinamicamente usando dados traduzidos
    const serviceInfo = extractServiceInfo(translatedData.name, translatedData.category || '')
    
    // Obter IDs de plataforma e tipo (criar se necessário)
    const [platformId, serviceTypeId] = await Promise.all([
      getOrCreateEntity(supabase, 'get_or_create_platform', { platform_name: serviceInfo.platform }),
      getOrCreateEntity(supabase, 'get_or_create_service_type', { type_name: serviceInfo.serviceType })
    ])
    
    // Calcular preços
    const providerRateUSD = parseFloat(service.rate) || 0
    const finalRateBRL = convertUsdToBrl(providerRateUSD, exchangeRate) * (1 + globalMarkup / 100)

    const serviceData = {
      provider,
      provider_service_id: service.service,
      name: translatedData.name, // Nome traduzido
      description: translatedData.description || translatedData.name, // Descrição traduzida
      category: serviceInfo.category, // Categoria traduzida
      platform: serviceInfo.platform,
      shop_category: serviceInfo.serviceType,
      combined_category: `${serviceInfo.platform} - ${serviceInfo.serviceType}`,
      platform_id: platformId,
      service_type_id: serviceTypeId,
      // Campos para manter originais (para referência)
      original_name: translatedData.originalName,
      original_description: translatedData.originalDescription,
      original_category: translatedData.originalCategory,
      provider_rate: providerRateUSD,
      rate: finalRateBRL,
      markup_type: 'percentage',
      markup_value: globalMarkup,
      min_quantity: parseInt(service.min) || 1,
      max_quantity: parseInt(service.max) || 10000,
      service_type: service.type || 'Default',
      dripfeed: service.dripfeed || false,
      refill: service.refill || false,
      cancel: service.cancel || false,
      status: 'active',
      sync_enabled: true,
      featured: false,
      lp_visible: false,
      quantities: JSON.stringify([]),
      last_sync: now,
      updated_at: now
    }

    if (existing) {
      const { error } = await supabase
        .from('services')
        .update(serviceData)
        .eq('id', existing.id)
      return !error
    } else {
      const { error } = await supabase
        .from('services')
        .insert({ ...serviceData, created_at: now })
      return !error
    }
  } catch (error) {
    return false
  }
}

/**
 * Utilitário para criar/obter entidades
 */
async function getOrCreateEntity(supabase: any, rpcName: string, params: any): Promise<string | null> {
  try {
    const { data, error } = await supabase.rpc(rpcName, params)
    return error ? null : data
  } catch {
    return null
  }
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
  sync_enabled?: boolean
  // Novos campos da loja
  shop_category?: string
  quantities?: number[]
  lp_visible?: boolean
  featured?: boolean
}) {
  // Usar service role para garantir acesso
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

    const { data: updatedData, error } = await supabase
      .from('services')
      .update({
        ...data,
        updated_at: new Date().toISOString()
      })
      .eq('id', serviceId)
      .select()

    if (error) {
      throw error
    }
    
    revalidatePath("/dashboard/admin")
    revalidatePath("/dashboard/services")

    return { success: true, data: updatedData }
  } catch (error: any) {
    return { error: `Erro ao atualizar serviço: ${error.message}` }
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
    // Verificar autenticação e permissão
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: "Não autenticado" }

    const { data: userData } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single()

    if (userData?.role !== "admin") return { error: "Acesso negado" }

    // Atualizar em lote usando service role para melhor performance
    const adminSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    const { error } = await adminSupabase
      .from('services')
      .update({
        markup_type: markupType,
        markup_value: markupValue,
        updated_at: new Date().toISOString()
      })
      .in('id', serviceIds)

    if (error) throw error

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
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  try {
    // Buscar todas as estatísticas em paralelo
    const [totalResult, activeResult, providerStats, lastSyncResult] = await Promise.all([
      supabase.from('services').select('*', { count: 'exact', head: true }),
      supabase.from('services').select('*', { count: 'exact', head: true }).eq('status', 'active'),
      supabase.from('services').select('provider').eq('status', 'active'),
      supabase.from('services').select('last_sync').order('last_sync', { ascending: false }).limit(1).single()
    ])

    const total = totalResult.count || 0
    const active = activeResult.count || 0
    const mtpCount = providerStats.data?.filter(s => s.provider === 'mtp').length || 0
    const japCount = providerStats.data?.filter(s => s.provider === 'jap').length || 0

    return {
      success: true,
      stats: {
        total,
        active,
        inactive: total - active,
        mtp: mtpCount,
        jap: japCount,
        lastSync: lastSyncResult.data?.last_sync
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
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  try {
    const { data: apiKeys } = await supabase
      .from("api_keys")
      .select("*")
      .eq("is_active", true)

    if (!apiKeys?.length) return { error: "Nenhuma chave de API configurada" }

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
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  try {
    const page = filters?.page || 1
    const limit = filters?.limit || 50
    const offset = (page - 1) * limit

    // Construir filtros uma vez
    const buildFilters = (query: any) => {
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
      return query
    }

    // Executar queries em paralelo
    const [servicesResult, countResult, markupResult, exchangeRate] = await Promise.all([
      buildFilters(
        supabase
          .from('services')
          .select(`
            id, provider, provider_service_id, name, description, category,
            provider_rate, rate, markup_type, markup_value,
            min_quantity, max_quantity, status, sync_enabled,
            last_sync, created_at, updated_at
          `)
          .order('created_at', { ascending: false })
      ).range(offset, offset + limit - 1),
      
      buildFilters(
        supabase.from('services').select('*', { count: 'exact', head: true })
      ),
      
      getSetting('markup_percentage'),
      getExchangeRate()
    ])

    if (servicesResult.error) throw servicesResult.error
    if (countResult.error) throw countResult.error

    const defaultMarkup = parseFloat(markupResult.success ? markupResult.data?.value || '20' : '20')

    // Recalcular preços dinamicamente
    const servicesWithDynamicPrices = servicesResult.data?.map((service: any) => {
      const providerRateUSD = parseFloat(service.provider_rate) || 0
      
      if (providerRateUSD > 0) {
        const providerRateBRL = providerRateUSD * exchangeRate
        const serviceMarkupValue = parseFloat(service.markup_value) || 0
        const serviceMarkupType = service.markup_type || 'percentage'
        
        const isUsingDefault = !serviceMarkupValue || [20, 25, 30, 50, 100].includes(serviceMarkupValue)
        const finalMarkupValue = isUsingDefault ? defaultMarkup : serviceMarkupValue
        
        const finalRateBRL = serviceMarkupType === 'fixed' && !isUsingDefault
          ? finalMarkupValue
          : providerRateBRL * (1 + finalMarkupValue / 100)
        
        return {
          ...service,
          provider_rate_brl: parseFloat(providerRateBRL.toFixed(4)),
          rate: parseFloat(finalRateBRL.toFixed(4)),
          markup_value: finalMarkupValue,
          markup_type: serviceMarkupType,
          exchange_rate: exchangeRate
        }
      }
      
      return service
    }) || []

    return {
      success: true,
      services: servicesWithDynamicPrices,
      pagination: {
        page,
        limit,
        total: countResult.count || 0,
        totalPages: Math.ceil((countResult.count || 0) / limit)
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
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  try {
    const { data: services, error } = await supabase
      .from('services')
      .select('category')
      .eq('status', 'active')
      .not('category', 'is', null)

    if (error) throw error

    // Criar mapa de categorias únicas
    const categoryMap = new Map<string, { en: string; pt: string }>()
    
    services?.forEach((service: { category: string }) => {
      if (service.category && !categoryMap.has(service.category)) {
        const categoryVersions = getBothCategoryVersions(service.category)
        categoryMap.set(service.category, categoryVersions)
      }
    })

    const categories = Array.from(categoryMap.values())
      .sort((a, b) => a.pt.localeCompare(b.pt))
    
    return { success: true, categories }
  } catch (error) {
    return { error: `Erro ao buscar categorias: ${error}` }
  }
}

/**
 * 🌍 TRADUÇÃO EM SEGUNDO PLANO
 * Traduzir serviços existentes que ainda não foram traduzidos
 */
export async function translateExistingServices(batchSize: number = 50) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  try {
    // Buscar serviços que ainda não foram traduzidos
    // (aqueles que não têm original_name preenchido)
    const { data: services, error } = await supabase
      .from('services')
      .select('id, name, description, category')
      .is('original_name', null) // Ainda não traduzidos
      .eq('status', 'active')
      .limit(batchSize)

    if (error) throw error
    if (!services?.length) {
      return { success: true, message: 'Todos os serviços já estão traduzidos', translated: 0 }
    }

    console.log(`🌍 Traduzindo ${services.length} serviços em segundo plano...`)
    
    let translatedCount = 0

    // Processar em lotes menores para evitar rate limiting
    const miniBatchSize = 10
    for (let i = 0; i < services.length; i += miniBatchSize) {
      const batch = services.slice(i, i + miniBatchSize)
      
      await Promise.all(batch.map(async (service) => {
        try {
          // Traduzir dados do serviço
          const translatedData = await translationService.translateServiceData({
            name: service.name,
            description: service.description,
            category: service.category
          })

          // Atualizar apenas se houve tradução
          if (translatedData.originalName || translatedData.originalDescription || translatedData.originalCategory) {
            const { error: updateError } = await supabase
              .from('services')
              .update({
                name: translatedData.name,
                description: translatedData.description,
                category: translatedData.category,
                original_name: translatedData.originalName,
                original_description: translatedData.originalDescription,
                original_category: translatedData.originalCategory,
                updated_at: new Date().toISOString()
              })
              .eq('id', service.id)

            if (!updateError) {
              translatedCount++
              console.log(`  ✅ Traduzido: ${service.name} → ${translatedData.name}`)
            }
          } else {
            // Marcar como "já em português" para não processar novamente
            await supabase
              .from('services')
              .update({ original_name: '' }) // String vazia indica "já em português"
              .eq('id', service.id)
          }
        } catch (error) {
          console.log(`  ⚠️ Erro ao traduzir serviço ${service.id}:`, error)
        }
      }))

      // Pequena pausa entre lotes para evitar rate limiting
      if (i + miniBatchSize < services.length) {
        await new Promise(resolve => setTimeout(resolve, 1000))
      }
    }

    return {
      success: true,
      translated: translatedCount,
      message: `${translatedCount} serviços traduzidos com sucesso`
    }
  } catch (error) {
    return { error: `Erro na tradução em segundo plano: ${error}` }
  }
}

/**
 * Obter estatísticas de tradução
 */
export async function getTranslationStats() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  try {
    const [totalResult, translatedResult, pendingResult] = await Promise.all([
      supabase.from('services').select('*', { count: 'exact', head: true }),
      supabase.from('services').select('*', { count: 'exact', head: true }).not('original_name', 'is', null),
      supabase.from('services').select('*', { count: 'exact', head: true }).is('original_name', null)
    ])

    const total = totalResult.count || 0
    const translated = translatedResult.count || 0
    const pending = pendingResult.count || 0

    return {
      success: true,
      stats: {
        total,
        translated,
        pending,
        translationProgress: total > 0 ? Math.round((translated / total) * 100) : 0
      }
    }
  } catch (error) {
    return { error: `Erro ao obter estatísticas de tradução: ${error}` }
  }
} 