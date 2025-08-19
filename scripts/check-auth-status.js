#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

console.log('🔐 VERIFICANDO STATUS DE AUTENTICAÇÃO')
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

async function checkAuthStatus() {
  try {
    const env = loadEnv()
    const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    
    console.log('🔗 Conectando no Supabase...')
    const supabase = createClient(supabaseUrl, supabaseKey)
    
    // Verificar se consegue acessar auth
    console.log('\n🧪 Testando autenticação...')
    
    try {
      const { data: { user }, error } = await supabase.auth.getUser()
      
      if (error) {
        console.log('❌ Erro de auth:', error.message)
      } else if (user) {
        console.log('✅ Usuário logado:')
        console.log(`   ID: ${user.id}`)
        console.log(`   Email: ${user.email}`)
        console.log(`   Criado: ${user.created_at}`)
      } else {
        console.log('❌ Nenhum usuário logado')
      }
    } catch (authError) {
      console.log('❌ Erro ao verificar auth:', authError.message)
    }
    
    // Verificar se existem usuários no banco
    console.log('\n👥 Verificando usuários no banco...')
    
    try {
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('*')
      
      if (usersError) {
        console.log('❌ Erro ao buscar usuários:', usersError.message)
      } else {
        console.log(`📊 Total de usuários no banco: ${users?.length || 0}`)
        
        if (users && users.length > 0) {
          users.forEach((user, i) => {
            console.log(`\n   ${i+1}. Email: ${user.email}`)
            console.log(`      Role: ${user.role}`)
            console.log(`      ID: ${user.id}`)
            console.log(`      Criado: ${user.created_at}`)
          })
        }
      }
    } catch (err) {
      console.log('❌ Erro ao verificar usuários:', err.message)
    }
    
    console.log('\n🎯 DIAGNÓSTICO:')
    console.log('─'.repeat(50))
    
    // Fazer diagnóstico baseado nos resultados
    const { data: users } = await supabase.from('users').select('*')
    const { data: { user: currentUser } } = await supabase.auth.getUser()
    
    if (!users || users.length === 0) {
      console.log('🚨 PROBLEMA: Nenhum usuário no banco')
      console.log('   SOLUÇÃO: Registre-se em http://localhost:3000/auth/sign-up')
    } else if (!currentUser) {
      console.log('🚨 PROBLEMA: Você não está logado')
      console.log('   SOLUÇÃO: Faça login em http://localhost:3000/auth/login')
    } else {
      console.log('✅ Você está logado e tem usuários no banco')
      
      // Verificar se o usuário logado está no banco
      const userInDb = users.find(u => u.id === currentUser.id)
      if (!userInDb) {
        console.log('⚠️  PROBLEMA: Usuário logado não está na tabela users')
        console.log('   SOLUÇÃO: Problema de sincronização entre auth e users')
      } else if (userInDb.role !== 'admin') {
        console.log('⚠️  PROBLEMA: Usuário não é admin')
        console.log('   SOLUÇÃO: Tornar usuário admin no banco')
      } else {
        console.log('✅ Tudo OK! Problema deve ser nas chaves de API')
      }
    }
    
    console.log('\n📋 PRÓXIMOS PASSOS:')
    console.log('1. Se não tem conta → Registre-se')
    console.log('2. Se tem conta → Faça login')
    console.log('3. Se está logado → Verifique se é admin')
    console.log('4. Se é admin → Adicione chaves de API válidas')
    
  } catch (error) {
    console.error('💥 ERRO FATAL:', error.message)
  }
}

checkAuthStatus() 