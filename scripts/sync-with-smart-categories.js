#!/usr/bin/env node

/**
 * Script de sincronização com categorização inteligente
 * Organiza os serviços em categorias lógicas em português
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

// Sistema inteligente de categorização
function smartCategorize(serviceName, originalCategory) {
  const name = serviceName.toLowerCase()
  
  // Detectar plataforma
  let platform = 'Outros'
  if (name.includes('instagram')) platform = 'Instagram'
  else if (name.includes('tiktok')) platform = 'TikTok'
  else if (name.includes('youtube')) platform = 'YouTube'
  else if (name.includes('facebook')) platform = 'Facebook'
  else if (name.includes('twitter') || name.includes(' x ')) platform = 'Twitter/X'
  else if (name.includes('telegram')) platform = 'Telegram'
  else if (name.includes('spotify')) platform = 'Spotify'
  else if (name.includes('twitch')) platform = 'Twitch'
  
  // Detectar tipo de serviço
  let serviceType = 'Outros'
  if (name.includes('likes') || name.includes('curtidas')) serviceType = 'Curtidas'
  else if (name.includes('followers') || name.includes('seguidores')) serviceType = 'Seguidores'
  else if (name.includes('views') || name.includes('visualizações')) serviceType = 'Visualizações'
  else if (name.includes('comments') || name.includes('comentários')) serviceType = 'Comentários'
  else if (name.includes('subscribers') || name.includes('inscritos')) serviceType = 'Inscritos'
  else if (name.includes('shares') || name.includes('compartilhamentos')) serviceType = 'Compartilhamentos'
  
  // Criar categoria final
  if (platform === 'Outros' && serviceType === 'Outros') {
    // Se não conseguiu detectar, usar categoria original traduzida
    return translateOriginalCategory(originalCategory)
  }
  
  return `${platform} - ${serviceType}`
}

function translateOriginalCategory(category) {
  // Traduções específicas para categorias que não seguem padrão
  const translations = {
    'MTP Promotions': 'Promoções MTP',
    'Working After Update!': 'Serviços Atualizados',
    'Provided By MTP': 'Fornecido por MTP',
    'Cheapest Of All Time': 'Mais Baratos',
    'Services For Gamers': 'Serviços para Gamers',
    'Services For Musicians': 'Serviços para Músicos',
    'Services For Streamers': 'Serviços para Streamers',
    'Private': 'Privado',
    'Elite Services': 'Serviços Elite'
  }
  
  // Verificar traduções diretas
  for (const [en, pt] of Object.entries(translations)) {
    if (category.includes(en)) {
      return pt
    }
  }
  
  return category // Retornar original se não encontrar tradução
}

async function syncWithSmartCategories() {
  console.log('🧠 SINCRONIZAÇÃO INTELIGENTE DE SERVIÇOS')
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
    
    console.log('📡 Buscando serviços da API...')
    
    // Fazer requisição para API
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
    
    const data = await response.json()
    console.log(`📊 ${data.length} serviços recebidos`)
    
    // Filtrar apenas serviços principais (Instagram, TikTok, YouTube, Facebook)
    const mainServices = data.filter(service => {
      const name = service.name.toLowerCase()
      return name.includes('instagram') || 
             name.includes('tiktok') || 
             name.includes('youtube') || 
             name.includes('facebook')
    })
    
    console.log(`🎯 ${mainServices.length} serviços principais selecionados`)
    
    // Analisar categorias que serão criadas
    const categoryMap = new Map()
    mainServices.forEach(service => {
      const category = smartCategorize(service.name, service.category)
      categoryMap.set(category, (categoryMap.get(category) || 0) + 1)
    })
    
    console.log('\n📂 CATEGORIAS QUE SERÃO CRIADAS:')
    Array.from(categoryMap.entries()).sort().forEach(([category, count]) => {
      console.log(`   📁 ${category}: ${count} serviços`)
    })
    
    console.log('\n🔄 Iniciando sincronização...')
    
    const exchangeRate = 5.50 // Cotação fixa
    const markup = 1.20 // 20% markup
    let synced = 0
    
    // Sincronizar apenas os primeiros 50 para teste
    const servicesToSync = mainServices.slice(0, 50)
    
    for (const service of servicesToSync) {
      try {
        const smartCategory = smartCategorize(service.name, service.category)
        const providerRateUSD = parseFloat(service.rate)
        const providerRateBRL = providerRateUSD * exchangeRate
        const finalRateBRL = providerRateBRL * markup
        
        console.log(`💾 ${service.name.substring(0, 60)}...`)
        console.log(`   📂 Categoria: ${smartCategory}`)
        console.log(`   💰 ${providerRateUSD} USD → R$ ${finalRateBRL.toFixed(2)}`)
        
        const serviceData = {
          provider: 'mtp',
          provider_service_id: service.service.toString(),
          name: service.name,
          description: service.name,
          category: smartCategory,
          rate: finalRateBRL,
          min_quantity: parseInt(service.min) || 1,
          max_quantity: parseInt(service.max) || 10000,
          status: 'active',
          dripfeed: service.dripfeed === 'true' || service.dripfeed === true,
          refill: service.refill === 'true' || service.refill === true,
          cancel: service.cancel === 'true' || service.cancel === true,
          type: 'default',
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
          result = await supabase
            .from('services')
            .update(serviceData)
            .eq('id', existing.id)
        } else {
          result = await supabase
            .from('services')
            .insert(serviceData)
        }
        
        if (result.error) {
          console.log(`   ❌ Erro: ${result.error.message}`)
        } else {
          console.log(`   ✅ ${existing ? 'Atualizado' : 'Criado'}`)
          synced++
        }
        
      } catch (error) {
        console.log(`   💥 Erro: ${error.message}`)
      }
    }
    
    console.log(`\n🎉 Sincronização concluída: ${synced}/${servicesToSync.length} serviços`)
    
    // Mostrar estatísticas finais
    console.log('\n📊 ESTATÍSTICAS FINAIS:')
    const finalCategoryMap = new Map()
    const { data: syncedServices } = await supabase
      .from('services')
      .select('category')
      .eq('provider', 'mtp')
    
    syncedServices?.forEach(service => {
      finalCategoryMap.set(service.category, (finalCategoryMap.get(service.category) || 0) + 1)
    })
    
    Array.from(finalCategoryMap.entries()).sort().forEach(([category, count]) => {
      console.log(`   📁 ${category}: ${count} serviços`)
    })
    
  } catch (error) {
    console.error('❌ Erro na sincronização:', error.message)
  }
}

// Executar sincronização
syncWithSmartCategories().catch(console.error)
