#!/usr/bin/env node

/**
 * Script para puxar estrutura real da API MoreThanPanel
 * Usa as configurações do Supabase para buscar a chave ativa
 */

require('dotenv').config()
const { createClient } = require('@supabase/supabase-js')

async function puxarEstruturaAPI() {
  console.log('🔍 PUXANDO ESTRUTURA REAL DA API MORETHANPANEL...\n')
  
  try {
    // Verificar variáveis de ambiente
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    
    if (!supabaseUrl || !supabaseKey) {
      console.error('❌ Faltam variáveis de ambiente:')
      console.error('   NEXT_PUBLIC_SUPABASE_URL:', !!supabaseUrl)
      console.error('   SUPABASE_SERVICE_ROLE_KEY:', !!supabaseKey)
      process.exit(1)
    }
    
    console.log('✅ Variáveis de ambiente encontradas')
    
    // Conectar ao Supabase
    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
    
    console.log('🔑 Buscando chave MTP ativa...')
    
    // Buscar chave MTP ativa
    const { data: apiKey, error } = await supabase
      .from('api_keys')
      .select('*')
      .eq('provider', 'mtp')
      .eq('is_active', true)
      .single()
    
    if (error || !apiKey) {
      console.error('❌ MTP API key não encontrada em api_keys')
      console.error('   Erro:', error?.message)
      console.log('\n💡 Verifique se existe uma chave MTP ativa na tabela api_keys')
      process.exit(1)
    }
    
    console.log('✅ Chave MTP encontrada:', apiKey.api_key.substring(0, 8) + '...')
    console.log('🌐 URL da API:', apiKey.api_url || 'https://morethanpanel.com/api/v2')
    
    // Fazer requisição para API
    console.log('\n📡 Fazendo requisição para API...')
    
    const apiUrl = apiKey.api_url || 'https://morethanpanel.com/api/v2'
    const body = new URLSearchParams({
      key: apiKey.api_key,
      action: 'services'
    }).toString()
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'SMM-Panel-Analysis/1.0'
      },
      body: body
    })
    
    if (!response.ok) {
      console.error('❌ Erro HTTP:', response.status, response.statusText)
      process.exit(1)
    }
    
    const responseText = await response.text()
    console.log('📄 Resposta recebida (primeiros 200 chars):', responseText.substring(0, 200))
    
    // Tentar parsear JSON
    let services
    try {
      services = JSON.parse(responseText)
    } catch (parseError) {
      console.error('❌ Erro ao parsear JSON:', parseError.message)
      console.log('📄 Resposta completa:', responseText)
      process.exit(1)
    }
    
    // Verificar se é array
    if (!Array.isArray(services)) {
      console.error('❌ Resposta não é um array de serviços')
      console.log('📊 Tipo da resposta:', typeof services)
      console.log('📄 Conteúdo:', JSON.stringify(services, null, 2))
      process.exit(1)
    }
    
    console.log('✅ JSON parseado com sucesso!')
    console.log('📊 Total de serviços:', services.length)
    
    // Analisar categorias únicas
    const categories = [...new Set(services.map(s => s.category).filter(Boolean))]
    console.log('📂 Categorias únicas:', categories.length)
    
    console.log('\n🎯 PRIMEIRAS 20 CATEGORIAS:')
    console.log('=' .repeat(50))
    categories.slice(0, 20).forEach((cat, i) => {
      const count = services.filter(s => s.category === cat).length
      console.log(`${i + 1}. "${cat}" (${count} serviços)`)
    })
    
    console.log('\n🔍 SAMPLE DOS PRIMEIROS 3 SERVIÇOS:')
    console.log('=' .repeat(60))
    console.log(JSON.stringify(services.slice(0, 3), null, 2))
    
    // Analisar campos disponíveis
    const allFields = new Set()
    services.slice(0, 100).forEach(service => {
      Object.keys(service).forEach(field => allFields.add(field))
    })
    
    console.log('\n🔧 CAMPOS DISPONÍVEIS NOS SERVIÇOS:')
    console.log('=' .repeat(40))
    console.log(Array.from(allFields).sort().join(', '))
    
    // Analisar padrões de plataformas
    const platformPatterns = {
      'Instagram': services.filter(s => s.name?.toLowerCase().includes('instagram')).length,
      'TikTok': services.filter(s => s.name?.toLowerCase().includes('tiktok')).length,
      'YouTube': services.filter(s => s.name?.toLowerCase().includes('youtube')).length,
      'Facebook': services.filter(s => s.name?.toLowerCase().includes('facebook')).length,
      'Twitter': services.filter(s => s.name?.toLowerCase().includes('twitter')).length,
      'Spotify': services.filter(s => s.name?.toLowerCase().includes('spotify')).length,
    }
    
    console.log('\n📱 PADRÕES DE PLATAFORMAS (por nome do serviço):')
    console.log('=' .repeat(45))
    Object.entries(platformPatterns).forEach(([platform, count]) => {
      if (count > 0) {
        console.log(`📊 ${platform}: ${count} serviços`)
      }
    })
    
    // Analisar tipos de serviços
    const serviceTypePatterns = {
      'Followers': services.filter(s => s.name?.toLowerCase().includes('followers')).length,
      'Likes': services.filter(s => s.name?.toLowerCase().includes('likes')).length,
      'Views': services.filter(s => s.name?.toLowerCase().includes('views')).length,
      'Comments': services.filter(s => s.name?.toLowerCase().includes('comments')).length,
      'Subscribers': services.filter(s => s.name?.toLowerCase().includes('subscribers')).length,
      'Shares': services.filter(s => s.name?.toLowerCase().includes('shares')).length,
    }
    
    console.log('\n🛍️ PADRÕES DE TIPOS DE SERVIÇOS (por nome):')
    console.log('=' .repeat(45))
    Object.entries(serviceTypePatterns).forEach(([type, count]) => {
      if (count > 0) {
        console.log(`📊 ${type}: ${count} serviços`)
      }
    })
    
    console.log('\n🎉 ANÁLISE COMPLETA!')
    console.log('=' .repeat(30))
    console.log(`✅ API funcionando: ${services.length} serviços`)
    console.log(`📂 ${categories.length} categorias diferentes`)
    console.log(`🔧 ${allFields.size} campos por serviço`)
    console.log(`📊 Dados prontos para estruturação do banco`)
    
  } catch (error) {
    console.error('❌ Erro geral:', error.message)
    console.error('📍 Stack:', error.stack)
    process.exit(1)
  }
}

// Executar
puxarEstruturaAPI().catch(console.error)
