#!/usr/bin/env node

console.log('🧪 TESTE DIRETO DA SINCRONIZAÇÃO')
console.log('=' .repeat(50))

console.log('\n📋 INSTRUÇÕES PARA TESTE:')

console.log('\n1. 🌐 Abra o painel admin:')
console.log('   http://localhost:3000/dashboard/admin')

console.log('\n2. 🔍 Abra o Console (F12):')
console.log('   → Pressione F12')
console.log('   → Vá na aba "Console"')

console.log('\n3. 📝 Cole este código no console:')
console.log('─'.repeat(50))
console.log(`
// TESTE DIRETO DA SINCRONIZAÇÃO
console.log('🧪 Iniciando teste direto...')

// Verificar se a função existe
if (typeof syncAllServices !== 'undefined') {
  console.log('✅ Função syncAllServices encontrada')
  
  // Chamar diretamente
  syncAllServices().then(result => {
    console.log('📊 Resultado:', result)
  }).catch(error => {
    console.log('❌ Erro:', error)
  })
} else {
  console.log('❌ Função syncAllServices não encontrada')
  console.log('🔍 Tentando importar...')
  
  // Tentar chamar via fetch
  fetch('/api/sync-services', { method: 'POST' })
    .then(r => r.json())
    .then(result => console.log('📊 Via API:', result))
    .catch(error => console.log('❌ Erro API:', error))
}
`)
console.log('─'.repeat(50))

console.log('\n4. 🎯 OU clique no botão "Sincronizar Serviços":')
console.log('   → No header do painel')
console.log('   → Ou na aba "Serviços"')

console.log('\n5. 📊 Verifique os logs:')
console.log('   → No console do navegador (F12)')
console.log('   → No terminal onde roda "npm run dev"')

console.log('\n💡 Se não aparecer nada:')
console.log('   → Verifique se está logado')
console.log('   → Verifique se tem chaves de API')
console.log('   → Recarregue a página')

console.log('\n🎯 Resultado esperado:')
console.log('   → Logs detalhados da sincronização')
console.log('   → Requisições para APIs externas')
console.log('   → Salvamento no banco de dados') 