#!/usr/bin/env node

console.log('🧪 Teste Simples de APIs MTP/JAP')
console.log('=' .repeat(40))

console.log('\n📋 INSTRUÇÕES PARA TESTE MANUAL:')

console.log('\n1. 🔑 OBTER CHAVES DE API:')
console.log('   → Registre-se em: https://morethanpanel.com')
console.log('   → Registre-se em: https://justanotherpanel.com')
console.log('   → Obtenha suas chaves de API')

console.log('\n2. 🧪 TESTE DIRETO (CURL):')
console.log('\n   Para MTP:')
console.log('   curl -X POST https://morethanpanel.com/api/v2 \\')
console.log('        -d "key=SUA_CHAVE_MTP&action=balance"')

console.log('\n   Para JAP:')
console.log('   curl -X POST https://justanotherpanel.com/api/v2 \\')
console.log('        -d "key=SUA_CHAVE_JAP&action=balance"')

console.log('\n3. 📱 TESTE NO NAVEGADOR:')
console.log('   → Acesse: http://localhost:3000/dashboard/admin')
console.log('   → Abra F12 > Console')
console.log('   → Cole o código abaixo:')

console.log('\n' + '─'.repeat(50))
console.log(`
// TESTE DIRETO NO CONSOLE DO NAVEGADOR:
async function testarAPI() {
  // SUBSTITUA 'SUA_CHAVE_AQUI' pela sua chave real
  const chavesMTP = 'SUA_CHAVE_MTP_AQUI'
  const chavesJAP = 'SUA_CHAVE_JAP_AQUI'
  
  console.log('🔍 Testando APIs...')
  
  try {
    // Teste MTP
    console.log('🧪 Testando MTP...')
    const mtpResponse = await fetch('https://morethanpanel.com/api/v2', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: \`key=\${chavesMTP}&action=balance\`
    })
    
    const mtpText = await mtpResponse.text()
    console.log('📊 MTP Response:', mtpText)
    
    // Teste JAP
    console.log('🧪 Testando JAP...')
    const japResponse = await fetch('https://justanotherpanel.com/api/v2', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: \`key=\${chavesJAP}&action=balance\`
    })
    
    const japText = await japResponse.text()
    console.log('📊 JAP Response:', japText)
    
    console.log('✅ Teste concluído!')
    
  } catch (error) {
    console.error('❌ Erro:', error)
  }
}

// Executar o teste
testarAPI()
`)
console.log('─'.repeat(50))

console.log('\n4. 🔍 INTERPRETAR RESULTADOS:')
console.log('\n   ✅ SUCESSO - Se retornar algo como:')
console.log('      {"balance":"10.50","currency":"USD"}')
console.log('   ')
console.log('   ❌ ERRO - Se retornar:')
console.log('      {"error":"Incorrect API key"}')
console.log('      {"error":"Invalid request"}')

console.log('\n5. 💡 SOLUÇÕES PARA PROBLEMAS COMUNS:')
console.log('\n   🔐 Chave inválida:')
console.log('      → Verifique se copiou a chave completa')
console.log('      → Confirme se a chave não expirou')
console.log('      → Teste diretamente no site do provedor')

console.log('\n   🌐 Erro de CORS:')
console.log('      → Normal no navegador')
console.log('      → APIs devem ser chamadas do servidor')
console.log('      → Use o painel administrativo')

console.log('\n   🔄 Erro de rede:')
console.log('      → Verifique sua conexão')
console.log('      → Tente novamente em alguns minutos')
console.log('      → Verifique se os sites estão online')

console.log('\n6. 🎯 APÓS CONFIRMAR QUE AS CHAVES FUNCIONAM:')
console.log('   → Configure no painel: http://localhost:3000/dashboard/admin')
console.log('   → Aba "APIs" > Adicionar chaves')
console.log('   → Teste conectividade')
console.log('   → As bolinhas devem ficar VERDES!')

console.log('\n🏁 Se as chaves funcionarem no teste manual,')
console.log('   mas não no painel, o problema é no código.')
console.log('   Nesse caso, verifique os logs do console (F12).')

console.log('\n📞 SUPORTE:')
console.log('   → Logs detalhados aparecem no console do servidor')
console.log('   → Verifique o terminal onde roda "npm run dev"')
console.log('   → Procure por mensagens de erro ou debug') 