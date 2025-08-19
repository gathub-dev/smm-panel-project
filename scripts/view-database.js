#!/usr/bin/env node

/**
 * Script simples para visualizar todo o banco de dados SMM Panel
 * Execute: node scripts/view-database.js
 */

const { createClient } = require('@supabase/supabase-js');

// Configuração do Supabase
const SUPABASE_URL = 'https://xpklpweyvwviuiqzjgwe.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhwa2xwd2V5dnd2aXVpcXpqZ3dlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTU2NTE3OSwiZXhwIjoyMDcxMTQxMTc5fQ.7adnyvvwEWyAzYXHWyF7n9SEfdTrxZHcKlSKTJ7gQaQ';

async function viewDatabase() {
  console.log('🔍 VISUALIZANDO TODO O BANCO DE DADOS SMM PANEL');
  console.log('================================================\n');
  
  try {
    // Criar cliente Supabase com service role key
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    
    // 1. USUÁRIOS
    console.log('📊 USUÁRIOS:');
    console.log('-------------');
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (usersError) throw usersError;
    
    if (users && users.length > 0) {
      users.forEach((user, index) => {
        console.log(`${index + 1}. ${user.email}`);
        console.log(`   - Nome: ${user.full_name || 'Não informado'}`);
        console.log(`   - Role: ${user.role}`);
        console.log(`   - Status: ${user.status}`);
        console.log(`   - Saldo: R$ ${user.balance}`);
        console.log(`   - Criado em: ${new Date(user.created_at).toLocaleDateString('pt-BR')}`);
        console.log('');
      });
    } else {
      console.log('   Nenhum usuário encontrado');
      console.log('');
    }
    
    // 2. CATEGORIAS
    console.log('📂 CATEGORIAS:');
    console.log('---------------');
    const { data: categories, error: categoriesError } = await supabase
      .from('categories')
      .select('*')
      .order('sort_order', { ascending: true });
    
    if (categoriesError) throw categoriesError;
    
    if (categories && categories.length > 0) {
      categories.forEach((category, index) => {
        console.log(`${index + 1}. ${category.name}`);
        console.log(`   - Descrição: ${category.description || 'Sem descrição'}`);
        console.log(`   - Ícone: ${category.icon || 'Sem ícone'}`);
        console.log(`   - Ordem: ${category.sort_order}`);
        console.log(`   - Status: ${category.is_active ? 'Ativo' : 'Inativo'}`);
        console.log(`   - Criado em: ${new Date(category.created_at).toLocaleDateString('pt-BR')}`);
        console.log('');
      });
    } else {
      console.log('   Nenhuma categoria encontrada');
      console.log('');
    }
    
    // 3. SERVIÇOS
    console.log('🛠️ SERVIÇOS:');
    console.log('-------------');
    const { data: services, error: servicesError } = await supabase
      .from('services')
      .select(`
        *,
        categories(name)
      `)
      .order('created_at', { ascending: false });
    
    if (servicesError) throw servicesError;
    
    if (services && services.length > 0) {
      services.forEach((service, index) => {
        const categoryName = service.categories ? service.categories.name : 'Sem categoria';
        console.log(`${index + 1}. ${service.name}`);
        console.log(`   - Categoria: ${categoryName}`);
        console.log(`   - Descrição: ${service.description || 'Sem descrição'}`);
        console.log(`   - Provider: ${service.provider}`);
        console.log(`   - ID Provider: ${service.provider_service_id}`);
        console.log(`   - Taxa: R$ ${service.rate}`);
        console.log(`   - Quantidade: ${service.min_quantity} - ${service.max_quantity}`);
        console.log(`   - Tipo: ${service.type}`);
        console.log(`   - Status: ${service.status}`);
        console.log(`   - Dripfeed: ${service.dripfeed ? 'Sim' : 'Não'}`);
        console.log(`   - Refill: ${service.refill ? 'Sim' : 'Não'}`);
        console.log(`   - Cancel: ${service.cancel ? 'Sim' : 'Não'}`);
        console.log(`   - Criado em: ${new Date(service.created_at).toLocaleDateString('pt-BR')}`);
        console.log('');
      });
    } else {
      console.log('   Nenhum serviço encontrado');
      console.log('');
    }
    
    // 4. PEDIDOS
    console.log('📋 PEDIDOS:');
    console.log('------------');
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select(`
        *,
        users(email),
        services(name)
      `)
      .order('created_at', { ascending: false })
      .limit(20);
    
    if (ordersError) throw ordersError;
    
    if (orders && orders.length > 0) {
      orders.forEach((order, index) => {
        const userEmail = order.users ? order.users.email : 'Usuário não encontrado';
        const serviceName = order.services ? order.services.name : 'Serviço não encontrado';
        console.log(`${index + 1}. Pedido ${order.id.slice(0, 8)}...`);
        console.log(`   - Usuário: ${userEmail}`);
        console.log(`   - Serviço: ${serviceName}`);
        console.log(`   - Link: ${order.link}`);
        console.log(`   - Quantidade: ${order.quantity}`);
        console.log(`   - Início: ${order.start_count}`);
        console.log(`   - Restante: ${order.remains}`);
        console.log(`   - Valor: R$ ${order.charge}`);
        console.log(`   - Status: ${order.status}`);
        console.log(`   - Criado em: ${new Date(order.created_at).toLocaleDateString('pt-BR')}`);
        console.log('');
      });
    } else {
      console.log('   Nenhum pedido encontrado');
      console.log('');
    }
    
    // 5. TRANSAÇÕES
    console.log('💰 TRANSAÇÕES:');
    console.log('---------------');
    const { data: transactions, error: transactionsError } = await supabase
      .from('transactions')
      .select(`
        *,
        users(email)
      `)
      .order('created_at', { ascending: false })
      .limit(20);
    
    if (transactionsError) throw transactionsError;
    
    if (transactions && transactions.length > 0) {
      transactions.forEach((transaction, index) => {
        const userEmail = transaction.users ? transaction.users.email : 'Usuário não encontrado';
        console.log(`${index + 1}. ${transaction.type.toUpperCase()}`);
        console.log(`   - Usuário: ${userEmail}`);
        console.log(`   - Valor: R$ ${transaction.amount}`);
        console.log(`   - Saldo antes: R$ ${transaction.balance_before}`);
        console.log(`   - Saldo depois: R$ ${transaction.balance_after}`);
        console.log(`   - Descrição: ${transaction.description || 'Sem descrição'}`);
        console.log(`   - Pedido ID: ${transaction.order_id || 'N/A'}`);
        console.log(`   - Criado em: ${new Date(transaction.created_at).toLocaleDateString('pt-BR')}`);
        console.log('');
      });
    } else {
      console.log('   Nenhuma transação encontrada');
      console.log('');
    }
    
    // 6. API KEYS
    console.log('🔑 API KEYS:');
    console.log('-------------');
    const { data: apiKeys, error: apiKeysError } = await supabase
      .from('api_keys')
      .select('*')
      .order('provider', { ascending: true });
    
    if (apiKeysError) throw apiKeysError;
    
    if (apiKeys && apiKeys.length > 0) {
      apiKeys.forEach((apiKey, index) => {
        console.log(`${index + 1}. ${apiKey.provider.toUpperCase()}`);
        console.log(`   - API Key: ${apiKey.api_key.slice(0, 20)}...`);
        console.log(`   - API URL: ${apiKey.api_url}`);
        console.log(`   - Status: ${apiKey.is_active ? 'Ativo' : 'Inativo'}`);
        console.log(`   - Criado em: ${new Date(apiKey.created_at).toLocaleDateString('pt-BR')}`);
        console.log('');
      });
    } else {
      console.log('   Nenhuma API key encontrada');
      console.log('');
    }
    
    // 7. CONFIGURAÇÕES
    console.log('⚙️ CONFIGURAÇÕES:');
    console.log('------------------');
    const { data: settings, error: settingsError } = await supabase
      .from('settings')
      .select('*')
      .order('key', { ascending: true });
    
    if (settingsError) throw settingsError;
    
    if (settings && settings.length > 0) {
      settings.forEach((setting, index) => {
        console.log(`${index + 1}. ${setting.key}`);
        console.log(`   - Valor: ${setting.value || 'Não definido'}`);
        console.log(`   - Descrição: ${setting.description || 'Sem descrição'}`);
        console.log(`   - Criado em: ${new Date(setting.created_at).toLocaleDateString('pt-BR')}`);
        console.log('');
      });
    } else {
      console.log('   Nenhuma configuração encontrada');
      console.log('');
    }
    
    // 8. ESTATÍSTICAS FINAIS
    console.log('📈 ESTATÍSTICAS GERAIS:');
    console.log('-------------------------');
    const userCount = users ? users.length : 0;
    const categoryCount = categories ? categories.length : 0;
    const serviceCount = services ? services.length : 0;
    const orderCount = orders ? orders.length : 0;
    const transactionCount = transactions ? transactions.length : 0;
    const apiKeyCount = apiKeys ? apiKeys.length : 0;
    const settingCount = settings ? settings.length : 0;
    
    console.log(`   - Total de usuários: ${userCount}`);
    console.log(`   - Total de categorias: ${categoryCount}`);
    console.log(`   - Total de serviços: ${serviceCount}`);
    console.log(`   - Total de pedidos: ${orderCount}`);
    console.log(`   - Total de transações: ${transactionCount}`);
    console.log(`   - Total de API keys: ${apiKeyCount}`);
    console.log(`   - Total de configurações: ${settingCount}`);
    
    // 9. USUÁRIOS POR ROLE
    if (users && users.length > 0) {
      const roleStats = users.reduce((acc, user) => {
        acc[user.role] = (acc[user.role] || 0) + 1;
        return acc;
      }, {});
      
      console.log('\n👥 USUÁRIOS POR ROLE:');
      console.log('----------------------');
      Object.entries(roleStats).forEach(([role, count]) => {
        console.log(`   - ${role}: ${count}`);
      });
    }
    
    // 10. USUÁRIOS POR STATUS
    if (users && users.length > 0) {
      const statusStats = users.reduce((acc, user) => {
        acc[user.status] = (acc[user.status] || 0) + 1;
        return acc;
      }, {});
      
      console.log('\n📊 USUÁRIOS POR STATUS:');
      console.log('-------------------------');
      Object.entries(statusStats).forEach(([status, count]) => {
        console.log(`   - ${status}: ${count}`);
      });
    }
    
    console.log('\n✅ VISUALIZAÇÃO DO BANCO CONCLUÍDA!');
    
  } catch (error) {
    console.error('\n❌ ERRO durante a visualização:', error.message);
    console.error('\n🔧 DETALHES DO ERRO:', error);
  }
}

// Executar o script
viewDatabase().then(() => {
  console.log('\n🏁 Script finalizado.');
  process.exit(0);
}).catch(error => {
  console.error('\n💥 Erro fatal:', error);
  process.exit(1);
}); 