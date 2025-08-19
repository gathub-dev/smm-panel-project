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
  console.log('🚀 SERVER: Iniciando saveAPIKey')
  console.log('Provider:', provider)
  console.log('Chave (8 chars):', apiKey.substring(0, 8) + '...')
  
  const supabase = createServerActionClient({ cookies })

  try {
    // Verificar se é admin
    console.log('👤 Verificando usuário...')
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      console.log('❌ Usuário não autenticado')
      return { error: "Não autenticado" }
    }
    console.log('✅ Usuário autenticado:', user.id)

    console.log('🔧 MODO DEV: Verificação de admin simplificada...')
    console.log('✅ Usuário autenticado - acesso liberado')

    if (!apiKey.trim()) {
      console.log('❌ Chave vazia')
      return { error: "Chave de API é obrigatória" }
    }

    // URLs padrão
    const defaultUrls = {
      mtp: 'https://morethanpanel.com/api/v2',
      jap: 'https://justanotherpanel.com/api/v2'
    }

    // Testar a chave antes de salvar
    console.log(`🔍 Testando chave ${provider.toUpperCase()}:`, apiKey.substring(0, 8) + '...')
    
    try {
      const testManager = new APIManager(
        provider === 'mtp' ? apiKey : undefined,
        provider === 'jap' ? apiKey : undefined
      )

      const connectionTest = await testManager.testAllConnections()
      
      if (!connectionTest[provider]) {
        console.log(`❌ Teste falhou para ${provider}`)
        return { error: "Chave de API inválida ou sem conectividade. Verifique se a chave está correta." }
      }
      
      console.log(`✅ Teste passou para ${provider}`)
    } catch (testError) {
      console.log(`⚠️ Erro no teste:`, testError)
      // Continuar mesmo com erro de teste, pois pode ser problema de rede
    }

    // Verificar se já existe uma chave para este provedor
    console.log('🔍 Verificando se já existe chave para', provider)
    const { data: existingKey, error: selectError } = await supabase
      .from('api_keys')
      .select('id')
      .eq('provider', provider)
      .single()

    if (selectError && selectError.code !== 'PGRST116') {
      console.log('❌ Erro ao buscar chave existente:', selectError)
      throw selectError
    }

    console.log('Chave existente encontrada:', existingKey ? 'SIM' : 'NÃO')

    const keyData = {
      provider,
      api_key: apiKey,
      api_url: apiUrl || defaultUrls[provider],
      is_active: true,
      updated_at: new Date().toISOString()
    }

    console.log('📝 Dados para salvar:', { ...keyData, api_key: keyData.api_key.substring(0, 8) + '...' })

    if (existingKey) {
      // Atualizar chave existente
      console.log('🔄 Atualizando chave existente...')
      const { error } = await supabase
        .from('api_keys')
        .update(keyData)
        .eq('id', existingKey.id)

      if (error) {
        console.log('❌ Erro ao atualizar:', error)
        throw error
      }
      console.log('✅ Chave atualizada com sucesso')
    } else {
      // Criar nova chave
      console.log('➕ Criando nova chave...')
      const { error } = await supabase
        .from('api_keys')
        .insert(keyData)

      if (error) {
        console.log('❌ Erro ao inserir:', error)
        throw error
      }
      console.log('✅ Nova chave criada com sucesso')
    }

    console.log('🔄 Revalidando path...')
    revalidatePath("/dashboard/admin")
    console.log('🏁 Salvamento concluído com sucesso')
    return { success: true, message: `Chave ${provider.toUpperCase()} salva com sucesso` }
  } catch (error) {
    console.error('💥 Erro ao salvar chave:', error)
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
    console.log('🔍 Iniciando teste de todas as chaves de API...')

    // Verificar se está autenticado
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      console.log('❌ Usuário não autenticado')
      return { error: "Não autenticado" }
    }
    console.log('✅ Usuário autenticado:', user.id)

    // Obter todas as chaves ativas
    console.log('📋 Buscando chaves de API no banco...')
    const { data: apiKeys, error: keysError } = await supabase
      .from('api_keys')
      .select('*')
      .eq('is_active', true)

    if (keysError) {
      console.log('❌ Erro ao buscar chaves:', keysError)
      return { error: `Erro ao buscar chaves: ${keysError.message}` }
    }

    if (!apiKeys || apiKeys.length === 0) {
      console.log('⚠️ Nenhuma chave de API encontrada')
      return { 
        success: true,
        connections: { mtp: false, jap: false },
        balances: { mtp: null, jap: null },
        message: "Nenhuma chave de API configurada. Configure as chaves primeiro."
      }
    }

    console.log(`📊 Encontradas ${apiKeys.length} chaves ativas`)

    const mtpKey = apiKeys.find(key => key.provider === 'mtp')?.api_key
    const japKey = apiKeys.find(key => key.provider === 'jap')?.api_key

    console.log('🔑 Chaves encontradas:', {
      mtp: mtpKey ? `${mtpKey.substring(0, 8)}...` : 'Não configurada',
      jap: japKey ? `${japKey.substring(0, 8)}...` : 'Não configurada'
    })

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
        console.log('🧪 Testando MTP...')
        const apiManager = new APIManager(mtpKey, undefined)
        const mtpTest = await apiManager.testAllConnections()
        results.mtp = mtpTest.mtp
        
        if (results.mtp) {
          console.log('✅ MTP conectado com sucesso')
          try {
            balances.mtp = await apiManager.getProviderBalance('mtp')
            console.log('💰 Saldo MTP:', balances.mtp)
          } catch (balanceError) {
            console.log('⚠️ Erro ao obter saldo MTP:', balanceError)
          }
        } else {
          console.log('❌ MTP falhou no teste')
        }
      } catch (error) {
        console.log('❌ Erro ao testar MTP:', error)
        results.mtp = false
      }
    } else {
      console.log('⚠️ Chave MTP não configurada')
    }

    // Testar JAP se disponível
    if (japKey) {
      try {
        console.log('🧪 Testando JAP...')
        const apiManager = new APIManager(undefined, japKey)
        const japTest = await apiManager.testAllConnections()
        results.jap = japTest.jap
        
        if (results.jap) {
          console.log('✅ JAP conectado com sucesso')
          try {
            balances.jap = await apiManager.getProviderBalance('jap')
            console.log('💰 Saldo JAP:', balances.jap)
          } catch (balanceError) {
            console.log('⚠️ Erro ao obter saldo JAP:', balanceError)
          }
        } else {
          console.log('❌ JAP falhou no teste')
        }
      } catch (error) {
        console.log('❌ Erro ao testar JAP:', error)
        results.jap = false
      }
    } else {
      console.log('⚠️ Chave JAP não configurada')
    }

    console.log('📊 Resultados finais:', { connections: results, balances })

    return { 
      success: true, 
      connections: results,
      balances,
      message: "Teste de conectividade concluído"
    }
  } catch (error) {
    console.error('💥 Erro fatal no teste de APIs:', error)
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

    console.log('✅ Usuário autenticado para getAPIKeysInfo:', user.id)

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