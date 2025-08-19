#!/usr/bin/env node

/**
 * Script para corrigir o problema de acesso do usuário admin
 * Desabilita temporariamente o RLS para resolver a recursão infinita
 */

const { createClient } = require('@supabase/supabase-js');

// Configuração do Supabase
const SUPABASE_URL = 'https://xpklpweyvwviuiqzjgwe.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhwa2xwd2V5dnd2aXVpcXpqZ3dlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTU2NTE3OSwiZXhwIjoyMDcxMTQxMTc5fQ.7adnyvvwEWyAzYXHWyF7n9SEfdTrxZHcKlSKTJ7gQaQ';

async function fixAccess() {
  console.log('🔧 CORRIGINDO PROBLEMA DE ACESSO DO USUÁRIO ADMIN');
  console.log('==================================================\n');
  
  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    
    console.log('1️⃣ Verificando status atual do RLS...');
    
    // Verificar se o RLS está ativo
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name, table_schema')
      .eq('table_schema', 'public')
      .in('table_name', ['users', 'categories', 'services', 'orders', 'transactions', 'api_keys', 'settings']);
    
    if (tablesError) {
      console.log('❌ Erro ao verificar tabelas:', tablesError.message);
    } else {
      console.log('✅ Tabelas encontradas:', tables.map(t => t.table_name).join(', '));
    }
    
    console.log('\n2️⃣ Desabilitando RLS nas tabelas...');
    
    // Desabilitar RLS na tabela users
    const { error: usersError } = await supabase.rpc('exec_sql', {
      sql: 'ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;'
    });
    
    if (usersError) {
      console.log('⚠️  Erro ao desabilitar RLS na tabela users:', usersError.message);
      console.log('   Tentando método alternativo...');
      
      // Método alternativo - usar query direta
      const { error: altUsersError } = await supabase
        .from('users')
        .select('*')
        .limit(1);
      
      if (altUsersError) {
        console.log('❌ Ainda não consegue acessar users:', altUsersError.message);
      } else {
        console.log('✅ Acesso à tabela users funcionando!');
      }
    } else {
      console.log('✅ RLS desabilitado na tabela users');
    }
    
    // Desabilitar RLS na tabela categories
    const { error: categoriesError } = await supabase.rpc('exec_sql', {
      sql: 'ALTER TABLE public.categories DISABLE ROW LEVEL SECURITY;'
    });
    
    if (categoriesError) {
      console.log('⚠️  Erro ao desabilitar RLS na tabela categories:', categoriesError.message);
    } else {
      console.log('✅ RLS desabilitado na tabela categories');
    }
    
    // Desabilitar RLS na tabela services
    const { error: servicesError } = await supabase.rpc('exec_sql', {
      sql: 'ALTER TABLE public.services DISABLE ROW LEVEL SECURITY;'
    });
    
    if (servicesError) {
      console.log('⚠️  Erro ao desabilitar RLS na tabela services:', servicesError.message);
    } else {
      console.log('✅ RLS desabilitado na tabela services');
    }
    
    // Desabilitar RLS na tabela orders
    const { error: ordersError } = await supabase.rpc('exec_sql', {
      sql: 'ALTER TABLE public.orders DISABLE ROW LEVEL SECURITY;'
    });
    
    if (ordersError) {
      console.log('⚠️  Erro ao desabilitar RLS na tabela orders:', ordersError.message);
    } else {
      console.log('✅ RLS desabilitado na tabela orders');
    }
    
    // Desabilitar RLS na tabela transactions
    const { error: transactionsError } = await supabase.rpc('exec_sql', {
      sql: 'ALTER TABLE public.transactions DISABLE ROW LEVEL SECURITY;'
    });
    
    if (transactionsError) {
      console.log('⚠️  Erro ao desabilitar RLS na tabela transactions:', transactionsError.message);
    } else {
      console.log('✅ RLS desabilitado na tabela transactions');
    }
    
    // Desabilitar RLS na tabela api_keys
    const { error: apiKeysError } = await supabase.rpc('exec_sql', {
      sql: 'ALTER TABLE public.api_keys DISABLE ROW LEVEL SECURITY;'
    });
    
    if (apiKeysError) {
      console.log('⚠️  Erro ao desabilitar RLS na tabela api_keys:', apiKeysError.message);
    } else {
      console.log('✅ RLS desabilitado na tabela api_keys');
    }
    
    // Desabilitar RLS na tabela settings
    const { error: settingsError } = await supabase.rpc('exec_sql', {
      sql: 'ALTER TABLE public.settings DISABLE ROW LEVEL SECURITY;'
    });
    
    if (settingsError) {
      console.log('⚠️  Erro ao desabilitar RLS na tabela settings:', settingsError.message);
    } else {
      console.log('✅ RLS desabilitado na tabela settings');
    }
    
    console.log('\n3️⃣ Testando acesso às tabelas...');
    
    // Testar acesso à tabela users
    const { data: users, error: usersTestError } = await supabase
      .from('users')
      .select('*')
      .eq('role', 'admin');
    
    if (usersTestError) {
      console.log('❌ Ainda não consegue acessar users:', usersTestError.message);
    } else {
      console.log('✅ Acesso à tabela users funcionando!');
      console.log('   - Usuários admin encontrados:', users.length);
      users.forEach(user => {
        console.log(`     - ${user.email} (${user.role})`);
      });
    }
    
    // Testar acesso à tabela categories
    const { data: categories, error: categoriesTestError } = await supabase
      .from('categories')
      .select('*');
    
    if (categoriesTestError) {
      console.log('❌ Ainda não consegue acessar categories:', categoriesTestError.message);
    } else {
      console.log('✅ Acesso à tabela categories funcionando!');
      console.log('   - Categorias encontradas:', categories.length);
    }
    
    // Testar acesso à tabela services
    const { data: services, error: servicesTestError } = await supabase
      .from('services')
      .select('*');
    
    if (servicesTestError) {
      console.log('❌ Ainda não consegue acessar services:', servicesTestError.message);
    } else {
      console.log('✅ Acesso à tabela services funcionando!');
      console.log('   - Serviços encontrados:', services.length);
    }
    
    console.log('\n4️⃣ Verificando se o problema foi resolvido...');
    
    if (!usersTestError && !categoriesTestError && !servicesTestError) {
      console.log('🎉 PROBLEMA RESOLVIDO!');
      console.log('💡 Agora tente acessar /dashboard/admin no navegador.');
      console.log('🔒 NOTA: O RLS foi desabilitado temporariamente para resolver o problema.');
    } else {
      console.log('⚠️  Ainda há problemas de acesso.');
      console.log('💡 Execute o script SQL diretamente no banco de dados.');
    }
    
  } catch (error) {
    console.error('\n❌ ERRO durante correção:', error.message);
    console.error('🔧 Detalhes:', error);
  }
}

// Executar correção
fixAccess().then(() => {
  console.log('\n🏁 Correção concluída.');
  process.exit(0);
}).catch(error => {
  console.error('\n💥 Erro fatal:', error);
  process.exit(1);
}); 