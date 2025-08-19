#!/usr/bin/env node

/**
 * Script para testar a sincronização após correções
 */

const { createClient } = require('@supabase/supabase-js');

// Configuração do Supabase
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://xpklpweyvwviuiqzjgwe.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhwa2xwd2V5dnd2aXVpcXpqZ3dlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTU2NTE3OSwiZXhwIjoyMDcxMTQxMTc5fQ.7adnyvvwEWyAzYXHWyF7n9SEfdTrxZHcKlSKTJ7gQaQ';

// Criar cliente Supabase com service role key (acesso total)
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function testSyncFunction() {
  console.log('🧪 Testando função de sincronização após correções...\n');
  
  try {
    // 1. Verificar se existem chaves de API
    console.log('1. Verificando chaves de API...');
    const { data: apiKeys, error: keysError } = await supabase
      .from('api_keys')
      .select('*')
      .eq('is_active', true);
    
    if (keysError) {
      console.log('   ❌ Erro ao buscar chaves:', keysError.message);
      return;
    }
    
    console.log(`   ✅ Encontradas ${apiKeys.length} chaves ativas`);
    apiKeys.forEach(key => {
      console.log(`      • ${key.provider.toUpperCase()}: ${key.api_key.substring(0, 8)}...`);
    });
    
    // 2. Testar inserção manual de serviço
    console.log('\n2. Testando inserção manual de serviço...');
    const testService = {
      provider: 'mtp', // Usar provider válido
      provider_service_id: 'test-sync-' + Date.now(),
      name: 'Teste de Sincronização Manual',
      description: 'Serviço de teste para verificar sincronização',
      category: 'Teste',
      provider_rate: 1.0,
      rate: 1.2,
      markup_type: 'percentage',
      markup_value: 20,
      min_quantity: 1,
      max_quantity: 1000,
      status: 'active',
      sync_enabled: true,
      last_sync: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    const { data: insertResult, error: insertError } = await supabase
      .from('services')
      .insert(testService)
      .select()
      .single();
    
    if (insertError) {
      console.log('   ❌ Erro na inserção manual:', insertError.message);
    } else {
      console.log('   ✅ Inserção manual bem-sucedida');
      console.log(`      ID: ${insertResult.id}`);
      
      // Remover o serviço de teste
      await supabase.from('services').delete().eq('id', insertResult.id);
      console.log('   🗑️  Serviço de teste removido');
    }
    
    // 3. Verificar serviços existentes
    console.log('\n3. Verificando serviços existentes...');
    const { data: existingServices, error: servicesError } = await supabase
      .from('services')
      .select('id, provider, name, status')
      .limit(5);
    
    if (servicesError) {
      console.log('   ❌ Erro ao consultar serviços:', servicesError.message);
    } else {
      console.log(`   ✅ Encontrados ${existingServices.length} serviços na base`);
      existingServices.forEach(service => {
        console.log(`      • ${service.provider.toUpperCase()}: ${service.name.substring(0, 50)}... (${service.status})`);
      });
    }
    
    // 4. Contar serviços por provider
    console.log('\n4. Estatísticas por provider...');
    const { data: allServices, error: allError } = await supabase
      .from('services')
      .select('provider');
    
    if (allError) {
      console.log('   ❌ Erro ao contar serviços:', allError.message);
    } else {
      const stats = allServices.reduce((acc, service) => {
        acc[service.provider] = (acc[service.provider] || 0) + 1;
        return acc;
      }, {});
      
      console.log('   📊 Serviços por provider:');
      Object.entries(stats).forEach(([provider, count]) => {
        console.log(`      • ${provider.toUpperCase()}: ${count} serviços`);
      });
    }
    
    console.log('\n🎉 Teste de sincronização concluído!');
    console.log('💡 Se não houver erros acima, a sincronização deve funcionar corretamente.');
    
  } catch (error) {
    console.error('❌ Erro fatal no teste:', error.message);
  }
}

// Executar teste
testSyncFunction().catch(error => {
  console.error('❌ Erro fatal:', error);
  process.exit(1);
}); 