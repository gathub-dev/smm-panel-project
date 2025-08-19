#!/usr/bin/env node

/**
 * Script para corrigir a estrutura de categorias
 * Criar categorias na tabela categories e vincular aos serviços
 */

const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = "https://xpklpweyvwviuiqzjgwe.supabase.co"
const supabaseServiceKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhwa2xwd2V5dnd2aXVpcXpqZ3dlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTU2NTE3OSwiZXhwIjoyMDcxMTQxMTc5fQ.7adnyvvwEWyAzYXHWyF7n9SEfdTrxZHcKlSKTJ7gQaQ"

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function fixCategoriesStructure() {
  console.log('🔧 CORRIGINDO ESTRUTURA DE CATEGORIAS')
  console.log('=' .repeat(50))
  
  try {
    // 1. Buscar todas as categorias únicas dos serviços existentes
    console.log('📊 Analisando categorias existentes nos serviços...')
    
    const { data: services } = await supabase
      .from('services')
      .select('category')
      .not('category', 'is', null)
    
    const uniqueCategories = [...new Set(services?.map(s => s.category).filter(Boolean))]
    console.log(`📂 Encontradas ${uniqueCategories.length} categorias únicas:`)
    uniqueCategories.forEach(cat => console.log(`   • ${cat}`))
    
    // 2. Criar as categorias na tabela categories
    console.log('\n🏗️ Criando categorias na tabela categories...')
    
    const categoriesToCreate = [
      {
        name: 'Instagram - Curtidas',
        description: 'Curtidas para posts do Instagram',
        icon: '❤️',
        sort_order: 1,
        is_active: true
      },
      {
        name: 'Instagram - Seguidores',
        description: 'Seguidores para perfis do Instagram',
        icon: '👥',
        sort_order: 2,
        is_active: true
      },
      {
        name: 'Instagram - Visualizações',
        description: 'Visualizações para vídeos do Instagram',
        icon: '👁️',
        sort_order: 3,
        is_active: true
      },
      {
        name: 'Instagram - Comentários',
        description: 'Comentários para posts do Instagram',
        icon: '💬',
        sort_order: 4,
        is_active: true
      },
      {
        name: 'TikTok - Curtidas',
        description: 'Curtidas para vídeos do TikTok',
        icon: '❤️',
        sort_order: 5,
        is_active: true
      },
      {
        name: 'TikTok - Seguidores',
        description: 'Seguidores para perfis do TikTok',
        icon: '👥',
        sort_order: 6,
        is_active: true
      },
      {
        name: 'TikTok - Visualizações',
        description: 'Visualizações para vídeos do TikTok',
        icon: '👁️',
        sort_order: 7,
        is_active: true
      },
      {
        name: 'TikTok - Comentários',
        description: 'Comentários para vídeos do TikTok',
        icon: '💬',
        sort_order: 8,
        is_active: true
      },
      {
        name: 'YouTube - Visualizações',
        description: 'Visualizações para vídeos do YouTube',
        icon: '👁️',
        sort_order: 9,
        is_active: true
      },
      {
        name: 'YouTube - Inscritos',
        description: 'Inscritos para canais do YouTube',
        icon: '📺',
        sort_order: 10,
        is_active: true
      },
      {
        name: 'YouTube - Curtidas',
        description: 'Curtidas para vídeos do YouTube',
        icon: '👍',
        sort_order: 11,
        is_active: true
      },
      {
        name: 'Facebook - Curtidas',
        description: 'Curtidas para posts do Facebook',
        icon: '👍',
        sort_order: 12,
        is_active: true
      },
      {
        name: 'Facebook - Seguidores',
        description: 'Seguidores para páginas do Facebook',
        icon: '👥',
        sort_order: 13,
        is_active: true
      },
      {
        name: 'Outros',
        description: 'Outros serviços diversos',
        icon: '🔧',
        sort_order: 99,
        is_active: true
      }
    ]
    
    const categoryMap = new Map() // Para mapear nome -> ID
    
    for (const categoryData of categoriesToCreate) {
      // Verificar se já existe
      const { data: existing } = await supabase
        .from('categories')
        .select('id')
        .eq('name', categoryData.name)
        .single()
      
      if (existing) {
        console.log(`   ✅ Categoria "${categoryData.name}" já existe (ID: ${existing.id})`)
        categoryMap.set(categoryData.name, existing.id)
      } else {
        // Criar nova categoria
        const { data: newCategory, error } = await supabase
          .from('categories')
          .insert(categoryData)
          .select('id, name')
          .single()
        
        if (error) {
          console.log(`   ❌ Erro ao criar "${categoryData.name}": ${error.message}`)
        } else {
          console.log(`   ✅ Categoria "${categoryData.name}" criada (ID: ${newCategory.id})`)
          categoryMap.set(categoryData.name, newCategory.id)
        }
      }
    }
    
    // 3. Atualizar os serviços com category_id correto
    console.log('\n🔗 Vinculando serviços às categorias...')
    
    const { data: allServices } = await supabase
      .from('services')
      .select('id, name, category')
      .not('category', 'is', null)
    
    let updated = 0
    
    for (const service of allServices || []) {
      const categoryId = categoryMap.get(service.category)
      
      if (categoryId) {
        const { error } = await supabase
          .from('services')
          .update({ category_id: categoryId })
          .eq('id', service.id)
        
        if (error) {
          console.log(`   ❌ Erro ao vincular "${service.name}": ${error.message}`)
        } else {
          console.log(`   ✅ "${service.name}" → "${service.category}"`)
          updated++
        }
      } else {
        // Vincular à categoria "Outros" se não encontrar correspondência
        const othersId = categoryMap.get('Outros')
        if (othersId) {
          await supabase
            .from('services')
            .update({ category_id: othersId })
            .eq('id', service.id)
          
          console.log(`   ⚠️ "${service.name}" → "Outros" (categoria não encontrada)`)
          updated++
        }
      }
    }
    
    console.log(`\n🎉 Estrutura corrigida com sucesso!`)
    console.log(`📂 ${categoryMap.size} categorias criadas/verificadas`)
    console.log(`🔗 ${updated} serviços vinculados`)
    
    // 4. Verificação final
    console.log('\n📊 VERIFICAÇÃO FINAL:')
    const { data: finalCheck } = await supabase
      .from('services')
      .select(`
        id,
        name,
        category,
        categories (
          id,
          name,
          icon
        )
      `)
      .not('category_id', 'is', null)
      .limit(5)
    
    finalCheck?.forEach(service => {
      console.log(`✅ ${service.name}`)
      console.log(`   Categoria: ${service.categories?.name} ${service.categories?.icon}`)
    })
    
  } catch (error) {
    console.error('❌ Erro na correção:', error.message)
  }
}

// Executar correção
fixCategoriesStructure().catch(console.error)
