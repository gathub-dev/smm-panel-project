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
    console.log('📋 [LP-PLATFORMS] Buscando todas as plataformas da LP...')
    
    const supabase = createAdminClient()
    
    const { data: platforms, error } = await supabase
      .from('platforms')
      .select('*')
      .order('sort_order', { ascending: true })
    
    if (error) {
      console.error('❌ [LP-PLATFORMS] Erro ao buscar plataformas:', error)
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
    
    console.log(`✅ [LP-PLATFORMS] Encontradas ${platformsWithCount.length} plataformas`)
    return { success: true, platforms: platformsWithCount }
    
  } catch (error: any) {
    console.error('❌ [LP-PLATFORMS] Erro geral:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Buscar apenas plataformas visíveis na LP (para público)
 */
export async function getVisibleLPPlatforms(): Promise<{ success: boolean; platforms?: LPPlatform[]; error?: string }> {
  try {
    console.log('👁️ [LP-PLATFORMS] Buscando plataformas visíveis na LP...')
    
    const supabase = createAdminClient()
    
    const { data: platforms, error } = await supabase
      .from('platforms')
      .select('*')
      .eq('lp_visible', true)
      .order('sort_order', { ascending: true })
    
    if (error) {
      console.error('❌ [LP-PLATFORMS] Erro ao buscar plataformas visíveis:', error)
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
    
    console.log(`✅ [LP-PLATFORMS] Encontradas ${platformsWithCount.length} plataformas visíveis`)
    return { success: true, platforms: platformsWithCount }
    
  } catch (error: any) {
    console.error('❌ [LP-PLATFORMS] Erro geral:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Buscar serviços das plataformas visíveis na LP
 */
export async function getLPServicesByVisiblePlatforms(): Promise<{ success: boolean; services?: any[]; error?: string }> {
  try {
    console.log('🛍️ [LP-PLATFORMS] Buscando serviços das plataformas visíveis...')
    
    const supabase = createAdminClient()
    
    // Primeiro buscar plataformas visíveis
    const { data: visiblePlatforms, error: platformError } = await supabase
      .from('platforms')
      .select('id')
      .eq('lp_visible', true)
    
    if (platformError) {
      console.error('❌ [LP-PLATFORMS] Erro ao buscar plataformas visíveis:', platformError)
      return { success: false, error: platformError.message }
    }
    
    if (!visiblePlatforms || visiblePlatforms.length === 0) {
      console.log('✅ [LP-PLATFORMS] Nenhuma plataforma visível encontrada')
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
      console.error('❌ [LP-PLATFORMS] Erro ao buscar serviços:', error)
      return { success: false, error: error.message }
    }
    
    console.log(`✅ [LP-PLATFORMS] Encontrados ${services?.length || 0} serviços`)
    return { success: true, services: services || [] }
    
  } catch (error: any) {
    console.error('❌ [LP-PLATFORMS] Erro geral:', error)
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
    console.log(`🔄 [LP-PLATFORMS] Atualizando visibilidade da plataforma ${platformId} para ${isVisible}`)
    
    const supabase = createAdminClient()
    
    const { error } = await supabase
      .from('platforms')
      .update({ lp_visible: isVisible })
      .eq('id', platformId)
    
    if (error) {
      console.error('❌ [LP-PLATFORMS] Erro ao atualizar visibilidade:', error)
      return { success: false, error: error.message }
    }
    
    console.log('✅ [LP-PLATFORMS] Visibilidade atualizada com sucesso')
    return { success: true }
    
  } catch (error: any) {
    console.error('❌ [LP-PLATFORMS] Erro geral:', error)
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
    console.log(`📊 [LP-PLATFORMS] Atualizando ordem da plataforma ${platformId} para ${sortOrder}`)
    
    const supabase = createAdminClient()
    
    const { error } = await supabase
      .from('platforms')
      .update({ sort_order: sortOrder })
      .eq('id', platformId)
    
    if (error) {
      console.error('❌ [LP-PLATFORMS] Erro ao atualizar ordem:', error)
      return { success: false, error: error.message }
    }
    
    console.log('✅ [LP-PLATFORMS] Ordem atualizada com sucesso')
    return { success: true }
    
  } catch (error: any) {
    console.error('❌ [LP-PLATFORMS] Erro geral:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Buscar todas as plataformas para dropdown (simples)
 */
export async function getAllPlatformsForSelect(): Promise<{ success: boolean; platforms?: { id: string; name: string; display_name: string }[]; error?: string }> {
  try {
    console.log('📋 [LP-PLATFORMS] Buscando plataformas para select...')
    
    const supabase = createAdminClient()
    
    const { data: platforms, error } = await supabase
      .from('platforms')
      .select('id, name, display_name')
      .order('display_name', { ascending: true })
    
    if (error) {
      console.error('❌ [LP-PLATFORMS] Erro ao buscar plataformas:', error)
      return { success: false, error: error.message }
    }
    
    const formattedPlatforms = (platforms || []).map(platform => ({
      id: platform.id,
      name: platform.name,
      display_name: platform.display_name || platform.name
    }))
    
    console.log(`✅ [LP-PLATFORMS] Encontradas ${formattedPlatforms.length} plataformas para select`)
    return { success: true, platforms: formattedPlatforms }
    
  } catch (error: any) {
    console.error('❌ [LP-PLATFORMS] Erro geral:', error)
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
    console.log(`✏️ [LP-PLATFORMS] Atualizando informações da plataforma ${platformId}`)
    
    const supabase = createAdminClient()
    
    const { error } = await supabase
      .from('lp_platforms')
      .update(updates)
      .eq('id', platformId)
    
    if (error) {
      console.error('❌ [LP-PLATFORMS] Erro ao atualizar informações:', error)
      return { success: false, error: error.message }
    }
    
    console.log('✅ [LP-PLATFORMS] Informações atualizadas com sucesso')
    return { success: true }
    
  } catch (error: any) {
    console.error('❌ [LP-PLATFORMS] Erro geral:', error)
    return { success: false, error: error.message }
  }
}
