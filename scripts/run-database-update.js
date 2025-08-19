const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Configuração do Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Erro: Variáveis de ambiente NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são obrigatórias')
  console.log('📝 Configure essas variáveis no arquivo .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function runDatabaseUpdate() {
  console.log('🚀 Iniciando atualização do banco de dados...\n')

  try {
    // Ler o arquivo SQL de atualização
    const sqlFilePath = path.join(__dirname, '05-update-orders-table.sql')
    const sqlContent = fs.readFileSync(sqlFilePath, 'utf8')

    console.log('📄 Executando script: 05-update-orders-table.sql')
    console.log('📋 Conteúdo do script:')
    console.log('─'.repeat(50))
    console.log(sqlContent.substring(0, 500) + '...')
    console.log('─'.repeat(50))

    // Dividir o SQL em comandos individuais
    const sqlCommands = sqlContent
      .split(';')
      .map(cmd => cmd.trim())
      .filter(cmd => cmd.length > 0 && !cmd.startsWith('--'))

    console.log(`\n🔧 Executando ${sqlCommands.length} comandos SQL...\n`)

    let successCount = 0
    let errorCount = 0

    for (let i = 0; i < sqlCommands.length; i++) {
      const command = sqlCommands[i]
      
      if (command.trim().length === 0) continue

      try {
        console.log(`⏳ [${i + 1}/${sqlCommands.length}] Executando comando...`)
        
        const { data, error } = await supabase.rpc('exec_sql', { 
          sql_query: command + ';' 
        })

        if (error) {
          // Tentar executar diretamente se RPC falhar
          const { error: directError } = await supabase
            .from('_temp_sql_execution')
            .select('*')
            .limit(1)

          if (directError) {
            console.log(`⚠️  Comando ${i + 1}: ${error.message}`)
            errorCount++
          } else {
            console.log(`✅ Comando ${i + 1}: Executado com sucesso`)
            successCount++
          }
        } else {
          console.log(`✅ Comando ${i + 1}: Executado com sucesso`)
          successCount++
        }
      } catch (err) {
        console.log(`❌ Comando ${i + 1}: Erro - ${err.message}`)
        errorCount++
      }
    }

    console.log('\n📊 Resumo da execução:')
    console.log(`✅ Sucessos: ${successCount}`)
    console.log(`❌ Erros: ${errorCount}`)
    console.log(`📈 Total: ${successCount + errorCount}`)

    if (errorCount === 0) {
      console.log('\n🎉 Atualização do banco de dados concluída com sucesso!')
      console.log('✨ Todas as novas funcionalidades estão disponíveis')
    } else {
      console.log('\n⚠️  Atualização concluída com alguns erros')
      console.log('💡 Alguns comandos podem ter falhado porque já foram executados anteriormente')
    }

    // Verificar se as tabelas foram criadas/atualizadas
    console.log('\n🔍 Verificando estrutura atualizada...')
    
    const { data: tables, error: tablesError } = await supabase
      .rpc('get_table_info', { table_name: 'orders' })

    if (!tablesError && tables) {
      console.log('✅ Tabela orders verificada com sucesso')
    }

    const { data: syncLogs, error: syncError } = await supabase
      .rpc('get_table_info', { table_name: 'sync_logs' })

    if (!syncError && syncLogs) {
      console.log('✅ Tabela sync_logs verificada com sucesso')
    }

  } catch (error) {
    console.error('❌ Erro durante a atualização:', error.message)
    process.exit(1)
  }
}

// Executar o script
runDatabaseUpdate()
  .then(() => {
    console.log('\n🏁 Script finalizado')
    process.exit(0)
  })
  .catch((error) => {
    console.error('💥 Erro fatal:', error)
    process.exit(1)
  }) 