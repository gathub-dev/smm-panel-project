#!/usr/bin/env node

/**
 * Script para testar sincronização de serviços
 * Funciona com as tabelas existentes
 */

const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = "https://xpklpweyvwviuiqzjgwe.supabase.co"
const supabaseServiceKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhwa2xwd2V5dnd2aXVpcXpqZ3dlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTU2NTE3OSwiZXhwIjoyMDcxMTQxMTc5fQ.7adnyvvwEWyAzYXHWyF7n9SEfdTrxZHcKlSKTJ7gQaQ"

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

// Tradução simples de categorias
const translateCategory = (englishCategory) => {
  const translations = {
    'Instagram': 'Instagram',
    'Instagram Followers': 'Seguidores Instagram',
    'Instagram Likes': 'Curtidas Instagram',
    'Instagram Views': 'Visualizações Instagram',
    'Instagram Comments': 'Comentários Instagram',
    'TikTok': 'TikTok',
    'TikTok Followers': 'Seguidores TikTok',
    'TikTok Likes': 'Curtidas TikTok',
    'TikTok Views': 'Visualizações TikTok',
    'YouTube': 'YouTube',
    'YouTube Subscribers': 'Inscritos YouTube',
    'YouTube Views': 'Visualizações YouTube',
    'YouTube Likes': 'Curtidas YouTube',
    'Facebook': 'Facebook',
    'Facebook Followers': 'Seguidores Facebook',
    'Facebook Likes': 'Curtidas Facebook',
    'Twitter': 'Twitter/X',
    'Other': 'Outros'
  }
  
  return translations[englishCategory] || englishCategory
}

async function testMTPAPI() {
  console.log('🧪 TESTANDO API MTP')
  console.log('=' .repeat(50))
  
  try {
    // Buscar chave MTP
    const { data: apiKeys } = await supabase
      .from('api_keys')
      .select('*')
      .eq('provider', 'mtp')
      .eq('is_active', true)
      .single()
    
    if (!apiKeys) {
      console.log('❌ Chave MTP não encontrada')
      return
    }
    
    console.log('🔑 Chave MTP encontrada:', apiKeys.api_key.substring(0, 10) + '...')
    console.log('🌐 URL:', apiKeys.api_url)
    
    // Testar API
    const response = await fetch(apiKeys.api_url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        key: apiKeys.api_key,
        action: 'services'
      })
    })
    
    if (!response.ok) {
      console.log('❌ Erro HTTP:', response.status)
      return
    }
    
    const data = await response.json()
    
    if (data.error) {
      console.log('❌ Erro da API:', data.error)
      return
    }
    
    console.log('✅ API funcionando!')
    console.log(`📊 Serviços recebidos: ${data.length}`)
    
    if (data.length > 0) {
      console.log('\n📝 Primeiros 5 serviços:')
      data.slice(0, 5).forEach((service, i) => {
        console.log(`${i + 1}. ID: ${service.service}`)
        console.log(`   Nome: ${service.name}`)
        console.log(`   Categoria: ${service.category}`)
        console.log(`   Preço: $${service.rate}`)
        console.log(`   Min: ${service.min} | Max: ${service.max}`)
        console.log(`   Categoria PT: ${translateCategory(service.category)}`)
        console.log('')
      })
      
      // Perguntar se quer sincronizar
      console.log('🤔 Deseja sincronizar estes serviços? (y/n)')
      
      // Para teste, vamos sincronizar os primeiros 10
      const servicesToSync = data.slice(0, 10)
      await syncServices(servicesToSync)
    }
    
  } catch (error) {
    console.error('❌ Erro no teste:', error.message)
  }
}

async function syncServices(services) {
  console.log('\n🔄 INICIANDO SINCRONIZAÇÃO')
  console.log('=' .repeat(30))
  
  const exchangeRate = 5.50 // Cotação fixa por enquanto
  const markup = 1.20 // 20% markup
  
  let synced = 0
  
  for (const service of services) {
    try {
      console.log(`💾 Sincronizando: ${service.name}`)
      
      const providerRateUSD = parseFloat(service.rate)
      const providerRateBRL = providerRateUSD * exchangeRate
      const finalRateBRL = providerRateBRL * markup
      
      const serviceData = {
        provider: 'mtp',
        provider_service_id: service.service.toString(),
        name: service.name,
        description: service.name, // Usar nome como descrição
        category: translateCategory(service.category),
        rate: finalRateBRL,
        min_quantity: parseInt(service.min) || 1,
        max_quantity: parseInt(service.max) || 10000,
        status: 'active',
        dripfeed: service.dripfeed === 'true' || service.dripfeed === true,
        refill: service.refill === 'true' || service.refill === true,
        cancel: service.cancel === 'true' || service.cancel === true,
        type: 'default', // Usar sempre 'default' por enquanto
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
      
      // Verificar se já existe
      const { data: existing } = await supabase
        .from('services')
        .select('id')
        .eq('provider_service_id', service.service.toString())
        .eq('provider', 'mtp')
        .single()
      
      let result
      if (existing) {
        // Atualizar
        result = await supabase
          .from('services')
          .update(serviceData)
          .eq('id', existing.id)
      } else {
        // Criar
        result = await supabase
          .from('services')
          .insert(serviceData)
      }
      
      if (result.error) {
        console.log(`   ❌ Erro: ${result.error.message}`)
      } else {
        console.log(`   ✅ ${existing ? 'Atualizado' : 'Criado'} - R$ ${finalRateBRL.toFixed(2)}`)
        synced++
      }
      
    } catch (error) {
      console.log(`   💥 Erro fatal: ${error.message}`)
    }
  }
  
  console.log(`\n🎉 Sincronização concluída: ${synced}/${services.length} serviços`)
}

// Executar teste
testMTPAPI().catch(console.error)
