const { createClient } = require('@supabase/supabase-js')

// Configuração do Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variáveis de ambiente não encontradas!')
  console.error('Certifique-se de que NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY estão definidas')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function addShopFields() {
  console.log('🚀 [FASE 1] Adicionando campos para sistema de loja...\n')

  try {
    // 1. Adicionar campo 'featured' (destaque manual)
    console.log('📌 Adicionando campo "featured" (destaque)...')
    const { error: featuredError } = await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE services 
        ADD COLUMN IF NOT EXISTS featured BOOLEAN DEFAULT FALSE;
      `
    })
    
    if (featuredError) {
      console.log('⚠️  Campo "featured" já existe ou erro:', featuredError.message)
    } else {
      console.log('✅ Campo "featured" adicionado com sucesso!')
    }

    // 2. Adicionar campo 'lp_visible' (visível na landing page)
    console.log('📌 Adicionando campo "lp_visible" (visível na LP)...')
    const { error: lpVisibleError } = await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE services 
        ADD COLUMN IF NOT EXISTS lp_visible BOOLEAN DEFAULT FALSE;
      `
    })
    
    if (lpVisibleError) {
      console.log('⚠️  Campo "lp_visible" já existe ou erro:', lpVisibleError.message)
    } else {
      console.log('✅ Campo "lp_visible" adicionado com sucesso!')
    }

    // 3. Adicionar campo 'quantities' (quantidades disponíveis)
    console.log('📌 Adicionando campo "quantities" (quantidades JSON)...')
    const { error: quantitiesError } = await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE services 
        ADD COLUMN IF NOT EXISTS quantities JSONB DEFAULT '[]'::jsonb;
      `
    })
    
    if (quantitiesError) {
      console.log('⚠️  Campo "quantities" já existe ou erro:', quantitiesError.message)
    } else {
      console.log('✅ Campo "quantities" adicionado com sucesso!')
    }

    // 4. Adicionar campo 'shop_category' (categoria da loja)
    console.log('📌 Adicionando campo "shop_category" (categoria)...')
    const { error: categoryError } = await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE services 
        ADD COLUMN IF NOT EXISTS shop_category VARCHAR(100) DEFAULT 'outros';
      `
    })
    
    if (categoryError) {
      console.log('⚠️  Campo "shop_category" já existe ou erro:', categoryError.message)
    } else {
      console.log('✅ Campo "shop_category" adicionado com sucesso!')
    }

    // 5. Verificar estrutura atual da tabela
    console.log('\n📊 Verificando estrutura atual da tabela services...')
    const { data: columns, error: columnsError } = await supabase.rpc('exec_sql', {
      sql: `
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns 
        WHERE table_name = 'services' 
        AND column_name IN ('featured', 'lp_visible', 'quantities', 'shop_category')
        ORDER BY column_name;
      `
    })

    if (columnsError) {
      console.error('❌ Erro ao verificar colunas:', columnsError)
    } else {
      console.log('📋 Novos campos adicionados:')
      columns.forEach(col => {
        console.log(`   • ${col.column_name}: ${col.data_type} (default: ${col.column_default})`)
      })
    }

    // 6. Definir quantidades padrão para alguns serviços (exemplo)
    console.log('\n🔧 Definindo quantidades padrão para serviços existentes...')
    const { error: updateError } = await supabase
      .from('services')
      .update({
        quantities: [100, 250, 500, 1000, 2500, 5000],
        shop_category: 'seguidores'
      })
      .ilike('name', '%seguidores%')

    if (updateError) {
      console.log('⚠️  Erro ao atualizar quantidades padrão:', updateError.message)
    } else {
      console.log('✅ Quantidades padrão definidas para serviços de seguidores!')
    }

    console.log('\n🎉 FASE 1 CONCLUÍDA COM SUCESSO!')
    console.log('📋 Próximos passos:')
    console.log('   • FASE 2: Melhorar interface admin')
    console.log('   • FASE 3: Criar loja simples (LP)')
    console.log('   • FASE 4: Sistema de mais vendidos')
    console.log('   • FASE 5: Painel completo')

  } catch (error) {
    console.error('❌ Erro geral:', error)
    process.exit(1)
  }
}

// Executar
addShopFields()

