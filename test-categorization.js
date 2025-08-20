// SCRIPT PARA TESTAR A CATEGORIZAÇÃO DAS CONFIGURAÇÕES
// Execute no console do navegador para ver como as configurações serão categorizadas

const settings = [
  {"key":"manual_sync_started","value":null,"description":"Última sincronização manual iniciada"},
  {"key":"last_monitoring","value":null,"description":"Último monitoramento executado"},
  {"key":"currency_last_update","value":"2025-08-19T14:16:47.735Z","description":null},
  {"key":"support_whatsapp","value":"+5511999999999","description":"WhatsApp de suporte"},
  {"key":"auto_sync_enabled","value":"false","description":"Sincronização automática de serviços"},
  {"key":"low_balance_alert","value":"100.00","description":"Alerta saldo baixo (USD)"},
  {"key":"markup_percentage","value":"90","description":null},
  {"key":"contact_email","value":"contato@smmpainel.com","description":"Email de contato principal"},
  {"key":"email_notifications","value":"true","description":"Notificações por email"},
  {"key":"currency_mode","value":"auto","description":null},
  {"key":"maintenance_mode","value":"false","description":"Modo de manutenção"},
  {"key":"last_price_update","value":null,"description":"Última atualização de preços"},
  {"key":"min_deposit","value":"10.00","description":"Depósito mínimo (BRL)"},
  {"key":"debug_mode","value":"false","description":"Modo debug habilitado"},
  {"key":"mtp_balance","value":"0.0000000","description":"Saldo atual do provedor MTP"},
  {"key":"usd_brl_rate","value":"5.5","description":null},
  {"key":"log_level","value":"info","description":"Nível de log do sistema"},
  {"key":"site_name","value":"SMM Panel Brasil - Teste Atualizado","description":"Nome do site"},
  {"key":"last_full_sync","value":null,"description":"Última sincronização completa"},
  {"key":"test_save_1755612632465","value":"funcionando","description":"Teste de salvamento"},
  {"key":"sync_interval_hours","value":"24","description":"Intervalo de sincronização em horas"}
];

const categorizedSettings = {
  general: [],
  pricing: [],
  api: [],
  notifications: [],
  security: [],
  system: []
};

settings.forEach(setting => {
  const key = setting.key.toLowerCase();
  
  // Pular configurações que são exibidas na seção especial de câmbio
  if (key === 'currency_mode' || key === 'usd_brl_rate' || key === 'markup_percentage') {
    console.log(`⏭️ PULANDO (seção câmbio): ${key}`);
    return;
  }
  
  // Categorização melhorada baseada nos dados reais
  if (key.includes('deposit') || key.includes('min_') || key.includes('max_') || key.includes('balance')) {
    categorizedSettings.pricing.push(setting);
    console.log(`💰 PRICING: ${key}`);
  } else if (key.includes('api') || key.includes('provider') || key.includes('sync') || key.includes('timeout') || 
             key.includes('mtp_') || key.includes('jap_') || key.includes('last_sync') || 
             key.includes('last_full_sync') || key.includes('last_monitoring') || key.includes('last_price_update')) {
    categorizedSettings.api.push(setting);
    console.log(`🔌 API: ${key}`);
  } else if (key.includes('notification') || key.includes('email') || key.includes('alert') || 
             key.includes('whatsapp') || key.includes('contact')) {
    categorizedSettings.notifications.push(setting);
    console.log(`🔔 NOTIFICATIONS: ${key}`);
  } else if (key.includes('security') || key.includes('auth') || key.includes('password') || 
             key.includes('login') || key.includes('session')) {
    categorizedSettings.security.push(setting);
    console.log(`🔒 SECURITY: ${key}`);
  } else if (key.includes('maintenance') || key.includes('debug') || key.includes('log') || 
             key.includes('test_')) {
    categorizedSettings.system.push(setting);
    console.log(`⚙️ SYSTEM: ${key}`);
  } else {
    categorizedSettings.general.push(setting);
    console.log(`🌐 GENERAL: ${key}`);
  }
});

console.log('\n📊 RESULTADO DA CATEGORIZAÇÃO:');
console.log('================================');
console.log(`Total: ${settings.length}`);
console.log(`Geral: ${categorizedSettings.general.length}`);
console.log(`Preços & Câmbio: ${categorizedSettings.pricing.length}`);
console.log(`APIs: ${categorizedSettings.api.length}`);
console.log(`Notificações: ${categorizedSettings.notifications.length}`);
console.log(`Segurança: ${categorizedSettings.security.length}`);
console.log(`Sistema: ${categorizedSettings.system.length}`);

console.log('\n📋 DETALHES POR CATEGORIA:');
console.log('==========================');
Object.entries(categorizedSettings).forEach(([category, items]) => {
  if (items.length > 0) {
    console.log(`\n${category.toUpperCase()} (${items.length}):`);
    items.forEach(item => console.log(`  - ${item.key}: ${item.description || 'Sem descrição'}`));
  }
});
