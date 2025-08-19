const { createClient } = require('@supabase/supabase-js')

// Configuração do Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variáveis de ambiente não encontradas!')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function addShopFields() {
  console.log('🚀 [FASE 1] Verificando e adicionando campos para sistema de loja...\n')

  try {
    // 1. Primeiro, vamos verificar a estrutura atual da tabela
    console.log('📊 Verificando estrutura atual da tabela services...')
    const { data: existingServices, error: fetchError } = await supabase
      .from('services')
      .select('*')
      .limit(1)

    if (fetchError) {
      console.error('❌ Erro ao acessar tabela services:', fetchError)
      return
    }

    const sampleService = existingServices[0]
    console.log('📋 Campos atuais na tabela services:')
    Object.keys(sampleService).forEach(key => {
      console.log(`   • ${key}`)
    })

    // 2. Vamos tentar adicionar os campos usando UPDATE (se não existirem, vai dar erro)
    console.log('\n🔧 Tentando adicionar novos campos...')
    
    // Teste se os campos já existem tentando fazer um update
    const testService = existingServices[0]
    
    try {
      const { error: testError } = await supabase
        .from('services')
        .update({
          featured: false,
          lp_visible: false,
          quantities: [100, 250, 500],
          shop_category: 'outros'
        })
        .eq('id', testService.id)

      if (testError) {
        console.log('⚠️  Campos não existem ainda. Erro esperado:', testError.message)
        console.log('\n📝 INSTRUÇÕES PARA ADICIONAR OS CAMPOS:')
        console.log('Como não posso executar ALTER TABLE diretamente, você precisa:')
        console.log('\n1. Acesse o painel do Supabase (https://supabase.com)')
        console.log('2. Vá em "Table Editor" > "services"')
        console.log('3. Clique em "Add Column" e adicione:')
        console.log('   • featured (boolean, default: false)')
        console.log('   • lp_visible (boolean, default: false)')
        console.log('   • quantities (jsonb, default: [])')
        console.log('   • shop_category (text, default: "outros")')
        console.log('\nOu execute este SQL no SQL Editor:')
        console.log(`
ALTER TABLE services 
ADD COLUMN IF NOT EXISTS featured BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS lp_visible BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS quantities JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS shop_category TEXT DEFAULT 'outros';
        `)
      } else {
        console.log('✅ Campos já existem! Testando funcionalidade...')
        
        // Reverter o teste
        await supabase
          .from('services')
          .update({
            featured: testService.featured || false,
            lp_visible: testService.lp_visible || false,
            quantities: testService.quantities || [],
            shop_category: testService.shop_category || 'outros'
          })
          .eq('id', testService.id)

        console.log('✅ Todos os campos estão funcionando!')
        
        // Definir quantidades padrão para serviços de seguidores
        console.log('\n🔧 Definindo quantidades padrão...')
        const { error: updateError } = await supabase
          .from('services')
          .update({
            quantities: [100, 250, 500, 1000, 2500, 5000],
            shop_category: 'seguidores'
          })
          .ilike('name', '%seguidores%')

        if (!updateError) {
          console.log('✅ Quantidades padrão definidas para serviços de seguidores!')
        }

        // Definir quantidades para curtidas
        const { error: likesError } = await supabase
          .from('services')
          .update({
            quantities: [50, 100, 250, 500, 1000, 2000],
            shop_category: 'curtidas'
          })
          .ilike('name', '%curtidas%')

        if (!likesError) {
          console.log('✅ Quantidades padrão definidas para serviços de curtidas!')
        }
      }

    } catch (error) {
      console.error('❌ Erro ao testar campos:', error)
    }

    console.log('\n🎉 VERIFICAÇÃO DA FASE 1 CONCLUÍDA!')
    console.log('📋 Próximos passos:')
    console.log('   • Adicionar campos no Supabase (se necessário)')
    console.log('   • FASE 2: Melhorar interface admin')
    console.log('   • FASE 3: Criar loja simples (LP)')

  } catch (error) {
    console.error('❌ Erro geral:', error)
  }
}

// Executar
addShopFields()

