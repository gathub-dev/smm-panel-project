#!/usr/bin/env node

/**
 * Script de Limpeza Rápida - SMM Panel
 * Remove todos os dados transacionais sem confirmação
 * USO: node scripts/quick-cleanup.js
 */

const { createClient } = require('@supabase/supabase-js')

// Verificar variáveis de ambiente
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Erro: Variáveis de ambiente não configuradas')
  console.error('Configure: NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function quickCleanup() {
  console.log('🧹 Limpeza rápida iniciada...')
  
  try {
    // Limpar em ordem (respeitando foreign keys)
    await supabase.from('transactions').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    console.log('✅ Transações removidas')
    
    await supabase.from('orders').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    console.log('✅ Pedidos removidos')
    
    await supabase.from('services').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    console.log('✅ Serviços removidos')
    
    await supabase.from('categories').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    console.log('✅ Categorias removidas')
    
    await supabase.from('api_keys').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    console.log('✅ Chaves API removidas')
    
    // Resetar saldos
    await supabase.from('users').update({ balance: 0.00 }).neq('balance', 0.00)
    console.log('✅ Saldos resetados')
    
    console.log('🎉 Limpeza concluída!')
    
  } catch (error) {
    console.error('❌ Erro:', error.message)
  }
}

quickCleanup()
