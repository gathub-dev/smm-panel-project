#!/usr/bin/env node

/**
 * Script de sincronização completa com tradução de nomes e descrições
 * Usa a estrutura correta com categories e category_id
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

// Sistema de tradução de nomes de serviços
function translateServiceName(originalName) {
  let translated = originalName
  
  // Remover emojis e símbolos desnecessários do início
  translated = translated.replace(/^[🟡🟢🔵⚪🟣🟤⚫🔴🟠🟨]+\s*/, '')
  
  // Traduções de termos principais
  const translations = {
    // Plataformas
    'Instagram': 'Instagram',
    'TikTok': 'TikTok', 
    'YouTube': 'YouTube',
    'Youtube': 'YouTube',
    'Facebook': 'Facebook',
    'Twitter': 'Twitter',
    
    // Tipos de serviço
    'Followers': 'Seguidores',
    'Likes': 'Curtidas',
    'Views': 'Visualizações', 
    'Comments': 'Comentários',
    'Subscribers': 'Inscritos',
    'Shares': 'Compartilhamentos',
    'Video Views': 'Visualizações de Vídeo',
    'Story Views': 'Visualizações de Story',
    'Reel Views': 'Visualizações de Reels',
    'Live Stream': 'Live Stream',
    
    // Qualidade/Tipo
    'Real': 'Reais',
    'High Quality': 'Alta Qualidade',
    'Premium': 'Premium',
    'Custom': 'Personalizados',
    'Instant': 'Instantâneo',
    'Fast': 'Rápido',
    'Cheap': 'Barato',
    
    // Garantias
    'No Refill': 'Sem Reposição',
    'Lifetime Guaranteed': 'Garantia Vitalícia',
    'Guaranteed': 'Garantido',
    '30 Day Refill': 'Reposição 30 Dias',
    'Refill': 'Reposição',
    
    // Velocidade
    'Speed': 'Velocidade',
    'Day': 'Dia',
    'Hour': 'Hora',
    'Min': 'Min',
    'Max': 'Máx',
    
    // Outros
    'NEW': 'NOVO',
    'BEST': 'MELHOR',
    'TOP': 'TOP'
  }
  
  // Aplicar traduções
  for (const [en, pt] of Object.entries(translations)) {
    const regex = new RegExp(`\\b${en}\\b`, 'gi')
    translated = translated.replace(regex, pt)
  }
  
  // Limpar caracteres especiais extras
  translated = translated.replace(/\s*\|\s*NEW!\s*\|?\s*$/i, ' (NOVO)')
  translated = translated.replace(/\s*\|\s*BEST\s*\|?\s*$/i, ' (MELHOR)')
  translated = translated.replace(/\s+/g, ' ').trim()
  
  return translated
}

// Criar descrição em português
function createDescription(serviceName, category, rate, min, max) {
  const platform = category.split(' - ')[0]
  const serviceType = category.split(' - ')[1] || 'Serviços'
  
  let description = `${serviceType} de alta qualidade para ${platform}. `
  
  // Adicionar informações de velocidade/qualidade baseado no nome
  if (serviceName.toLowerCase().includes('real') || serviceName.toLowerCase().includes('reais')) {
    description += 'Perfis reais e ativos. '
  }
  
  if (serviceName.toLowerCase().includes('garantia vitalícia')) {
    description += 'Garantia vitalícia incluída. '
  } else if (serviceName.toLowerCase().includes('30 dias')) {
    description += 'Reposição de 30 dias. '
  }
  
  if (serviceName.toLowerCase().includes('instantâneo')) {
    description += 'Início instantâneo. '
  }
  
  if (serviceName.toLowerCase().includes('rápido')) {
    description += 'Entrega rápida. '
  }
  
  description += `Quantidade mínima: ${min}. Máxima: ${max.toLocaleString('pt-BR')}.`
  
  return description
}

// Detectar categoria baseada no nome
function detectCategory(serviceName) {
  const name = serviceName.toLowerCase()
  
  // Detectar plataforma
  let platform = 'Outros'
  if (name.includes('instagram')) platform = 'Instagram'
  else if (name.includes('tiktok')) platform = 'TikTok'
  else if (name.includes('youtube')) platform = 'YouTube'
  else if (name.includes('facebook')) platform = 'Facebook'
  
  // Detectar tipo
  let serviceType = 'Outros'
  if (name.includes('likes') || name.includes('curtidas')) serviceType = 'Curtidas'
  else if (name.includes('followers') || name.includes('seguidores')) serviceType = 'Seguidores'
  else if (name.includes('views') || name.includes('visualizações')) serviceType = 'Visualizações'
  else if (name.includes('comments') || name.includes('comentários')) serviceType = 'Comentários'
  else if (name.includes('subscribers') || name.includes('inscritos')) serviceType = 'Inscritos'
  
  return `${platform} - ${serviceType}`
}

async function syncWithTranslation() {
  console.log('🌐 SINCRONIZAÇÃO COM TRADUÇÃO COMPLETA')
  console.log('=' .repeat(50))
  
  try {
    // 1. Buscar categorias existentes
    console.log('📂 Carregando categorias...')
    const { data: categories } = await supabase
      .from('categories')
      .select('id, name')
    
    const categoryMap = new Map()
    categories?.forEach(cat => {
      categoryMap.set(cat.name, cat.id)
    })
    
    console.log(`✅ ${categories?.length} categorias carregadas`)
    
    // 2. Buscar serviços da API
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
    const response = await fetch(apiKeys.api_url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        key: apiKeys.api_key,
        action: 'services'
      })
    })
    
    const data = await response.json()
    console.log(`📊 ${data.length} serviços recebidos`)
    
    // 3. Filtrar serviços principais
    const mainServices = data.filter(service => {
      const name = service.name.toLowerCase()
      return (name.includes('instagram') || 
              name.includes('tiktok') || 
              name.includes('youtube') ||
              name.includes('facebook')) &&
              !name.includes('👇') && // Remover separadores
              !name.includes('services') // Remover headers
    })
    
    console.log(`🎯 ${mainServices.length} serviços principais selecionados`)
    
    // 4. Sincronizar com tradução
    console.log('\n🌐 Iniciando sincronização com tradução...')
    
    const exchangeRate = 5.50
    const markup = 1.20
    let synced = 0
    
    // Processar apenas os primeiros 30 para teste
    const servicesToSync = mainServices.slice(0, 30)
    
    for (const service of servicesToSync) {
      try {
        // Traduzir nome
        const translatedName = translateServiceName(service.name)
        
        // Detectar categoria
        const categoryName = detectCategory(service.name)
        const categoryId = categoryMap.get(categoryName) || categoryMap.get('Outros')
        
        // Calcular preços
        const providerRateUSD = parseFloat(service.rate)
        const providerRateBRL = providerRateUSD * exchangeRate
        const finalRateBRL = providerRateBRL * markup
        
        // Criar descrição
        const description = createDescription(
          translatedName, 
          categoryName, 
          finalRateBRL, 
          service.min, 
          service.max
        )
        
        console.log(`\n💾 Processando: ${service.service}`)
        console.log(`   📝 Original: ${service.name}`)
        console.log(`   🌐 Traduzido: ${translatedName}`)
        console.log(`   📂 Categoria: ${categoryName}`)
        console.log(`   💰 Preço: $${providerRateUSD} → R$ ${finalRateBRL.toFixed(2)}`)
        
        const serviceData = {
          provider: 'mtp',
          provider_service_id: service.service.toString(),
          name: translatedName,
          description: description,
          category: categoryName, // Backup
          category_id: categoryId, // Relacionamento correto
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
        
        // Inserir serviço
        const { error } = await supabase
          .from('services')
          .insert(serviceData)
        
        if (error) {
          console.log(`   ❌ Erro: ${error.message}`)
        } else {
          console.log(`   ✅ Criado com sucesso`)
          synced++
        }
        
      } catch (error) {
        console.log(`   💥 Erro fatal: ${error.message}`)
      }
    }
    
    console.log(`\n🎉 Sincronização concluída: ${synced}/${servicesToSync.length} serviços`)
    
    // 5. Mostrar resultado final
    console.log('\n📊 RESULTADO FINAL:')
    const { data: finalServices } = await supabase
      .from('services')
      .select(`
        id,
        name,
        description,
        rate,
        categories (
          name,
          icon
        )
      `)
      .limit(5)
    
    finalServices?.forEach(service => {
      console.log(`\n✅ ${service.name}`)
      console.log(`   📂 ${service.categories?.name} ${service.categories?.icon}`)
      console.log(`   💰 R$ ${service.rate}`)
      console.log(`   📝 ${service.description.substring(0, 80)}...`)
    })
    
  } catch (error) {
    console.error('❌ Erro na sincronização:', error.message)
  }
}

// Executar sincronização
syncWithTranslation().catch(console.error)
