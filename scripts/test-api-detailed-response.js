#!/usr/bin/env node

/**
 * Script para testar diferentes parâmetros da API MTP
 * e verificar se há campos adicionais disponíveis
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

async function testAPIDetailedResponse() {
  console.log('🔍 TESTANDO DIFERENTES PARÂMETROS DA API MTP')
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
    
    console.log('🔑 Testando diferentes formatos de requisição...')
    console.log('🌐 URL:', apiKeys.api_url)
    
    // Teste 1: Requisição padrão (JSON)
    console.log('\n📋 TESTE 1: Requisição JSON padrão')
    console.log('-'.repeat(40))
    
    const response1 = await fetch(apiKeys.api_url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        key: apiKeys.api_key,
        action: 'services'
      })
    })
    
    const data1 = await response1.json()
    console.log(`📊 Total de serviços: ${data1.length}`)
    
    if (data1.length > 0) {
      console.log('🔧 Campos disponíveis no primeiro serviço:')
      console.log(Object.keys(data1[0]).join(', '))
      
      console.log('\n📝 Primeiro serviço completo:')
      console.log(JSON.stringify(data1[0], null, 2))
    }
    
    // Teste 2: Requisição form-data (como no PHP)
    console.log('\n📋 TESTE 2: Requisição form-data (como PHP)')
    console.log('-'.repeat(40))
    
    const formData = new URLSearchParams()
    formData.append('key', apiKeys.api_key)
    formData.append('action', 'services')
    
    const response2 = await fetch(apiKeys.api_url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: formData
    })
    
    const data2 = await response2.json()
    console.log(`📊 Total de serviços: ${data2.length}`)
    
    if (data2.length > 0) {
      console.log('🔧 Campos disponíveis no primeiro serviço:')
      console.log(Object.keys(data2[0]).join(', '))
      
      // Comparar se há diferenças
      const keys1 = Object.keys(data1[0]).sort()
      const keys2 = Object.keys(data2[0]).sort()
      
      if (JSON.stringify(keys1) === JSON.stringify(keys2)) {
        console.log('✅ Mesmos campos em ambos os formatos')
      } else {
        console.log('⚠️ Campos diferentes entre formatos!')
        console.log('JSON:', keys1)
        console.log('Form-data:', keys2)
      }
    }
    
    // Teste 3: Tentar outros parâmetros
    console.log('\n📋 TESTE 3: Testando parâmetros adicionais')
    console.log('-'.repeat(40))
    
    const additionalParams = [
      { detailed: true },
      { format: 'detailed' },
      { include_description: true },
      { full: true },
      { extended: true }
    ]
    
    for (const params of additionalParams) {
      try {
        console.log(`🧪 Testando parâmetros:`, params)
        
        const testBody = {
          key: apiKeys.api_key,
          action: 'services',
          ...params
        }
        
        const testResponse = await fetch(apiKeys.api_url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(testBody)
        })
        
        const testData = await testResponse.json()
        
        if (Array.isArray(testData) && testData.length > 0) {
          const testKeys = Object.keys(testData[0])
          const originalKeys = Object.keys(data1[0])
          
          if (testKeys.length > originalKeys.length) {
            console.log('🎉 ENCONTROU CAMPOS ADICIONAIS!')
            console.log('Novos campos:', testKeys.filter(k => !originalKeys.includes(k)))
            console.log('Primeiro serviço com novos campos:')
            console.log(JSON.stringify(testData[0], null, 2))
          } else {
            console.log('❌ Nenhum campo adicional')
          }
        } else {
          console.log('❌ Resposta inválida ou erro')
        }
      } catch (error) {
        console.log('❌ Erro no teste:', error.message)
      }
    }
    
    // Teste 4: Analisar serviços específicos com nomes longos
    console.log('\n📋 TESTE 4: Analisando serviços com descrições no nome')
    console.log('-'.repeat(40))
    
    const servicesWithLongNames = data1
      .filter(s => s.name.length > 100)
      .slice(0, 3)
    
    servicesWithLongNames.forEach((service, i) => {
      console.log(`\n${i + 1}. 📋 SERVIÇO ID: ${service.service}`)
      console.log(`   📏 Tamanho do nome: ${service.name.length} caracteres`)
      console.log(`   📝 Nome completo:`)
      console.log(`   "${service.name}"`)
      
      // Tentar extrair informações do nome
      const nameAnalysis = analyzeServiceName(service.name)
      if (Object.keys(nameAnalysis).length > 0) {
        console.log(`   🔍 Informações extraídas do nome:`)
        Object.entries(nameAnalysis).forEach(([key, value]) => {
          console.log(`      ${key}: ${value}`)
        })
      }
    })
    
    console.log('\n🎯 CONCLUSÃO:')
    console.log('=' .repeat(30))
    console.log(`✅ API retorna apenas ${Object.keys(data1[0]).length} campos básicos`)
    console.log(`📝 Informações detalhadas estão no campo "name"`)
    console.log(`🔧 Necessário parser para extrair dados do nome`)
    
  } catch (error) {
    console.error('❌ Erro na análise:', error.message)
  }
}

// Função para analisar o nome do serviço e extrair informações
function analyzeServiceName(name) {
  const analysis = {}
  
  // Extrair emojis de qualidade
  const qualityEmojis = {
    '🟢': 'MÉDIO',
    '🟡': 'BÁSICO', 
    '🔵': 'PREMIUM',
    '🟠': 'ALTO',
    '🔴': 'MÁXIMO'
  }
  
  for (const [emoji, tier] of Object.entries(qualityEmojis)) {
    if (name.includes(emoji)) {
      analysis.qualityTier = tier
      break
    }
  }
  
  // Extrair informações de reposição
  if (name.includes('Lifetime Guaranteed') || name.includes('Garantia Vitalícia')) {
    analysis.guarantee = 'Vitalícia'
  } else if (name.includes('30 Day') || name.includes('30 Dia')) {
    analysis.guarantee = '30 dias'
  } else if (name.includes('No Refill') || name.includes('Sem Reposição')) {
    analysis.guarantee = 'Sem reposição'
  }
  
  // Extrair velocidade
  const speedMatch = name.match(/Speed:?\s*([^|]+)/i) || name.match(/Velocidade:?\s*([^|]+)/i)
  if (speedMatch) {
    analysis.speed = speedMatch[1].trim()
  }
  
  // Extrair tempo de início
  const startMatch = name.match(/Start:?\s*([^|]+)/i) || name.match(/Início:?\s*([^|]+)/i)
  if (startMatch) {
    analysis.startTime = startMatch[1].trim()
  }
  
  // Extrair máximo
  const maxMatch = name.match(/Max:?\s*([^|]+)/i) || name.match(/Máx:?\s*([^|]+)/i)
  if (maxMatch) {
    analysis.maxAmount = maxMatch[1].trim()
  }
  
  return analysis
}

// Executar análise
testAPIDetailedResponse().catch(console.error)
