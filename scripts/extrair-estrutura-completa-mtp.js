#!/usr/bin/env node

/**
 * Script para extrair TODA a estrutura completa da API MoreThanPanel
 * Organiza por plataformas, tipos de serviços e cria mapeamento completo
 */

require('dotenv').config()
const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')

async function extrairEstruturaCompleta() {
  console.log('🔍 EXTRAINDO ESTRUTURA COMPLETA DA API MORETHANPANEL...\n')
  
  try {
    // Conectar ao Supabase
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    
    if (!supabaseUrl || !supabaseKey) {
      console.error('❌ Faltam variáveis de ambiente')
      process.exit(1)
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    })
    
    // Buscar chave MTP
    const { data: apiKey, error } = await supabase
      .from('api_keys')
      .select('*')
      .eq('provider', 'mtp')
      .eq('is_active', true)
      .single()
    
    if (error || !apiKey) {
      console.error('❌ MTP API key não encontrada')
      process.exit(1)
    }
    
    console.log('✅ Chave MTP encontrada')
    
    // Fazer requisição para API
    const apiUrl = apiKey.api_url || 'https://morethanpanel.com/api/v2'
    const body = new URLSearchParams({
      key: apiKey.api_key,
      action: 'services'
    }).toString()
    
    console.log('📡 Fazendo requisição para API...')
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'SMM-Panel-Complete-Analysis/1.0'
      },
      body: body
    })
    
    if (!response.ok) {
      console.error('❌ Erro HTTP:', response.status)
      process.exit(1)
    }
    
    const services = JSON.parse(await response.text())
    
    if (!Array.isArray(services)) {
      console.error('❌ Resposta inválida')
      process.exit(1)
    }
    
    console.log(`✅ ${services.length} serviços carregados`)
    
    // ANÁLISE COMPLETA - EXTRAIR TODAS AS PLATAFORMAS
    console.log('\n🔍 EXTRAINDO PLATAFORMAS...')
    
    const platformsMap = new Map()
    const serviceTypesMap = new Map()
    const categoriesMap = new Map()
    
    // Função para extrair plataforma do nome do serviço
    function extractPlatform(serviceName, category) {
      const name = serviceName.toLowerCase()
      const cat = category.toLowerCase()
      
      // Plataformas principais
      if (name.includes('instagram') || cat.includes('instagram')) return 'Instagram'
      if (name.includes('tiktok') || cat.includes('tiktok')) return 'TikTok'
      if (name.includes('youtube') || cat.includes('youtube')) return 'YouTube'
      if (name.includes('facebook') || cat.includes('facebook')) return 'Facebook'
      if (name.includes('twitter') || cat.includes('twitter')) return 'Twitter'
      if (name.includes('spotify') || cat.includes('spotify')) return 'Spotify'
      if (name.includes('telegram') || cat.includes('telegram')) return 'Telegram'
      if (name.includes('discord') || cat.includes('discord')) return 'Discord'
      if (name.includes('twitch') || cat.includes('twitch')) return 'Twitch'
      if (name.includes('linkedin') || cat.includes('linkedin')) return 'LinkedIn'
      if (name.includes('pinterest') || cat.includes('pinterest')) return 'Pinterest'
      if (name.includes('snapchat') || cat.includes('snapchat')) return 'Snapchat'
      if (name.includes('reddit') || cat.includes('reddit')) return 'Reddit'
      if (name.includes('clubhouse') || cat.includes('clubhouse')) return 'Clubhouse'
      if (name.includes('soundcloud') || cat.includes('soundcloud')) return 'SoundCloud'
      if (name.includes('vimeo') || cat.includes('vimeo')) return 'Vimeo'
      if (name.includes('dailymotion') || cat.includes('dailymotion')) return 'Dailymotion'
      if (name.includes('rumble') || cat.includes('rumble')) return 'Rumble'
      if (name.includes('kick') || cat.includes('kick')) return 'Kick'
      if (name.includes('threads') || cat.includes('threads')) return 'Threads'
      if (name.includes('onlyfans') || cat.includes('onlyfans')) return 'OnlyFans'
      if (name.includes('website') || cat.includes('website') || name.includes('traffic')) return 'Website'
      if (name.includes('google') || cat.includes('google')) return 'Google'
      if (name.includes('yelp') || cat.includes('yelp')) return 'Yelp'
      if (name.includes('trustpilot') || cat.includes('trustpilot')) return 'Trustpilot'
      
      return 'Outros'
    }
    
    // Função para extrair tipo de serviço
    function extractServiceType(serviceName, category) {
      const name = serviceName.toLowerCase()
      const cat = category.toLowerCase()
      
      if (name.includes('followers') || name.includes('subscriber') || name.includes('member')) return 'Seguidores'
      if (name.includes('likes') || name.includes('reactions') || name.includes('hearts')) return 'Curtidas'
      if (name.includes('views') || name.includes('plays') || name.includes('streams')) return 'Visualizações'
      if (name.includes('comments') || name.includes('replies')) return 'Comentários'
      if (name.includes('shares') || name.includes('retweets') || name.includes('reposts')) return 'Compartilhamentos'
      if (name.includes('saves') || name.includes('bookmarks')) return 'Salvamentos'
      if (name.includes('story') || name.includes('stories')) return 'Stories'
      if (name.includes('live') || name.includes('livestream')) return 'Live'
      if (name.includes('impressions') || name.includes('reach')) return 'Impressões'
      if (name.includes('engagement') || name.includes('interactions')) return 'Engajamento'
      if (name.includes('accounts') || name.includes('profiles')) return 'Contas'
      if (name.includes('reviews') || name.includes('ratings')) return 'Avaliações'
      if (name.includes('traffic') || name.includes('visitors')) return 'Tráfego'
      if (name.includes('downloads') || name.includes('installs')) return 'Downloads'
      if (name.includes('mentions') || name.includes('tags')) return 'Menções'
      
      return 'Outros'
    }
    
    // Processar todos os serviços
    services.forEach(service => {
      const platform = extractPlatform(service.name, service.category)
      const serviceType = extractServiceType(service.name, service.category)
      const category = service.category
      
      // Mapear plataformas
      if (!platformsMap.has(platform)) {
        platformsMap.set(platform, {
          name: platform,
          display_name: platform,
          services: [],
          service_count: 0,
          categories: new Set()
        })
      }
      
      const platformData = platformsMap.get(platform)
      platformData.services.push(service)
      platformData.service_count++
      platformData.categories.add(serviceType)
      
      // Mapear tipos de serviços
      if (!serviceTypesMap.has(serviceType)) {
        serviceTypesMap.set(serviceType, {
          name: serviceType,
          display_name: serviceType,
          services: [],
          service_count: 0,
          platforms: new Set()
        })
      }
      
      const serviceTypeData = serviceTypesMap.get(serviceType)
      serviceTypeData.services.push(service)
      serviceTypeData.service_count++
      serviceTypeData.platforms.add(platform)
      
      // Mapear categorias originais
      if (!categoriesMap.has(category)) {
        categoriesMap.set(category, {
          original_category: category,
          platform: platform,
          service_type: serviceType,
          services: [],
          service_count: 0
        })
      }
      
      const categoryData = categoriesMap.get(category)
      categoryData.services.push(service)
      categoryData.service_count++
    })
    
    // Converter Sets para Arrays
    platformsMap.forEach(platform => {
      platform.categories = Array.from(platform.categories)
    })
    
    serviceTypesMap.forEach(serviceType => {
      serviceType.platforms = Array.from(serviceType.platforms)
    })
    
    // Criar estrutura final
    const estruturaCompleta = {
      metadata: {
        total_services: services.length,
        total_platforms: platformsMap.size,
        total_service_types: serviceTypesMap.size,
        total_original_categories: categoriesMap.size,
        extracted_at: new Date().toISOString(),
        api_url: apiUrl
      },
      platforms: Array.from(platformsMap.values()).sort((a, b) => b.service_count - a.service_count),
      service_types: Array.from(serviceTypesMap.values()).sort((a, b) => b.service_count - a.service_count),
      original_categories: Array.from(categoriesMap.values()).sort((a, b) => b.service_count - a.service_count),
      sample_services: services.slice(0, 50) // Primeiros 50 para referência
    }
    
    // Salvar estrutura completa em arquivo
    const outputFile = 'scripts/estrutura-mtp-completa.json'
    fs.writeFileSync(outputFile, JSON.stringify(estruturaCompleta, null, 2))
    
    console.log('\n📊 ESTRUTURA COMPLETA EXTRAÍDA:')
    console.log('=' .repeat(50))
    console.log(`📱 ${estruturaCompleta.platforms.length} plataformas identificadas`)
    console.log(`🛍️ ${estruturaCompleta.service_types.length} tipos de serviços`)
    console.log(`📂 ${estruturaCompleta.original_categories.length} categorias originais`)
    console.log(`💾 Salvo em: ${outputFile}`)
    
    console.log('\n🏆 TOP 10 PLATAFORMAS:')
    console.log('=' .repeat(30))
    estruturaCompleta.platforms.slice(0, 10).forEach((platform, i) => {
      console.log(`${i + 1}. ${platform.display_name}: ${platform.service_count} serviços`)
    })
    
    console.log('\n🏆 TOP 10 TIPOS DE SERVIÇOS:')
    console.log('=' .repeat(35))
    estruturaCompleta.service_types.slice(0, 10).forEach((type, i) => {
      console.log(`${i + 1}. ${type.display_name}: ${type.service_count} serviços`)
    })
    
    console.log('\n📋 PLATAFORMAS PARA BANCO DE DADOS:')
    console.log('=' .repeat(40))
    estruturaCompleta.platforms.forEach(platform => {
      console.log(`INSERT INTO platforms (name, display_name, description, service_count) VALUES`)
      console.log(`('${platform.name}', '${platform.display_name}', 'Serviços para ${platform.display_name}', ${platform.service_count});`)
    })
    
    console.log('\n📋 TIPOS DE SERVIÇOS PARA BANCO DE DADOS:')
    console.log('=' .repeat(45))
    estruturaCompleta.service_types.forEach(serviceType => {
      console.log(`INSERT INTO service_types (name, display_name, description, service_count) VALUES`)
      console.log(`('${serviceType.name.toLowerCase()}', '${serviceType.display_name}', '${serviceType.display_name} para redes sociais', ${serviceType.service_count});`)
    })
    
    console.log('\n🎉 EXTRAÇÃO COMPLETA FINALIZADA!')
    console.log(`📄 Arquivo detalhado: ${outputFile}`)
    
  } catch (error) {
    console.error('❌ Erro:', error.message)
    process.exit(1)
  }
}

// Executar
extrairEstruturaCompleta().catch(console.error)
