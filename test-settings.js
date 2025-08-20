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
      
      console.log(`✅ Arquivo ${envFile} carregado`)
      loaded = true
      break
    }
  }
  
  if (!loaded) {
    console.log('⚠️ Nenhum arquivo .env encontrado')
  }
}

// Carregar variáveis de ambiente
loadEnvFile()

// Configuração do Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Variáveis de ambiente não encontradas!')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, serviceRoleKey)

async function testSettings() {
  console.log('🔍 TESTANDO CONFIGURAÇÕES')
  console.log('========================\n')

  try {
    // 1. Buscar todas as configurações
    console.log('📋 Buscando todas as configurações...')
    const { data: settings, error } = await supabase
      .from("settings")
      .select("*")
      .order("key")

    if (error) {
      console.log('❌ Erro ao buscar settings:', error.message)
      return
    }

    console.log(`✅ ${settings.length} configurações encontradas`)
    
    // 2. Mostrar algumas configurações
    console.log('\n📄 Primeiras 5 configurações:')
    settings.slice(0, 5).forEach(setting => {
      console.log(`  - ${setting.key}: ${setting.value}`)
    })

    // 3. Testar categorização
    console.log('\n🏷️ TESTANDO CATEGORIZAÇÃO:')
    
    const categorizedSettings = {
      general: [],
      pricing: [],
      api: [],
      notifications: [],
      security: [],
      system: []
    }

    settings.forEach(setting => {
      const key = setting.key.toLowerCase()
      
      // Pular configurações que são exibidas na seção especial de câmbio
      if (key === 'currency_mode' || key === 'usd_brl_rate' || key === 'markup_percentage') {
        console.log(`⏭️ PULANDO (seção câmbio): ${setting.key}`)
        return // Não adicionar nas categorias normais
      }
      
      if (key.includes('deposit') || key.includes('min_') || key.includes('max_') || key.includes('balance') || key.includes('alert')) {
        console.log(`💰 PRICING: ${setting.key}`)
        categorizedSettings.pricing.push(setting)
      } else if (key.includes('api') || key.includes('provider') || key.includes('sync') || key.includes('timeout') || key.includes('monitoring') || key.includes('price')) {
        console.log(`🔌 API: ${setting.key}`)
        categorizedSettings.api.push(setting)
      } else if (key.includes('notification') || key.includes('email') || key.includes('contact') || key.includes('whatsapp')) {
        console.log(`🔔 NOTIFICATIONS: ${setting.key}`)
        categorizedSettings.notifications.push(setting)
      } else if (key.includes('security') || key.includes('auth') || key.includes('password') || key.includes('login') || key.includes('session')) {
        console.log(`🔒 SECURITY: ${setting.key}`)
        categorizedSettings.security.push(setting)
      } else if (key.includes('maintenance') || key.includes('debug') || key.includes('log') || key.includes('test')) {
        console.log(`⚙️ SYSTEM: ${setting.key}`)
        categorizedSettings.system.push(setting)
      } else {
        console.log(`🌐 GENERAL: ${setting.key}`)
        categorizedSettings.general.push(setting)
      }
    })

    // 4. Mostrar resultado da categorização
    console.log('\n📊 RESULTADO DA CATEGORIZAÇÃO:')
    console.log('================================')
    console.log(`Total: ${settings.length}`)
    console.log(`Geral: ${categorizedSettings.general.length}`)
    console.log(`Preços & Câmbio: ${categorizedSettings.pricing.length}`)
    console.log(`APIs: ${categorizedSettings.api.length}`)
    console.log(`Notificações: ${categorizedSettings.notifications.length}`)
    console.log(`Segurança: ${categorizedSettings.security.length}`)
    console.log(`Sistema: ${categorizedSettings.system.length}`)

    // 5. Detalhes por categoria
    console.log('\n📋 DETALHES POR CATEGORIA:')
    console.log('==========================')
    
    Object.entries(categorizedSettings).forEach(([category, items]) => {
      if (items.length > 0) {
        console.log(`\n${category.toUpperCase()} (${items.length}):`)
        items.forEach(item => {
          console.log(`  - ${item.key}: ${item.description || 'Sem descrição'}`)
        })
      }
    })

  } catch (error) {
    console.error('❌ Erro geral:', error.message)
  }
}

// Executar teste
testSettings().then(() => {
  console.log('\n✅ Teste concluído!')
  process.exit(0)
}).catch(error => {
  console.error('❌ Erro fatal:', error)
  process.exit(1)
})
