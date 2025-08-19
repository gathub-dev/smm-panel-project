#!/usr/bin/env node

console.log('🔍 VERIFICAÇÃO RÁPIDA - Por que não fica verde?')
console.log('=' .repeat(50))

console.log('\n🎯 PROBLEMA: Bolinhas sempre vermelhas')
console.log('\n📋 VERIFICAÇÕES RÁPIDAS:')

console.log('\n1. 🗄️ VERIFICAR NO SUPABASE:')
console.log('   → Acesse: https://supabase.com/dashboard')
console.log('   → Seu projeto > Table Editor')
console.log('   → Procure a tabela: "api_keys"')
console.log('   ')
console.log('   ❓ A tabela "api_keys" EXISTE?')
console.log('   □ SIM - Continue para o passo 2')
console.log('   □ NÃO - Execute o SQL primeiro!')

console.log('\n2. 🔑 VERIFICAR CHAVES SALVAS:')
console.log('   → Na tabela "api_keys", veja se tem dados')
console.log('   → Campos: provider, api_key, is_active')
console.log('   ')
console.log('   ❓ Tem chaves salvas na tabela?')
console.log('   □ SIM - Continue para o passo 3')
console.log('   □ NÃO - Precisa adicionar chaves!')

console.log('\n3. 🧪 TESTE RÁPIDO NO PAINEL:')
console.log('   → http://localhost:3000/dashboard/admin')
console.log('   → Aba "APIs" > Botão "Testar Chave"')
console.log('   → Cole uma chave real e teste')

console.log('\n4. 📱 VERIFICAR CONSOLE DO NAVEGADOR:')
console.log('   → Aperte F12 no painel')
console.log('   → Aba "Console"')
console.log('   → Procure por erros em vermelho')

console.log('\n🚨 CAUSAS MAIS COMUNS:')
console.log('\n   ❌ Tabela api_keys não existe')
console.log('      → Solução: Execute o SQL no Supabase')
console.log('\n   ❌ Nenhuma chave configurada')
console.log('      → Solução: Adicione chaves no painel')
console.log('\n   ❌ Chaves inválidas')
console.log('      → Solução: Use chaves reais dos provedores')

console.log('\n🎯 TESTE SUPER RÁPIDO:')
console.log('1. Vá no Supabase > Tabela "api_keys"')
console.log('2. Se não existir → Execute o SQL')
console.log('3. Se existir mas vazia → Adicione chaves')
console.log('4. Se tem chaves → Teste no painel')

console.log('\n💡 DICA: Se você não tem chaves reais,')
console.log('   as bolinhas VÃO ficar vermelhas mesmo!')
console.log('   Você precisa de contas nos provedores.')

console.log('\n🔗 LINKS RÁPIDOS:')
console.log('   → Supabase: https://supabase.com/dashboard')
console.log('   → MTP: https://morethanpanel.com')
console.log('   → JAP: https://justanotherpanel.com')
console.log('   → Painel: http://localhost:3000/dashboard/admin') 