#!/usr/bin/env node

/**
 * Script para gerenciar o banco de dados SMM Panel
 * Funcionalidades:
 * 1. Visualizar todo o banco de dados
 * 2. Definir usuário como admin
 * 3. Executar comandos SQL personalizados
 */

const { createClient } = require('@supabase/supabase-js');
const readline = require('readline');

// Configuração do Supabase
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://xpklpweyvwviuiqzjgwe.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhwa2xwd2V5dnd2aXVpcXpqZ3dlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTU2NTE3OSwiZXhwIjoyMDcxMTQxMTc5fQ.7adnyvvwEWyAzYXHWyF7n9SEfdTrxZHcKlSKTJ7gQaQ';

// Criar cliente Supabase com service role key (acesso total)
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// Interface de linha de comando
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Função para fazer perguntas
function question(query) {
  return new Promise((resolve) => {
    rl.question(query, resolve);
  });
}

// Função para visualizar todo o banco de dados
async function viewDatabase() {
  console.log('\n🔍 Visualizando todo o banco de dados...\n');
  
  try {
    // 1. Verificar usuários
    console.log('📊 USUÁRIOS:');
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (usersError) throw usersError;
    
    if (users && users.length > 0) {
      users.forEach(user => {
        console.log(`  - ${user.email} (${user.role}) - Status: ${user.status} - Saldo: R$ ${user.balance}`);
      });
    } else {
      console.log('  Nenhum usuário encontrado');
    }
    
    // 2. Verificar categorias
    console.log('\n📂 CATEGORIAS:');
    const { data: categories, error: categoriesError } = await supabase
      .from('categories')
      .select('*')
      .order('sort_order', { ascending: true });
    
    if (categoriesError) throw categoriesError;
    
    if (categories && categories.length > 0) {
      categories.forEach(category => {
        console.log(`  - ${category.name} (${category.is_active ? 'Ativo' : 'Inativo'})`);
      });
    } else {
      console.log('  Nenhuma categoria encontrada');
    }
    
    // 3. Verificar serviços
    console.log('\n🛠️ SERVIÇOS:');
    const { data: services, error: servicesError } = await supabase
      .from('services')
      .select(`
        *,
        categories(name)
      `)
      .order('created_at', { ascending: false });
    
    if (servicesError) throw servicesError;
    
    if (services && services.length > 0) {
      services.forEach(service => {
        const categoryName = service.categories ? service.categories.name : 'Sem categoria';
        console.log(`  - ${service.name} (${categoryName}) - Provider: ${service.provider} - R$ ${service.rate}`);
      });
    } else {
      console.log('  Nenhum serviço encontrado');
    }
    
    // 4. Verificar pedidos
    console.log('\n📋 PEDIDOS:');
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select(`
        *,
        users(email),
        services(name)
      `)
      .order('created_at', { ascending: false })
      .limit(10);
    
    if (ordersError) throw ordersError;
    
    if (orders && orders.length > 0) {
      orders.forEach(order => {
        const userEmail = order.users ? order.users.email : 'Usuário não encontrado';
        const serviceName = order.services ? order.services.name : 'Serviço não encontrado';
        console.log(`  - Pedido ${order.id.slice(0, 8)} - ${userEmail} - ${serviceName} - Status: ${order.status}`);
      });
    } else {
      console.log('  Nenhum pedido encontrado');
    }
    
    // 5. Verificar transações
    console.log('\n💰 TRANSAÇÕES:');
    const { data: transactions, error: transactionsError } = await supabase
      .from('transactions')
      .select(`
        *,
        users(email)
      `)
      .order('created_at', { ascending: false })
      .limit(10);
    
    if (transactionsError) throw transactionsError;
    
    if (transactions && transactions.length > 0) {
      transactions.forEach(transaction => {
        const userEmail = transaction.users ? transaction.users.email : 'Usuário não encontrado';
        console.log(`  - ${transaction.type} - ${userEmail} - R$ ${transaction.amount} - ${transaction.description || 'Sem descrição'}`);
      });
    } else {
      console.log('  Nenhuma transação encontrada');
    }
    
    // 6. Estatísticas gerais
    console.log('\n📈 ESTATÍSTICAS GERAIS:');
    const userCount = users ? users.length : 0;
    const categoryCount = categories ? categories.length : 0;
    const serviceCount = services ? services.length : 0;
    const orderCount = orders ? orders.length : 0;
    const transactionCount = transactions ? transactions.length : 0;
    
    console.log(`  - Total de usuários: ${userCount}`);
    console.log(`  - Total de categorias: ${categoryCount}`);
    console.log(`  - Total de serviços: ${serviceCount}`);
    console.log(`  - Total de pedidos: ${orderCount}`);
    console.log(`  - Total de transações: ${transactionCount}`);
    
    // 7. Usuários por role
    if (users && users.length > 0) {
      const roleStats = users.reduce((acc, user) => {
        acc[user.role] = (acc[user.role] || 0) + 1;
        return acc;
      }, {});
      
      console.log('\n👥 USUÁRIOS POR ROLE:');
      Object.entries(roleStats).forEach(([role, count]) => {
        console.log(`  - ${role}: ${count}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Erro ao visualizar banco de dados:', error.message);
  }
}

// Função para definir usuário como admin
async function setUserAsAdmin(email) {
  console.log(`\n👑 Definindo usuário ${email} como admin...\n`);
  
  try {
    // 1. Verificar se o usuário existe
    const { data: existingUser, error: findError } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();
    
    if (findError) {
      if (findError.code === 'PGRST116') {
        console.log(`❌ Usuário ${email} não encontrado no banco de dados.`);
        console.log('💡 O usuário deve ser criado primeiro através do sistema de autenticação.');
        return;
      }
      throw findError;
    }
    
    console.log(`✅ Usuário encontrado: ${existingUser.email} (Role atual: ${existingUser.role})`);
    
    // 2. Atualizar para admin
    const { data: updatedUser, error: updateError } = await supabase
      .from('users')
      .update({ 
        role: 'admin',
        updated_at: new Date().toISOString()
      })
      .eq('email', email)
      .select()
      .single();
    
    if (updateError) throw updateError;
    
    console.log(`🎉 Usuário ${email} foi definido como admin com sucesso!`);
    console.log(`   - Role: ${updatedUser.role}`);
    console.log(`   - Atualizado em: ${updatedUser.updated_at}`);
    
    // 3. Verificar todos os admins
    const { data: admins, error: adminsError } = await supabase
      .from('users')
      .select('email, role, created_at')
      .eq('role', 'admin')
      .order('created_at', { ascending: true });
    
    if (adminsError) throw adminsError;
    
    console.log('\n👑 USUÁRIOS ADMIN NO SISTEMA:');
    admins.forEach(admin => {
      console.log(`  - ${admin.email} (desde ${new Date(admin.created_at).toLocaleDateString('pt-BR')})`);
    });
    
  } catch (error) {
    console.error('❌ Erro ao definir usuário como admin:', error.message);
  }
}

// Função para executar comando SQL personalizado
async function executeCustomSQL(sql) {
  console.log(`\n🔧 Executando comando SQL personalizado...\n`);
  console.log(`SQL: ${sql}\n`);
  
  try {
    // Nota: Para comandos SQL complexos, você precisará usar o cliente PostgreSQL diretamente
    // Este é um exemplo básico usando as funções do Supabase
    console.log('⚠️  Para comandos SQL complexos, use o script SQL diretamente no banco de dados.');
    console.log('💡 Use os arquivos: scripts/03-view-database.sql e scripts/04-set-admin-user.sql');
    
  } catch (error) {
    console.error('❌ Erro ao executar comando SQL:', error.message);
  }
}

// Função principal do menu
async function main() {
  console.log('🚀 GERENCIADOR DE BANCO DE DADOS SMM PANEL');
  console.log('=============================================\n');
  
  while (true) {
    console.log('\nEscolha uma opção:');
    console.log('1. 🔍 Visualizar todo o banco de dados');
    console.log('2. 👑 Definir usuário como admin');
    console.log('3. 🔧 Executar comando SQL personalizado');
    console.log('4. ❌ Sair');
    
    const choice = await question('\nDigite sua escolha (1-4): ');
    
    switch (choice.trim()) {
      case '1':
        await viewDatabase();
        break;
        
      case '2':
        const email = await question('\nDigite o email do usuário: ');
        if (email.trim()) {
          await setUserAsAdmin(email.trim());
        } else {
          console.log('❌ Email não pode estar vazio.');
        }
        break;
        
      case '3':
        const sql = await question('\nDigite o comando SQL: ');
        if (sql.trim()) {
          await executeCustomSQL(sql.trim());
        } else {
          console.log('❌ Comando SQL não pode estar vazio.');
        }
        break;
        
      case '4':
        console.log('\n👋 Até logo!');
        rl.close();
        process.exit(0);
        break;
        
      default:
        console.log('❌ Opção inválida. Tente novamente.');
    }
  }
}

// Verificar se as variáveis de ambiente estão configuradas
if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Erro: Variáveis de ambiente do Supabase não configuradas.');
  console.error('💡 Configure NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no arquivo .env');
  process.exit(1);
}

// Executar o programa
main().catch(error => {
  console.error('❌ Erro fatal:', error);
  process.exit(1);
}); 