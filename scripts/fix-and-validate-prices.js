// Script para corrigir provider_rate e validar preços
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis do Supabase não encontradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Função para buscar chaves da API do banco
async function getApiKeys() {
  const { data: apiKeys, error } = await supabase
    .from('api_keys')
    .select('*')
    .eq('is_active', true);

  if (error) {
    console.error('❌ Erro ao buscar chaves da API:', error);
    return null;
  }

  const mtpKey = apiKeys.find(key => key.provider === 'mtp');
  if (!mtpKey) {
    console.error('❌ Chave da API MTP não encontrada no banco');
    return null;
  }

  return mtpKey;
}

// Função para buscar serviços da API MTP
async function fetchServicesFromMTP(apiKey, apiUrl) {
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

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const services = await response.json();
    return services;
  } catch (error) {
    console.error('❌ Erro ao buscar da API MTP:', error.message);
    return [];
  }
}

// Função para buscar taxa de câmbio atual
async function getCurrentExchangeRate() {
  try {
    const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
    const data = await response.json();
    return data.rates.BRL || 5.5; // Fallback para 5.5 se não conseguir buscar
  } catch (error) {
    console.warn('⚠️ Erro ao buscar taxa de câmbio, usando 5.5 como fallback');
    return 5.5;
  }
}

// Função para calcular preço com markup
function calculateFinalPrice(providerRateUSD, exchangeRate, markupPercentage) {
  const rateBRL = providerRateUSD * exchangeRate;
  const finalRate = rateBRL * (1 + markupPercentage / 100);
  return parseFloat(finalRate.toFixed(4));
}

// Função para analisar competitividade
function analyzeCompetitiveness(service, finalRate, providerRateUSD, exchangeRate) {
  const currentRate = parseFloat(service.rate);
  const difference = currentRate - finalRate;
  const percentageDiff = ((difference / finalRate) * 100).toFixed(2);
  
  let status = '✅ Preço adequado';
  if (Math.abs(difference) > 0.5) {
    status = difference > 0 ? '⚠️ Preço alto' : '⚠️ Preço baixo';
  }
  
  return {
    status,
    currentRate,
    calculatedRate: finalRate,
    difference: parseFloat(difference.toFixed(4)),
    percentageDiff: parseFloat(percentageDiff),
    providerCostBRL: parseFloat((providerRateUSD * exchangeRate).toFixed(4)),
    profitBRL: parseFloat((currentRate - (providerRateUSD * exchangeRate)).toFixed(4))
  };
}

async function fixAndValidatePrices() {
  console.log('🔧 CORRIGINDO E VALIDANDO PREÇOS DOS SERVIÇOS');
  console.log('='.repeat(50));

  // 1. Buscar chaves da API
  console.log('\n📋 1. Buscando chaves da API...');
  const mtpConfig = await getApiKeys();
  if (!mtpConfig) {
    console.log('❌ Não foi possível encontrar configuração da API MTP');
    return;
  }
  console.log('✅ Chave da API MTP encontrada');

  // 2. Buscar serviços da API
  console.log('\n📋 2. Buscando serviços da API MTP...');
  const apiServices = await fetchServicesFromMTP(mtpConfig.api_key, mtpConfig.api_url);
  if (apiServices.length === 0) {
    console.log('❌ Não foi possível buscar serviços da API');
    return;
  }
  console.log(`✅ ${apiServices.length} serviços encontrados na API`);

  // 3. Buscar taxa de câmbio
  console.log('\n📋 3. Buscando taxa de câmbio atual...');
  const exchangeRate = await getCurrentExchangeRate();
  console.log(`✅ Taxa USD → BRL: ${exchangeRate}`);

  // 4. Buscar serviços do banco
  console.log('\n📋 4. Buscando serviços do banco...');
  const { data: dbServices, error } = await supabase
    .from('services')
    .select('*')
    .eq('provider', 'mtp')
    .order('created_at');

  if (error) {
    console.error('❌ Erro ao buscar serviços do banco:', error);
    return;
  }
  console.log(`✅ ${dbServices.length} serviços encontrados no banco`);

  // 5. Processar e corrigir cada serviço
  console.log('\n📋 5. Processando e corrigindo serviços...');
  console.log('='.repeat(50));

  const updates = [];
  const analysis = [];
  let correctedCount = 0;

  for (const dbService of dbServices) {
    const apiService = apiServices.find(s => s.service === dbService.provider_service_id);
    
    if (!apiService) {
      console.log(`⚠️ Serviço ${dbService.provider_service_id} não encontrado na API`);
      continue;
    }

    const providerRateUSD = parseFloat(apiService.rate);
    const markupPercentage = parseFloat(dbService.markup_value);
    
    // Calcular preço correto
    const calculatedFinalRate = calculateFinalPrice(providerRateUSD, exchangeRate, markupPercentage);
    
    // Analisar competitividade
    const competitiveness = analyzeCompetitiveness(dbService, calculatedFinalRate, providerRateUSD, exchangeRate);
    
    // Preparar atualização se provider_rate estiver zerado
    if (parseFloat(dbService.provider_rate) === 0) {
      updates.push({
        id: dbService.id,
        provider_rate: providerRateUSD,
        // Opcionalmente, atualizar o rate também se estiver muito diferente
        ...(Math.abs(competitiveness.difference) > 1 ? { rate: calculatedFinalRate } : {})
      });
      correctedCount++;
    }

    analysis.push({
      id: dbService.id,
      name: dbService.name.substring(0, 50) + '...',
      category: dbService.category,
      ...competitiveness
    });
  }

  // 6. Aplicar correções
  if (updates.length > 0) {
    console.log(`\n📋 6. Aplicando ${updates.length} correções...`);
    
    for (const update of updates) {
      const { error } = await supabase
        .from('services')
        .update({
          provider_rate: update.provider_rate,
          ...(update.rate ? { rate: update.rate } : {}),
          updated_at: new Date().toISOString()
        })
        .eq('id', update.id);

      if (error) {
        console.error(`❌ Erro ao atualizar serviço ${update.id}:`, error);
      }
    }
    
    console.log(`✅ ${correctedCount} serviços corrigidos com sucesso!`);
  } else {
    console.log('\n📋 6. Nenhuma correção necessária - todos os provider_rate já estão preenchidos');
  }

  // 7. Relatório de análise
  console.log('\n📊 RELATÓRIO DE ANÁLISE DE PREÇOS');
  console.log('='.repeat(50));
  
  const adequateCount = analysis.filter(a => a.status === '✅ Preço adequado').length;
  const highCount = analysis.filter(a => a.status === '⚠️ Preço alto').length;
  const lowCount = analysis.filter(a => a.status === '⚠️ Preço baixo').length;
  
  console.log(`📊 Total de serviços analisados: ${analysis.length}`);
  console.log(`✅ Preços adequados: ${adequateCount}`);
  console.log(`⚠️ Preços altos: ${highCount}`);
  console.log(`⚠️ Preços baixos: ${lowCount}`);
  
  // Mostrar análise detalhada dos primeiros 10 serviços
  console.log('\n📋 ANÁLISE DETALHADA (Primeiros 10 serviços):');
  console.log('='.repeat(80));
  
  analysis.slice(0, 10).forEach((item, index) => {
    console.log(`\n${index + 1}. ${item.name}`);
    console.log(`   Categoria: ${item.category}`);
    console.log(`   ${item.status}`);
    console.log(`   Preço atual: R$ ${item.currentRate.toFixed(4)}`);
    console.log(`   Preço calculado: R$ ${item.calculatedRate.toFixed(4)}`);
    console.log(`   Diferença: R$ ${item.difference} (${item.percentageDiff}%)`);
    console.log(`   Custo fornecedor: R$ ${item.providerCostBRL}`);
    console.log(`   Lucro: R$ ${item.profitBRL}`);
  });

  // 8. Recomendações
  console.log('\n💡 RECOMENDAÇÕES:');
  console.log('='.repeat(30));
  
  if (highCount > 0) {
    console.log(`⚠️ ${highCount} serviços com preços altos - considere reduzir para ser mais competitivo`);
  }
  
  if (lowCount > 0) {
    console.log(`⚠️ ${lowCount} serviços com preços baixos - considere aumentar para melhorar margem`);
  }
  
  const avgProfit = analysis.reduce((sum, item) => sum + item.profitBRL, 0) / analysis.length;
  console.log(`💰 Lucro médio por 1000 unidades: R$ ${avgProfit.toFixed(2)}`);
  
  if (avgProfit < 1) {
    console.log('⚠️ Margem de lucro baixa - considere aumentar o markup');
  } else if (avgProfit > 5) {
    console.log('💡 Margem alta - você pode ser mais competitivo reduzindo preços');
  } else {
    console.log('✅ Margem de lucro adequada');
  }

  console.log('\n✅ Processo concluído!');
}

// Executar o script
fixAndValidatePrices().catch(console.error);
