"use server"

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

interface Platform {
  id: string
  name: string
  display_name: string
  service_count: number
  import_enabled: boolean
  is_active: boolean
  icon: string
}

interface ServiceType {
  id: string
  name: string
  display_name: string
  service_count: number
  import_enabled: boolean
  is_active: boolean
  icon: string
}

interface ImportCombination {
  platform_name: string
  platform_display_name: string
  service_type_name: string
  service_type_display_name: string
  import_enabled: boolean
  services_imported: number
  last_import: string | null
}

export interface ImportControlResult {
  success: boolean
  data?: any
  error?: string
}

/**
 * Buscar todas as plataformas disponíveis para importação
 */
export async function getPlatformsForImport(): Promise<ImportControlResult> {
  try {
    const supabase = createClient()
    
    // Verificar se é admin
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: "Usuário não autenticado" }
    }

    const { data: userData } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single()

    if (userData?.role !== "admin") {
      return { success: false, error: "Acesso negado - apenas administradores" }
    }

    // Buscar plataformas usando a função SQL
    const { data: platforms, error } = await supabase
      .rpc('get_platforms_for_import')

    if (error) {
      console.error('❌ Erro ao buscar plataformas:', error)
      return { success: false, error: error.message }
    }

    return { success: true, data: platforms || [] }
  } catch (error: any) {
    console.error('❌ Erro geral:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Buscar todos os tipos de serviços disponíveis para importação
 */
export async function getServiceTypesForImport(): Promise<ImportControlResult> {
  try {
    const supabase = createClient()
    
    // Verificar se é admin
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: "Usuário não autenticado" }
    }

    const { data: userData } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single()

    if (userData?.role !== "admin") {
      return { success: false, error: "Acesso negado - apenas administradores" }
    }

    // Buscar tipos de serviços usando a função SQL
    const { data: serviceTypes, error } = await supabase
      .rpc('get_service_types_for_import')

    if (error) {
      console.error('❌ Erro ao buscar tipos de serviços:', error)
      return { success: false, error: error.message }
    }

    return { success: true, data: serviceTypes || [] }
  } catch (error: any) {
    console.error('❌ Erro geral:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Buscar todas as combinações disponíveis para importação
 */
export async function getImportCombinations(): Promise<ImportControlResult> {
  try {
    const supabase = createClient()
    
    // Verificar se é admin
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: "Usuário não autenticado" }
    }

    const { data: userData } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single()

    if (userData?.role !== "admin") {
      return { success: false, error: "Acesso negado - apenas administradores" }
    }

    // Buscar combinações usando a função SQL
    const { data: combinations, error } = await supabase
      .rpc('get_import_combinations')

    if (error) {
      console.error('❌ Erro ao buscar combinações:', error)
      return { success: false, error: error.message }
    }

    return { success: true, data: combinations || [] }
  } catch (error: any) {
    console.error('❌ Erro geral:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Habilitar importação de uma combinação específica
 */
export async function enableImportCombination(
  platformName: string, 
  serviceTypeName: string, 
  markupOverride?: number
): Promise<ImportControlResult> {
  try {
    const supabase = createClient()
    
    // Verificar se é admin
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: "Usuário não autenticado" }
    }

    const { data: userData } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single()

    if (userData?.role !== "admin") {
      return { success: false, error: "Acesso negado - apenas administradores" }
    }

    console.log(`🔧 Habilitando importação: ${platformName} - ${serviceTypeName}`)

    // Usar a função SQL para habilitar a combinação
    const { data: result, error } = await supabase
      .rpc('enable_import_combination', {
        p_platform_name: platformName,
        p_service_type_name: serviceTypeName,
        p_markup_override: markupOverride || null
      })

    if (error) {
      console.error('❌ Erro ao habilitar combinação:', error)
      return { success: false, error: error.message }
    }

    if (!result) {
      return { success: false, error: "Plataforma ou tipo de serviço não encontrado" }
    }

    console.log(`✅ Combinação habilitada: ${platformName} - ${serviceTypeName}`)
    
    revalidatePath('/dashboard/admin')
    return { success: true, data: { enabled: true } }
  } catch (error: any) {
    console.error('❌ Erro geral:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Habilitar múltiplas combinações de uma vez
 */
export async function enableMultipleCombinations(
  combinations: Array<{ platformName: string; serviceTypeName: string; markupOverride?: number }>
): Promise<ImportControlResult> {
  try {
    const supabase = createClient()
    
    // Verificar se é admin
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: "Usuário não autenticado" }
    }

    const { data: userData } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single()

    if (userData?.role !== "admin") {
      return { success: false, error: "Acesso negado - apenas administradores" }
    }

    console.log(`🔧 Habilitando ${combinations.length} combinações...`)

    let successCount = 0
    let errorCount = 0
    const errors: string[] = []

    // Processar cada combinação
    for (const combo of combinations) {
      try {
        const { data: result, error } = await supabase
          .rpc('enable_import_combination', {
            p_platform_name: combo.platformName,
            p_service_type_name: combo.serviceTypeName,
            p_markup_override: combo.markupOverride || null
          })

        if (error) {
          errorCount++
          errors.push(`${combo.platformName} - ${combo.serviceTypeName}: ${error.message}`)
        } else if (result) {
          successCount++
          console.log(`✅ ${combo.platformName} - ${combo.serviceTypeName}`)
        } else {
          errorCount++
          errors.push(`${combo.platformName} - ${combo.serviceTypeName}: Não encontrado`)
        }
      } catch (error: any) {
        errorCount++
        errors.push(`${combo.platformName} - ${combo.serviceTypeName}: ${error.message}`)
      }
    }

    console.log(`📊 Resultado: ${successCount} sucessos, ${errorCount} erros`)

    revalidatePath('/dashboard/admin')
    
    return { 
      success: true, 
      data: { 
        successCount, 
        errorCount, 
        errors: errors.slice(0, 5) // Limitar erros mostrados
      } 
    }
  } catch (error: any) {
    console.error('❌ Erro geral:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Desabilitar importação de uma combinação
 */
export async function disableImportCombination(
  platformName: string, 
  serviceTypeName: string
): Promise<ImportControlResult> {
  try {
    const supabase = createClient()
    
    // Verificar se é admin
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: "Usuário não autenticado" }
    }

    const { data: userData } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single()

    if (userData?.role !== "admin") {
      return { success: false, error: "Acesso negado - apenas administradores" }
    }

    console.log(`🔧 Desabilitando importação: ${platformName} - ${serviceTypeName}`)

    // Buscar IDs das tabelas
    const { data: platform } = await supabase
      .from('platforms')
      .select('id')
      .eq('name', platformName)
      .single()

    const { data: serviceType } = await supabase
      .from('service_types')
      .select('id')
      .eq('name', serviceTypeName)
      .single()

    if (!platform || !serviceType) {
      return { success: false, error: "Plataforma ou tipo de serviço não encontrado" }
    }

    // Atualizar controle de importação
    const { error } = await supabase
      .from('import_control')
      .update({ 
        import_enabled: false,
        updated_at: new Date().toISOString()
      })
      .eq('platform_id', platform.id)
      .eq('service_type_id', serviceType.id)

    if (error) {
      console.error('❌ Erro ao desabilitar combinação:', error)
      return { success: false, error: error.message }
    }

    console.log(`✅ Combinação desabilitada: ${platformName} - ${serviceTypeName}`)
    
    revalidatePath('/dashboard/admin')
    return { success: true, data: { disabled: true } }
  } catch (error: any) {
    console.error('❌ Erro geral:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Buscar estatísticas de importação
 */
export async function getImportStats(): Promise<ImportControlResult> {
  try {
    const supabase = createClient()
    
    // Verificar se é admin
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: "Usuário não autenticado" }
    }

    const { data: userData } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single()

    if (userData?.role !== "admin") {
      return { success: false, error: "Acesso negado - apenas administradores" }
    }

    // Buscar estatísticas
    const { data: platformsCount } = await supabase
      .from('platforms')
      .select('id', { count: 'exact' })
      .eq('is_active', true)

    const { data: serviceTypesCount } = await supabase
      .from('service_types')
      .select('id', { count: 'exact' })
      .eq('is_active', true)

    const { data: enabledCombinationsCount } = await supabase
      .from('import_control')
      .select('id', { count: 'exact' })
      .eq('import_enabled', true)

    const { data: servicesCount } = await supabase
      .from('services')
      .select('id', { count: 'exact' })
      .eq('status', 'active')

    const stats = {
      activePlatforms: platformsCount?.length || 0,
      activeServiceTypes: serviceTypesCount?.length || 0,
      enabledCombinations: enabledCombinationsCount?.length || 0,
      importedServices: servicesCount?.length || 0
    }

    return { success: true, data: stats }
  } catch (error: any) {
    console.error('❌ Erro ao buscar estatísticas:', error)
    return { success: false, error: error.message }
  }
}
