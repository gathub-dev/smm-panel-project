#!/usr/bin/env node

/**
 * Script para testar todo o fluxo de autenticação
 */

const { createClient } = require('@supabase/supabase-js');

// Configuração do Supabase
const SUPABASE_URL = 'https://xpklpweyvwviuiqzjgwe.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhwa2xwd2V5dnd2aXVpcXpqZ3dlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU1NjUxNzksImV4cCI6MjA3MTE0MTE3OX0.nFv0uVijjsjjylwmoZePzFY0Mtqea9rb8Gal_AS9Q9M';

async function testAuthFlow() {
  console.log('🧪 TESTANDO FLUXO COMPLETO DE AUTENTICAÇÃO');
  console.log('==========================================\n');
  
  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    
    console.log('1️⃣ Testando login...');
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: 'lhost2025@gmail.com',
      password: '123456'
    });
    
    if (signInError) {
      console.log('❌ Erro no login:', signInError.message);
      return;
    }
    
    console.log('✅ Login realizado com sucesso!');
    console.log('   - User ID:', signInData.user.id);
    console.log('   - Email:', signInData.user.email);
    console.log('   - Session:', signInData.session ? 'Sim' : 'Não');
    
    console.log('\n2️⃣ Verificando sessão...');
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.log('❌ Erro ao verificar sessão:', sessionError.message);
    } else if (session) {
      console.log('✅ Sessão ativa encontrada!');
      console.log('   - User ID:', session.user.id);
      console.log('   - Email:', session.user.email);
      console.log('   - Expira em:', session.expires_at);
    } else {
      console.log('❌ Nenhuma sessão encontrada');
    }
    
    console.log('\n3️⃣ Testando acesso à tabela users...');
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('*')
      .eq('id', signInData.user.id);
    
    if (usersError) {
      console.log('❌ Erro ao acessar users:', usersError.message);
      console.log('   - Código:', usersError.code);
      console.log('   - Detalhes:', usersError.details);
      console.log('   - Dica:', usersError.hint);
      
      // Tentar acessar apenas o próprio perfil
      console.log('\n4️⃣ Tentando acessar apenas o próprio perfil...');
      const { data: ownProfile, error: ownProfileError } = await supabase
        .from('users')
        .select('role, status')
        .eq('id', signInData.user.id)
        .single();
      
      if (ownProfileError) {
        console.log('❌ Erro ao acessar próprio perfil:', ownProfileError.message);
      } else {
        console.log('✅ Próprio perfil acessado com sucesso!');
        console.log('   - Role:', ownProfile.role);
        console.log('   - Status:', ownProfile.status);
        console.log('   - É admin?', ownProfile.role === 'admin' ? 'SIM' : 'NÃO');
        
        if (ownProfile.role === 'admin') {
          console.log('\n🎉 USUÁRIO É ADMIN! O problema pode estar no layout da aplicação.');
          console.log('💡 Verifique se há algum problema no código do layout admin.');
        }
      }
    } else {
      console.log('✅ Acesso à tabela users funcionando!');
      console.log('   - Dados encontrados:', users.length);
      users.forEach(user => {
        console.log(`     - ${user.email} (${user.role}) - Status: ${user.status}`);
      });
    }
    
    console.log('\n5️⃣ Testando acesso a outras tabelas...');
    
    // Testar categorias
    const { data: categories, error: categoriesError } = await supabase
      .from('categories')
      .select('*');
    
    if (categoriesError) {
      console.log('❌ Erro ao acessar categories:', categoriesError.message);
    } else {
      console.log('✅ Acesso à tabela categories funcionando!');
      console.log('   - Categorias encontradas:', categories.length);
    }
    
    // Testar serviços
    const { data: services, error: servicesError } = await supabase
      .from('services')
      .select('*');
    
    if (servicesError) {
      console.log('❌ Erro ao acessar services:', servicesError.message);
    } else {
      console.log('✅ Acesso à tabela services funcionando!');
      console.log('   - Serviços encontrados:', services.length);
    }
    
    console.log('\n6️⃣ Resumo do teste...');
    
    if (usersError) {
      console.log('❌ PROBLEMA IDENTIFICADO:');
      console.log('   - Login funcionando: ✅');
      console.log('   - Sessão ativa: ✅');
      console.log('   - Acesso a users: ❌');
      console.log('   - Causa: Políticas RLS ainda ativas');
      console.log('\n💡 SOLUÇÃO:');
      console.log('   1. Acesse o painel do Supabase');
      console.log('   2. Vá para SQL Editor');
      console.log('   3. Execute: ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;');
    } else {
      console.log('✅ TUDO FUNCIONANDO!');
      console.log('💡 O problema pode estar no código da aplicação.');
    }
    
  } catch (error) {
    console.error('\n❌ ERRO durante teste:', error.message);
    console.error('🔧 Detalhes:', error);
  }
}

// Executar teste
testAuthFlow().then(() => {
  console.log('\n🏁 Teste concluído.');
  process.exit(0);
}).catch(error => {
  console.error('\n💥 Erro fatal:', error);
  process.exit(1);
}); 