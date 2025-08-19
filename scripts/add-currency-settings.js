// Script para adicionar configurações de câmbio USD/BRL
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis do Supabase não encontradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Configurações de câmbio
const currencySettings = [
  {
    key: "currency_source_type",
    value: "manual",
    description: "Fonte do câmbio USD/BRL: 'api' para automático ou 'manual' para valor fixo"
  },
  {
    key: "usd_brl_manual_rate",
    value: "5.50",
    description: "Taxa de câmbio USD/BRL manual (usado quando currency_source_type = manual)"
  },
  {
    key: "currency_api_provider",
    value: "exchangerate-api",
    description: "Provedor da API de câmbio: 'exchangerate-api', 'fixer', 'currencylayer'"
  },
  {
    key: "currency_api_key",
    value: "",
    description: "Chave da API de câmbio (se necessário para o provedor escolhido)"
  },
  {
    key: "currency_update_interval_hours",
    value: "24",
    description: "Intervalo de atualização automática do câmbio (horas)"
  },
  {
    key: "currency_auto_update_enabled",
    value: "true",
    description: "Atualização automática do câmbio habilitada"
  },
  {
    key: "currency_fallback_rate",
    value: "5.50",
    description: "Taxa de câmbio de fallback se a API falhar"
  },
  {
    key: "currency_last_update",
    value: "",
    description: "Timestamp da última atualização do câmbio"
  },
  {
    key: "currency_api_timeout_seconds",
    value: "10",
    description: "Timeout para requisições da API de câmbio"
  }
];

async function addCurrencySettings() {
  console.log('💱 ADICIONANDO CONFIGURAÇÕES DE CÂMBIO');
  console.log('='.repeat(50));

  try {
    console.log('\n📋 Inserindo configurações de câmbio...');
    
    for (const setting of currencySettings) {
      const { data, error } = await supabase
        .from('settings')
        .upsert(setting)
        .select()
        .single();

      if (error) {
        console.log(`❌ Erro ao inserir ${setting.key}:`, error.message);
      } else {
        console.log(`✅ ${setting.key}: ${setting.value}`);
      }
    }

    // Verificar configurações inseridas
    console.log('\n📋 Verificando configurações de câmbio...');
    const { data: currencyConfigs, error: selectError } = await supabase
      .from('settings')
      .select('*')
      .like('key', '%currency%')
      .order('key');

    if (selectError) {
      console.log('❌ Erro ao buscar configurações:', selectError.message);
      return;
    }

    console.log(`\n✅ ${currencyConfigs.length} configurações de câmbio encontradas:`);
    currencyConfigs.forEach(config => {
      console.log(`   📊 ${config.key}: ${config.value}`);
    });

    console.log('\n🎉 CONFIGURAÇÕES DE CÂMBIO ADICIONADAS!');
    console.log('\n💡 Como usar:');
    console.log('   • currency_source_type = "manual" → usa valor fixo');
    console.log('   • currency_source_type = "api" → busca da API automaticamente');
    console.log('   • Acesse /dashboard/admin/settings para configurar');

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

// Executar
if (require.main === module) {
  addCurrencySettings().catch(console.error);
}

module.exports = { addCurrencySettings };
