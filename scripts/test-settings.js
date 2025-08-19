// Script para testar o sistema de configurações
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis do Supabase não encontradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Configurações padrão para testar
const defaultSettings = [
  // Configurações gerais
  {
    key: "site_name",
    value: "SMM Panel Brasil",
    description: "Nome do site exibido no cabeçalho"
  },
  {
    key: "site_description",
    value: "Serviços de Marketing Digital - Mais Barato do Brasil",
    description: "Descrição do site"
  },
  {
    key: "contact_email",
    value: "contato@smmpainel.com",
    description: "Email de contato principal"
  },
  {
    key: "support_whatsapp",
    value: "+5511999999999",
    description: "WhatsApp de suporte"
  },
  
  // Configurações de preços
  {
    key: "global_markup_percentage",
    value: "20",
    description: "Markup padrão aplicado aos serviços (%)"
  },
  {
    key: "min_deposit_amount",
    value: "10.00",
    description: "Valor mínimo de depósito (BRL)"
  },
  {
    key: "max_deposit_amount",
    value: "10000.00",
    description: "Valor máximo de depósito (BRL)"
  },
  {
    key: "currency_symbol",
    value: "R$",
    description: "Símbolo da moeda"
  },
  
  // Configurações de API
  {
    key: "api_timeout_seconds",
    value: "30",
    description: "Timeout para requisições API (segundos)"
  },
  {
    key: "sync_interval_hours",
    value: "6",
    description: "Intervalo de sincronização automática (horas)"
  },
  {
    key: "auto_sync_enabled",
    value: "true",
    description: "Sincronização automática habilitada"
  },
  
  // Configurações de notificações
  {
    key: "email_notifications_enabled",
    value: "true",
    description: "Notificações por email habilitadas"
  },
  {
    key: "order_status_notifications",
    value: "true",
    description: "Notificar mudanças de status de pedidos"
  },
  {
    key: "low_balance_alert_threshold",
    value: "100.00",
    description: "Alerta quando saldo do provedor for menor que (USD)"
  },
  
  // Configurações de segurança
  {
    key: "max_login_attempts",
    value: "5",
    description: "Tentativas máximas de login"
  },
  {
    key: "session_timeout_minutes",
    value: "60",
    description: "Timeout da sessão (minutos)"
  },
  {
    key: "require_email_verification",
    value: "true",
    description: "Exigir verificação de email"
  },
  
  // Configurações do sistema
  {
    key: "maintenance_mode",
    value: "false",
    description: "Modo de manutenção"
  },
  {
    key: "debug_mode",
    value: "false",
    description: "Modo debug habilitado"
  },
  {
    key: "log_level",
    value: "info",
    description: "Nível de log (debug, info, warn, error)"
  }
];

async function testSettingsSystem() {
  console.log('⚙️ TESTANDO SISTEMA DE CONFIGURAÇÕES');
  console.log('='.repeat(50));

  try {
    // 1. Verificar se a tabela settings existe
    console.log('\n📋 1. Verificando tabela settings...');
    const { data: existingSettings, error: selectError } = await supabase
      .from('settings')
      .select('*')
      .limit(1);

    if (selectError) {
      console.log('❌ Erro ao acessar tabela settings:', selectError.message);
      return;
    }

    console.log('✅ Tabela settings acessível');

    // 2. Inserir configurações padrão
    console.log('\n📋 2. Inserindo configurações padrão...');
    
    for (const setting of defaultSettings) {
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

    // 3. Verificar configurações inseridas
    console.log('\n📋 3. Verificando configurações inseridas...');
    const { data: allSettings, error: allError } = await supabase
      .from('settings')
      .select('*')
      .order('key');

    if (allError) {
      console.log('❌ Erro ao buscar configurações:', allError.message);
      return;
    }

    console.log(`✅ ${allSettings.length} configurações encontradas`);

    // 4. Categorizar configurações
    console.log('\n📋 4. Categorizando configurações...');
    
    const categorized = {
      general: [],
      pricing: [],
      api: [],
      notifications: [],
      security: [],
      system: []
    };

    allSettings.forEach(setting => {
      const key = setting.key.toLowerCase();
      
      if (key.includes('markup') || key.includes('price') || key.includes('currency') || key.includes('deposit')) {
        categorized.pricing.push(setting);
      } else if (key.includes('api') || key.includes('provider') || key.includes('sync') || key.includes('timeout')) {
        categorized.api.push(setting);
      } else if (key.includes('notification') || key.includes('email') || key.includes('alert')) {
        categorized.notifications.push(setting);
      } else if (key.includes('security') || key.includes('auth') || key.includes('password') || key.includes('login') || key.includes('session')) {
        categorized.security.push(setting);
      } else if (key.includes('maintenance') || key.includes('debug') || key.includes('log')) {
        categorized.system.push(setting);
      } else {
        categorized.general.push(setting);
      }
    });

    console.log('\n📊 Distribuição por categoria:');
    Object.entries(categorized).forEach(([category, settings]) => {
      console.log(`   ${category}: ${settings.length} configurações`);
    });

    // 5. Testar atualização de configuração
    console.log('\n📋 5. Testando atualização...');
    const { data: updatedSetting, error: updateError } = await supabase
      .from('settings')
      .update({ 
        value: 'SMM Panel Brasil - Teste Atualizado',
        updated_at: new Date().toISOString()
      })
      .eq('key', 'site_name')
      .select()
      .single();

    if (updateError) {
      console.log('❌ Erro ao atualizar:', updateError.message);
    } else {
      console.log('✅ Configuração atualizada:', updatedSetting.key, '=', updatedSetting.value);
    }

    // 6. Testar busca por configuração específica
    console.log('\n📋 6. Testando busca específica...');
    const { data: specificSetting, error: specificError } = await supabase
      .from('settings')
      .select('*')
      .eq('key', 'global_markup_percentage')
      .single();

    if (specificError) {
      console.log('❌ Erro ao buscar configuração específica:', specificError.message);
    } else {
      console.log('✅ Configuração encontrada:', specificSetting.key, '=', specificSetting.value);
    }

    // 7. Testar exportação (simulada)
    console.log('\n📋 7. Testando exportação...');
    const exportData = {
      exported_at: new Date().toISOString(),
      version: "1.0",
      settings: allSettings
    };

    console.log(`✅ Dados de exportação preparados: ${exportData.settings.length} configurações`);

    // 8. Estatísticas finais
    console.log('\n📊 ESTATÍSTICAS FINAIS:');
    console.log('='.repeat(30));
    console.log(`📈 Total de configurações: ${allSettings.length}`);
    console.log(`📂 Geral: ${categorized.general.length}`);
    console.log(`💰 Preços: ${categorized.pricing.length}`);
    console.log(`🔌 APIs: ${categorized.api.length}`);
    console.log(`🔔 Notificações: ${categorized.notifications.length}`);
    console.log(`🔒 Segurança: ${categorized.security.length}`);
    console.log(`⚙️ Sistema: ${categorized.system.length}`);

    // 9. Verificar configurações críticas
    console.log('\n🔍 CONFIGURAÇÕES CRÍTICAS:');
    console.log('='.repeat(30));
    
    const criticalSettings = [
      'global_markup_percentage',
      'auto_sync_enabled', 
      'maintenance_mode',
      'debug_mode'
    ];

    criticalSettings.forEach(key => {
      const setting = allSettings.find(s => s.key === key);
      if (setting) {
        console.log(`✅ ${key}: ${setting.value}`);
      } else {
        console.log(`❌ ${key}: NÃO ENCONTRADA`);
      }
    });

    console.log('\n🎉 TESTE DO SISTEMA DE CONFIGURAÇÕES CONCLUÍDO!');
    console.log('\n💡 Próximos passos:');
    console.log('   • Acesse http://localhost:3001/dashboard/admin/settings');
    console.log('   • Teste a interface de configurações');
    console.log('   • Exporte/importe configurações');
    console.log('   • Ajuste configurações conforme necessário');

  } catch (error) {
    console.error('❌ Erro geral no teste:', error);
  }
}

// Executar teste
if (require.main === module) {
  testSettingsSystem().catch(console.error);
}

module.exports = { testSettingsSystem };
