// Script para comparar dados da API com dados salvos no banco
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis do Supabase não encontradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Função para buscar dados da API MTP
async function fetchFromMTP() {
  const apiKey = process.env.MTP_API_KEY;
  const apiUrl = process.env.MTP_API_URL;
  
  if (!apiKey || !apiUrl) {
    console.log('❌ Chaves da API MTP não encontradas');
    return [];
  }

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        key: apiKey,
        action: 'services'
      })
    });

    const services = await response.json();
    return services;
  } catch (error) {
    console.error('❌ Erro ao buscar da API:', error.message);
    return [];
  }
}

async function compareData() {
  console.log('🔍 COMPARANDO DADOS DA API COM BANCO...');
  console.log('=======================================\n');

  // Buscar serviços da API
  const apiServices = await fetchFromMTP();
  if (apiServices.length === 0) {
    console.log('❌ Não foi possível buscar dados da API');
    return;
  }

  // Buscar alguns serviços específicos do banco
  const { data: dbServices, error } = await supabase
    .from('services')
    .select('*')
    .in('provider_service_id', ['5756', '2541', '8068', '2848', '4641'])
    .order('provider_service_id');

  if (error) {
    console.error('❌ Erro ao buscar do banco:', error);
    return;
  }

  console.log(`📊 Encontrados ${apiServices.length} serviços na API`);
  console.log(`📊 Comparando ${dbServices.length} serviços específicos\n`);

  dbServices.forEach(dbService => {
    const apiService = apiServices.find(s => s.service === dbService.provider_service_id);
    
    if (!apiService) {
      console.log(`❌ Serviço ${dbService.provider_service_id} não encontrado na API\n`);
      return;
    }

    console.log(`🔍 SERVIÇO ID: ${dbService.provider_service_id}`);
    console.log(`📝 Nome API: ${apiService.name}`);
    console.log(`📝 Nome DB:  ${dbService.name}`);
    console.log(`📂 Categoria API: ${apiService.category}`);
    console.log(`📂 Categoria DB:  ${dbService.category}`);
    console.log(`💰 Rate API (USD): ${apiService.rate}`);
    console.log(`💰 Rate DB (BRL):  ${dbService.rate}`);
    console.log(`📊 Min API: ${apiService.min} | Max API: ${apiService.max}`);
    console.log(`📊 Min DB:  ${dbService.min_quantity} | Max DB:  ${dbService.max_quantity}`);
    
    console.log('\n🔧 CONFIGURAÇÕES ESPECIAIS:');
    console.log(`   Type API: ${apiService.type} | DB: ${dbService.type}`);
    console.log(`   Dripfeed API: ${apiService.dripfeed} | DB: ${dbService.dripfeed}`);
    console.log(`   Refill API: ${apiService.refill} | DB: ${dbService.refill}`);
    console.log(`   Cancel API: ${apiService.cancel} | DB: ${dbService.cancel}`);
    
    // Verificar se os valores estão corretos
    const issues = [];
    if (apiService.type !== dbService.type) issues.push('❌ Type diferente');
    if (apiService.dripfeed !== dbService.dripfeed) issues.push('❌ Dripfeed diferente');
    if (apiService.refill !== dbService.refill) issues.push('❌ Refill diferente');
    if (apiService.cancel !== dbService.cancel) issues.push('❌ Cancel diferente');
    if (parseInt(apiService.min) !== dbService.min_quantity) issues.push('❌ Min quantity diferente');
    if (parseInt(apiService.max) !== dbService.max_quantity) issues.push('❌ Max quantity diferente');
    
    if (issues.length > 0) {
      console.log('\n⚠️  PROBLEMAS ENCONTRADOS:');
      issues.forEach(issue => console.log(`   ${issue}`));
    } else {
      console.log('\n✅ Dados estão corretos!');
    }
    
    console.log('\n' + '='.repeat(60) + '\n');
  });

  // Verificar configurações gerais
  console.log('\n🔧 VERIFICAÇÃO GERAL DOS DADOS:');
  console.log('================================');
  
  const allDbServices = await supabase.from('services').select('*');
  const services = allDbServices.data || [];
  
  const typeCount = services.reduce((acc, s) => {
    acc[s.type] = (acc[s.type] || 0) + 1;
    return acc;
  }, {});
  
  const dripfeedCount = services.filter(s => s.dripfeed).length;
  const refillCount = services.filter(s => s.refill).length;
  const cancelCount = services.filter(s => s.cancel).length;
  const syncEnabledCount = services.filter(s => s.sync_enabled).length;
  
  console.log(`📊 Total de serviços: ${services.length}`);
  console.log(`📊 Types: ${JSON.stringify(typeCount, null, 2)}`);
  console.log(`📊 Dripfeed habilitado: ${dripfeedCount} serviços`);
  console.log(`📊 Refill habilitado: ${refillCount} serviços`);
  console.log(`📊 Cancel habilitado: ${cancelCount} serviços`);
  console.log(`📊 Sync habilitado: ${syncEnabledCount} serviços`);
  
  // Verificar provider_rate
  const zeroProviderRate = services.filter(s => parseFloat(s.provider_rate) === 0).length;
  console.log(`⚠️  Serviços com provider_rate = 0: ${zeroProviderRate}`);
}

compareData().catch(console.error);
