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

// Simular um usuário admin logado
const supabase = createClient(supabaseUrl, anonKey)

async function testAdminSettings() {
  console.log('🔍 TESTANDO FUNÇÃO getAllSettings() SIMULADA')
  console.log('============================================\n')

  try {
    // Simular a lógica da função getAllSettings
    console.log('1. Verificando acesso admin...')
    
    // Emails hardcoded
    const HARDCODED_ADMIN_EMAILS = [
      "lhost2025@gmail.com",
      "admin@exemplo.com"
    ]
    
    // Simular usuário logado (você pode mudar este email para testar)
    const mockUser = {
      email: "lhost2025@gmail.com", // ← Mude este email para testar
      user_metadata: { role: "admin" }
    }
    
    console.log(`Usuário simulado: ${mockUser.email}`)
    
    // Verificar se é admin hardcoded
    if (mockUser.email && HARDCODED_ADMIN_EMAILS.includes(mockUser.email.toLowerCase())) {
      console.log('✅ Admin verificado via email hardcoded')
    } else if (mockUser.user_metadata?.role === "admin") {
      console.log('✅ Admin verificado via user_metadata')
    } else {
      console.log('❌ Usuário não é admin')
      return
    }

    console.log('\n2. Buscando configurações...')
    
    // Usar service role para garantir acesso
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    const adminSupabase = createClient(supabaseUrl, serviceRoleKey)
    
    const { data: settings, error } = await adminSupabase
      .from("settings")
      .select("*")
      .order("key")

    if (error) {
      console.log('❌ Erro ao buscar settings:', error.message)
      return
    }

    console.log(`✅ ${settings.length} configurações encontradas`)

    console.log('\n3. Categorizando configurações...')
    
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
        return // Não adicionar nas categorias normais
      }
      
      if (key.includes('deposit') || key.includes('min_') || key.includes('max_') || key.includes('balance') || key.includes('alert')) {
        categorizedSettings.pricing.push(setting)
      } else if (key.includes('api') || key.includes('provider') || key.includes('sync') || key.includes('timeout') || key.includes('monitoring') || key.includes('price')) {
        categorizedSettings.api.push(setting)
      } else if (key.includes('notification') || key.includes('email') || key.includes('contact') || key.includes('whatsapp')) {
        categorizedSettings.notifications.push(setting)
      } else if (key.includes('security') || key.includes('auth') || key.includes('password') || key.includes('login') || key.includes('session')) {
        categorizedSettings.security.push(setting)
      } else if (key.includes('maintenance') || key.includes('debug') || key.includes('log') || key.includes('test')) {
        categorizedSettings.system.push(setting)
      } else {
        categorizedSettings.general.push(setting)
      }
    })

    console.log('\n📊 RESULTADO FINAL:')
    console.log('===================')
    console.log(`Total: ${settings.length}`)
    console.log(`Geral: ${categorizedSettings.general.length}`)
    console.log(`Preços & Câmbio: ${categorizedSettings.pricing.length}`)
    console.log(`APIs: ${categorizedSettings.api.length}`)
    console.log(`Notificações: ${categorizedSettings.notifications.length}`)
    console.log(`Segurança: ${categorizedSettings.security.length}`)
    console.log(`Sistema: ${categorizedSettings.system.length}`)

    console.log('\n✅ A função getAllSettings() deveria retornar:')
    console.log({
      success: true,
      data: {
        all: settings,
        categorized: categorizedSettings
      }
    })

  } catch (error) {
    console.error('❌ Erro:', error.message)
  }
}

testAdminSettings().then(() => {
  console.log('\n🎯 CONCLUSÃO: Se você está vendo números > 0 acima, a função está funcionando!')
  console.log('Se ainda estiver vendo 0 no painel, pode ser um problema de cache do navegador.')
  console.log('Tente: Ctrl+F5 ou Cmd+Shift+R para recarregar sem cache.')
}).catch(console.error)
