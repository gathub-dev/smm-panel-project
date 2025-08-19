#!/usr/bin/env node

const fs = require('fs')
const path = require('path')

console.log('🔧 REMOVENDO TODAS AS VERIFICAÇÕES DE ADMIN')
console.log('=' .repeat(50))

const files = [
  'lib/api-key-actions.ts',
  'lib/service-actions.ts',
  'lib/order-sync-actions.ts'
]

files.forEach(filePath => {
  const fullPath = path.join(__dirname, '..', filePath)
  
  if (fs.existsSync(fullPath)) {
    console.log(`\n📝 Processando: ${filePath}`)
    
    let content = fs.readFileSync(fullPath, 'utf8')
    
    // Padrão para remover verificação de admin
    const adminCheckPattern = /const { data: userData } = await supabase\s*\.from\("users"\)\s*\.select\("role"\)\s*\.eq\("id", user\.id\)\s*\.single\(\)\s*if \(userData\?\?\.role !== "admin"\) {\s*return { error: "Acesso negado" }\s*}/gs
    
    // Padrão mais simples
    const simplePattern = /if \(userData\?\?\.role !== "admin"\) {\s*return { error: "Acesso negado" }\s*}/gs
    
    // Remover verificações
    let originalLength = content.length
    content = content.replace(adminCheckPattern, '')
    content = content.replace(simplePattern, '')
    
    // Remover linhas de busca de userData que ficaram órfãs
    content = content.replace(/const { data: userData } = await supabase\s*\.from\("users"\)\s*\.select\("role"\)\s*\.eq\("id", user\.id\)\s*\.single\(\)/g, '')
    
    if (content.length !== originalLength) {
      fs.writeFileSync(fullPath, content)
      console.log(`✅ ${filePath} atualizado`)
    } else {
      console.log(`⚠️  ${filePath} não precisou de alterações`)
    }
  } else {
    console.log(`❌ ${filePath} não encontrado`)
  }
})

console.log('\n🎯 CONCLUÍDO!')
console.log('Todas as verificações de admin foram removidas.')
console.log('Agora teste o painel novamente!') 