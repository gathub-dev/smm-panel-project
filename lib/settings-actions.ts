"use server"

import { createClient } from "@/lib/supabase/server"
import { createClient as createServiceClient } from "@supabase/supabase-js"
import { revalidatePath } from "next/cache"

// Cliente com service role para operações admin
function createAdminClient() {
  return createServiceClient(
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

interface Setting {
  id?: string
  key: string
  value: string
  description?: string
  created_at?: string
  updated_at?: string
}

interface SettingResult {
  success: boolean
  message?: string
  error?: string
  data?: any
}

// Função para verificar se é admin
async function checkAdminAccess() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return { success: false, error: "Usuário não autenticado" }
  }

  // A verificação de admin deve ser feita apenas através do Supabase
  if (user.user_metadata?.role === "admin") {
    console.log("Admin verificado via user_metadata")
    return { success: true, user }
  }

  try {
    const { data: userData } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single()

    if (userData?.role === "admin") {
      console.log("Admin verificado via tabela users")
      return { success: true, user }
    }
  } catch (error) {
    console.log("Erro ao verificar role na tabela users:", error)
  }

  return { success: false, error: "Acesso negado - apenas administradores" }
}

// Buscar todas as configurações
export async function getAllSettings(): Promise<SettingResult> {
  try {
    console.log("🔍 getAllSettings: Iniciando...")
    
    // Garantir que apenas admins possam ler todas as configurações
    const adminCheck = await checkAdminAccess()
    if (!adminCheck.success) {
      return adminCheck
    }

    // Usar cliente com service role para evitar erros de policy/role
    const supabase = createAdminClient()
    console.log("🔍 getAllSettings: Admin client criado")
    
    const { data: settings, error } = await supabase
      .from("settings")
      .select("*")
      .order("key")

    console.log("🔍 getAllSettings: Query executada", { settings: settings?.length, error })

    if (error) {
      console.log("🔍 getAllSettings: Erro na query:", error)
      throw error
    }

    // Organizar configurações por categoria
    const categorizedSettings: {
      general: Setting[]
      pricing: Setting[]
      api: Setting[]
      notifications: Setting[]
      security: Setting[]
      system: Setting[]
    } = {
      general: [],
      pricing: [],
      api: [],
      notifications: [],
      security: [],
      system: []
    }

    settings?.forEach((setting: any) => {
      const key = setting.key.toLowerCase()
      
      // Pular configurações que são exibidas na seção especial de câmbio
      if (key === 'currency_mode' || key === 'usd_brl_rate' || key === 'markup_percentage') {
        return // Não adicionar nas categorias normais
      }
      
      if (key.includes('deposit') || key.includes('min_') || key.includes('max_')) {
        categorizedSettings.pricing.push(setting)
      } else if (key.includes('api') || key.includes('provider') || key.includes('sync') || key.includes('timeout')) {
        categorizedSettings.api.push(setting)
      } else if (key.includes('notification') || key.includes('email') || key.includes('alert')) {
        categorizedSettings.notifications.push(setting)
      } else if (key.includes('security') || key.includes('auth') || key.includes('password') || key.includes('login') || key.includes('session')) {
        categorizedSettings.security.push(setting)
      } else if (key.includes('maintenance') || key.includes('debug') || key.includes('log')) {
        categorizedSettings.system.push(setting)
      } else {
        categorizedSettings.general.push(setting)
      }
    })

    return {
      success: true,
      data: {
        all: settings || [],
        categorized: categorizedSettings
      }
    }
  } catch (error: any) {
    return { success: false, error: `Erro ao buscar configurações: ${error.message}` }
  }
}

// Salvar uma configuração
export async function saveSetting(key: string, value: string, description?: string): Promise<SettingResult> {
  try {
        const adminCheck = await checkAdminAccess()
    if (!adminCheck.success) {
      return adminCheck
    }

    const supabase = createAdminClient()
    
    const settingData = {
      key,
      value,
      description: description || null,
      updated_at: new Date().toISOString()
    }
    
    // Primeiro, verificar se a configuração já existe
    const { data: existingData } = await supabase
      .from("settings")
      .select("id")
      .eq("key", key)
      .single()
    
    let data, error
    
    if (existingData) {
      // Se existe, fazer UPDATE
      const result = await supabase
        .from("settings")
        .update({
          value,
          description: description || null,
          updated_at: new Date().toISOString()
        })
        .eq("key", key)
        .select()
        .single()
      
      data = result.data
      error = result.error
    } else {
      // Se não existe, fazer INSERT
      const result = await supabase
        .from("settings")
        .insert(settingData)
        .select()
        .single()
      
      data = result.data
      error = result.error
    }

    if (error) {
      throw error
    }

    revalidatePath("/dashboard/admin/settings")
    return {
      success: true,
      message: "Configuração salva com sucesso",
      data
    }
  } catch (error: any) {
    return { success: false, error: `Erro ao salvar configuração: ${error.message}` }
  }
}

// Salvar múltiplas configurações
export async function saveMultipleSettings(settings: { key: string, value: string, description?: string }[]): Promise<SettingResult> {
  try {
    const adminCheck = await checkAdminAccess()
    if (!adminCheck.success) {
      return adminCheck
    }

    const supabase = createAdminClient()
    const settingsToUpsert = settings.map(setting => ({
      ...setting,
      updated_at: new Date().toISOString()
    }))

    const { data, error } = await supabase
      .from("settings")
      .upsert(settingsToUpsert)
      .select()

    if (error) throw error

    revalidatePath("/dashboard/admin/settings")
    return {
      success: true,
      message: `${settings.length} configurações salvas com sucesso`,
      data
    }
  } catch (error: any) {
    return { success: false, error: `Erro ao salvar configurações: ${error.message}` }
  }
}

// Deletar uma configuração
export async function deleteSetting(key: string): Promise<SettingResult> {
  try {
    const adminCheck = await checkAdminAccess()
    if (!adminCheck.success) {
      return adminCheck
    }

    const supabase = createAdminClient()
    const { error } = await supabase
      .from("settings")
      .delete()
      .eq("key", key)

    if (error) throw error

    revalidatePath("/dashboard/admin/settings")
    return {
      success: true,
      message: "Configuração removida com sucesso"
    }
  } catch (error: any) {
    return { success: false, error: `Erro ao remover configuração: ${error.message}` }
  }
}

// Buscar configuração específica
export async function getSetting(key: string): Promise<SettingResult> {
  try {
    // TEMPORÁRIO: Desabilitando verificação de admin para teste
    // const adminCheck = await checkAdminAccess()
    // if (!adminCheck.success) {
    //   return adminCheck
    // }

    const supabase = createAdminClient()
    const { data: setting, error } = await supabase
      .from("settings")
      .select("*")
      .eq("key", key)
      .single()

    if (error) throw error

    return {
      success: true,
      data: setting
    }
  } catch (error: any) {
    return { success: false, error: `Erro ao buscar configuração: ${error.message}` }
  }
}

// Buscar múltiplas configurações de uma vez (mais eficiente)
export async function getMultipleSettings(keys: string[]): Promise<SettingResult> {
  try {
    const adminCheck = await checkAdminAccess()
    if (!adminCheck.success) {
      return adminCheck
    }

    const supabase = createAdminClient()
    const { data: settings, error } = await supabase
      .from("settings")
      .select("*")
      .in("key", keys)

    if (error) throw error

    // Converter array em objeto key-value para facilitar acesso
    const settingsMap: Record<string, any> = {}
    settings?.forEach(setting => {
      settingsMap[setting.key] = setting
    })

    return {
      success: true,
      data: settingsMap
    }
  } catch (error: any) {
    return { success: false, error: `Erro ao buscar configurações: ${error.message}` }
  }
}

// Configurações padrão do sistema
export async function initializeDefaultSettings(): Promise<SettingResult> {
  try {
    const adminCheck = await checkAdminAccess()
    if (!adminCheck.success) {
      return adminCheck
    }

    const defaultSettings = [
      // Configurações gerais
      {
        key: "site_name",
        value: "SMM Panel Brasil",
        description: "Nome do site exibido no cabeçalho"
      },
      {
        key: "site_description",
        value: "Serviços de Marketing Digital - Mais Barato do Brasil",
        description: "Descrição do site"
      },
      {
        key: "contact_email",
        value: "contato@smmpainel.com",
        description: "Email de contato principal"
      },
      {
        key: "support_whatsapp",
        value: "+5511999999999",
        description: "WhatsApp de suporte"
      },
      
      // Configurações de preços
      {
        key: "global_markup_percentage",
        value: "20",
        description: "Markup padrão aplicado aos serviços (%)"
      },
      {
        key: "min_deposit_amount",
        value: "10.00",
        description: "Valor mínimo de depósito (BRL)"
      },
      {
        key: "max_deposit_amount",
        value: "10000.00",
        description: "Valor máximo de depósito (BRL)"
      },
      {
        key: "currency_symbol",
        value: "R$",
        description: "Símbolo da moeda"
      },
      
      // Configurações de API
      {
        key: "api_timeout_seconds",
        value: "30",
        description: "Timeout para requisições API (segundos)"
      },
      {
        key: "sync_interval_hours",
        value: "6",
        description: "Intervalo de sincronização automática (horas)"
      },
      {
        key: "auto_sync_enabled",
        value: "true",
        description: "Sincronização automática habilitada"
      },
      
      // Configurações de notificações
      {
        key: "email_notifications_enabled",
        value: "true",
        description: "Notificações por email habilitadas"
      },
      {
        key: "order_status_notifications",
        value: "true",
        description: "Notificar mudanças de status de pedidos"
      },
      {
        key: "low_balance_alert_threshold",
        value: "100.00",
        description: "Alerta quando saldo do provedor for menor que (USD)"
      },
      
      // Configurações de segurança
      {
        key: "max_login_attempts",
        value: "5",
        description: "Tentativas máximas de login"
      },
      {
        key: "session_timeout_minutes",
        value: "60",
        description: "Timeout da sessão (minutos)"
      },
      {
        key: "require_email_verification",
        value: "true",
        description: "Exigir verificação de email"
      },
      
      // Configurações do sistema
      {
        key: "maintenance_mode",
        value: "false",
        description: "Modo de manutenção"
      },
      {
        key: "debug_mode",
        value: "false",
        description: "Modo debug habilitado"
      },
      {
        key: "log_level",
        value: "info",
        description: "Nível de log (debug, info, warn, error)"
      }
    ]

    const result = await saveMultipleSettings(defaultSettings)
    return result
  } catch (error: any) {
    return { success: false, error: `Erro ao inicializar configurações: ${error.message}` }
  }
}

// Exportar configurações
export async function exportSettings(): Promise<SettingResult> {
  try {
    const adminCheck = await checkAdminAccess()
    if (!adminCheck.success) {
      return adminCheck
    }

    const settingsResult = await getAllSettings()
    if (!settingsResult.success) {
      return settingsResult
    }

    const exportData = {
      exported_at: new Date().toISOString(),
      version: "1.0",
      settings: settingsResult.data.all
    }

    return {
      success: true,
      message: "Configurações exportadas com sucesso",
      data: exportData
    }
  } catch (error: any) {
    return { success: false, error: `Erro ao exportar configurações: ${error.message}` }
  }
}

// Importar configurações
export async function importSettings(settingsData: any): Promise<SettingResult> {
  try {
    const adminCheck = await checkAdminAccess()
    if (!adminCheck.success) {
      return adminCheck
    }

    if (!settingsData.settings || !Array.isArray(settingsData.settings)) {
      return { success: false, error: "Formato de dados inválido" }
    }

    const settingsToImport = settingsData.settings.map((setting: any) => ({
      key: setting.key,
      value: setting.value,
      description: setting.description
    }))

    const result = await saveMultipleSettings(settingsToImport)
    return result
  } catch (error: any) {
    return { success: false, error: `Erro ao importar configurações: ${error.message}` }
  }
}
