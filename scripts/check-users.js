#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

console.log('👥 VERIFICANDO USUÁRIOS DO SISTEMA')
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

async function checkUsers() {
  try {
    const env = loadEnv()
    const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = env.SUPABASE_SERVICE_ROLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.log('❌ Variáveis de ambiente não encontradas!')
      return
    }
    
    console.log('🔗 Conectando no Supabase...')
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    // 1. Verificar usuários na tabela public.users
    console.log('\n📋 USUÁRIOS EM public.users:')
    console.log('─'.repeat(40))
    
    try {
      const { data: publicUsers, error } = await supabase
        .from('users')
        .select('*')
      
      if (error) {
        console.log('❌ Erro:', error.message)
      } else if (publicUsers.length === 0) {
        console.log('⚠️  Nenhum usuário encontrado em public.users')
      } else {
        console.log(`✅ Encontrados ${publicUsers.length} usuários:`)
        publicUsers.forEach((user, i) => {
          console.log(`\n   ${i+1}. ID: ${user.id}`)
          console.log(`      Email: ${user.email || 'N/A'}`)
          console.log(`      Role: ${user.role || 'N/A'}`)
          console.log(`      Criado: ${user.created_at || 'N/A'}`)
        })
      }
    } catch (err) {
      console.log('❌ Tabela public.users não existe ou erro:', err.message)
    }
    
    // 2. Verificar usuários na tabela public.profiles
    console.log('\n👤 USUÁRIOS EM public.profiles:')
    console.log('─'.repeat(40))
    
    try {
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('*')
      
      if (error) {
        console.log('❌ Erro:', error.message)
      } else if (profiles.length === 0) {
        console.log('⚠️  Nenhum profile encontrado')
      } else {
        console.log(`✅ Encontrados ${profiles.length} profiles:`)
        profiles.forEach((profile, i) => {
          console.log(`\n   ${i+1}. ID: ${profile.id}`)
          console.log(`      Email: ${profile.email || 'N/A'}`)
          console.log(`      Role: ${profile.role || 'N/A'}`)
          console.log(`      Criado: ${profile.created_at || 'N/A'}`)
        })
      }
    } catch (err) {
      console.log('❌ Tabela public.profiles não existe ou erro:', err.message)
    }
    
    // 3. Tentar verificar auth.users (pode não funcionar com chave anon)
    console.log('\n🔐 USUÁRIOS EM auth.users:')
    console.log('─'.repeat(40))
    console.log('⚠️  Não é possível acessar auth.users com chave anônima')
    console.log('   Para ver usuários de auth, use o painel do Supabase')
    
    console.log('\n🎯 RESUMO:')
    console.log('─'.repeat(40))
    console.log('1. Verifique se você tem conta criada')
    console.log('2. Faça login em: http://localhost:3000/auth/login')
    console.log('3. Se não tem conta: http://localhost:3000/auth/sign-up')
    console.log('4. Depois acesse: http://localhost:3000/dashboard/admin')
    
  } catch (error) {
    console.error('💥 ERRO:', error.message)
  }
}

checkUsers() 