// Script para simplificar configurações - remover duplicatas e deixar apenas o essencial
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis do Supabase não encontradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// CONFIGURAÇÕES ESSENCIAIS SIMPLIFICADAS
const essentialSettings = [
  // === GERAL ===
  {
    key: "site_name",
    value: "SMM Panel Brasil",
    description: "Nome do site"
  },
  {
    key: "contact_email", 
    value: "contato@smmpainel.com",
    description: "Email de contato"
  },
  {
    key: "support_whatsapp",
    value: "+5511999999999", 
    description: "WhatsApp de suporte"
  },

  // === PREÇOS E CÂMBIO ===
  {
    key: "markup_percentage",
    value: "20",
    description: "Markup aplicado aos serviços (%)"
  },
  {
    key: "currency_mode",
    value: "manual", 
    description: "Modo câmbio: 'manual' ou 'auto'"
  },
  {
    key: "usd_brl_rate",
    value: "5.50",
    description: "Taxa USD/BRL (manual) ou fallback (auto)"
  },
  {
    key: "min_deposit",
    value: "10.00",
    description: "Depósito mínimo (BRL)"
  },

  // === SISTEMA ===
  {
    key: "auto_sync_enabled",
    value: "true",
    description: "Sincronização automática de serviços"
  },
  {
    key: "sync_interval_hours",
    value: "6",
    description: "Intervalo de sincronização (horas)"
  },
  {
    key: "maintenance_mode",
    value: "false", 
    description: "Modo manutenção"
  },
  {
    key: "debug_mode",
    value: "false",
    description: "Modo debug"
  },

  // === NOTIFICAÇÕES ===
  {
    key: "email_notifications",
    value: "true",
    description: "Notificações por email"
  },
  {
    key: "low_balance_alert",
    value: "100.00",
    description: "Alerta saldo baixo (USD)"
  }
];

// Configurações para REMOVER (duplicatas/desnecessárias)
const settingsToRemove = [
  // Duplicatas de timeout
  'api_timeout_seconds',
  'currency_api_timeout_seconds',
  
  // Duplicatas de câmbio
  'currency_symbol', // usar padrão R$
  'currency_api_key', // só se necessário
  'currency_api_provider', // usar padrão
  'currency_auto_update_enabled', // usar currency_mode
  'currency_fallback_rate', // usar usd_brl_rate
  'currency_last_update', // automático
  'currency_update_interval_hours', // usar sync_interval_hours
  'currency_source_type', // usar currency_mode
  'usd_brl_manual_rate', // usar usd_brl_rate
  
  // Configurações muito específicas
  'max_price_difference_percent',
  'min_profit_margin_brl',
  'monitoring_interval_hours',
  
  // Configurações de segurança básicas (usar padrões)
  'max_login_attempts',
  'session_timeout_minutes', 
  'require_email_verification',
  
  // Configurações automáticas
  'last_full_sync',
  'last_monitoring',
  
  // Duplicatas de notificação
  'email_notifications_enabled', // usar email_notifications
  'order_status_notifications', // incluído em email_notifications
  'low_balance_alert_threshold', // usar low_balance_alert
  
  // Configurações de depósito desnecessárias
  'max_deposit_amount', // sem limite
  'min_deposit_amount', // usar min_deposit
  
  // Configurações de log (usar padrões)
  'log_level',
  
  // Descrição desnecessária
  'site_description' // usar padrão
];

async function simplifySettings() {
  console.log('🧹 SIMPLIFICANDO CONFIGURAÇÕES');
  console.log('='.repeat(50));

  try {
    // 1. Remover configurações desnecessárias
    console.log('\n❌ Removendo configurações desnecessárias...');
    for (const key of settingsToRemove) {
      const { error } = await supabase
        .from('settings')
        .delete()
        .eq('key', key);

      if (error) {
        console.log(`⚠️ Erro ao remover ${key}: ${error.message}`);
      } else {
        console.log(`🗑️ Removido: ${key}`);
      }
    }

    // 2. Inserir/atualizar configurações essenciais
    console.log('\n✅ Inserindo configurações essenciais...');
    for (const setting of essentialSettings) {
      const { data, error } = await supabase
        .from('settings')
        .upsert(setting)
        .select()
        .single();

      if (error) {
        console.log(`❌ Erro ao inserir ${setting.key}: ${error.message}`);
      } else {
        console.log(`✅ ${setting.key}: ${setting.value}`);
      }
    }

    // 3. Verificar resultado final
    console.log('\n📊 CONFIGURAÇÕES FINAIS:');
    console.log('='.repeat(30));
    
    const { data: finalSettings, error: finalError } = await supabase
      .from('settings')
      .select('*')
      .order('key');

    if (finalError) {
      console.log('❌ Erro ao buscar configurações finais:', finalError.message);
      return;
    }

    // Categorizar configurações finais
    const categories = {
      geral: [],
      precos: [],
      sistema: [], 
      notificacoes: []
    };

    finalSettings?.forEach(setting => {
      const key = setting.key.toLowerCase();
      if (key.includes('site_') || key.includes('contact_') || key.includes('support_')) {
        categories.geral.push(setting);
      } else if (key.includes('markup') || key.includes('currency') || key.includes('usd') || key.includes('deposit')) {
        categories.precos.push(setting);
      } else if (key.includes('sync') || key.includes('maintenance') || key.includes('debug')) {
        categories.sistema.push(setting);
      } else if (key.includes('notification') || key.includes('email') || key.includes('alert')) {
        categories.notificacoes.push(setting);
      }
    });

    console.log(`\n📈 TOTAL: ${finalSettings.length} configurações`);
    console.log(`🌐 Geral: ${categories.geral.length}`);
    console.log(`💰 Preços: ${categories.precos.length}`);
    console.log(`⚙️ Sistema: ${categories.sistema.length}`);
    console.log(`🔔 Notificações: ${categories.notificacoes.length}`);

    console.log('\n📋 CONFIGURAÇÕES POR CATEGORIA:');
    Object.entries(categories).forEach(([cat, settings]) => {
      console.log(`\n${cat.toUpperCase()}:`);
      settings.forEach(s => console.log(`   ${s.key}: ${s.value}`));
    });

    console.log('\n🎉 SIMPLIFICAÇÃO CONCLUÍDA!');
    console.log('\n💡 Agora você tem apenas as configurações essenciais:');
    console.log('   • Informações básicas do site');
    console.log('   • Configurações de preço e câmbio simplificadas');
    console.log('   • Controles de sistema essenciais');
    console.log('   • Notificações básicas');
    
  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

// Executar
if (require.main === module) {
  simplifySettings().catch(console.error);
}

module.exports = { simplifySettings };
