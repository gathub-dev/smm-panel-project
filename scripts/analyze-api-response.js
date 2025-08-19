#!/usr/bin/env node

/**
 * Script para analisar a resposta da API sem salvar nada
 * Apenas para ver como vem os dados e categorias
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

async function analyzeAPIResponse() {
  console.log('🔍 ANALISANDO RESPOSTA DA API MTP (SEM SALVAR)')
  console.log('=' .repeat(60))
  
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
    
    console.log('🔑 Fazendo requisição para API MTP...')
    console.log('🌐 URL:', apiKeys.api_url)
    
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
    
    if (!response.ok) {
      console.log('❌ Erro HTTP:', response.status)
      return
    }
    
    const data = await response.json()
    
    if (data.error) {
      console.log('❌ Erro da API:', data.error)
      return
    }
    
    console.log(`📊 Total de serviços recebidos: ${data.length}`)
    
    // Analisar categorias únicas
    const categories = new Set()
    const categoryCount = {}
    
    data.forEach(service => {
      if (service.category) {
        categories.add(service.category)
        categoryCount[service.category] = (categoryCount[service.category] || 0) + 1
      }
    })
    
    console.log(`\n📂 CATEGORIAS ENCONTRADAS (${categories.size} únicas):`)
    console.log('=' .repeat(50))
    
    // Mostrar todas as categorias com contagem
    Array.from(categories).sort().forEach(category => {
      console.log(`📁 ${category} (${categoryCount[category]} serviços)`)
    })
    
    console.log('\n🔍 ANÁLISE DETALHADA DOS PRIMEIROS 20 SERVIÇOS:')
    console.log('=' .repeat(60))
    
    data.slice(0, 20).forEach((service, i) => {
      console.log(`\n${i + 1}. 📋 SERVIÇO ID: ${service.service}`)
      console.log(`   📝 Nome: ${service.name}`)
      console.log(`   📂 Categoria: "${service.category}"`)
      console.log(`   💰 Preço: $${service.rate}`)
      console.log(`   📊 Min: ${service.min} | Max: ${service.max}`)
      console.log(`   🔄 Refill: ${service.refill}`)
      console.log(`   ❌ Cancel: ${service.cancel}`)
      console.log(`   ⚡ Dripfeed: ${service.dripfeed}`)
      console.log(`   🏷️ Tipo: ${service.type}`)
      
      // Mostrar todos os campos disponíveis
      console.log(`   🔧 Campos disponíveis: ${Object.keys(service).join(', ')}`)
    })
    
    // Buscar serviços de Instagram especificamente
    console.log('\n🔍 SERVIÇOS QUE CONTÊM "INSTAGRAM" NO NOME:')
    console.log('=' .repeat(50))
    
    const instagramServices = data.filter(service => 
      service.name.toLowerCase().includes('instagram')
    ).slice(0, 10)
    
    instagramServices.forEach((service, i) => {
      console.log(`\n${i + 1}. 📱 ${service.name}`)
      console.log(`   📂 Categoria: "${service.category}"`)
      console.log(`   💰 $${service.rate}`)
    })
    
    // Analisar padrões de nomes
    console.log('\n🔍 PADRÕES DE NOMES DE SERVIÇOS:')
    console.log('=' .repeat(40))
    
    const namePatterns = {
      'Likes': data.filter(s => s.name.toLowerCase().includes('likes')).length,
      'Followers': data.filter(s => s.name.toLowerCase().includes('followers')).length,
      'Views': data.filter(s => s.name.toLowerCase().includes('views')).length,
      'Comments': data.filter(s => s.name.toLowerCase().includes('comments')).length,
      'Instagram': data.filter(s => s.name.toLowerCase().includes('instagram')).length,
      'TikTok': data.filter(s => s.name.toLowerCase().includes('tiktok')).length,
      'YouTube': data.filter(s => s.name.toLowerCase().includes('youtube')).length,
      'Facebook': data.filter(s => s.name.toLowerCase().includes('facebook')).length,
    }
    
    Object.entries(namePatterns).forEach(([pattern, count]) => {
      if (count > 0) {
        console.log(`📊 ${pattern}: ${count} serviços`)
      }
    })
    
    console.log('\n🎯 CONCLUSÃO:')
    console.log('=' .repeat(30))
    console.log(`✅ API funcionando perfeitamente`)
    console.log(`📊 ${data.length} serviços disponíveis`)
    console.log(`📂 ${categories.size} categorias diferentes`)
    console.log(`🔍 Dados completos para análise`)
    
  } catch (error) {
    console.error('❌ Erro na análise:', error.message)
  }
}

// Executar análise
analyzeAPIResponse().catch(console.error)
