"use server"

import { createClient } from "@supabase/supabase-js"

// Cliente admin para bypass RLS
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

export interface LPPlatform {
  id: string
  name: string
  display_name: string
  description: string
  icon: string
  platform_type: string
  is_visible: boolean
  sort_order: number
  services_count?: number
}

/**
 * Buscar todas as plataformas da LP (para admin)
 */
export async function getAllLPPlatforms(): Promise<{ success: boolean; platforms?: LPPlatform[]; error?: string }> {
  try {
    
    const supabase = createAdminClient()
    
    const { data: platforms, error } = await supabase
      .from('platforms')
      .select('*')
      .order('sort_order', { ascending: true })
    
    if (error) {
      return { success: false, error: error.message }
    }
    
    // Contar serviços por plataforma
    const platformsWithCount = await Promise.all(
      (platforms || []).map(async (platform) => {
        const { count } = await supabase
          .from('services')
          .select('*', { count: 'exact', head: true })
          .eq('platform_id', platform.id)
          .eq('lp_visible', true)
          .eq('status', 'active')
        
        return {
          id: platform.id,
          name: platform.name,
          display_name: platform.display_name || platform.name, // Fallback para name se display_name não existir
          description: platform.description || '',
          icon: platform.icon,
          platform_type: platform.name,
          is_visible: platform.lp_visible !== undefined ? platform.lp_visible : false, // Fallback para false se não existir
          sort_order: platform.sort_order || 0,
          services_count: count || 0
        }
      })
    )
    
    return { success: true, platforms: platformsWithCount }
    
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

/**
 * Buscar apenas plataformas visíveis na LP (para público)
 */
export async function getVisibleLPPlatforms(): Promise<{ success: boolean; platforms?: LPPlatform[]; error?: string }> {
  try {
    
    const supabase = createAdminClient()
    
    const { data: platforms, error } = await supabase
      .from('platforms')
      .select('*')
      .eq('lp_visible', true)
      .order('sort_order', { ascending: true })
    
    if (error) {
      return { success: false, error: error.message }
    }
    
    // Contar serviços por plataforma
    const platformsWithCount = await Promise.all(
      (platforms || []).map(async (platform) => {
        const { count } = await supabase
          .from('services')
          .select('*', { count: 'exact', head: true })
          .eq('platform_id', platform.id)
          .eq('lp_visible', true)
          .eq('status', 'active')
        
        return {
          id: platform.id,
          name: platform.name,
          display_name: platform.display_name || platform.name, // Fallback para name se display_name não existir
          description: platform.description || '',
          icon: platform.icon,
          platform_type: platform.name,
          is_visible: platform.lp_visible !== undefined ? platform.lp_visible : false, // Fallback para false se não existir
          sort_order: platform.sort_order || 0,
          services_count: count || 0
        }
      })
    )
    
    return { success: true, platforms: platformsWithCount }
    
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

/**
 * Buscar serviços das plataformas visíveis na LP
 */
export async function getLPServicesByVisiblePlatforms(): Promise<{ success: boolean; services?: any[]; error?: string }> {
  try {
    
    const supabase = createAdminClient()
    
    // Primeiro buscar plataformas visíveis
    const { data: visiblePlatforms, error: platformError } = await supabase
      .from('platforms')
      .select('id')
      .eq('lp_visible', true)
    
    if (platformError) {
      return { success: false, error: platformError.message }
    }
    
    if (!visiblePlatforms || visiblePlatforms.length === 0) {
      return { success: true, services: [] }
    }
    
    const platformIds = visiblePlatforms.map(p => p.id)
    
    // Buscar serviços das plataformas visíveis
    const { data: services, error } = await supabase
      .from('services')
      .select(`
        *,
        platforms!inner(id, name, display_name, icon)
      `)
      .in('platform_id', platformIds)
      .eq('lp_visible', true)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
    
    if (error) {
      return { success: false, error: error.message }
    }
    
    return { success: true, services: services || [] }
    
  } catch (error: any) {

    return { success: false, error: error.message }
  }
}

/**
 * Atualizar visibilidade de uma plataforma
 */
export async function updatePlatformVisibility(
  platformId: string, 
  isVisible: boolean
): Promise<{ success: boolean; error?: string }> {
  try {
    
    const supabase = createAdminClient()
    
    const { error } = await supabase
      .from('platforms')
      .update({ lp_visible: isVisible })
      .eq('id', platformId)
    
    if (error) {
      return { success: false, error: error.message }
    }
    
    return { success: true }
    
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

/**
 * Atualizar ordem de uma plataforma
 */
export async function updatePlatformOrder(
  platformId: string, 
  sortOrder: number
): Promise<{ success: boolean; error?: string }> {
  try {
    
    const supabase = createAdminClient()
    
    const { error } = await supabase
      .from('platforms')
      .update({ sort_order: sortOrder })
      .eq('id', platformId)
    
    if (error) {
      return { success: false, error: error.message }
    }
    
    return { success: true }
    
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

/**
 * Buscar todas as plataformas para dropdown (simples)
 */
export async function getAllPlatformsForSelect(): Promise<{ success: boolean; platforms?: { id: string; name: string; display_name: string }[]; error?: string }> {
  try {
    
    const supabase = createAdminClient()
    
    // Primeiro testar se conseguimos acessar a tabela
    const { data: platforms, error } = await supabase
      .from('platforms')
      .select('*')
    
    if (error) {
      return { success: false, error: error.message }
    }
    
    if (!platforms || platforms.length === 0) {
      return { success: true, platforms: [] }
    }
    
    const formattedPlatforms = platforms.map(platform => ({
      id: platform.id,
      name: platform.name || platform.display_name || 'Sem nome',
      display_name: platform.display_name || platform.name || 'Sem nome'
    }))
    
    return { success: true, platforms: formattedPlatforms }
    
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

/**
 * Atualizar informações de uma plataforma
 */
export async function updatePlatformInfo(
  platformId: string,
  updates: {
    display_name?: string
    description?: string
    icon?: string
  }
): Promise<{ success: boolean; error?: string }> {
  try {
    
    const supabase = createAdminClient()
    
    const { error } = await supabase
      .from('lp_platforms')
      .update(updates)
      .eq('id', platformId)
    
    if (error) {
      return { success: false, error: error.message }
    }
    
    return { success: true }
    
  } catch (error: any) {
      
    return { success: false, error: error.message }
  }
}
