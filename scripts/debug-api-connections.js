#!/usr/bin/env node

console.log('🔍 Debug - Conexões API MTP/JAP')
console.log('=' .repeat(50))

console.log('\n🚨 PROBLEMA: APIs sempre ficam vermelhas (desconectadas)')
console.log('\n📋 POSSÍVEIS CAUSAS E SOLUÇÕES:')

console.log('\n1. 🔑 CHAVES DE API NÃO CONFIGURADAS')
console.log('   ❌ Problema: Nenhuma chave foi salva no banco')
console.log('   ✅ Solução: Configure as chaves na aba "APIs"')
console.log('   📝 Passos:')
console.log('      → Aba "APIs" > Botão "API Keys"')
console.log('      → Selecione MTP ou JAP')
console.log('      → Cole a chave válida')
console.log('      → Clique "Salvar"')

console.log('\n2. 🔐 CHAVES INVÁLIDAS OU EXPIRADAS')
console.log('   ❌ Problema: Chaves não funcionam nos provedores')
console.log('   ✅ Solução: Verifique as chaves diretamente')
console.log('   🌐 Teste manual:')
console.log('      → MTP: https://morethanpanel.com/api/v2')
console.log('      → JAP: https://justanotherpanel.com/api/v2')
console.log('      → Teste: action=balance&key=SUA_CHAVE')

console.log('\n3. 🌐 PROBLEMAS DE CORS/FETCH')
console.log('   ❌ Problema: Navegador bloqueia requisições')
console.log('   ✅ Solução: APIs devem ser chamadas do servidor (não cliente)')
console.log('   🔧 Verificar: Se as funções estão marcadas como "use server"')

console.log('\n4. 🗄️ BANCO DE DADOS NÃO ATUALIZADO')
console.log('   ❌ Problema: Tabela api_keys não existe')
console.log('   ✅ Solução: Execute o SQL de atualização')
console.log('   📋 Verificar no Supabase:')
console.log('      → Tabela "api_keys" existe?')
console.log('      → Campos: id, provider, api_key, api_url, is_active')

console.log('\n5. 🔄 ERRO NA FUNÇÃO DE TESTE')
console.log('   ❌ Problema: Função testAllAPIKeys() com erro')
console.log('   ✅ Solução: Verificar logs do console')
console.log('   🛠️  Debug: Abrir F12 > Console > Testar conexões')

console.log('\n🔧 SCRIPT DE TESTE RÁPIDO:')
console.log('─'.repeat(50))
console.log(`
// Cole este código no console do navegador (F12):
async function testarAPIs() {
  try {
    console.log('🔍 Testando APIs...')
    
    // Testar MTP
    const mtpResponse = await fetch('https://morethanpanel.com/api/v2', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: 'key=SUA_CHAVE_MTP&action=balance'
    })
    const mtpResult = await mtpResponse.text()
    console.log('MTP Response:', mtpResult)
    
    // Testar JAP  
    const japResponse = await fetch('https://justanotherpanel.com/api/v2', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: 'key=SUA_CHAVE_JAP&action=balance'
    })
    const japResult = await japResponse.text()
    console.log('JAP Response:', japResult)
    
  } catch (error) {
    console.error('Erro:', error)
  }
}

testarAPIs()
`)
console.log('─'.repeat(50))

console.log('\n📋 CHECKLIST DE VERIFICAÇÃO:')
console.log('\n□ 1. Chaves de API configuradas no painel?')
console.log('□ 2. Chaves válidas nos sites dos provedores?')
console.log('□ 3. Tabela api_keys existe no Supabase?')
console.log('□ 4. Console do navegador mostra erros?')
console.log('□ 5. Servidor Next.js está rodando?')

console.log('\n🎯 SOLUÇÃO MAIS COMUM:')
console.log('1. 🔑 Configure uma chave de API válida')
console.log('2. 🧪 Teste a chave diretamente no site do provedor')
console.log('3. 🔄 Salve no painel e teste novamente')

console.log('\n💡 DICA: Se você não tem chaves de API:')
console.log('   → Registre-se em morethanpanel.com')
console.log('   → Registre-se em justanotherpanel.com')
console.log('   → Obtenha suas chaves de API')
console.log('   → Configure no painel administrativo')

console.log('\n🏁 Após configurar, as bolinhas devem ficar VERDES!')
console.log('📱 Teste em: http://localhost:3000/dashboard/admin') 