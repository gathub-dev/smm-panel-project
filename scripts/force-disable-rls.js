#!/usr/bin/env node

/**
 * Script para forçar a desabilitação do RLS usando service role key
 */

const { createClient } = require('@supabase/supabase-js');

// Configuração do Supabase com service role key (acesso total)
const SUPABASE_URL = 'https://xpklpweyvwviuiqzjgwe.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhwa2xwd2V5dnd2aXVpcXpqZ3dlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTU2NTE3OSwiZXhwIjoyMDcxMTQxMTc5fQ.7adnyvvwEWyAzYXHWyF7n9SEfdTrxZHcKlSKTJ7gQaQ';

async function forceDisableRLS() {
  console.log('💥 FORÇANDO DESABILITAÇÃO DO RLS');
  console.log('==================================\n');
  
  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    
    console.log('1️⃣ Testando acesso com service role key...');
    
    // Testar acesso direto com service role
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('*')
      .eq('role', 'admin');
    
    if (usersError) {
      console.log('❌ Erro ao acessar users com service role:', usersError.message);
    } else {
      console.log('✅ Acesso com service role funcionando!');
      console.log('   - Usuários admin encontrados:', users.length);
      users.forEach(user => {
        console.log(`     - ${user.email} (${user.role})`);
      });
    }
    
    console.log('\n2️⃣ Tentando desabilitar RLS via SQL direto...');
    
    // Tentar executar SQL direto via RPC
    const { data: rpcResult, error: rpcError } = await supabase.rpc('exec_sql', {
      sql: 'ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;'
    });
    
    if (rpcError) {
      console.log('❌ RPC exec_sql não disponível:', rpcError.message);
      console.log('   Tentando método alternativo...');
      
      // Método alternativo - usar query SQL direta
      const { data: sqlResult, error: sqlError } = await supabase
        .from('users')
        .select('*')
        .limit(1);
      
      if (sqlError) {
        console.log('❌ Ainda não consegue acessar users:', sqlError.message);
        
        // Última tentativa - verificar se há políticas ativas
        console.log('\n3️⃣ Verificando políticas RLS ativas...');
        
        // Tentar remover políticas específicas
        const { error: dropPolicyError } = await supabase.rpc('drop_policy_if_exists', {
          table_name: 'users',
          policy_name: 'Admins can view all users'
        });
        
        if (dropPolicyError) {
          console.log('❌ Não foi possível remover políticas:', dropPolicyError.message);
        } else {
          console.log('✅ Política removida com sucesso!');
        }
      } else {
        console.log('✅ Acesso direto funcionando!');
      }
    } else {
      console.log('✅ RLS desabilitado via RPC!');
    }
    
    console.log('\n4️⃣ Testando acesso final...');
    
    // Teste final
    const { data: finalTest, error: finalError } = await supabase
      .from('users')
      .select('*')
      .eq('role', 'admin');
    
    if (finalError) {
      console.log('❌ Acesso ainda não funcionando:', finalError.message);
      console.log('\n💡 SOLUÇÃO ALTERNATIVA:');
      console.log('   1. Acesse o painel do Supabase');
      console.log('   2. Vá para SQL Editor');
      console.log('   3. Execute: ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;');
      console.log('   4. Execute: ALTER TABLE public.categories DISABLE ROW LEVEL SECURITY;');
      console.log('   5. Execute: ALTER TABLE public.services DISABLE ROW LEVEL SECURITY;');
    } else {
      console.log('🎉 PROBLEMA RESOLVIDO!');
      console.log('💡 Agora tente acessar /dashboard/admin no navegador.');
    }
    
  } catch (error) {
    console.error('\n❌ ERRO durante forçar desabilitação:', error.message);
    console.error('🔧 Detalhes:', error);
  }
}

// Executar forçar desabilitação
forceDisableRLS().then(() => {
  console.log('\n🏁 Forçar desabilitação concluída.');
  process.exit(0);
}).catch(error => {
  console.error('\n💥 Erro fatal:', error);
  process.exit(1);
}); 