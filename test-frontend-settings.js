const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Carregar variáveis de ambiente
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

console.log('🔍 TESTE ESPECÍFICO - PROBLEMA DO FRONTEND')
console.log('==========================================\n')

async function testFrontendScenario() {
  try {
    console.log('1. 🧪 SIMULANDO CENÁRIO DO FRONTEND:')
    console.log('   - Usando cliente anônimo (como no frontend)')
    console.log('   - Simulando usuário logado com email hardcoded')
    
    // Cliente como o frontend usa
    const supabase = createClient(supabaseUrl, anonKey)
    
    // Simular usuário logado
    const mockUser = {
      id: '5dd0f702-0e99-4f6b-b32c-a4d76bf66bdd',
      email: 'lhost2025@gmail.com',
      user_metadata: { role: 'admin' }
    }
    
    console.log(`   - Usuário: ${mockUser.email}`)
    
    // 2. Testar acesso às configurações como usuário anônimo
    console.log('\n2. 🔐 TESTANDO ACESSO COMO USUÁRIO ANÔNIMO:')
    const { data: settingsAnon, error: anonError } = await supabase
      .from('settings')
      .select('*')
      .limit(5)
    
    if (anonError) {
      console.log('   ❌ Erro com cliente anônimo:', anonError.message)
      console.log('   💡 RLS está bloqueando acesso - ESTE É O PROBLEMA!')
      
      // 3. Confirmar com service role
      console.log('\n3. 🔑 CONFIRMANDO COM SERVICE ROLE:')
      const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
      const adminSupabase = createClient(supabaseUrl, serviceRoleKey)
      
      const { data: settingsAdmin, error: adminError } = await adminSupabase
        .from('settings')
        .select('*')
        .limit(5)
      
      if (!adminError && settingsAdmin.length > 0) {
        console.log('   ✅ Service role funciona:', settingsAdmin.length, 'configurações')
        console.log('   🎯 DIAGNÓSTICO: RLS bloqueia frontend, mas service role funciona')
        
        console.log('\n4. 🛠️ SOLUÇÕES POSSÍVEIS:')
        console.log('   A) Criar política RLS para usuários autenticados')
        console.log('   B) Usar service role no backend (server actions)')
        console.log('   C) Desabilitar RLS temporariamente para tabela settings')
        
        console.log('\n5. 📋 TESTANDO SOLUÇÃO B (Service Role no Backend):')
        console.log('   - A função getAllSettings() já deveria usar service role')
        console.log('   - Vamos verificar se está funcionando...')
        
        // Simular a função getAllSettings
        const categorizedSettings = {
          general: [],
          pricing: [],
          api: [],
          notifications: [],
          security: [],
          system: []
        }

        const allSettings = await adminSupabase
          .from('settings')
          .select('*')
          .order('key')
        
        if (allSettings.data) {
          allSettings.data.forEach(setting => {
            const key = setting.key.toLowerCase()
            
            if (key === 'currency_mode' || key === 'usd_brl_rate' || key === 'markup_percentage') {
              return
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
          
          console.log('   ✅ Categorização funcionando:')
          console.log(`      Total: ${allSettings.data.length}`)
          console.log(`      Geral: ${categorizedSettings.general.length}`)
          console.log(`      Preços: ${categorizedSettings.pricing.length}`)
          console.log(`      APIs: ${categorizedSettings.api.length}`)
          console.log(`      Notificações: ${categorizedSettings.notifications.length}`)
          console.log(`      Sistema: ${categorizedSettings.system.length}`)
          
          console.log('\n6. 🚨 CONCLUSÃO:')
          console.log('   - Backend funciona (service role)')
          console.log('   - Frontend falha (RLS bloqueia)')
          console.log('   - Problema: getAllSettings() não está sendo chamada corretamente')
          console.log('   - OU: Verificação de admin está falhando no frontend')
        }
      }
    } else {
      console.log('   ✅ Acesso anônimo funcionando:', settingsAnon.length, 'configurações')
      console.log('   💡 RLS não está bloqueando - problema pode ser outro')
    }
    
  } catch (error) {
    console.error('❌ Erro:', error.message)
  }
}

testFrontendScenario().then(() => {
  console.log('\n🎯 PRÓXIMOS PASSOS:')
  console.log('1. Verificar se getAllSettings() está sendo chamada')
  console.log('2. Verificar se checkAdminAccess() está funcionando')
  console.log('3. Verificar logs do console no navegador (F12)')
  console.log('4. Considerar desabilitar RLS temporariamente')
}).catch(console.error)
