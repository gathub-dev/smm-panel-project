// Script para configurar sincronização automática
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis do Supabase não encontradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Função para criar script de sincronização automática
function createAutoSyncScript() {
  const scriptContent = `#!/bin/bash
# Script de sincronização automática do SMM Panel
# Executado automaticamente pelo cron

cd "${process.cwd()}"

echo "🔄 Iniciando sincronização automática - $(date)"

# Executar monitoramento
node scripts/monitor-and-sync.js

# Se houve mudanças significativas, executar correção de preços
if [ $? -eq 0 ]; then
    echo "✅ Monitoramento concluído"
    
    # Verificar se precisa atualizar preços (baseado na última atualização)
    LAST_UPDATE=$(node -e "
        require('dotenv').config();
        const { createClient } = require('@supabase/supabase-js');
        const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
        
        supabase.from('settings').select('value').eq('key', 'last_price_update').single()
        .then(({data}) => {
            const lastUpdate = data?.value ? new Date(data.value) : new Date(0);
            const hoursSince = (new Date() - lastUpdate) / (1000 * 60 * 60);
            console.log(hoursSince > 6 ? 'UPDATE_NEEDED' : 'NO_UPDATE');
        })
        .catch(() => console.log('UPDATE_NEEDED'));
    ")
    
    if [ "$LAST_UPDATE" = "UPDATE_NEEDED" ]; then
        echo "🔧 Executando atualização de preços..."
        node scripts/fix-and-validate-prices.js
        
        # Salvar timestamp da última atualização
        node -e "
            require('dotenv').config();
            const { createClient } = require('@supabase/supabase-js');
            const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
            
            supabase.from('settings').upsert({
                key: 'last_price_update',
                value: new Date().toISOString(),
                description: 'Última atualização automática de preços'
            }).then(() => console.log('✅ Timestamp atualizado'));
        "
    else
        echo "⏭️ Preços atualizados recentemente, pulando..."
    fi
else
    echo "❌ Erro no monitoramento"
fi

echo "🏁 Sincronização automática finalizada - $(date)"
echo "----------------------------------------"
`;

  const scriptPath = path.join(process.cwd(), 'scripts', 'auto-sync.sh');
  fs.writeFileSync(scriptPath, scriptContent);
  
  // Tornar o script executável
  fs.chmodSync(scriptPath, '755');
  
  return scriptPath;
}

// Função para criar configuração do cron
function createCronConfig() {
  const projectPath = process.cwd();
  const cronEntry = `# SMM Panel - Sincronização automática a cada 6 horas
0 */6 * * * cd ${projectPath} && ./scripts/auto-sync.sh >> logs/auto-sync.log 2>&1

# SMM Panel - Monitoramento rápido a cada hora
0 * * * * cd ${projectPath} && node scripts/monitor-and-sync.js >> logs/monitoring.log 2>&1`;

  const cronPath = path.join(process.cwd(), 'scripts', 'crontab-config.txt');
  fs.writeFileSync(cronPath, cronEntry);
  
  return cronPath;
}

// Função para criar diretório de logs
function createLogsDirectory() {
  const logsDir = path.join(process.cwd(), 'logs');
  if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
  }
  
  // Criar arquivo de log inicial
  const logFile = path.join(logsDir, 'auto-sync.log');
  if (!fs.existsSync(logFile)) {
    fs.writeFileSync(logFile, `# Log de sincronização automática - Iniciado em ${new Date().toISOString()}\n`);
  }
  
  const monitoringLogFile = path.join(logsDir, 'monitoring.log');
  if (!fs.existsSync(monitoringLogFile)) {
    fs.writeFileSync(monitoringLogFile, `# Log de monitoramento - Iniciado em ${new Date().toISOString()}\n`);
  }
  
  return logsDir;
}

// Função para salvar configurações no banco
async function saveAutoSyncSettings() {
  const settings = [
    {
      key: 'auto_sync_enabled',
      value: 'true',
      description: 'Sincronização automática habilitada'
    },
    {
      key: 'sync_interval_hours',
      value: '6',
      description: 'Intervalo de sincronização em horas'
    },
    {
      key: 'monitoring_interval_hours',
      value: '1',
      description: 'Intervalo de monitoramento em horas'
    },
    {
      key: 'max_price_difference_percent',
      value: '10',
      description: 'Diferença máxima de preço para alerta (%)'
    },
    {
      key: 'min_profit_margin_brl',
      value: '0.5',
      description: 'Margem mínima de lucro em BRL'
    }
  ];

  for (const setting of settings) {
    const { error } = await supabase
      .from('settings')
      .upsert(setting);

    if (error) {
      console.error(`❌ Erro ao salvar configuração ${setting.key}:`, error);
    }
  }
}

// Função principal
async function setupAutoSync() {
  console.log('⚙️ CONFIGURANDO SINCRONIZAÇÃO AUTOMÁTICA');
  console.log('='.repeat(50));

  try {
    // 1. Criar script de sincronização
    console.log('📝 1. Criando script de sincronização automática...');
    const scriptPath = createAutoSyncScript();
    console.log(`✅ Script criado: ${scriptPath}`);

    // 2. Criar configuração do cron
    console.log('\n📝 2. Criando configuração do cron...');
    const cronPath = createCronConfig();
    console.log(`✅ Configuração criada: ${cronPath}`);

    // 3. Criar diretório de logs
    console.log('\n📝 3. Criando diretório de logs...');
    const logsDir = createLogsDirectory();
    console.log(`✅ Diretório criado: ${logsDir}`);

    // 4. Salvar configurações no banco
    console.log('\n📝 4. Salvando configurações no banco...');
    await saveAutoSyncSettings();
    console.log('✅ Configurações salvas no banco');

    // 5. Instruções para o usuário
    console.log('\n📋 INSTRUÇÕES PARA ATIVAR:');
    console.log('='.repeat(30));
    console.log('Para ativar a sincronização automática, execute:');
    console.log('');
    console.log('1. Instalar a configuração do cron:');
    console.log(`   crontab ${cronPath}`);
    console.log('');
    console.log('2. Verificar se foi instalado:');
    console.log('   crontab -l');
    console.log('');
    console.log('3. Monitorar logs:');
    console.log('   tail -f logs/auto-sync.log');
    console.log('   tail -f logs/monitoring.log');
    console.log('');
    console.log('📅 CRONOGRAMA CONFIGURADO:');
    console.log('- Sincronização completa: A cada 6 horas');
    console.log('- Monitoramento rápido: A cada 1 hora');
    console.log('');
    console.log('⚠️ IMPORTANTE:');
    console.log('- Certifique-se de que o Node.js está no PATH do sistema');
    console.log('- Verifique se as variáveis de ambiente estão configuradas');
    console.log('- Os logs serão salvos no diretório logs/');

    // 6. Teste rápido
    console.log('\n🧪 TESTE RÁPIDO:');
    console.log('Para testar manualmente, execute:');
    console.log('./scripts/auto-sync.sh');

    console.log('\n✅ Configuração de sincronização automática concluída!');

  } catch (error) {
    console.error('❌ Erro durante configuração:', error);
  }
}

// Executar configuração
if (require.main === module) {
  setupAutoSync().catch(console.error);
}

module.exports = { setupAutoSync };
