// Script para melhorar extração de descrições detalhadas dos serviços
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis do Supabase não encontradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Função para buscar chaves da API
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

    const services = await response.json();
    return services;
  } catch (error) {
    console.error('❌ Erro ao buscar da API MTP:', error.message);
    return [];
  }
}

// Função para extrair informações detalhadas da descrição
function parseServiceDescription(description) {
  const info = {
    geo: null,
    startTime: null,
    minMax: null,
    linkExample: null,
    warnings: [],
    qualityTier: null,
    qualityDescription: null,
    speed: null
  };

  if (!description) return info;

  // Extrair Geo
  const geoMatch = description.match(/🌎\s*Geo:\s*([^\n]+)/i) || 
                   description.match(/🌍\s*Geo:\s*([^\n]+)/i);
  if (geoMatch) {
    info.geo = geoMatch[1].trim();
  }

  // Extrair Start Time
  const startTimeMatch = description.match(/⌚️?\s*(?:Horário de Início|Start Time):\s*([^\n]+)/i);
  if (startTimeMatch) {
    info.startTime = startTimeMatch[1].trim();
  }

  // Extrair Min-Max
  const minMaxMatch = description.match(/🔼\s*(?:Mín\.|Min)\s*-\s*(?:Máx\.|Max)\.?:\s*([^\n]+)/i);
  if (minMaxMatch) {
    info.minMax = minMaxMatch[1].trim();
  }

  // Extrair Link Example
  const linkMatch = description.match(/🍺?\s*(?:Exemplo de Link|Link Example):\s*(https?:\/\/[^\s\n]+)/i);
  if (linkMatch) {
    info.linkExample = linkMatch[1].trim();
  }

  // Extrair avisos/warnings
  const warningPatterns = [
    /⚠️\s*([^\n]+)/g,
    /🚨\s*([^\n]+)/g,
    /❗\s*([^\n]+)/g
  ];

  warningPatterns.forEach(pattern => {
    let match;
    while ((match = pattern.exec(description)) !== null) {
      info.warnings.push(match[1].trim());
    }
  });

  // Extrair tier de qualidade (cores)
  const qualityTiers = {
    '🟢': 'MÉDIO',
    '🟡': 'BÁSICO', 
    '🔵': 'PREMIUM',
    '🟠': 'ALTO',
    '🔴': 'MÁXIMO'
  };

  for (const [emoji, tier] of Object.entries(qualityTiers)) {
    if (description.includes(emoji)) {
      info.qualityTier = tier;
      
      // Extrair descrição da qualidade
      const tierPattern = new RegExp(`${emoji}\\s*${tier}:?\\s*([^🟢🟡🔵🟠🔴]+)`, 'i');
      const tierMatch = description.match(tierPattern);
      if (tierMatch) {
        info.qualityDescription = tierMatch[1].trim().replace(/\n+/g, ' ');
      }
      break;
    }
  }

  // Extrair velocidade da descrição ou nome
  const speedPatterns = [
    /(\d+(?:-\d+)?(?:K|k)?\/(?:Day|Dia|Daily))/gi,
    /(?:Speed|Velocidade):\s*(\d+(?:-\d+)?(?:K|k)?\/(?:Day|Dia|Daily))/gi,
    /(\d+(?:-\d+)?\s*(?:K|k)?\s*(?:por|per)\s*(?:dia|day))/gi
  ];

  speedPatterns.forEach(pattern => {
    const match = description.match(pattern);
    if (match && !info.speed) {
      info.speed = match[1];
    }
  });

  return info;
}

// Função para gerar descrição melhorada em português
function generateImprovedDescription(service, parsedInfo, apiService) {
  let description = '';

  // Título do serviço
  const platform = service.category.split(' - ')[0];
  const serviceType = service.category.split(' - ')[1];
  
  description += `🎯 **${serviceType} para ${platform}**\n\n`;

  // Informações básicas
  description += `📊 **Detalhes do Serviço:**\n`;
  description += `• Quantidade mínima: ${service.min_quantity.toLocaleString('pt-BR')}\n`;
  description += `• Quantidade máxima: ${service.max_quantity.toLocaleString('pt-BR')}\n`;
  
  if (parsedInfo.speed) {
    description += `• Velocidade: ${parsedInfo.speed.replace(/Day|Daily/gi, 'por dia')}\n`;
  }

  if (parsedInfo.startTime) {
    description += `• Tempo de início: ${parsedInfo.startTime.replace(/h/g, ' horas')}\n`;
  }

  if (parsedInfo.geo) {
    description += `• Localização: ${parsedInfo.geo === 'Global' ? 'Mundial' : parsedInfo.geo}\n`;
  }

  // Garantias e recursos
  description += `\n🛡️ **Garantias:**\n`;
  
  if (service.name.includes('Garantia Vitalícia')) {
    description += `• ✅ Garantia vitalícia incluída\n`;
  } else if (service.name.includes('Reposição 30 Dias')) {
    description += `• ✅ Reposição de 30 dias\n`;
  } else if (service.name.includes('Sem Reposição')) {
    description += `• ❌ Sem reposição\n`;
  }

  if (service.refill) {
    description += `• ✅ Reposição automática disponível\n`;
  }

  if (service.cancel) {
    description += `• ✅ Cancelamento disponível\n`;
  }

  // Qualidade do serviço
  if (parsedInfo.qualityTier) {
    description += `\n⭐ **Nível de Qualidade: ${parsedInfo.qualityTier}**\n`;
    if (parsedInfo.qualityDescription) {
      description += `${parsedInfo.qualityDescription.substring(0, 200)}...\n`;
    }
  }

  // Avisos importantes
  if (parsedInfo.warnings.length > 0) {
    description += `\n⚠️ **Avisos Importantes:**\n`;
    parsedInfo.warnings.forEach(warning => {
      description += `• ${warning}\n`;
    });
  }

  // Exemplo de link
  if (parsedInfo.linkExample) {
    description += `\n🔗 **Exemplo de link:** ${parsedInfo.linkExample}\n`;
  }

  // Preço
  description += `\n💰 **Preço:** R$ ${parseFloat(service.rate).toFixed(4)} por 1000 unidades\n`;

  return description.trim();
}

// Função principal
async function improveServiceDescriptions() {
  console.log('🔧 MELHORANDO DESCRIÇÕES DOS SERVIÇOS');
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

  // 3. Buscar serviços do banco
  console.log('\n📋 3. Buscando serviços do banco...');
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

  // 4. Processar cada serviço
  console.log('\n📋 4. Processando descrições...');
  console.log('='.repeat(50));

  let updatedCount = 0;

  for (const dbService of dbServices.slice(0, 5)) { // Processar apenas os primeiros 5 para teste
    const apiService = apiServices.find(s => s.service === dbService.provider_service_id);
    
    if (!apiService) {
      console.log(`⚠️ Serviço ${dbService.provider_service_id} não encontrado na API`);
      continue;
    }

    console.log(`\n🔍 Processando: ${dbService.name.substring(0, 50)}...`);
    
    // Extrair informações da descrição original
    const parsedInfo = parseServiceDescription(apiService.name);
    
    console.log('📋 Informações extraídas:');
    console.log(`   Geo: ${parsedInfo.geo || 'N/A'}`);
    console.log(`   Start Time: ${parsedInfo.startTime || 'N/A'}`);
    console.log(`   Min-Max: ${parsedInfo.minMax || 'N/A'}`);
    console.log(`   Speed: ${parsedInfo.speed || 'N/A'}`);
    console.log(`   Quality: ${parsedInfo.qualityTier || 'N/A'}`);
    console.log(`   Warnings: ${parsedInfo.warnings.length}`);

    // Gerar nova descrição
    const improvedDescription = generateImprovedDescription(dbService, parsedInfo, apiService);
    
    console.log('\n📝 Nova descrição gerada:');
    console.log(improvedDescription.substring(0, 300) + '...');

    // Atualizar no banco
    const { error: updateError } = await supabase
      .from('services')
      .update({
        description: improvedDescription,
        updated_at: new Date().toISOString()
      })
      .eq('id', dbService.id);

    if (updateError) {
      console.error(`❌ Erro ao atualizar serviço ${dbService.id}:`, updateError);
    } else {
      console.log('✅ Descrição atualizada com sucesso!');
      updatedCount++;
    }

    console.log('\n' + '-'.repeat(60));
  }

  console.log(`\n✅ ${updatedCount} descrições atualizadas com sucesso!`);
  
  // 5. Mostrar exemplo de antes e depois
  if (updatedCount > 0) {
    console.log('\n📋 EXEMPLO DE MELHORIA:');
    console.log('='.repeat(50));
    
    const { data: updatedService } = await supabase
      .from('services')
      .select('name, description')
      .limit(1)
      .single();

    if (updatedService) {
      console.log('🔧 ANTES: Descrição simples gerada automaticamente');
      console.log('🎯 DEPOIS: Descrição detalhada com informações extraídas da API');
      console.log('\n📝 Nova descrição:');
      console.log(updatedService.description);
    }
  }

  console.log('\n✅ Processo de melhoria concluído!');
}

// Executar o script
if (require.main === module) {
  improveServiceDescriptions().catch(console.error);
}

module.exports = { improveServiceDescriptions, parseServiceDescription };
