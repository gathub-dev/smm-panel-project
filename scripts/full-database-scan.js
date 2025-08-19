#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

console.log('🔍 VARREDURA COMPLETA DO BANCO DE DADOS')
console.log('=' .repeat(60))

// Ler variáveis de ambiente
function loadEnv() {
  const envPath = path.join(__dirname, '..', '.env')
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8')
    const lines = envContent.split('\n')
    
    const env = {}
    lines.forEach(line => {
      if (line.includes('=') && !line.startsWith('#')) {
        const [key, ...valueParts] = line.split('=')
        env[key.trim()] = valueParts.join('=').trim()
      }
    })
    return env
  }
  return {}
}

async function fullDatabaseScan() {
  try {
    const env = loadEnv()
    const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    
    console.log('🔗 Conectando no Supabase...')
    console.log('URL:', supabaseUrl?.substring(0, 40) + '...')
    
    const supabase = createClient(supabaseUrl, supabaseKey)
    
    // Lista de todas as tabelas possíveis
    const possibleTables = [
      'users', 'profiles', 'api_keys', 'services', 'orders', 
      'transactions', 'categories', 'settings', 'sync_logs',
      'balances', 'payments', 'notifications', 'logs'
    ]
    
    console.log('\n📊 TESTANDO TODAS AS TABELAS POSSÍVEIS:')
    console.log('─'.repeat(60))
    
    const existingTables = []
    const nonExistingTables = []
    
    for (const tableName of possibleTables) {
      try {
        console.log(`\n🔍 Testando tabela: ${tableName}`)
        
        // Tentar contar registros
        const { data, error, count } = await supabase
          .from(tableName)
          .select('*', { count: 'exact', head: true })
        
        if (error) {
          console.log(`   ❌ ${tableName}: ${error.message}`)
          nonExistingTables.push(tableName)
        } else {
          console.log(`   ✅ ${tableName}: ${count || 0} registros`)
          existingTables.push({ name: tableName, count: count || 0 })
          
          // Se tem registros, mostrar estrutura
          if (count > 0) {
            const { data: sample } = await supabase
              .from(tableName)
              .select('*')
              .limit(1)
            
            if (sample && sample.length > 0) {
              console.log(`      📋 Campos: ${Object.keys(sample[0]).join(', ')}`)
            }
          }
        }
      } catch (err) {
        console.log(`   💥 ${tableName}: ERRO - ${err.message}`)
        nonExistingTables.push(tableName)
      }
    }
    
    console.log('\n📈 RESUMO DAS TABELAS:')
    console.log('─'.repeat(60))
    
    if (existingTables.length > 0) {
      console.log('✅ TABELAS QUE EXISTEM:')
      existingTables.forEach(table => {
        console.log(`   • ${table.name}: ${table.count} registros`)
      })
    } else {
      console.log('❌ NENHUMA TABELA ENCONTRADA!')
    }
    
    if (nonExistingTables.length > 0) {
      console.log('\n❌ TABELAS QUE NÃO EXISTEM:')
      nonExistingTables.forEach(table => {
        console.log(`   • ${table}`)
      })
    }
    
    // Verificar especificamente as tabelas importantes
    console.log('\n🎯 VERIFICAÇÃO ESPECÍFICA:')
    console.log('─'.repeat(60))
    
    // Verificar users
    console.log('\n👥 VERIFICANDO USUÁRIOS:')
    if (existingTables.find(t => t.name === 'users')) {
      try {
        const { data: users } = await supabase
          .from('users')
          .select('*')
        
        console.log(`   Encontrados ${users?.length || 0} usuários:`)
        users?.forEach((user, i) => {
          console.log(`   ${i+1}. Email: ${user.email || 'N/A'}`)
          console.log(`      Role: ${user.role || 'N/A'}`)
          console.log(`      ID: ${user.id}`)
        })
      } catch (err) {
        console.log('   ❌ Erro ao buscar usuários:', err.message)
      }
    } else {
      console.log('   ❌ Tabela users não existe!')
    }
    
    // Verificar api_keys
    console.log('\n🔑 VERIFICANDO API KEYS:')
    if (existingTables.find(t => t.name === 'api_keys')) {
      try {
        const { data: apiKeys } = await supabase
          .from('api_keys')
          .select('*')
        
        console.log(`   Encontradas ${apiKeys?.length || 0} chaves:`)
        apiKeys?.forEach((key, i) => {
          console.log(`   ${i+1}. Provider: ${key.provider}`)
          console.log(`      Chave: ${key.api_key?.substring(0, 8)}...`)
          console.log(`      Ativa: ${key.is_active}`)
        })
      } catch (err) {
        console.log('   ❌ Erro ao buscar chaves:', err.message)
      }
    } else {
      console.log('   ❌ Tabela api_keys não existe!')
    }
    
    console.log('\n🎯 CONCLUSÃO:')
    console.log('─'.repeat(60))
    
    if (existingTables.length === 0) {
      console.log('🚨 BANCO COMPLETAMENTE VAZIO!')
      console.log('   → Precisa executar o SQL de criação das tabelas')
      console.log('   → Use o arquivo: scripts/01-create-database-schema.sql')
    } else {
      console.log('✅ Banco tem algumas tabelas')
      
      if (!existingTables.find(t => t.name === 'users')) {
        console.log('❌ Falta tabela users - precisa criar')
      }
      
      if (!existingTables.find(t => t.name === 'api_keys')) {
        console.log('❌ Falta tabela api_keys - precisa criar')
      }
      
      const usersTable = existingTables.find(t => t.name === 'users')
      if (usersTable && usersTable.count === 0) {
        console.log('⚠️  Tabela users existe mas está vazia')
      }
    }
    
  } catch (error) {
    console.error('💥 ERRO FATAL:', error.message)
  }
}

fullDatabaseScan() 