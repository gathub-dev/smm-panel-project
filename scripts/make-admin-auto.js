#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

console.log('👑 TORNANDO USUÁRIO ADMIN')
console.log('=' .repeat(40))

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

async function makeUserAdmin() {
  try {
    const env = loadEnv()
    const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    
    console.log('🔗 Conectando no Supabase...')
    const supabase = createClient(supabaseUrl, supabaseKey)
    
    const userEmail = 'lhost2025@gmail.com'
    
    // 1. Verificar usuário atual
    console.log('🔍 Verificando usuário atual...')
    const { data: currentUser, error: selectError } = await supabase
      .from('users')
      .select('id, email, role')
      .eq('email', userEmail)
      .single()
    
    if (selectError) {
      console.log('❌ Erro ao buscar usuário:', selectError.message)
      return
    }
    
    console.log('👤 Usuário encontrado:')
    console.log(`   Email: ${currentUser.email}`)
    console.log(`   Role atual: ${currentUser.role}`)
    
    if (currentUser.role === 'admin') {
      console.log('✅ Usuário já é admin!')
      return
    }
    
    // 2. Tornar admin
    console.log('🔄 Tornando usuário admin...')
    const { error: updateError } = await supabase
      .from('users')
      .update({ role: 'admin' })
      .eq('email', userEmail)
    
    if (updateError) {
      console.log('❌ Erro ao atualizar:', updateError.message)
      return
    }
    
    // 3. Verificar se funcionou
    const { data: updatedUser } = await supabase
      .from('users')
      .select('id, email, role')
      .eq('email', userEmail)
      .single()
    
    console.log('✅ SUCESSO!')
    console.log(`   Email: ${updatedUser.email}`)
    console.log(`   Role: ${updatedUser.role}`)
    
    console.log('\n🎯 PRÓXIMOS PASSOS:')
    console.log('1. Recarregue o painel: http://localhost:3000/dashboard/admin')
    console.log('2. Tente salvar uma chave de API')
    console.log('3. As bolinhas devem ficar verdes!')
    
  } catch (error) {
    console.error('💥 ERRO:', error.message)
  }
}

makeUserAdmin() 