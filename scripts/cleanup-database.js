#!/usr/bin/env node

/**
 * Script para Limpeza Segura do Banco de Dados SMM Panel
 * 
 * Este script limpa todos os dados transacionais mantendo apenas:
 * - Estrutura das tabelas
 * - Usuários (com saldos zerados)
 * - Configurações essenciais
 * 
 * USO: node scripts/cleanup-database.js
 */

const { createClient } = require('@supabase/supabase-js')

// Configuração do Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Erro: Variáveis de ambiente do Supabase não configuradas')
  console.error('Certifique-se de que NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY estão definidas')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function confirmCleanup() {
  const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
  })

  return new Promise((resolve) => {
    console.log('\n⚠️  ATENÇÃO: Este script irá DELETAR todos os dados transacionais!')
    console.log('📋 Dados que serão removidos:')
    console.log('   • Todos os pedidos (orders)')
    console.log('   • Todas as transações (transactions)')
    console.log('   • Todos os serviços (services)')
    console.log('   • Todas as categorias (categories)')
    console.log('   • Todas as chaves de API (api_keys)')
    console.log('   • Configurações não-essenciais')
    console.log('\n✅ Dados que serão mantidos:')
    console.log('   • Usuários (com saldos zerados)')
    console.log('   • Configurações essenciais')
    console.log('   • Estrutura das tabelas')
    
    readline.question('\n❓ Tem certeza que deseja continuar? (digite "CONFIRMAR" para prosseguir): ', (answer) => {
      readline.close()
      resolve(answer === 'CONFIRMAR')
    })
  })
}

async function cleanupDatabase() {
  try {
    console.log('\n🚀 Iniciando limpeza do banco de dados...\n')

    // 1. Limpar transações
    console.log('🗑️  Removendo transações...')
    const { error: transactionsError } = await supabase
      .from('transactions')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000') // Delete all
    
    if (transactionsError) throw transactionsError
    console.log('✅ Transações removidas')

    // 2. Limpar pedidos
    console.log('🗑️  Removendo pedidos...')
    const { error: ordersError } = await supabase
      .from('orders')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000') // Delete all
    
    if (ordersError) throw ordersError
    console.log('✅ Pedidos removidos')

    // 3. Limpar serviços
    console.log('🗑️  Removendo serviços...')
    const { error: servicesError } = await supabase
      .from('services')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000') // Delete all
    
    if (servicesError) throw servicesError
    console.log('✅ Serviços removidos')

    // 4. Limpar categorias
    console.log('🗑️  Removendo categorias...')
    const { error: categoriesError } = await supabase
      .from('categories')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000') // Delete all
    
    if (categoriesError) throw categoriesError
    console.log('✅ Categorias removidas')

    // 5. Limpar chaves de API
    console.log('🗑️  Removendo chaves de API...')
    const { error: apiKeysError } = await supabase
      .from('api_keys')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000') // Delete all
    
    if (apiKeysError) throw apiKeysError
    console.log('✅ Chaves de API removidas')

    // 6. Resetar saldos dos usuários
    console.log('💰 Resetando saldos dos usuários...')
    const { error: usersError } = await supabase
      .from('users')
      .update({ 
        balance: 0.00,
        updated_at: new Date().toISOString()
      })
      .neq('balance', 0.00)
    
    if (usersError) throw usersError
    console.log('✅ Saldos resetados para zero')

    // 7. Limpar configurações não-essenciais
    console.log('⚙️  Removendo configurações não-essenciais...')
    const essentialSettings = [
      'site_name',
      'site_description', 
      'maintenance_mode',
      'registration_enabled'
    ]
    
    const { error: settingsError } = await supabase
      .from('settings')
      .delete()
      .not('key', 'in', `(${essentialSettings.map(s => `"${s}"`).join(',')})`)
    
    if (settingsError) throw settingsError
    console.log('✅ Configurações não-essenciais removidas')

    // 8. Verificação final - contar registros
    console.log('\n📊 Verificação final:')
    
    const tables = ['users', 'categories', 'services', 'orders', 'transactions', 'api_keys', 'settings']
    
    for (const table of tables) {
      const { count, error } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true })
      
      if (error) {
        console.log(`❌ Erro ao contar ${table}: ${error.message}`)
      } else {
        console.log(`📋 ${table}: ${count} registros`)
      }
    }

    console.log('\n🎉 Limpeza concluída com sucesso!')
    console.log('✅ O banco de dados foi limpo mantendo apenas as estruturas essenciais')
    console.log('🔐 Usuários e configurações essenciais foram preservados')

  } catch (error) {
    console.error('\n❌ Erro durante a limpeza:', error.message)
    process.exit(1)
  }
}

async function main() {
  console.log('🧹 SMM Panel - Script de Limpeza do Banco de Dados')
  console.log('================================================')
  
  const confirmed = await confirmCleanup()
  
  if (!confirmed) {
    console.log('\n❌ Operação cancelada pelo usuário')
    process.exit(0)
  }
  
  await cleanupDatabase()
}

// Executar apenas se chamado diretamente
if (require.main === module) {
  main().catch(console.error)
}

module.exports = { cleanupDatabase }
