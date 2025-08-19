const { createClient } = require('@supabase/supabase-js')

// Configuração do Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variáveis de ambiente não encontradas!')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  db: { schema: 'public' },
  auth: { persistSession: false }
})

async function executeSQL() {
  console.log('🚀 [FASE 1] Executando SQL para adicionar campos da loja...\n')

  try {
    // Usar uma abordagem alternativa - fazer uma query personalizada
    console.log('📌 Tentando executar ALTER TABLE usando query personalizada...')
    
    // Como não podemos usar rpc diretamente, vamos tentar uma abordagem diferente
    // Vamos usar o REST API do Supabase para executar SQL
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'apikey': supabaseServiceKey
      },
      body: JSON.stringify({
        sql: `
          ALTER TABLE services 
          ADD COLUMN IF NOT EXISTS featured BOOLEAN DEFAULT FALSE,
          ADD COLUMN IF NOT EXISTS lp_visible BOOLEAN DEFAULT FALSE,
          ADD COLUMN IF NOT EXISTS quantities JSONB DEFAULT '[]'::jsonb,
          ADD COLUMN IF NOT EXISTS shop_category TEXT DEFAULT 'outros';
        `
      })
    })

    if (response.ok) {
      console.log('✅ Campos adicionados com sucesso via REST API!')
    } else {
      console.log('⚠️  REST API não funcionou. Tentando abordagem manual...')
      
      // Abordagem manual: tentar inserir um registro de teste
      console.log('🔧 Testando se podemos adicionar campos manualmente...')
      
      // Primeiro, vamos pegar um serviço existente
      const { data: services, error: fetchError } = await supabase
        .from('services')
        .select('id')
        .limit(1)

      if (fetchError || !services.length) {
        console.error('❌ Erro ao buscar serviços:', fetchError)
        return
      }

      console.log('📝 Como não consegui executar ALTER TABLE automaticamente,')
      console.log('vou criar um arquivo SQL para você executar manualmente.')
      
      // Criar arquivo SQL
      const sqlContent = `
-- FASE 1: Adicionar campos para sistema de loja
-- Execute este SQL no painel do Supabase (SQL Editor)

ALTER TABLE services 
ADD COLUMN IF NOT EXISTS featured BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS lp_visible BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS quantities JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS shop_category TEXT DEFAULT 'outros';

-- Comentar os campos adicionados
COMMENT ON COLUMN services.featured IS 'Marca serviço como destaque para mais vendidos';
COMMENT ON COLUMN services.lp_visible IS 'Serviço visível na landing page simples';
COMMENT ON COLUMN services.quantities IS 'Array JSON com quantidades disponíveis [100,250,500]';
COMMENT ON COLUMN services.shop_category IS 'Categoria do serviço na loja (seguidores, curtidas, etc)';

-- Definir quantidades padrão para serviços existentes
UPDATE services 
SET quantities = '[100, 250, 500, 1000, 2500, 5000]'::jsonb,
    shop_category = 'seguidores'
WHERE name ILIKE '%seguidores%';

UPDATE services 
SET quantities = '[50, 100, 250, 500, 1000, 2000]'::jsonb,
    shop_category = 'curtidas'  
WHERE name ILIKE '%curtidas%' OR name ILIKE '%likes%';

UPDATE services 
SET quantities = '[25, 50, 100, 200, 300, 500]'::jsonb,
    shop_category = 'seguidores'
WHERE name ILIKE '%followers%';

UPDATE services 
SET quantities = '[700, 850, 1000, 1500, 2000, 5000]'::jsonb,
    shop_category = 'seguidores'
WHERE name ILIKE '%brasileiro%';

-- Marcar alguns serviços como visíveis na LP (exemplo)
UPDATE services 
SET lp_visible = true,
    featured = false
WHERE shop_category IN ('seguidores', 'curtidas')
  AND status = 'active'
LIMIT 10;

-- Verificar se os campos foram adicionados
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'services' 
  AND column_name IN ('featured', 'lp_visible', 'quantities', 'shop_category')
ORDER BY column_name;
      `

      // Salvar o arquivo SQL
      require('fs').writeFileSync('./fase1-adicionar-campos.sql', sqlContent.trim())
      console.log('✅ Arquivo "fase1-adicionar-campos.sql" criado!')
      console.log('\n📋 INSTRUÇÕES:')
      console.log('1. Abra o painel do Supabase')
      console.log('2. Vá em "SQL Editor"')
      console.log('3. Cole o conteúdo do arquivo "fase1-adicionar-campos.sql"')
      console.log('4. Execute o SQL')
      console.log('5. Execute novamente este script para verificar')
    }

  } catch (error) {
    console.error('❌ Erro ao executar SQL:', error)
    console.log('\n📝 SOLUÇÃO ALTERNATIVA:')
    console.log('Execute este SQL manualmente no painel do Supabase:')
    console.log(`
ALTER TABLE services 
ADD COLUMN IF NOT EXISTS featured BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS lp_visible BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS quantities JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS shop_category TEXT DEFAULT 'outros';
    `)
  }
}

// Executar
executeSQL()

