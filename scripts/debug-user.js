#!/usr/bin/env node

/**
 * Script para debugar o problema de permissão do usuário
 */

const { createClient } = require('@supabase/supabase-js');

// Configuração do Supabase
const SUPABASE_URL = 'https://xpklpweyvwviuiqzjgwe.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhwa2xwd2V5dnd2aXVpcXpqZ3dlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTU2NTE3OSwiZXhwIjoyMDcxMTQxMTc5fQ.7adnyvvwEWyAzYXHWyF7n9SEfdTrxZHcKlSKTJ7gQaQ';

async function debugUser() {
  console.log('🔍 DEBUGANDO PROBLEMA DE PERMISSÃO DO USUÁRIO');
  console.log('==============================================\n');
  
  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    
    // 1. Verificar usuário por email
    console.log('1️⃣ Verificando usuário por email: lhost2025@gmail.com');
    const { data: userByEmail, error: emailError } = await supabase
      .from('users')
      .select('*')
      .eq('email', 'lhost2025@gmail.com')
      .single();
    
    if (emailError) {
      console.log('❌ Erro ao buscar por email:', emailError.message);
    } else {
      console.log('✅ Usuário encontrado por email:');
      console.log('   - ID:', userByEmail.id);
      console.log('   - Email:', userByEmail.email);
      console.log('   - Role:', userByEmail.role);
      console.log('   - Status:', userByEmail.status);
      console.log('');
    }
    
    // 2. Verificar se existe na tabela auth.users
    console.log('2️⃣ Verificando tabela auth.users...');
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
    
    let targetUser = null;
    if (authError) {
      console.log('❌ Erro ao listar usuários auth:', authError.message);
    } else {
      targetUser = authUsers.users.find(u => u.email === 'lhost2025@gmail.com');
      if (targetUser) {
        console.log('✅ Usuário encontrado na tabela auth.users:');
        console.log('   - ID:', targetUser.id);
        console.log('   - Email:', targetUser.email);
        console.log('   - Email confirmado:', targetUser.email_confirmed_at);
        console.log('   - Criado em:', targetUser.created_at);
        console.log('');
      } else {
        console.log('❌ Usuário NÃO encontrado na tabela auth.users');
        console.log('');
      }
    }
    
    // 3. Verificar se o ID do usuário na tabela users corresponde ao auth.users
    if (userByEmail && userByEmail.id) {
      console.log('3️⃣ Verificando correspondência de ID...');
      console.log('   - ID na tabela users:', userByEmail.id);
      console.log('   - ID na tabela auth.users:', targetUser ? targetUser.id : 'N/A');
      
      if (targetUser && userByEmail.id === targetUser.id) {
        console.log('✅ IDs correspondem!');
      } else {
        console.log('❌ IDs NÃO correspondem!');
      }
      console.log('');
    }
    
    // 4. Verificar estrutura da tabela users
    console.log('4️⃣ Verificando estrutura da tabela users...');
    const { data: tableInfo, error: tableError } = await supabase
      .rpc('get_table_info', { table_name: 'users' });
    
    if (tableError) {
      console.log('❌ Erro ao obter info da tabela:', tableError.message);
      console.log('   Tentando método alternativo...');
      
      // Método alternativo
      const { data: columns, error: columnsError } = await supabase
        .from('users')
        .select('*')
        .limit(1);
      
      if (columnsError) {
        console.log('❌ Erro ao verificar colunas:', columnsError.message);
      } else {
        console.log('✅ Estrutura da tabela users:');
        console.log('   - Colunas disponíveis:', Object.keys(columns[0] || {}));
      }
    } else {
      console.log('✅ Informações da tabela:', tableInfo);
    }
    
    // 5. Testar consulta específica que o layout está fazendo
    console.log('\n5️⃣ Testando consulta específica do layout...');
    if (userByEmail && userByEmail.id) {
      const { data: profile, error: profileError } = await supabase
        .from('users')
        .select('role')
        .eq('id', userByEmail.id)
        .single();
      
      if (profileError) {
        console.log('❌ Erro na consulta do layout:', profileError.message);
        console.log('   - Código:', profileError.code);
        console.log('   - Detalhes:', profileError.details);
      } else {
        console.log('✅ Consulta do layout funcionou:');
        console.log('   - Role encontrado:', profile.role);
        console.log('   - É admin?', profile.role === 'admin' ? 'SIM' : 'NÃO');
      }
    }
    
  } catch (error) {
    console.error('\n❌ ERRO durante debug:', error.message);
    console.error('🔧 Detalhes:', error);
  }
}

// Executar debug
debugUser().then(() => {
  console.log('\n🏁 Debug concluído.');
  process.exit(0);
}).catch(error => {
  console.error('\n💥 Erro fatal:', error);
  process.exit(1);
}); 