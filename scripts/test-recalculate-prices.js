// Script para testar o recálculo de preços
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis do Supabase não encontradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testRecalculatePrices() {
  console.log('🧪 TESTE DE RECÁLCULO DE PREÇOS');
  console.log('='.repeat(50));

  try {
    // 1. Verificar configurações atuais
    console.log('\n📊 1. Verificando configurações...');
    const { data: settings } = await supabase
      .from('settings')
      .select('key, value')
      .in('key', ['currency_mode', 'usd_brl_rate', 'markup_percentage']);

    const config = {};
    settings?.forEach(s => config[s.key] = s.value);
    
    console.log('   Modo câmbio:', config.currency_mode || 'manual');
    console.log('   Taxa USD/BRL:', config.usd_brl_rate || '5.50');
    console.log('   Markup:', config.markup_percentage || '20', '%');

    // 2. Verificar alguns serviços antes
    console.log('\n📋 2. Serviços ANTES do recálculo:');
    const { data: servicesBefore } = await supabase
      .from('services')
      .select('id, name, provider_rate, rate, markup_value')
      .eq('status', 'active')
      .limit(5);

    servicesBefore?.forEach(s => {
      console.log(`   ${s.name}: $${s.provider_rate} → R$ ${s.rate} (markup: ${s.markup_value || 'N/A'}%)`);
    });

    // 3. Simular recálculo manual
    console.log('\n🔄 3. Simulando recálculo...');
    const exchangeRate = parseFloat(config.usd_brl_rate || '5.50');
    const markup = parseFloat(config.markup_percentage || '20');

    console.log(`   Fórmula: (provider_rate_USD * ${exchangeRate}) * (1 + ${markup}/100)`);

    servicesBefore?.forEach(s => {
      const providerRateUSD = parseFloat(s.provider_rate) || 0;
      const providerRateBRL = providerRateUSD * exchangeRate;
      const newRate = providerRateBRL * (1 + markup / 100);
      
      console.log(`   ${s.name}:`);
      console.log(`     Atual: R$ ${s.rate}`);
      console.log(`     Novo:  R$ ${newRate.toFixed(4)}`);
      console.log(`     Diff:  ${newRate > s.rate ? '+' : ''}${(newRate - s.rate).toFixed(4)}`);
    });

    // 4. Contar total de serviços que serão afetados
    console.log('\n📈 4. Estatísticas:');
    const { data: totalServices } = await supabase
      .from('services')
      .select('id', { count: 'exact' })
      .eq('status', 'active')
      .not('provider_rate', 'is', null);

    console.log(`   Total de serviços ativos: ${totalServices?.length || 0}`);

    const { data: outdatedServices } = await supabase
      .from('services')
      .select('id', { count: 'exact' })
      .eq('status', 'active')
      .neq('markup_value', markup);

    console.log(`   Serviços com markup desatualizado: ${outdatedServices?.length || 0}`);

    console.log('\n💡 Para aplicar o recálculo:');
    console.log('   1. Acesse as configurações no admin');
    console.log('   2. Clique em "Recalcular Preços"');
    console.log('   3. Ou execute: import("../lib/recalculate-prices-actions.js").then(({recalculateAllServicesPrices}) => recalculateAllServicesPrices())');

  } catch (error) {
    console.error('❌ Erro no teste:', error);
  }
}

// Executar teste
if (require.main === module) {
  testRecalculatePrices().catch(console.error);
}

module.exports = { testRecalculatePrices };
