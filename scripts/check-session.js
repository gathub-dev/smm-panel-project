#!/usr/bin/env node

/**
 * Script para verificar a sessão do usuário
 */

const { createClient } = require('@supabase/supabase-js');

// Configuração do Supabase
const SUPABASE_URL = 'https://xpklpweyvwviuiqzjgwe.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhwa2xwd2V5dnd2aXVpcXpqZ3dlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU1NjUxNzksImV4cCI6MjA3MTE0MTE3OX0.nFv0uVijjsjjylwmoZePzFY0Mtqea9rb8Gal_AS9Q9M';

async function checkSession() {
  console.log('🔐 VERIFICANDO SESSÃO DO USUÁRIO');
  console.log('==================================\n');
  
  try {
    // Criar cliente Supabase com anon key (como o navegador)
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    
    console.log('1️⃣ Verificando sessão atual...');
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.log('❌ Erro ao verificar sessão:', sessionError.message);
    } else if (session) {
      console.log('✅ Sessão encontrada:');
      console.log('   - User ID:', session.user.id);
      console.log('   - Email:', session.user.email);
      console.log('   - Email confirmado:', session.user.email_confirmed_at);
      console.log('   - Criado em:', session.user.created_at);
      console.log('   - Último acesso:', session.user.last_sign_in_at);
      console.log('');
      
      // Verificar se o usuário tem role admin
      console.log('2️⃣ Verificando role do usuário...');
      const { data: profile, error: profileError } = await supabase
        .from('users')
        .select('role, status')
        .eq('id', session.user.id)
        .single();
      
      if (profileError) {
        console.log('❌ Erro ao verificar perfil:', profileError.message);
      } else {
        console.log('✅ Perfil encontrado:');
        console.log('   - Role:', profile.role);
        console.log('   - Status:', profile.status);
        console.log('   - É admin?', profile.role === 'admin' ? 'SIM' : 'NÃO');
        console.log('');
        
        if (profile.role === 'admin') {
          console.log('🎉 USUÁRIO É ADMIN! O problema pode estar em outro lugar.');
        } else {
          console.log('❌ USUÁRIO NÃO É ADMIN! Este é o problema.');
        }
      }
    } else {
      console.log('❌ NENHUMA SESSÃO ENCONTRADA!');
      console.log('💡 Você precisa fazer login primeiro.');
      console.log('');
      
      console.log('3️⃣ Tentando fazer login...');
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: 'lhost2025@gmail.com',
        password: '123456' // Tente uma senha comum
      });
      
      if (signInError) {
        console.log('❌ Erro no login:', signInError.message);
        console.log('💡 Tente fazer login manualmente no navegador primeiro.');
      } else {
        console.log('✅ Login realizado com sucesso!');
        console.log('   - User ID:', signInData.user.id);
        console.log('   - Email:', signInData.user.email);
        
        // Verificar role após login
        console.log('\n4️⃣ Verificando role após login...');
        const { data: profileAfterLogin, error: profileAfterLoginError } = await supabase
          .from('users')
          .select('role, status')
          .eq('id', signInData.user.id)
          .single();
        
        if (profileAfterLoginError) {
          console.log('❌ Erro ao verificar perfil após login:', profileAfterLoginError.message);
        } else {
          console.log('✅ Perfil encontrado após login:');
          console.log('   - Role:', profileAfterLogin.role);
          console.log('   - Status:', profileAfterLogin.status);
          console.log('   - É admin?', profileAfterLogin.role === 'admin' ? 'SIM' : 'NÃO');
          
          if (profileAfterLogin.role === 'admin') {
            console.log('\n🎉 USUÁRIO É ADMIN! Agora deve funcionar no navegador.');
            console.log('💡 Tente acessar /dashboard/admin novamente.');
          } else {
            console.log('\n❌ USUÁRIO NÃO É ADMIN! Este é o problema.');
          }
        }
      }
    }
    
  } catch (error) {
    console.error('\n❌ ERRO durante verificação:', error.message);
    console.error('🔧 Detalhes:', error);
  }
}

// Executar verificação
checkSession().then(() => {
  console.log('\n🏁 Verificação concluída.');
  process.exit(0);
}).catch(error => {
  console.error('\n💥 Erro fatal:', error);
  process.exit(1);
}); 