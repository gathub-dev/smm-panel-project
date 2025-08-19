"use server"

import { createClient } from "@supabase/supabase-js"

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
        created_at
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
      services: services || [],
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