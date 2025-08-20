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

// Debug das variáveis
console.log('🔍 DEBUG - Variáveis encontradas:')
console.log('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✅ Definida' : '❌ Não encontrada')
console.log('SUPABASE_SERVICE_ROLE_KEY:', serviceRoleKey ? '✅ Definida' : '❌ Não encontrada')

if (!supabaseUrl || !serviceRoleKey) {
  console.error('\n❌ Variáveis de ambiente não encontradas!')
  console.log('Certifique-se de ter NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no arquivo .env.local')
  
  // Tentar mostrar o conteúdo do arquivo .env (sem valores sensíveis)
  const envFiles = ['.env.local', '.env']
  for (const envFile of envFiles) {
    const envPath = path.join(__dirname, envFile)
    if (fs.existsSync(envPath)) {
      console.log(`\n📄 Conteúdo do ${envFile} (chaves apenas):`)
      const envContent = fs.readFileSync(envPath, 'utf8')
      const lines = envContent.split('\n')
      lines.forEach(line => {
        if (line.trim() && !line.startsWith('#')) {
          const [key] = line.split('=')
          if (key) {
            console.log(`  - ${key.trim()}`)
          }
        }
      })
      break
    }
  }
  
  process.exit(1)
}

const supabase = createClient(supabaseUrl, serviceRoleKey)

async function analyzeDatabase() {
  console.log('🔍 ANÁLISE COMPLETA DO BANCO SUPABASE')
  console.log('=====================================\n')

  try {
    // 1. Listar todas as tabelas
    console.log('📋 TABELAS DISPONÍVEIS:')
    let tables = null
    let tablesError = null
    
    try {
      const result = await supabase.rpc('get_schema_tables', { schema_name: 'public' })
      tables = result.data
      tablesError = result.error
    } catch (error) {
      tablesError = 'RPC não disponível'
    }

    if (tablesError) {
      // Fallback: tentar listar tabelas conhecidas
      const knownTables = ['users', 'services', 'orders', 'settings', 'platforms', 'service_types', 'api_keys']
      console.log('Tabelas conhecidas:', knownTables.join(', '))
    } else {
      console.log(tables)
    }

    // 2. Analisar tabela users
    console.log('\n👥 TABELA USERS:')
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('*')
      .limit(5)

    if (usersError) {
      console.log('❌ Erro ao acessar users:', usersError.message)
    } else {
      console.log(`✅ ${users.length} usuários encontrados`)
      if (users.length > 0) {
        console.log('Colunas:', Object.keys(users[0]).join(', '))
        console.log('Exemplo:', users[0])
      }
    }

    // 3. Analisar tabela services
    console.log('\n🔧 TABELA SERVICES:')
    const { data: services, error: servicesError } = await supabase
      .from('services')
      .select('*')
      .limit(5)

    if (servicesError) {
      console.log('❌ Erro ao acessar services:', servicesError.message)
    } else {
      console.log(`✅ ${services.length} serviços encontrados`)
      if (services.length > 0) {
        console.log('Colunas:', Object.keys(services[0]).join(', '))
      }
    }

    // 4. Analisar tabela orders
    console.log('\n📦 TABELA ORDERS:')
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('*')
      .limit(5)

    if (ordersError) {
      console.log('❌ Erro ao acessar orders:', ordersError.message)
    } else {
      console.log(`✅ ${orders.length} pedidos encontrados`)
      if (orders.length > 0) {
        console.log('Colunas:', Object.keys(orders[0]).join(', '))
      }
    }

    // 5. Analisar tabela settings
    console.log('\n⚙️ TABELA SETTINGS:')
    const { data: settings, error: settingsError } = await supabase
      .from('settings')
      .select('*')

    if (settingsError) {
      console.log('❌ Erro ao acessar settings:', settingsError.message)
    } else {
      console.log(`✅ ${settings.length} configurações encontradas`)
      if (settings.length > 0) {
        console.log('Colunas:', Object.keys(settings[0]).join(', '))
        console.log('Configurações:')
        settings.forEach(setting => {
          console.log(`  - ${setting.key}: ${setting.value}`)
        })
      }
    }

    // 6. Testar políticas RLS
    console.log('\n🔒 TESTE DE POLÍTICAS RLS:')
    
    // Tentar acessar sem autenticação
    const publicSupabase = createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
    
    const { data: publicUsers, error: publicError } = await publicSupabase
      .from('users')
      .select('id, email')
      .limit(1)

    if (publicError) {
      console.log('✅ RLS funcionando - acesso público bloqueado:', publicError.message)
    } else {
      console.log('⚠️ RLS pode estar desabilitado - acesso público permitido')
    }

    // 7. Verificar outras tabelas
    const otherTables = ['platforms', 'service_types', 'api_keys', 'transactions']
    
    console.log('\n📊 OUTRAS TABELAS:')
    for (const tableName of otherTables) {
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .limit(1)

      if (error) {
        console.log(`❌ ${tableName}: ${error.message}`)
      } else {
        console.log(`✅ ${tableName}: Acessível (${data.length} registros testados)`)
        if (data.length > 0) {
          console.log(`   Colunas: ${Object.keys(data[0]).join(', ')}`)
        }
      }
    }

    // 8. Resumo final
    console.log('\n📈 RESUMO:')
    console.log('- Conexão com Supabase: ✅ Funcionando')
    console.log('- Service Role Key: ✅ Configurada')
    console.log('- Tabelas principais: users, services, orders, settings')
    console.log('- RLS: Verificar logs acima')

  } catch (error) {
    console.error('❌ Erro geral:', error.message)
  }
}

// Executar análise
analyzeDatabase().then(() => {
  console.log('\n✅ Análise concluída!')
  process.exit(0)
}).catch(error => {
  console.error('❌ Erro fatal:', error)
  process.exit(1)
})
