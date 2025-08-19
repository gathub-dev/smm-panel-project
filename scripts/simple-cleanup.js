#!/usr/bin/env node

/**
 * Script de Limpeza Simples - SMM Panel
 * Não requer dependências externas, apenas Node.js nativo
 * USO: node scripts/simple-cleanup.js
 */

const https = require('https')
const http = require('http')

// Configuração
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ Erro: Configure as variáveis de ambiente:')
  console.error('   NEXT_PUBLIC_SUPABASE_URL')
  console.error('   SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

// Função para fazer requisições HTTP
function makeRequest(url, options, data = null) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https:') ? https : http
    
    const req = protocol.request(url, options, (res) => {
      let body = ''
      res.on('data', chunk => body += chunk)
      res.on('end', () => {
        try {
          const result = JSON.parse(body)
          resolve({ status: res.statusCode, data: result })
        } catch (e) {
          resolve({ status: res.statusCode, data: body })
        }
      })
    })
    
    req.on('error', reject)
    
    if (data) {
      req.write(JSON.stringify(data))
    }
    
    req.end()
  })
}

// Função para deletar de uma tabela
async function deleteFromTable(tableName) {
  const url = `${SUPABASE_URL}/rest/v1/${tableName}?id=neq.00000000-0000-0000-0000-000000000000`
  
  const options = {
    method: 'DELETE',
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=minimal'
    }
  }
  
  try {
    const result = await makeRequest(url, options)
    if (result.status >= 200 && result.status < 300) {
      console.log(`✅ ${tableName} limpa`)
      return true
    } else {
      console.log(`❌ Erro ao limpar ${tableName}: ${result.status}`)
      return false
    }
  } catch (error) {
    console.log(`❌ Erro ao limpar ${tableName}: ${error.message}`)
    return false
  }
}

// Função para resetar saldos
async function resetBalances() {
  const url = `${SUPABASE_URL}/rest/v1/users?balance=neq.0.00`
  
  const options = {
    method: 'PATCH',
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=minimal'
    }
  }
  
  const data = {
    balance: 0.00,
    updated_at: new Date().toISOString()
  }
  
  try {
    const result = await makeRequest(url, options, data)
    if (result.status >= 200 && result.status < 300) {
      console.log('✅ Saldos resetados')
      return true
    } else {
      console.log(`❌ Erro ao resetar saldos: ${result.status}`)
      return false
    }
  } catch (error) {
    console.log(`❌ Erro ao resetar saldos: ${error.message}`)
    return false
  }
}

// Função principal
async function cleanup() {
  console.log('🧹 Iniciando limpeza simples...\n')
  
  // Ordem de limpeza (respeitando foreign keys)
  const tables = [
    'transactions',
    'orders', 
    'services',
    'categories',
    'api_keys'
  ]
  
  // Limpar tabelas
  for (const table of tables) {
    await deleteFromTable(table)
    // Pequena pausa entre operações
    await new Promise(resolve => setTimeout(resolve, 500))
  }
  
  // Resetar saldos
  await resetBalances()
  
  console.log('\n🎉 Limpeza concluída!')
  console.log('✅ Dados transacionais removidos')
  console.log('✅ Saldos resetados para zero')
  console.log('🔒 Usuários e estruturas mantidos')
}

// Executar
cleanup().catch(error => {
  console.error('❌ Erro fatal:', error.message)
  process.exit(1)
})
