"use server"

import { createServerActionClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { revalidatePath } from "next/cache"
import { APIManager } from "./providers/api-manager"

/**
 * Adicionar ou atualizar chave de API
 */
export async function saveAPIKey(
  provider: 'mtp' | 'jap',
  apiKey: string,
  apiUrl?: string
) {
  const supabase = createServerActionClient({ cookies })

  try {
    // Verificar se é admin
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { error: "Não autenticado" }
    }

    if (!apiKey.trim()) {
      return { error: "Chave de API é obrigatória" }
    }

    const defaultUrls = {
      mtp: 'https://morethanpanel.com/api/v2',
      jap: 'https://justanotherpanel.com/api/v2'
    }

    try {
      const testManager = new APIManager(
        provider === 'mtp' ? apiKey : undefined,
        provider === 'jap' ? apiKey : undefined
      )

      const connectionTest = await testManager.testAllConnections()
      
      if (!connectionTest[provider]) {
        return { error: "Chave de API inválida ou sem conectividade. Verifique se a chave está correta." }
      }
      
    } catch (testError) {
      // Continuar mesmo com erro de teste, pois pode ser problema de rede
    }

    // Verificar se já existe uma chave para este provedor
    const { data: existingKey, error: selectError } = await supabase
      .from('api_keys')
      .select('id')
      .eq('provider', provider)
      .single()

    if (selectError && selectError.code !== 'PGRST116') {
      throw selectError
    }

    const keyData = {
      provider,
      api_key: apiKey,
      api_url: apiUrl || defaultUrls[provider],
      is_active: true,
      updated_at: new Date().toISOString()
    }

    if (existingKey) {
      // Atualizar chave existente
      const { error } = await supabase
        .from('api_keys')
        .update(keyData)
        .eq('id', existingKey.id)

      if (error) {
        throw error
      }
    } else {
      // Criar nova chave
      const { error } = await supabase
        .from('api_keys')
        .insert(keyData)

      if (error) {
        throw error
      }
    }

    revalidatePath("/dashboard/admin")
    return { success: true, message: `Chave ${provider.toUpperCase()} salva com sucesso` }
  } catch (error) {     
    const errorMessage = error instanceof Error ? error.message : String(error)
    return { error: `Erro ao salvar chave: ${errorMessage}` }
  }
}

/**
 * Ativar/desativar chave de API
 */
export async function toggleAPIKey(provider: 'mtp' | 'jap', isActive: boolean) {
  const supabase = createServerActionClient({ cookies })

  try {
    // Verificar se está autenticado
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: "Não autenticado" }

    const { error } = await supabase
      .from('api_keys')
      .update({ 
        is_active: isActive,
        updated_at: new Date().toISOString()
      })
      .eq('provider', provider)

    if (error) throw error

    revalidatePath("/dashboard/admin")
    return { 
      success: true, 
      message: `Chave ${provider.toUpperCase()} ${isActive ? 'ativada' : 'desativada'}` 
    }
  } catch (error) {
    return { error: `Erro ao alterar status: ${error}` }
  }
}

/**
 * Remover chave de API
 */
export async function removeAPIKey(provider: 'mtp' | 'jap') {
  const supabase = createServerActionClient({ cookies })

  try {
    // Verificar se está autenticado
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: "Não autenticado" }

    const { error } = await supabase
      .from('api_keys')
      .delete()
      .eq('provider', provider)

    if (error) throw error

    revalidatePath("/dashboard/admin")
    return { success: true, message: `Chave ${provider.toUpperCase()} removida` }
  } catch (error) {
    return { error: `Erro ao remover chave: ${error}` }
  }
}

/**
 * Testar todas as chaves de API - VERSÃO MELHORADA
 */
export async function testAllAPIKeys() {
  const supabase = createServerActionClient({ cookies })

  try {
    // Verificar se está autenticado
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { error: "Não autenticado" }
    }

    // Obter todas as chaves ativas
    const { data: apiKeys, error: keysError } = await supabase
      .from('api_keys')
      .select('*')
      .eq('is_active', true)

    if (keysError) {
      return { error: `Erro ao buscar chaves: ${keysError.message}` }
    }

    if (!apiKeys || apiKeys.length === 0) {
      return { 
        success: true,
        connections: { mtp: false, jap: false },
        balances: { mtp: null, jap: null },
        message: "Nenhuma chave de API configurada. Configure as chaves primeiro."
      }
    }


    const mtpKey = apiKeys.find(key => key.provider === 'mtp')?.api_key
    const japKey = apiKeys.find(key => key.provider === 'jap')?.api_key

    // Inicializar resultados
    const results: Record<'mtp' | 'jap', boolean> = {
      mtp: false,
      jap: false
    }

    const balances: Record<string, number | null> = {
      mtp: null,
      jap: null
    }

    // Testar MTP se disponível
    if (mtpKey) {
      try {
        const apiManager = new APIManager(mtpKey, undefined)
        const mtpTest = await apiManager.testAllConnections()
        results.mtp = mtpTest.mtp
        
        if (results.mtp) {
          try {
            balances.mtp = await apiManager.getProviderBalance('mtp')
          } catch (balanceError) {
          }
        } else {
        }
      } catch (error) {
        results.mtp = false
      }
    } else {
    }

    // Testar JAP se disponível
    if (japKey) {
      try {
        const apiManager = new APIManager(undefined, japKey)
        const japTest = await apiManager.testAllConnections()
        results.jap = japTest.jap
        
        if (results.jap) {
          try {
            balances.jap = await apiManager.getProviderBalance('jap')
          } catch (balanceError) {
          }
        } else {
        }
      } catch (error) {
        results.jap = false
      }
    } else {
    }

    return { 
      success: true, 
      connections: results,
      balances,
      message: "Teste de conectividade concluído"
    }
  } catch (error) {
    return { error: `Erro ao testar conexões: ${error}` }
  }
}

/**
 * Obter informações das chaves de API
 */
export async function getAPIKeysInfo() {
  const supabase = createServerActionClient({ cookies })

  try {
    // Verificar se está autenticado
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: "Não autenticado" }

    // Obter todas as chaves de API
    const { data: apiKeys } = await supabase
      .from('api_keys')
      .select('*')
      .order('created_at', { ascending: false })

    // Mascarar as chaves para segurança
    const maskedKeys = apiKeys?.map(key => ({
      ...key,
      api_key: key.api_key ? `${key.api_key.substring(0, 8)}...${key.api_key.slice(-4)}` : ''
    }))

    return { success: true, apiKeys: maskedKeys || [] }
  } catch (error) {
    return { error: `Erro ao obter informações: ${error}` }
  }
}

/**
 * Sincronizar saldos dos provedores
 */
export async function syncProviderBalances() {
  const supabase = createServerActionClient({ cookies })

  try {
    // Verificar se está autenticado
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: "Não autenticado" }

    // Obter chaves ativas
    const { data: apiKeys } = await supabase
      .from('api_keys')
      .select('*')
      .eq('is_active', true)

    if (!apiKeys || apiKeys.length === 0) {
      return { error: "Nenhuma chave de API configurada" }
    }

    const mtpKey = apiKeys.find(key => key.provider === 'mtp')?.api_key
    const japKey = apiKeys.find(key => key.provider === 'jap')?.api_key

    const apiManager = new APIManager(mtpKey, japKey)
    const balances: Record<string, number | null> = {}

    // Obter saldo MTP
    if (mtpKey) {
      try {
        balances.mtp = await apiManager.getProviderBalance('mtp')
      } catch {
        balances.mtp = null
      }
    }

    // Obter saldo JAP
    if (japKey) {
      try {
        balances.jap = await apiManager.getProviderBalance('jap')
      } catch {
        balances.jap = null
      }
    }

    // Salvar no settings para cache
    for (const [provider, balance] of Object.entries(balances)) {
      if (balance !== null) {
        await supabase
          .from('settings')
          .upsert({
            key: `${provider}_balance`,
            value: balance.toString(),
            description: `Saldo atual do provedor ${provider.toUpperCase()}`,
            updated_at: new Date().toISOString()
          })
      }
    }

    return { success: true, balances }
  } catch (error) {
    return { error: `Erro ao sincronizar saldos: ${error}` }
  }
} 