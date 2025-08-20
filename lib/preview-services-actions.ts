"use server"

import { createServerActionClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { APIManager } from "./providers/api-manager"
import { translationService } from "./translation-service"

// Função para criar cliente admin (service role)
function createAdminClient() {
  const { createClient } = require('@supabase/supabase-js')
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

/**
 * Preview de serviços da API sem importar
 */
export async function previewServicesFromAPI(options: {
  provider?: 'all' | 'mtp' | 'jap'
  maxServices?: number
  category?: string
  onlyNew?: boolean
}) {
  try {
    
    // Usar service role para garantir acesso às chaves de API
    const supabase = createAdminClient()

    // Obter chaves de API ativas
    const { data: apiKeys, error: keysError } = await supabase
      .from('api_keys')
      .select('*')
      .eq('is_active', true)


    if (keysError || !apiKeys || apiKeys.length === 0) {
      return { success: false, error: "Nenhuma chave de API configurada" }
    }

    const mtpKey = apiKeys.find((key: any) => key.provider === 'mtp')?.api_key
    const japKey = apiKeys.find((key: any) => key.provider === 'jap')?.api_key

    const apiManager = new APIManager(mtpKey, japKey)
    let allServices: any[] = []

    // Preview MTP se solicitado
    if ((options.provider === 'all' || options.provider === 'mtp') && mtpKey) {
      try {
        const mtpServices = await apiManager.getServices('mtp')
        
        const processedMTP = mtpServices.map(service => ({
          id: String(service.service), // Garantir que seja string para comparação
          name: translationService.cleanProviderInfo(service.name),
          description: translationService.cleanProviderInfo((service as any).description || ''),
          provider: 'mtp',
          category: translationService.cleanProviderInfo(service.category || 'Outros'),
          rate: typeof service.rate === 'number' ? service.rate : parseFloat(String(service.rate)) || 0,
          min_quantity: service.min || 1,
          max_quantity: service.max || 1000000,
          status: 'preview'
        }))
        
        allServices.push(...processedMTP)
      } catch (error) {
        // Erro silencioso no preview MTP
      }
    }

    // Preview JAP se solicitado
    if ((options.provider === 'all' || options.provider === 'jap') && japKey) {
      try {
        const japServices = await apiManager.getServices('jap')
        
        const processedJAP = japServices.map(service => ({
          id: String(service.service), // Garantir que seja string para comparação
          name: translationService.cleanProviderInfo(service.name),
          description: translationService.cleanProviderInfo((service as any).description || ''),
          provider: 'jap',
          category: translationService.cleanProviderInfo(service.category || 'Outros'),
          rate: typeof service.rate === 'number' ? service.rate : parseFloat(String(service.rate)) || 0,
          min_quantity: service.min || 1,
          max_quantity: service.max || 1000000,
          status: 'preview'
        }))
        
        allServices.push(...processedJAP)
      } catch (error) {
        // Erro silencioso no preview JAP
      }
    }

    // Filtrar por categoria se especificado
    if (options.category && options.category !== 'all') {
      allServices = allServices.filter(service => 
        service.category.toLowerCase().includes(options.category!.toLowerCase())
      )
    }

    // Filtrar apenas serviços não importados se solicitado
    if (options.onlyNew) {
      // Buscar todos os provider_service_id já importados
      const { data: existingServices, error: existingError } = await supabase
        .from('services')
        .select('provider_service_id, provider')
      
      if (!existingError) {
        const existingIds = new Set(
          existingServices.map((s: any) => `${s.provider}_${String(s.provider_service_id)}`)
        )
        
        allServices = allServices.filter(service => {
          const serviceKey = `${service.provider}_${service.id}`
          const exists = existingIds.has(serviceKey)
          return !exists
        })
      }
    }

    // Limitar quantidade se especificado
    
    if (options.maxServices && options.maxServices > 0) {
      allServices = allServices.slice(0, options.maxServices)
    }

    // Ordenar por nome
    allServices.sort((a, b) => a.name.localeCompare(b.name))



    return {
      success: true,
      services: allServices,
      total: allServices.length,
      providers: {
        mtp: allServices.filter(s => s.provider === 'mtp').length,
        jap: allServices.filter(s => s.provider === 'jap').length
      }
    }

  } catch (error) {
    return { 
      success: false, 
      error: `Erro no preview: ${error instanceof Error ? error.message : String(error)}` 
    }
  }
}

/**
 * Obter categorias disponíveis da API
 */
export async function getAvailableCategories() {
  const cookieStore = await cookies()
  const supabase = createServerActionClient({ cookies: () => cookieStore } as any)

  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: "Não autenticado" }
    }

    // Obter chaves de API ativas
    const { data: apiKeys } = await supabase
      .from('api_keys')
      .select('*')
      .eq('is_active', true)

    if (!apiKeys || apiKeys.length === 0) {
      return { success: false, error: "Nenhuma chave de API configurada" }
    }

    const mtpKey = apiKeys.find((key: any) => key.provider === 'mtp')?.api_key
    const japKey = apiKeys.find((key: any) => key.provider === 'jap')?.api_key

    const apiManager = new APIManager(mtpKey, japKey)
    const categories = new Set<string>()

    // Buscar categorias do MTP
    if (mtpKey) {
      try {
        const mtpServices = await apiManager.getServices('mtp')
        mtpServices.forEach(service => {
          if (service.category) {
            categories.add(service.category)
          }
        })
      } catch (error) {
        // Erro silencioso ao buscar categorias MTP
      }
    }

    // Buscar categorias do JAP
    if (japKey) {
      try {
        const japServices = await apiManager.getServices('jap')
        japServices.forEach(service => {
          if (service.category) {
            categories.add(service.category)
          }
        })
      } catch (error) {
        // Erro silencioso ao buscar categorias JAP
      }
    }

    const sortedCategories = Array.from(categories).sort()

    return {
      success: true,
      categories: sortedCategories
    }

  } catch (error) {
    return { 
      success: false, 
      error: `Erro ao obter categorias: ${error instanceof Error ? error.message : String(error)}` 
    }
  }
}
