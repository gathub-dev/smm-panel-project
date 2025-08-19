"use server"

import { createServerActionClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { APIManager } from "./providers/api-manager"

/**
 * Preview de serviços da API sem importar
 */
export async function previewServicesFromAPI(options: {
  provider?: 'all' | 'mtp' | 'jap'
  maxServices?: number
  category?: string
}) {
  console.log('🔍 PREVIEW DE SERVIÇOS DA API')
  console.log('Opções:', options)
  
  const supabase = createServerActionClient({ cookies })

  try {
    // Verificar autenticação
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: "Não autenticado" }
    }

    // Obter chaves de API ativas
    const { data: apiKeys, error: keysError } = await supabase
      .from('api_keys')
      .select('*')
      .eq('is_active', true)

    if (keysError || !apiKeys || apiKeys.length === 0) {
      return { success: false, error: "Nenhuma chave de API configurada" }
    }

    const mtpKey = apiKeys.find(key => key.provider === 'mtp')?.api_key
    const japKey = apiKeys.find(key => key.provider === 'jap')?.api_key

    const apiManager = new APIManager(mtpKey, japKey)
    let allServices: any[] = []

    // Preview MTP se solicitado
    if ((options.provider === 'all' || options.provider === 'mtp') && mtpKey) {
      console.log('📡 Fazendo preview MTP...')
      try {
        const mtpServices = await apiManager.getServices('mtp')
        console.log(`📊 MTP: ${mtpServices.length} serviços encontrados`)
        
        const processedMTP = mtpServices.map(service => ({
          id: service.service,
          name: service.name,
          description: service.description || '',
          provider: 'mtp',
          category: service.category || 'Outros',
          rate: parseFloat(service.rate) || 0,
          min_quantity: service.min || 1,
          max_quantity: service.max || 1000000,
          status: 'preview'
        }))
        
        allServices.push(...processedMTP)
      } catch (error) {
        console.log('❌ Erro no preview MTP:', error)
      }
    }

    // Preview JAP se solicitado
    if ((options.provider === 'all' || options.provider === 'jap') && japKey) {
      console.log('📡 Fazendo preview JAP...')
      try {
        const japServices = await apiManager.getServices('jap')
        console.log(`📊 JAP: ${japServices.length} serviços encontrados`)
        
        const processedJAP = japServices.map(service => ({
          id: service.service,
          name: service.name,
          description: service.description || '',
          provider: 'jap',
          category: service.category || 'Outros',
          rate: parseFloat(service.rate) || 0,
          min_quantity: service.min || 1,
          max_quantity: service.max || 1000000,
          status: 'preview'
        }))
        
        allServices.push(...processedJAP)
      } catch (error) {
        console.log('❌ Erro no preview JAP:', error)
      }
    }

    // Filtrar por categoria se especificado
    if (options.category && options.category !== 'all') {
      allServices = allServices.filter(service => 
        service.category.toLowerCase().includes(options.category!.toLowerCase())
      )
    }

    // Limitar quantidade se especificado
    if (options.maxServices && options.maxServices > 0) {
      allServices = allServices.slice(0, options.maxServices)
    }

    // Ordenar por nome
    allServices.sort((a, b) => a.name.localeCompare(b.name))

    console.log(`✅ Preview concluído: ${allServices.length} serviços`)

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
    console.error('💥 Erro no preview:', error)
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
  const supabase = createServerActionClient({ cookies })

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

    const mtpKey = apiKeys.find(key => key.provider === 'mtp')?.api_key
    const japKey = apiKeys.find(key => key.provider === 'jap')?.api_key

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
        console.log('Erro ao buscar categorias MTP:', error)
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
        console.log('Erro ao buscar categorias JAP:', error)
      }
    }

    const sortedCategories = Array.from(categories).sort()

    return {
      success: true,
      categories: sortedCategories
    }

  } catch (error) {
    console.error('Erro ao obter categorias:', error)
    return { 
      success: false, 
      error: `Erro ao obter categorias: ${error instanceof Error ? error.message : String(error)}` 
    }
  }
}
