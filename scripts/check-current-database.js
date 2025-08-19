#!/usr/bin/env node

/**
 * Script para verificar o estado atual do banco de dados
 * Mostra todas as configurações e dados existentes
 */

const { createClient } = require('@supabase/supabase-js')

// Configuração do Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://xpklpweyvwviuiqzjgwe.supabase.co"
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhwa2xwd2V5dnd2aXVpcXpqZ3dlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTU2NTE3OSwiZXhwIjoyMDcxMTQxMTc5fQ.7adnyvvwEWyAzYXHWyF7n9SEfdTrxZHcKlSKTJ7gQaQ"

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function checkDatabase() {
  console.log('🔍 ANÁLISE COMPLETA DO BANCO DE DADOS')
  console.log('=' .repeat(50))
  
  try {
    // 1. Verificar usuários
    console.log('\n👥 USUÁRIOS:')
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, email, full_name, role, balance, status, created_at')
      .order('created_at', { ascending: false })
    
    if (usersError) {
      console.log('❌ Erro ao buscar usuários:', usersError.message)
    } else {
      console.log(`📊 Total de usuários: ${users?.length || 0}`)
      if (users && users.length > 0) {
        users.forEach(user => {
          console.log(`   • ${user.email} (${user.role}) - Saldo: R$ ${user.balance}`)
        })
      }
    }

    // 2. Verificar chaves de API
    console.log('\n🔑 CHAVES DE API:')
    const { data: apiKeys, error: keysError } = await supabase
      .from('api_keys')
      .select('*')
    
    if (keysError) {
      console.log('❌ Erro ao buscar chaves:', keysError.message)
    } else {
      console.log(`📊 Total de chaves: ${apiKeys?.length || 0}`)
      if (apiKeys && apiKeys.length > 0) {
        apiKeys.forEach(key => {
          console.log(`   • ${key.provider.toUpperCase()}: ${key.api_key.substring(0, 10)}... (${key.is_active ? 'ATIVA' : 'INATIVA'})`)
          if (key.api_url) console.log(`     URL: ${key.api_url}`)
        })
      } else {
        console.log('⚠️ Nenhuma chave de API configurada')
      }
    }

    // 3. Verificar serviços
    console.log('\n🛍️ SERVIÇOS:')
    const { data: services, error: servicesError } = await supabase
      .from('services')
      .select('id, provider, name, category, rate, status, last_sync')
      .order('created_at', { ascending: false })
      .limit(10)
    
    if (servicesError) {
      console.log('❌ Erro ao buscar serviços:', servicesError.message)
    } else {
      const { count: totalServices } = await supabase
        .from('services')
        .select('*', { count: 'exact', head: true })
      
      console.log(`📊 Total de serviços: ${totalServices || 0}`)
      
      if (services && services.length > 0) {
        console.log('📝 Últimos 10 serviços:')
        services.forEach(service => {
          console.log(`   • [${service.provider?.toUpperCase()}] ${service.name} - R$ ${service.rate} (${service.status})`)
          console.log(`     Categoria: ${service.category}`)
          if (service.last_sync) {
            console.log(`     Última sync: ${new Date(service.last_sync).toLocaleString('pt-BR')}`)
          }
        })
      } else {
        console.log('⚠️ Nenhum serviço encontrado')
      }
    }

    // 4. Verificar categorias
    console.log('\n📂 CATEGORIAS DE SERVIÇOS:')
    const { data: categories } = await supabase
      .from('services')
      .select('category')
      .eq('status', 'active')
    
    if (categories) {
      const uniqueCategories = [...new Set(categories.map(c => c.category).filter(Boolean))]
      console.log(`📊 Total de categorias: ${uniqueCategories.length}`)
      uniqueCategories.slice(0, 10).forEach(cat => {
        console.log(`   • ${cat}`)
      })
    }

    // 5. Verificar pedidos
    console.log('\n📦 PEDIDOS:')
    const { count: totalOrders } = await supabase
      .from('orders')
      .select('*', { count: 'exact', head: true })
    
    const { count: pendingOrders } = await supabase
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .in('status', ['pending', 'processing', 'in_progress'])
    
    console.log(`📊 Total de pedidos: ${totalOrders || 0}`)
    console.log(`⏳ Pedidos pendentes: ${pendingOrders || 0}`)

    // 6. Verificar transações
    console.log('\n💰 TRANSAÇÕES:')
    const { count: totalTransactions } = await supabase
      .from('transactions')
      .select('*', { count: 'exact', head: true })
    
    console.log(`📊 Total de transações: ${totalTransactions || 0}`)

    // 7. Verificar cotações
    console.log('\n💱 COTAÇÕES:')
    const { data: exchangeRates, error: ratesError } = await supabase
      .from('exchange_rates')
      .select('*')
      .order('updated_at', { ascending: false })
      .limit(5)
    
    if (ratesError) {
      console.log('❌ Erro ao buscar cotações:', ratesError.message)
    } else {
      console.log(`📊 Cotações armazenadas: ${exchangeRates?.length || 0}`)
      if (exchangeRates && exchangeRates.length > 0) {
        exchangeRates.forEach(rate => {
          console.log(`   • ${rate.currency_pair}: ${rate.rate} (${new Date(rate.updated_at).toLocaleString('pt-BR')})`)
        })
      }
    }

    // 8. Verificar configurações
    console.log('\n⚙️ CONFIGURAÇÕES:')
    const { data: settings, error: settingsError } = await supabase
      .from('settings')
      .select('*')
      .order('key')
    
    if (settingsError) {
      console.log('❌ Erro ao buscar configurações:', settingsError.message)
    } else {
      console.log(`📊 Configurações: ${settings?.length || 0}`)
      if (settings && settings.length > 0) {
        settings.forEach(setting => {
          console.log(`   • ${setting.key}: ${setting.value}`)
          if (setting.description) {
            console.log(`     ${setting.description}`)
          }
        })
      } else {
        console.log('⚠️ Nenhuma configuração encontrada')
      }
    }

    console.log('\n🎉 ANÁLISE CONCLUÍDA!')
    console.log('=' .repeat(50))

  } catch (error) {
    console.error('❌ Erro na análise:', error.message)
  }
}

// Executar análise
checkDatabase().catch(console.error)
