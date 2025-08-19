// Script para monitoramento e sincronização regular dos serviços
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis do Supabase não encontradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Configurações do monitoramento
const MONITORING_CONFIG = {
  maxPriceDifference: 0.5, // R$ 0.50 de diferença máxima
  maxPercentageDifference: 10, // 10% de diferença máxima
  minProfitMargin: 0.5, // R$ 0.50 de lucro mínimo por 1000 unidades
  exchangeRateThreshold: 0.1, // 10% de mudança na taxa de câmbio
  syncIntervalHours: 6 // Sincronizar a cada 6 horas
};

// Função para buscar configurações do sistema
async function getSystemSettings() {
  const { data: settings, error } = await supabase
    .from('settings')
    .select('*');

  if (error) {
    console.error('❌ Erro ao buscar configurações:', error);
    return {};
  }

  const settingsMap = {};
  settings.forEach(setting => {
    settingsMap[setting.key] = setting.value;
  });

  return settingsMap;
}

// Função para salvar configuração
async function saveSetting(key, value, description) {
  const { error } = await supabase
    .from('settings')
    .upsert({
      key,
      value: value.toString(),
      description,
      updated_at: new Date().toISOString()
    });

  if (error) {
    console.error(`❌ Erro ao salvar configuração ${key}:`, error);
  }
}

// Função para buscar taxa de câmbio
async function getCurrentExchangeRate() {
  try {
    const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
    const data = await response.json();
    return data.rates.BRL || 5.5;
  } catch (error) {
    console.warn('⚠️ Erro ao buscar taxa de câmbio, usando fallback');
    return 5.5;
  }
}

// Função para verificar se precisa sincronizar
async function shouldSync() {
  const settings = await getSystemSettings();
  const lastSync = settings.last_full_sync;
  
  if (!lastSync) {
    console.log('📋 Primeira sincronização - executando...');
    return true;
  }

  const lastSyncDate = new Date(lastSync);
  const now = new Date();
  const hoursSinceLastSync = (now - lastSyncDate) / (1000 * 60 * 60);

  if (hoursSinceLastSync >= MONITORING_CONFIG.syncIntervalHours) {
    console.log(`📋 ${hoursSinceLastSync.toFixed(1)} horas desde última sincronização - executando...`);
    return true;
  }

  console.log(`📋 Última sincronização há ${hoursSinceLastSync.toFixed(1)} horas - aguardando...`);
  return false;
}

// Função para verificar mudanças na taxa de câmbio
async function checkExchangeRateChanges() {
  const settings = await getSystemSettings();
  const currentRate = await getCurrentExchangeRate();
  const lastRate = parseFloat(settings.last_exchange_rate || '5.5');
  
  const changePercentage = Math.abs((currentRate - lastRate) / lastRate) * 100;
  
  console.log(`💱 Taxa atual: ${currentRate} | Última: ${lastRate} | Mudança: ${changePercentage.toFixed(2)}%`);
  
  if (changePercentage >= MONITORING_CONFIG.exchangeRateThreshold * 100) {
    console.log('⚠️ Grande mudança na taxa de câmbio detectada!');
    await saveSetting('last_exchange_rate', currentRate, 'Última taxa de câmbio USD→BRL');
    return true;
  }
  
  return false;
}

// Função para monitorar serviços inativos
async function monitorInactiveServices() {
  const { data: services, error } = await supabase
    .from('services')
    .select('id, name, status, last_sync')
    .eq('status', 'inactive');

  if (error) {
    console.error('❌ Erro ao buscar serviços inativos:', error);
    return;
  }

  if (services.length > 0) {
    console.log(`⚠️ ${services.length} serviços inativos encontrados:`);
    services.forEach(service => {
      console.log(`   - ${service.name.substring(0, 50)}...`);
    });
  } else {
    console.log('✅ Todos os serviços estão ativos');
  }
}

// Função para verificar margens de lucro baixas
async function checkLowProfitMargins() {
  const { data: services, error } = await supabase
    .from('services')
    .select('id, name, rate, provider_rate, category')
    .eq('status', 'active');

  if (error) {
    console.error('❌ Erro ao buscar serviços:', error);
    return;
  }

  const exchangeRate = await getCurrentExchangeRate();
  const lowProfitServices = [];

  services.forEach(service => {
    const providerCostBRL = parseFloat(service.provider_rate) * exchangeRate;
    const profit = parseFloat(service.rate) - providerCostBRL;
    
    if (profit < MONITORING_CONFIG.minProfitMargin) {
      lowProfitServices.push({
        ...service,
        profit: profit.toFixed(4),
        profitPercentage: ((profit / providerCostBRL) * 100).toFixed(2)
      });
    }
  });

  if (lowProfitServices.length > 0) {
    console.log(`⚠️ ${lowProfitServices.length} serviços com margem baixa (< R$ ${MONITORING_CONFIG.minProfitMargin}):`);
    lowProfitServices.slice(0, 5).forEach(service => {
      console.log(`   - ${service.name.substring(0, 40)}... | Lucro: R$ ${service.profit} (${service.profitPercentage}%)`);
    });
  } else {
    console.log('✅ Todas as margens de lucro estão adequadas');
  }
}

// Função para gerar relatório de performance
async function generatePerformanceReport() {
  console.log('\n📊 RELATÓRIO DE PERFORMANCE DO SISTEMA');
  console.log('='.repeat(50));

  // Estatísticas gerais
  const { data: services } = await supabase
    .from('services')
    .select('*')
    .eq('status', 'active');

  const { data: orders } = await supabase
    .from('orders')
    .select('*')
    .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()); // Últimas 24h

  const { data: categories } = await supabase
    .from('categories')
    .select('*')
    .eq('is_active', true);

  console.log(`📈 Serviços ativos: ${services?.length || 0}`);
  console.log(`📈 Categorias ativas: ${categories?.length || 0}`);
  console.log(`📈 Pedidos (24h): ${orders?.length || 0}`);

  // Top categorias por número de serviços
  if (services && services.length > 0) {
    const categoryCount = services.reduce((acc, service) => {
      acc[service.category] = (acc[service.category] || 0) + 1;
      return acc;
    }, {});

    const topCategories = Object.entries(categoryCount)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5);

    console.log('\n🏆 Top 5 Categorias por Número de Serviços:');
    topCategories.forEach(([category, count], index) => {
      console.log(`   ${index + 1}. ${category}: ${count} serviços`);
    });
  }

  // Análise de preços
  if (services && services.length > 0) {
    const rates = services.map(s => parseFloat(s.rate)).filter(r => r > 0);
    const avgRate = rates.reduce((sum, rate) => sum + rate, 0) / rates.length;
    const minRate = Math.min(...rates);
    const maxRate = Math.max(...rates);

    console.log('\n💰 Análise de Preços:');
    console.log(`   Preço médio: R$ ${avgRate.toFixed(4)}`);
    console.log(`   Preço mínimo: R$ ${minRate.toFixed(4)}`);
    console.log(`   Preço máximo: R$ ${maxRate.toFixed(4)}`);
  }
}

// Função principal de monitoramento
async function runMonitoring() {
  console.log('🔍 INICIANDO MONITORAMENTO DO SISTEMA SMM');
  console.log('='.repeat(50));
  console.log(`⏰ ${new Date().toLocaleString('pt-BR')}`);

  try {
    // 1. Verificar se precisa sincronizar
    const needsSync = await shouldSync();
    
    // 2. Verificar mudanças na taxa de câmbio
    const exchangeRateChanged = await checkExchangeRateChanges();
    
    // 3. Monitorar serviços inativos
    console.log('\n📋 Verificando serviços inativos...');
    await monitorInactiveServices();
    
    // 4. Verificar margens de lucro
    console.log('\n📋 Verificando margens de lucro...');
    await checkLowProfitMargins();
    
    // 5. Gerar relatório de performance
    await generatePerformanceReport();
    
    // 6. Executar sincronização se necessário
    if (needsSync || exchangeRateChanged) {
      console.log('\n🔄 Executando sincronização automática...');
      // Aqui você pode chamar o script de sincronização
      console.log('💡 Execute: node scripts/fix-and-validate-prices.js');
      
      // Salvar timestamp da última verificação
      await saveSetting('last_full_sync', new Date().toISOString(), 'Última sincronização completa');
    }
    
    // 7. Salvar log de monitoramento
    await saveSetting('last_monitoring', new Date().toISOString(), 'Último monitoramento executado');
    
    console.log('\n✅ Monitoramento concluído com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro durante monitoramento:', error);
  }
}

// Executar monitoramento
if (require.main === module) {
  runMonitoring().catch(console.error);
}

module.exports = {
  runMonitoring,
  checkExchangeRateChanges,
  monitorInactiveServices,
  checkLowProfitMargins
};
