#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

console.log('🔍 INSPEÇÃO DIRETA DO SUPABASE')
console.log('=' .repeat(50))

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

async function inspectDatabase() {
  try {
    console.log('📋 Carregando configurações...')
    
    const env = loadEnv()
    const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    
    if (!supabaseUrl || !supabaseKey) {
      console.log('❌ Variáveis de ambiente não encontradas!')
      console.log('Procure por:')
      console.log('- NEXT_PUBLIC_SUPABASE_URL')
      console.log('- NEXT_PUBLIC_SUPABASE_ANON_KEY')
      console.log('No arquivo .env.local')
      return
    }
    
    console.log('✅ Conectando no Supabase...')
    console.log('URL:', supabaseUrl.substring(0, 30) + '...')
    
    const supabase = createClient(supabaseUrl, supabaseKey)
    
    // 1. Verificar tabelas públicas
    console.log('\n🗂️  TABELAS PÚBLICAS:')
    console.log('─'.repeat(40))
    
    const tables = ['users', 'profiles', 'services', 'orders', 'transactions', 'api_keys', 'categories', 'settings']
    
    for (const table of tables) {
      try {
        const { data, error, count } = await supabase
          .from(table)
          .select('*', { count: 'exact', head: true })
        
        if (error) {
          console.log(`❌ ${table}: NÃO EXISTE (${error.message})`)
        } else {
          console.log(`✅ ${table}: ${count || 0} linhas`)
        }
      } catch (err) {
        console.log(`❌ ${table}: ERRO (${err.message})`)
      }
    }
    
    // 2. Verificar API Keys especificamente
    console.log('\n🔑 CHAVES DE API:')
    console.log('─'.repeat(40))
    
    try {
      const { data: apiKeys, error } = await supabase
        .from('api_keys')
        .select('*')
      
      if (error) {
        console.log('❌ Tabela api_keys não existe:', error.message)
      } else if (apiKeys.length === 0) {
        console.log('⚠️  Tabela api_keys existe mas está VAZIA')
      } else {
        console.log(`✅ Encontradas ${apiKeys.length} chaves:`)
        apiKeys.forEach((key, i) => {
          console.log(`   ${i+1}. Provider: ${key.provider}`)
          console.log(`      Chave: ${key.api_key?.substring(0, 8)}...`)
          console.log(`      Ativa: ${key.is_active}`)
          console.log(`      Criada: ${key.created_at}`)
        })
      }
    } catch (err) {
      console.log('❌ Erro ao verificar api_keys:', err.message)
    }
    
    // 3. Verificar usuário atual
    console.log('\n👤 USUÁRIO ATUAL:')
    console.log('─'.repeat(40))
    
    try {
      const { data: { user }, error } = await supabase.auth.getUser()
      
      if (error || !user) {
        console.log('❌ Nenhum usuário logado')
      } else {
        console.log('✅ Usuário logado:')
        console.log(`   ID: ${user.id}`)
        console.log(`   Email: ${user.email}`)
        console.log(`   Criado: ${user.created_at}`)
        
        // Verificar profile
        try {
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single()
          
          if (profile) {
            console.log(`   Role: ${profile.role}`)
          } else {
            console.log('   Role: SEM PROFILE')
          }
        } catch {
          console.log('   Role: ERRO AO BUSCAR')
        }
      }
    } catch (err) {
      console.log('❌ Erro ao verificar usuário:', err.message)
    }
    
    // 4. Teste de conexão
    console.log('\n🧪 TESTE DE CONEXÃO:')
    console.log('─'.repeat(40))
    
    try {
      const { data, error } = await supabase
        .from('api_keys')
        .select('count')
        .limit(1)
      
      if (error) {
        console.log('❌ Conexão com problema:', error.message)
      } else {
        console.log('✅ Conexão funcionando!')
      }
    } catch (err) {
      console.log('❌ Erro de conexão:', err.message)
    }
    
    console.log('\n🎯 RESUMO:')
    console.log('─'.repeat(40))
    console.log('1. Se api_keys não existe → Execute o SQL')
    console.log('2. Se api_keys existe mas vazia → Adicione chaves')
    console.log('3. Se usuário sem role → Precisa criar profiles')
    console.log('4. Se tudo OK → Problema pode ser nas chaves')
    
  } catch (error) {
    console.error('💥 ERRO FATAL:', error.message)
  }
}

// Executar
inspectDatabase() 