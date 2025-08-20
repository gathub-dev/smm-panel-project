const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Carregar variáveis de ambiente do .env
function loadEnvFile() {
  const envFiles = ['.env.local', '.env']
  let loaded = false
  
  for (const envFile of envFiles) {
    const envPath = path.join(__dirname, envFile)
    
    if (fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, 'utf8')
      const lines = envContent.split('\n')
      
      lines.forEach(line => {
        const [key, ...valueParts] = line.split('=')
        if (key && valueParts.length > 0) {
          const value = valueParts.join('=').trim().replace(/^["']|["']$/g, '')
          process.env[key.trim()] = value
        }
      })
      
      loaded = true
      break
    }
  }
}

loadEnvFile()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

console.log('🔍 DEBUG COMPLETO - SETTINGS E APIs')
console.log('===================================\n')

async function debugComplete() {
  try {
    // 1. Testar conexão básica
    console.log('1. 🔌 TESTANDO CONEXÃO BÁSICA:')
    const supabase = createClient(supabaseUrl, anonKey)
    
    // Simular usuário logado
    console.log('   - URL Supabase:', supabaseUrl ? '✅ Definida' : '❌ Não definida')
    console.log('   - Anon Key:', anonKey ? '✅ Definida' : '❌ Não definida')
    
    // 2. Testar acesso às configurações (como usuário anônimo)
    console.log('\n2. ⚙️ TESTANDO ACESSO ÀS CONFIGURAÇÕES:')
    const { data: settingsPublic, error: settingsError } = await supabase
      .from('settings')
      .select('*')
      .limit(5)
    
    if (settingsError) {
      console.log('   ❌ Erro com usuário anônimo:', settingsError.message)
      console.log('   💡 Isso é esperado se RLS estiver ativo')
    } else {
      console.log('   ✅ Acesso público às configurações permitido')
      console.log('   📊 Configurações encontradas:', settingsPublic.length)
    }
    
    // 3. Testar com service role
    console.log('\n3. 🔑 TESTANDO COM SERVICE ROLE:')
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!serviceRoleKey) {
      console.log('   ❌ Service Role Key não encontrada')
      return
    }
    
    const adminSupabase = createClient(supabaseUrl, serviceRoleKey)
    const { data: settingsAdmin, error: adminError } = await adminSupabase
      .from('settings')
      .select('*')
      .order('key')
    
    if (adminError) {
      console.log('   ❌ Erro com service role:', adminError.message)
      return
    }
    
    console.log('   ✅ Service role funcionando')
    console.log('   📊 Total de configurações:', settingsAdmin.length)
    
    // 4. Simular a categorização exata do código
    console.log('\n4. 🏷️ SIMULANDO CATEGORIZAÇÃO EXATA:')
    
    const categorizedSettings = {
      general: [],
      pricing: [],
      api: [],
      notifications: [],
      security: [],
      system: []
    }

    settingsAdmin.forEach(setting => {
      const key = setting.key.toLowerCase()
      
      // Pular configurações que são exibidas na seção especial de câmbio
      if (key === 'currency_mode' || key === 'usd_brl_rate' || key === 'markup_percentage') {
        console.log(`   ⏭️ PULANDO (câmbio): ${setting.key}`)
        return // Não adicionar nas categorias normais
      }
      
      if (key.includes('deposit') || key.includes('min_') || key.includes('max_') || key.includes('balance') || key.includes('alert')) {
        console.log(`   💰 PRICING: ${setting.key}`)
        categorizedSettings.pricing.push(setting)
      } else if (key.includes('api') || key.includes('provider') || key.includes('sync') || key.includes('timeout') || key.includes('monitoring') || key.includes('price')) {
        console.log(`   🔌 API: ${setting.key}`)
        categorizedSettings.api.push(setting)
      } else if (key.includes('notification') || key.includes('email') || key.includes('contact') || key.includes('whatsapp')) {
        console.log(`   🔔 NOTIFICATIONS: ${setting.key}`)
        categorizedSettings.notifications.push(setting)
      } else if (key.includes('security') || key.includes('auth') || key.includes('password') || key.includes('login') || key.includes('session')) {
        console.log(`   🔒 SECURITY: ${setting.key}`)
        categorizedSettings.security.push(setting)
      } else if (key.includes('maintenance') || key.includes('debug') || key.includes('log') || key.includes('test')) {
        console.log(`   ⚙️ SYSTEM: ${setting.key}`)
        categorizedSettings.system.push(setting)
      } else {
        console.log(`   🌐 GENERAL: ${setting.key}`)
        categorizedSettings.general.push(setting)
      }
    })
    
    console.log('\n📊 RESULTADO DA CATEGORIZAÇÃO:')
    console.log('================================')
    console.log(`Total: ${settingsAdmin.length}`)
    console.log(`Geral: ${categorizedSettings.general.length}`)
    console.log(`Preços & Câmbio: ${categorizedSettings.pricing.length}`)
    console.log(`APIs: ${categorizedSettings.api.length}`)
    console.log(`Notificações: ${categorizedSettings.notifications.length}`)
    console.log(`Segurança: ${categorizedSettings.security.length}`)
    console.log(`Sistema: ${categorizedSettings.system.length}`)
    
    // 5. Testar API Keys (para status MTP/JAP)
    console.log('\n5. 🔑 TESTANDO STATUS DAS APIs (MTP/JAP):')
    const { data: apiKeys, error: apiError } = await adminSupabase
      .from('api_keys')
      .select('*')
    
    if (apiError) {
      console.log('   ❌ Erro ao buscar API keys:', apiError.message)
    } else {
      console.log('   ✅ API keys encontradas:', apiKeys.length)
      apiKeys.forEach(key => {
        console.log(`   - ${key.provider.toUpperCase()}: ${key.is_active ? '🟢 Ativa' : '🔴 Inativa'}`)
        console.log(`     Key: ${key.api_key.substring(0, 10)}...`)
        console.log(`     Último teste: ${key.last_tested || 'Nunca'}`)
      })
    }
    
    // 6. Verificar se há problemas de CORS ou autenticação
    console.log('\n6. 🌐 DIAGNÓSTICO FINAL:')
    console.log('========================')
    
    if (settingsAdmin.length > 0 && categorizedSettings.general.length === 0 && 
        categorizedSettings.pricing.length === 0 && categorizedSettings.api.length === 0) {
      console.log('❌ PROBLEMA: Configurações existem mas categorização falhou')
      console.log('💡 Verifique a lógica de categorização no frontend')
    } else if (settingsAdmin.length > 0) {
      console.log('✅ BACKEND: Configurações e categorização funcionando')
      console.log('💡 Se frontend mostra 0, pode ser:')
      console.log('   - Problema de autenticação no frontend')
      console.log('   - Cache do navegador')
      console.log('   - Erro JavaScript no console')
    } else {
      console.log('❌ PROBLEMA: Nenhuma configuração encontrada no banco')
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error.message)
  }
}

debugComplete().then(() => {
  console.log('\n🎯 PRÓXIMOS PASSOS:')
  console.log('==================')
  console.log('1. Verifique o console do navegador (F12) por erros JavaScript')
  console.log('2. Faça hard refresh: Ctrl+F5 ou Cmd+Shift+R')
  console.log('3. Verifique se o usuário está logado corretamente')
  console.log('4. Se ainda não funcionar, há problema na verificação de admin no frontend')
}).catch(console.error)
