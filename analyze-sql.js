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

async function executeSQL(query, description) {
  console.log(`\n🔍 ${description}`)
  console.log('=' .repeat(50))
  
  try {
    const { data, error } = await supabase.rpc('exec_sql', { query })
    
    if (error) {
      console.log('❌ Erro:', error.message)
      return
    }
    
    if (data && Array.isArray(data) && data.length > 0) {
      console.table(data)
    } else {
      console.log('✅ Query executada com sucesso (sem resultados)')
    }
  } catch (error) {
    console.log('❌ Erro na execução:', error.message)
  }
}

async function analyzeWithSQL() {
  console.log('🔍 ANÁLISE SQL DO BANCO SUPABASE')
  console.log('================================\n')

  // 1. Listar todas as tabelas
  await executeSQL(`
    SELECT 
      table_name as "Tabela",
      pg_size_pretty(pg_total_relation_size(table_name::regclass)) as "Tamanho"
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
    ORDER BY table_name;
  `, 'TABELAS DISPONÍVEIS')

  // 2. Estrutura da tabela users
  await executeSQL(`
    SELECT 
      column_name as "Coluna",
      data_type as "Tipo",
      is_nullable as "Null?",
      column_default as "Padrão"
    FROM information_schema.columns 
    WHERE table_name = 'users' AND table_schema = 'public'
    ORDER BY ordinal_position;
  `, 'ESTRUTURA DA TABELA USERS')

  // 3. Relacionamentos
  await executeSQL(`
    SELECT 
      kcu.table_name as "Tabela Origem",
      kcu.column_name as "Coluna Origem",
      ccu.table_name as "Tabela Destino",
      ccu.column_name as "Coluna Destino"
    FROM information_schema.key_column_usage kcu
    JOIN information_schema.referential_constraints rc ON kcu.constraint_name = rc.constraint_name
    JOIN information_schema.constraint_column_usage ccu ON rc.unique_constraint_name = ccu.constraint_name
    WHERE kcu.table_schema = 'public'
    ORDER BY kcu.table_name;
  `, 'RELACIONAMENTOS (FOREIGN KEYS)')

  // 4. Políticas RLS
  await executeSQL(`
    SELECT 
      tablename as "Tabela",
      policyname as "Política",
      cmd as "Comando",
      roles as "Roles"
    FROM pg_policies 
    WHERE schemaname = 'public'
    ORDER BY tablename, policyname;
  `, 'POLÍTICAS RLS')

  // 5. Status do RLS
  await executeSQL(`
    SELECT 
      tablename as "Tabela",
      rowsecurity as "RLS Ativo"
    FROM pg_tables 
    WHERE schemaname = 'public'
    ORDER BY tablename;
  `, 'STATUS RLS')

  // 6. Tipos ENUM
  await executeSQL(`
    SELECT 
      t.typname as "Tipo",
      string_agg(e.enumlabel, ', ' ORDER BY e.enumsortorder) as "Valores"
    FROM pg_type t
    JOIN pg_enum e ON t.oid = e.enumtypid
    JOIN pg_namespace n ON t.typnamespace = n.oid
    WHERE n.nspname = 'public'
    GROUP BY t.typname
    ORDER BY t.typname;
  `, 'TIPOS ENUM')

  console.log('\n✅ Análise SQL concluída!')
}

// Executar análise
analyzeWithSQL().catch(error => {
  console.error('❌ Erro fatal:', error)
  process.exit(1)
})
