#!/usr/bin/env node

/**
 * Script simples para definir o usuário lhost2025@gmail.com como admin
 * Execute: node scripts/set-admin.js
 */

const { createClient } = require('@supabase/supabase-js');

// Configuração do Supabase
const SUPABASE_URL = 'https://xpklpweyvwviuiqzjgwe.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhwa2xwd2V5dnd2aXVpcXpqZ3dlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTU2NTE3OSwiZXhwIjoyMDcxMTQxMTc5fQ.7adnyvvwEWyAzYXHWyF7n9SEfdTrxZHcKlSKTJ7gQaQ';

// Email do usuário que será definido como admin
const ADMIN_EMAIL = 'lhost2025@gmail.com';

async function setUserAsAdmin() {
  console.log('🚀 Iniciando processo de definição de admin...\n');
  
  try {
    // Criar cliente Supabase com service role key
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    
    console.log(`🔍 Procurando usuário: ${ADMIN_EMAIL}`);
    
    // 1. Verificar se o usuário existe
    const { data: existingUser, error: findError } = await supabase
      .from('users')
      .select('*')
      .eq('email', ADMIN_EMAIL)
      .single();
    
    if (findError) {
      if (findError.code === 'PGRST116') {
        console.log(`❌ Usuário ${ADMIN_EMAIL} não encontrado no banco de dados.`);
        console.log('\n💡 SOLUÇÕES:');
        console.log('   1. Certifique-se de que o usuário já se registrou no sistema');
        console.log('   2. Verifique se o email está correto');
        console.log('   3. Execute o script de visualização do banco para ver usuários existentes');
        return;
      }
      throw findError;
    }
    
    console.log(`✅ Usuário encontrado:`);
    console.log(`   - Email: ${existingUser.email}`);
    console.log(`   - Nome: ${existingUser.full_name || 'Não informado'}`);
    console.log(`   - Role atual: ${existingUser.role}`);
    console.log(`   - Status: ${existingUser.status}`);
    console.log(`   - Saldo: R$ ${existingUser.balance}`);
    
    // 2. Verificar se já é admin
    if (existingUser.role === 'admin') {
      console.log(`\n🎉 Usuário ${ADMIN_EMAIL} já é admin!`);
      return;
    }
    
    console.log(`\n👑 Atualizando usuário para role 'admin'...`);
    
    // 3. Atualizar para admin
    const { data: updatedUser, error: updateError } = await supabase
      .from('users')
      .update({ 
        role: 'admin',
        updated_at: new Date().toISOString()
      })
      .eq('email', ADMIN_EMAIL)
      .select()
      .single();
    
    if (updateError) throw updateError;
    
    console.log(`🎉 SUCESSO! Usuário ${ADMIN_EMAIL} foi definido como admin!`);
    console.log(`\n📋 DETALHES DA ATUALIZAÇÃO:`);
    console.log(`   - Role: ${updatedUser.role}`);
    console.log(`   - Atualizado em: ${updatedUser.updated_at}`);
    
    // 4. Verificar todos os admins no sistema
    console.log(`\n👑 VERIFICANDO TODOS OS ADMINS NO SISTEMA:`);
    
    const { data: admins, error: adminsError } = await supabase
      .from('users')
      .select('email, role, full_name, created_at')
      .eq('role', 'admin')
      .order('created_at', { ascending: true });
    
    if (adminsError) throw adminsError;
    
    if (admins && admins.length > 0) {
      admins.forEach((admin, index) => {
        const date = new Date(admin.created_at).toLocaleDateString('pt-BR');
        console.log(`   ${index + 1}. ${admin.email} - ${admin.full_name || 'Sem nome'} (desde ${date})`);
      });
    } else {
      console.log('   Nenhum admin encontrado no sistema');
    }
    
    console.log(`\n✅ PROCESSO CONCLUÍDO COM SUCESSO!`);
    console.log(`   O usuário ${ADMIN_EMAIL} agora tem acesso completo ao painel administrativo.`);
    
  } catch (error) {
    console.error('\n❌ ERRO durante o processo:', error.message);
    console.error('\n🔧 DETALHES DO ERRO:', error);
    
    if (error.code) {
      console.error(`   Código do erro: ${error.code}`);
    }
    
    if (error.details) {
      console.error(`   Detalhes: ${error.details}`);
    }
    
    if (error.hint) {
      console.error(`   Dica: ${error.hint}`);
    }
  }
}

// Executar o script
console.log('==========================================');
console.log('👑 SCRIPT PARA DEFINIR USUÁRIO COMO ADMIN');
console.log('==========================================\n');

setUserAsAdmin().then(() => {
  console.log('\n🏁 Script finalizado.');
  process.exit(0);
}).catch(error => {
  console.error('\n💥 Erro fatal:', error);
  process.exit(1);
}); 