const { createClient } = require('@supabase/supabase-js')

// Configuração do Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variáveis de ambiente não encontradas!')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function testShopFields() {
  console.log('🧪 [TESTE] Verificando campos da loja...\n')

  try {
    // 1. Buscar um serviço para testar
    console.log('📋 Buscando serviços para teste...')
    const { data: services, error: fetchError } = await supabase
      .from('services')
      .select('*')
      .limit(3)

    if (fetchError) {
      console.error('❌ Erro ao buscar serviços:', fetchError)
      return
    }

    if (!services.length) {
      console.log('⚠️  Nenhum serviço encontrado!')
      return
    }

    console.log(`✅ Encontrados ${services.length} serviços`)

    // 2. Verificar se os novos campos existem
    const firstService = services[0]
    console.log('\n🔍 Verificando campos no primeiro serviço:')
    console.log(`   • ID: ${firstService.id}`)
    console.log(`   • Nome: ${firstService.name?.substring(0, 50)}...`)
    
    const newFields = ['featured', 'lp_visible', 'quantities', 'shop_category']
    let allFieldsExist = true

    newFields.forEach(field => {
      const exists = field in firstService
      const value = firstService[field]
      console.log(`   • ${field}: ${exists ? '✅' : '❌'} ${exists ? `(${JSON.stringify(value)})` : 'CAMPO NÃO EXISTE'}`)
      if (!exists) allFieldsExist = false
    })

    if (!allFieldsExist) {
      console.log('\n❌ ALGUNS CAMPOS NÃO EXISTEM!')
      console.log('📝 Execute o SQL no painel do Supabase:')
      console.log('   1. Abra o arquivo "fase1-adicionar-campos.sql"')
      console.log('   2. Cole o conteúdo no SQL Editor do Supabase')
      console.log('   3. Execute o SQL')
      console.log('   4. Execute este teste novamente')
      return
    }

    console.log('\n✅ TODOS OS CAMPOS EXISTEM!')

    // 3. Testar atualização de um serviço
    console.log('\n🔧 Testando atualização de serviço...')
    const testService = services[0]
    
    const { error: updateError } = await supabase
      .from('services')
      .update({
        shop_category: 'seguidores',
        quantities: [100, 250, 500, 1000],
        lp_visible: true,
        featured: false
      })
      .eq('id', testService.id)

    if (updateError) {
      console.error('❌ Erro ao atualizar serviço:', updateError)
      return
    }

    console.log('✅ Serviço atualizado com sucesso!')

    // 4. Verificar se a atualização funcionou
    const { data: updatedService, error: verifyError } = await supabase
      .from('services')
      .select('id, name, shop_category, quantities, lp_visible, featured')
      .eq('id', testService.id)
      .single()

    if (verifyError) {
      console.error('❌ Erro ao verificar atualização:', verifyError)
      return
    }

    console.log('\n📊 Serviço após atualização:')
    console.log(`   • Nome: ${updatedService.name?.substring(0, 50)}...`)
    console.log(`   • Categoria Loja: ${updatedService.shop_category}`)
    console.log(`   • Quantidades: ${JSON.stringify(updatedService.quantities)}`)
    console.log(`   • LP Visível: ${updatedService.lp_visible}`)
    console.log(`   • Destaque: ${updatedService.featured}`)

    console.log('\n🎉 TESTE CONCLUÍDO COM SUCESSO!')
    console.log('📋 Status das fases:')
    console.log('   ✅ FASE 1: Campos adicionados no banco')
    console.log('   ✅ FASE 2: Interface admin atualizada')
    console.log('   🔄 FASE 3: Criar loja simples (próximo)')

  } catch (error) {
    console.error('❌ Erro geral:', error)
  }
}

// Executar
testShopFields()

