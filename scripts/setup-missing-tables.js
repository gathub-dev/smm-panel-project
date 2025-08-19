#!/usr/bin/env node

/**
 * Script para criar tabelas e configurações que estão faltando
 */

const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = "https://xpklpweyvwviuiqzjgwe.supabase.co"
const supabaseServiceKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhwa2xwd2V5dnd2aXVpcXpqZ3dlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTU2NTE3OSwiZXhwIjoyMDcxMTQxMTc5fQ.7adnyvvwEWyAzYXHWyF7n9SEfdTrxZHcKlSKTJ7gQaQ"

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function setupMissingTables() {
  console.log('🔧 CONFIGURANDO TABELAS E DADOS FALTANTES')
  console.log('=' .repeat(50))
  
  try {
    // 1. Criar tabela exchange_rates
    console.log('\n💱 Criando tabela exchange_rates...')
    const { error: exchangeError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS exchange_rates (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          currency_pair VARCHAR(10) NOT NULL,
          rate DECIMAL(10,4) NOT NULL,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        CREATE INDEX IF NOT EXISTS idx_exchange_rates_currency_pair 
        ON exchange_rates(currency_pair);
        
        ALTER TABLE exchange_rates ENABLE ROW LEVEL SECURITY;
        
        CREATE POLICY IF NOT EXISTS "Permitir todas operações em exchange_rates" 
        ON exchange_rates FOR ALL 
        USING (true) 
        WITH CHECK (true);
      `
    })
    
    if (exchangeError) {
      console.log('❌ Erro ao criar exchange_rates:', exchangeError.message)
    } else {
      console.log('✅ Tabela exchange_rates criada')
    }

    // 2. Inserir cotação inicial
    console.log('💰 Inserindo cotação inicial USD→BRL...')
    const { error: rateError } = await supabase
      .from('exchange_rates')
      .upsert({
        currency_pair: 'USD_BRL',
        rate: 5.50,
        updated_at: new Date().toISOString()
      })
    
    if (rateError) {
      console.log('❌ Erro ao inserir cotação:', rateError.message)
    } else {
      console.log('✅ Cotação inicial inserida: 1 USD = 5.50 BRL')
    }

    // 3. Inserir configurações essenciais
    console.log('\n⚙️ Inserindo configurações...')
    
    const settings = [
      {
        key: 'global_markup_percentage',
        value: '20',
        description: 'Markup padrão aplicado aos serviços (%)'
      },
      {
        key: 'site_name',
        value: 'SMM Panel Brasil',
        description: 'Nome do site'
      },
      {
        key: 'auto_sync_enabled',
        value: 'true',
        description: 'Sincronização automática de serviços'
      },
      {
        key: 'sync_interval_hours',
        value: '24',
        description: 'Intervalo de sincronização em horas'
      }
    ]

    for (const setting of settings) {
      const { error } = await supabase
        .from('settings')
        .upsert(setting, { onConflict: 'key' })
      
      if (error) {
        console.log(`❌ Erro ao inserir ${setting.key}:`, error.message)
      } else {
        console.log(`✅ Configuração ${setting.key}: ${setting.value}`)
      }
    }

    // 4. Verificar se tabela services tem as colunas necessárias
    console.log('\n🛍️ Verificando estrutura da tabela services...')
    
    // Adicionar colunas que podem estar faltando
    const alterQueries = [
      "ALTER TABLE services ADD COLUMN IF NOT EXISTS provider_rate DECIMAL(10,4);",
      "ALTER TABLE services ADD COLUMN IF NOT EXISTS markup_type TEXT DEFAULT 'percentage' CHECK (markup_type IN ('percentage', 'fixed'));",
      "ALTER TABLE services ADD COLUMN IF NOT EXISTS markup_value DECIMAL(10,2) DEFAULT 20.00;",
      "ALTER TABLE services ADD COLUMN IF NOT EXISTS last_sync TIMESTAMP WITH TIME ZONE;",
      "ALTER TABLE services ADD COLUMN IF NOT EXISTS sync_enabled BOOLEAN DEFAULT true;",
      "ALTER TABLE services ADD COLUMN IF NOT EXISTS category_pt VARCHAR(255);"
    ]

    for (const query of alterQueries) {
      const { error } = await supabase.rpc('exec_sql', { sql: query })
      if (error && !error.message.includes('already exists')) {
        console.log(`⚠️ Aviso: ${error.message}`)
      }
    }
    console.log('✅ Estrutura da tabela services verificada')

    // 5. Criar função para calcular preço com markup (se não existir)
    console.log('\n🧮 Criando função de cálculo de markup...')
    const { error: funcError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE OR REPLACE FUNCTION calculate_service_price(provider_rate DECIMAL, markup_type TEXT, markup_value DECIMAL)
        RETURNS DECIMAL AS $$
        BEGIN
          IF markup_type = 'percentage' THEN
            RETURN provider_rate * (1 + markup_value / 100);
          ELSE
            RETURN provider_rate + markup_value;
          END IF;
        END;
        $$ LANGUAGE plpgsql;
      `
    })
    
    if (funcError) {
      console.log('❌ Erro ao criar função:', funcError.message)
    } else {
      console.log('✅ Função de cálculo de markup criada')
    }

    console.log('\n🎉 CONFIGURAÇÃO CONCLUÍDA!')
    console.log('✅ Tabelas criadas e configuradas')
    console.log('✅ Cotação inicial inserida')
    console.log('✅ Configurações padrão inseridas')
    console.log('✅ Sistema pronto para sincronização!')

  } catch (error) {
    console.error('❌ Erro na configuração:', error.message)
  }
}

// Executar configuração
setupMissingTables().catch(console.error)
