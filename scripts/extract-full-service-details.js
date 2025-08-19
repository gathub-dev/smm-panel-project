// Script para extrair TODAS as informações detalhadas dos serviços da API
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis do Supabase não encontradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Função para buscar um serviço específico da API para análise detalhada
async function fetchSpecificService(apiKey, apiUrl, serviceId) {
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
    return services.find(s => s.service === serviceId);
  } catch (error) {
    console.error('❌ Erro ao buscar serviço específico:', error.message);
    return null;
  }
}

// Função avançada para extrair TODAS as informações
function extractAllServiceInfo(apiService) {
  const info = {
    // Informações básicas da API
    originalName: apiService.name,
    originalDescription: apiService.description || '',
    category: apiService.category,
    rate: apiService.rate,
    min: apiService.min,
    max: apiService.max,
    type: apiService.type,
    refill: apiService.refill,
    cancel: apiService.cancel,
    dripfeed: apiService.dripfeed,
    
    // Informações extraídas da descrição
    extracted: {
      geo: null,
      startTime: null,
      minMax: null,
      linkExample: null,
      warnings: [],
      qualityTier: null,
      qualityDescription: null,
      speed: null,
      features: [],
      requirements: []
    }
  };

  const fullText = `${apiService.name} ${apiService.description || ''}`;

  // 1. Extrair Geo/Localização
  const geoPatterns = [
    /🌎\s*Geo:\s*([^\n\r]+)/gi,
    /🌍\s*Geo:\s*([^\n\r]+)/gi,
    /🌐\s*Geo:\s*([^\n\r]+)/gi,
    /Geo:\s*([^\n\r]+)/gi
  ];
  
  geoPatterns.forEach(pattern => {
    const match = fullText.match(pattern);
    if (match && !info.extracted.geo) {
      info.extracted.geo = match[1].trim();
    }
  });

  // 2. Extrair Start Time/Tempo de Início
  const startTimePatterns = [
    /⌚️?\s*(?:Start Time|Horário de Início):\s*([^\n\r]+)/gi,
    /⏰\s*(?:Start Time|Horário de Início):\s*([^\n\r]+)/gi,
    /Start Time:\s*([^\n\r]+)/gi,
    /Horário de Início:\s*([^\n\r]+)/gi
  ];

  startTimePatterns.forEach(pattern => {
    const match = fullText.match(pattern);
    if (match && !info.extracted.startTime) {
      info.extracted.startTime = match[1].trim();
    }
  });

  // 3. Extrair Min-Max detalhado
  const minMaxPatterns = [
    /🔼\s*(?:Min|Mín)\s*-\s*(?:Max|Máx)\.?:\s*([^\n\r]+)/gi,
    /📊\s*(?:Min|Mín)\s*-\s*(?:Max|Máx)\.?:\s*([^\n\r]+)/gi,
    /(?:Min|Mín)\s*-\s*(?:Max|Máx)\.?:\s*([^\n\r]+)/gi
  ];

  minMaxPatterns.forEach(pattern => {
    const match = fullText.match(pattern);
    if (match && !info.extracted.minMax) {
      info.extracted.minMax = match[1].trim();
    }
  });

  // 4. Extrair velocidade/speed
  const speedPatterns = [
    /(?:Speed|Velocidade):\s*([^\n\r|]+)/gi,
    /(\d+(?:-\d+)?(?:K|k)?\/(?:Day|Dia|Daily))/gi,
    /(\d+(?:-\d+)?\s*(?:K|k)?\s*(?:por|per)\s*(?:dia|day))/gi,
    /(\d+(?:-\d+)?(?:K|k)?\s*Daily)/gi
  ];

  speedPatterns.forEach(pattern => {
    const matches = fullText.match(pattern);
    if (matches && !info.extracted.speed) {
      info.extracted.speed = matches[0].trim();
    }
  });

  // 5. Extrair exemplo de link
  const linkPatterns = [
    /🍺?\s*(?:Link Example|Exemplo de Link):\s*(https?:\/\/[^\s\n\r]+)/gi,
    /🔗\s*(?:Link Example|Exemplo de Link):\s*(https?:\/\/[^\s\n\r]+)/gi,
    /(?:Link Example|Exemplo de Link):\s*(https?:\/\/[^\s\n\r]+)/gi
  ];

  linkPatterns.forEach(pattern => {
    const match = fullText.match(pattern);
    if (match && !info.extracted.linkExample) {
      info.extracted.linkExample = match[1].trim();
    }
  });

  // 6. Extrair avisos e requirements
  const warningPatterns = [
    /⚠️\s*([^\n\r]+)/g,
    /🚨\s*([^\n\r]+)/g,
    /❗\s*([^\n\r]+)/g,
    /⛔\s*([^\n\r]+)/g
  ];

  warningPatterns.forEach(pattern => {
    let match;
    while ((match = pattern.exec(fullText)) !== null) {
      const warning = match[1].trim();
      if (warning && !info.extracted.warnings.includes(warning)) {
        info.extracted.warnings.push(warning);
      }
    }
  });

  // 7. Extrair tier de qualidade e descrição
  const qualityTiers = {
    '🟢': 'MÉDIO',
    '🟡': 'BÁSICO', 
    '🔵': 'PREMIUM',
    '🟠': 'ALTO',
    '🔴': 'MÁXIMO',
    '⚫': 'ESPECIAL'
  };

  for (const [emoji, tier] of Object.entries(qualityTiers)) {
    if (fullText.includes(emoji)) {
      info.extracted.qualityTier = tier;
      
      // Extrair descrição da qualidade
      const tierPattern = new RegExp(`${emoji}\\s*${tier}:?\\s*([^🟢🟡🔵🟠🔴⚫]+)`, 'i');
      const tierMatch = fullText.match(tierPattern);
      if (tierMatch) {
        info.extracted.qualityDescription = tierMatch[1].trim().replace(/\n+/g, ' ').substring(0, 300);
      }
      break;
    }
  }

  // 8. Extrair características especiais
  const featurePatterns = [
    /✅\s*([^\n\r]+)/g,
    /🎯\s*([^\n\r]+)/g,
    /💎\s*([^\n\r]+)/g,
    /⭐\s*([^\n\r]+)/g
  ];

  featurePatterns.forEach(pattern => {
    let match;
    while ((match = pattern.exec(fullText)) !== null) {
      const feature = match[1].trim();
      if (feature && !info.extracted.features.includes(feature)) {
        info.extracted.features.push(feature);
      }
    }
  });

  return info;
}

// Função para gerar descrição completa em português
function generateCompleteDescription(serviceInfo, dbService) {
  let description = '';

  // Cabeçalho
  const platform = dbService.category.split(' - ')[0];
  const serviceType = dbService.category.split(' - ')[1];
  
  description += `🎯 **${serviceType} para ${platform}**\n\n`;

  // Informações básicas
  description += `📊 **Informações do Serviço:**\n`;
  description += `• **Quantidade:** ${dbService.min_quantity.toLocaleString('pt-BR')} - ${dbService.max_quantity.toLocaleString('pt-BR')} unidades\n`;
  
  if (serviceInfo.extracted.speed) {
    const speedPt = serviceInfo.extracted.speed
      .replace(/Day|Daily/gi, 'por dia')
      .replace(/K/gi, 'mil');
    description += `• **Velocidade:** ${speedPt}\n`;
  }

  if (serviceInfo.extracted.startTime) {
    const startTimePt = serviceInfo.extracted.startTime
      .replace(/h/g, ' horas')
      .replace(/-/g, ' a ');
    description += `• **Tempo de início:** ${startTimePt}\n`;
  }

  if (serviceInfo.extracted.geo) {
    const geoPt = serviceInfo.extracted.geo === 'Global' ? 'Mundial' : serviceInfo.extracted.geo;
    description += `• **Localização:** ${geoPt}\n`;
  }

  // Tipo de serviço
  description += `• **Tipo:** ${serviceInfo.type === 'Default' ? 'Padrão' : serviceInfo.type}\n`;

  // Garantias e recursos
  description += `\n🛡️ **Garantias e Recursos:**\n`;
  
  // Analisar garantias pelo nome
  if (dbService.name.includes('Garantia Vitalícia')) {
    description += `• ✅ **Garantia vitalícia** - Reposição permanente\n`;
  } else if (dbService.name.includes('Reposição 30 Dias')) {
    description += `• ✅ **Reposição de 30 dias** - Proteção temporária\n`;
  } else if (dbService.name.includes('Sem Reposição')) {
    description += `• ❌ **Sem reposição** - Preço mais baixo\n`;
  }

  if (serviceInfo.refill) {
    description += `• ✅ **Reposição automática** disponível\n`;
  }

  if (serviceInfo.cancel) {
    description += `• ✅ **Cancelamento** permitido\n`;
  }

  if (serviceInfo.dripfeed) {
    description += `• ✅ **Entrega gradual** (drip-feed) disponível\n`;
  }

  // Características especiais
  if (dbService.name.includes('Reais')) {
    description += `• 👥 **Perfis reais** e ativos\n`;
  }

  if (dbService.name.includes('High Retention')) {
    description += `• 📈 **Alta retenção** - Visualizações completas\n`;
  }

  if (dbService.name.includes('Instantâneo')) {
    description += `• ⚡ **Início instantâneo**\n`;
  }

  // Qualidade do serviço
  if (serviceInfo.extracted.qualityTier) {
    description += `\n⭐ **Nível de Qualidade: ${serviceInfo.extracted.qualityTier}**\n`;
    if (serviceInfo.extracted.qualityDescription) {
      description += `${serviceInfo.extracted.qualityDescription}\n`;
    }
  }

  // Características extras
  if (serviceInfo.extracted.features.length > 0) {
    description += `\n🎯 **Características Especiais:**\n`;
    serviceInfo.extracted.features.slice(0, 3).forEach(feature => {
      description += `• ${feature}\n`;
    });
  }

  // Avisos importantes
  if (serviceInfo.extracted.warnings.length > 0) {
    description += `\n⚠️ **Avisos Importantes:**\n`;
    serviceInfo.extracted.warnings.forEach(warning => {
      const warningPt = warning
        .replace(/profile must be set to "public"/gi, 'perfil deve estar público')
        .replace(/order will not start/gi, 'pedido não iniciará')
        .replace(/after completion/gi, 'após conclusão')
        .replace(/you can close it again/gi, 'pode fechar novamente');
      description += `• ${warningPt}\n`;
    });
  }

  // Exemplo de link
  if (serviceInfo.extracted.linkExample) {
    description += `\n🔗 **Exemplo de link:** ${serviceInfo.extracted.linkExample}\n`;
  }

  // Informações de preço
  const providerCostBRL = parseFloat(dbService.provider_rate) * 5.41; // Taxa de câmbio atual
  const profit = parseFloat(dbService.rate) - providerCostBRL;
  const profitPercentage = ((profit / providerCostBRL) * 100).toFixed(1);

  description += `\n💰 **Informações de Preço:**\n`;
  description += `• **Preço final:** R$ ${parseFloat(dbService.rate).toFixed(4)} por 1000 unidades\n`;
  description += `• **Margem de lucro:** ${profitPercentage}% (R$ ${profit.toFixed(4)})\n`;

  return description.trim();
}

// Função principal
async function extractFullServiceDetails() {
  console.log('🔍 EXTRAINDO INFORMAÇÕES COMPLETAS DOS SERVIÇOS');
  console.log('='.repeat(60));

  // Buscar chaves da API
  const { data: apiKeys } = await supabase.from('api_keys').select('*').eq('is_active', true);
  const mtpConfig = apiKeys?.find(key => key.provider === 'mtp');
  
  if (!mtpConfig) {
    console.log('❌ Configuração da API MTP não encontrada');
    return;
  }

  // Buscar alguns serviços específicos para análise detalhada
  const { data: dbServices } = await supabase
    .from('services')
    .select('*')
    .limit(3); // Analisar apenas 3 para demonstração

  console.log(`\n📋 Analisando ${dbServices.length} serviços em detalhes...\n`);

  for (const dbService of dbServices) {
    console.log(`🔍 ANALISANDO: ${dbService.name}`);
    console.log('='.repeat(80));

    // Buscar dados completos da API
    const apiService = await fetchSpecificService(
      mtpConfig.api_key, 
      mtpConfig.api_url, 
      dbService.provider_service_id
    );

    if (!apiService) {
      console.log('❌ Serviço não encontrado na API\n');
      continue;
    }

    // Extrair todas as informações
    const serviceInfo = extractAllServiceInfo(apiService);

    // Mostrar informações extraídas
    console.log('\n📊 DADOS DA API:');
    console.log(`Nome original: ${serviceInfo.originalName}`);
    console.log(`Categoria: ${serviceInfo.category}`);
    console.log(`Rate: $${serviceInfo.rate}`);
    console.log(`Min-Max: ${serviceInfo.min} - ${serviceInfo.max}`);
    console.log(`Type: ${serviceInfo.type}`);
    console.log(`Refill: ${serviceInfo.refill}`);
    console.log(`Cancel: ${serviceInfo.cancel}`);
    console.log(`Dripfeed: ${serviceInfo.dripfeed}`);

    console.log('\n🔍 INFORMAÇÕES EXTRAÍDAS:');
    console.log(`Geo: ${serviceInfo.extracted.geo || 'N/A'}`);
    console.log(`Start Time: ${serviceInfo.extracted.startTime || 'N/A'}`);
    console.log(`Speed: ${serviceInfo.extracted.speed || 'N/A'}`);
    console.log(`Min-Max detalhado: ${serviceInfo.extracted.minMax || 'N/A'}`);
    console.log(`Quality Tier: ${serviceInfo.extracted.qualityTier || 'N/A'}`);
    console.log(`Link Example: ${serviceInfo.extracted.linkExample || 'N/A'}`);
    console.log(`Warnings: ${serviceInfo.extracted.warnings.length}`);
    console.log(`Features: ${serviceInfo.extracted.features.length}`);

    if (serviceInfo.extracted.warnings.length > 0) {
      console.log('\n⚠️ AVISOS:');
      serviceInfo.extracted.warnings.forEach(warning => {
        console.log(`   • ${warning}`);
      });
    }

    // Gerar e mostrar nova descrição
    const completeDescription = generateCompleteDescription(serviceInfo, dbService);
    
    console.log('\n📝 DESCRIÇÃO COMPLETA GERADA:');
    console.log('-'.repeat(60));
    console.log(completeDescription);
    console.log('-'.repeat(60));

    // Atualizar no banco
    const { error } = await supabase
      .from('services')
      .update({
        description: completeDescription,
        updated_at: new Date().toISOString()
      })
      .eq('id', dbService.id);

    if (error) {
      console.error('❌ Erro ao atualizar:', error);
    } else {
      console.log('✅ Descrição atualizada no banco!');
    }

    console.log('\n' + '='.repeat(80) + '\n');
  }

  console.log('✅ Análise completa finalizada!');
}

// Executar
if (require.main === module) {
  extractFullServiceDetails().catch(console.error);
}

module.exports = { extractAllServiceInfo, generateCompleteDescription };
