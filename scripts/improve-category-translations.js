// Script para melhorar as traduções de categorias
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis do Supabase não encontradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Mapeamento melhorado de categorias com ícones e descrições
const IMPROVED_CATEGORY_MAPPING = {
  // Instagram
  'Instagram - Seguidores': {
    name: 'Instagram - Seguidores',
    description: 'Aumente seus seguidores no Instagram com perfis reais e ativos',
    icon: '👥',
    sort_order: 1
  },
  'Instagram - Curtidas': {
    name: 'Instagram - Curtidas',
    description: 'Mais curtidas para seus posts do Instagram',
    icon: '❤️',
    sort_order: 2
  },
  'Instagram - Visualizações': {
    name: 'Instagram - Visualizações',
    description: 'Visualizações para vídeos e reels do Instagram',
    icon: '👁️',
    sort_order: 3
  },
  'Instagram - Comentários': {
    name: 'Instagram - Comentários',
    description: 'Comentários personalizados para seus posts',
    icon: '💬',
    sort_order: 4
  },
  'Instagram - Stories': {
    name: 'Instagram - Stories',
    description: 'Visualizações para seus stories do Instagram',
    icon: '📱',
    sort_order: 5
  },
  'Instagram - Reels': {
    name: 'Instagram - Reels',
    description: 'Impulsione seus reels com visualizações e curtidas',
    icon: '🎬',
    sort_order: 6
  },
  'Instagram - IGTV': {
    name: 'Instagram - IGTV',
    description: 'Visualizações para vídeos longos do IGTV',
    icon: '📺',
    sort_order: 7
  },
  'Instagram - Salvamentos': {
    name: 'Instagram - Salvamentos',
    description: 'Aumentar salvamentos dos seus posts',
    icon: '🔖',
    sort_order: 8
  },
  'Instagram - Impressões': {
    name: 'Instagram - Impressões',
    description: 'Aumentar o alcance e impressões',
    icon: '📊',
    sort_order: 9
  },

  // TikTok
  'TikTok - Seguidores': {
    name: 'TikTok - Seguidores',
    description: 'Ganhe seguidores reais no TikTok',
    icon: '🎵',
    sort_order: 10
  },
  'TikTok - Curtidas': {
    name: 'TikTok - Curtidas',
    description: 'Curtidas para seus vídeos do TikTok',
    icon: '💖',
    sort_order: 11
  },
  'TikTok - Visualizações': {
    name: 'TikTok - Visualizações',
    description: 'Visualizações para vídeos do TikTok',
    icon: '👀',
    sort_order: 12
  },
  'TikTok - Comentários': {
    name: 'TikTok - Comentários',
    description: 'Comentários personalizados para TikTok',
    icon: '💭',
    sort_order: 13
  },
  'TikTok - Compartilhamentos': {
    name: 'TikTok - Compartilhamentos',
    description: 'Compartilhamentos para seus vídeos',
    icon: '📤',
    sort_order: 14
  },

  // YouTube
  'YouTube - Inscritos': {
    name: 'YouTube - Inscritos',
    description: 'Inscritos reais para seu canal do YouTube',
    icon: '📺',
    sort_order: 15
  },
  'YouTube - Visualizações': {
    name: 'YouTube - Visualizações',
    description: 'Visualizações para vídeos do YouTube',
    icon: '🎥',
    sort_order: 16
  },
  'YouTube - Curtidas': {
    name: 'YouTube - Curtidas',
    description: 'Curtidas para vídeos do YouTube',
    icon: '👍',
    sort_order: 17
  },
  'YouTube - Comentários': {
    name: 'YouTube - Comentários',
    description: 'Comentários personalizados para YouTube',
    icon: '💬',
    sort_order: 18
  },
  'YouTube - Shorts': {
    name: 'YouTube - Shorts',
    description: 'Visualizações e curtidas para YouTube Shorts',
    icon: '📱',
    sort_order: 19
  },
  'YouTube - Tempo de Exibição': {
    name: 'YouTube - Tempo de Exibição',
    description: 'Aumentar tempo de exibição dos vídeos',
    icon: '⏱️',
    sort_order: 20
  },

  // Facebook
  'Facebook - Seguidores': {
    name: 'Facebook - Seguidores',
    description: 'Seguidores para página do Facebook',
    icon: '👥',
    sort_order: 21
  },
  'Facebook - Curtidas': {
    name: 'Facebook - Curtidas',
    description: 'Curtidas para posts e páginas do Facebook',
    icon: '👍',
    sort_order: 22
  },
  'Facebook - Visualizações': {
    name: 'Facebook - Visualizações',
    description: 'Visualizações para vídeos do Facebook',
    icon: '📹',
    sort_order: 23
  },

  // Twitter/X
  'Twitter - Seguidores': {
    name: 'Twitter - Seguidores',
    description: 'Seguidores reais para Twitter/X',
    icon: '🐦',
    sort_order: 24
  },
  'Twitter - Curtidas': {
    name: 'Twitter - Curtidas',
    description: 'Curtidas para tweets',
    icon: '❤️',
    sort_order: 25
  },
  'Twitter - Retweets': {
    name: 'Twitter - Retweets',
    description: 'Retweets para seus posts',
    icon: '🔄',
    sort_order: 26
  },

  // Telegram
  'Telegram - Membros': {
    name: 'Telegram - Membros',
    description: 'Membros para canais e grupos do Telegram',
    icon: '✈️',
    sort_order: 27
  },
  'Telegram - Visualizações': {
    name: 'Telegram - Visualizações',
    description: 'Visualizações para posts do Telegram',
    icon: '👁️',
    sort_order: 28
  },

  // LinkedIn
  'LinkedIn - Seguidores': {
    name: 'LinkedIn - Seguidores',
    description: 'Seguidores profissionais no LinkedIn',
    icon: '💼',
    sort_order: 29
  },
  'LinkedIn - Curtidas': {
    name: 'LinkedIn - Curtidas',
    description: 'Curtidas para posts profissionais',
    icon: '👍',
    sort_order: 30
  },

  // Spotify
  'Spotify - Seguidores': {
    name: 'Spotify - Seguidores',
    description: 'Seguidores para artistas no Spotify',
    icon: '🎵',
    sort_order: 31
  },
  'Spotify - Reproduções': {
    name: 'Spotify - Reproduções',
    description: 'Reproduções para músicas e playlists',
    icon: '▶️',
    sort_order: 32
  },

  // Twitch
  'Twitch - Seguidores': {
    name: 'Twitch - Seguidores',
    description: 'Seguidores para canal da Twitch',
    icon: '🎮',
    sort_order: 33
  },
  'Twitch - Visualizações': {
    name: 'Twitch - Visualizações',
    description: 'Visualizações para streams e vídeos',
    icon: '📺',
    sort_order: 34
  },

  // Website/SEO
  'Website - Tráfego': {
    name: 'Website - Tráfego',
    description: 'Tráfego real para websites',
    icon: '🌐',
    sort_order: 35
  },
  'Google - Avaliações': {
    name: 'Google - Avaliações',
    description: 'Avaliações para Google Meu Negócio',
    icon: '⭐',
    sort_order: 36
  },

  // Outros
  'Outros': {
    name: 'Outros',
    description: 'Outros serviços de marketing digital',
    icon: '🔧',
    sort_order: 99
  }
};

// Função para determinar categoria baseada no nome do serviço
function determineCategoryFromServiceName(serviceName) {
  const name = serviceName.toLowerCase();

  // Instagram
  if (name.includes('instagram')) {
    if (name.includes('follower') || name.includes('seguidor')) {
      return 'Instagram - Seguidores';
    } else if (name.includes('like') || name.includes('curtida')) {
      return 'Instagram - Curtidas';
    } else if (name.includes('view') || name.includes('visualiza')) {
      return 'Instagram - Visualizações';
    } else if (name.includes('comment') || name.includes('comentário')) {
      return 'Instagram - Comentários';
    } else if (name.includes('story') || name.includes('stories')) {
      return 'Instagram - Stories';
    } else if (name.includes('reel')) {
      return 'Instagram - Reels';
    } else if (name.includes('igtv')) {
      return 'Instagram - IGTV';
    } else if (name.includes('save') || name.includes('salvamento')) {
      return 'Instagram - Salvamentos';
    } else if (name.includes('impression') || name.includes('impressão')) {
      return 'Instagram - Impressões';
    } else {
      return 'Instagram - Seguidores'; // Default para Instagram
    }
  }

  // TikTok
  else if (name.includes('tiktok')) {
    if (name.includes('follower') || name.includes('seguidor')) {
      return 'TikTok - Seguidores';
    } else if (name.includes('like') || name.includes('curtida')) {
      return 'TikTok - Curtidas';
    } else if (name.includes('view') || name.includes('visualiza')) {
      return 'TikTok - Visualizações';
    } else if (name.includes('comment') || name.includes('comentário')) {
      return 'TikTok - Comentários';
    } else if (name.includes('share') || name.includes('compartilha')) {
      return 'TikTok - Compartilhamentos';
    } else {
      return 'TikTok - Seguidores'; // Default para TikTok
    }
  }

  // YouTube
  else if (name.includes('youtube')) {
    if (name.includes('subscriber') || name.includes('inscrito')) {
      return 'YouTube - Inscritos';
    } else if (name.includes('view') || name.includes('visualiza')) {
      return 'YouTube - Visualizações';
    } else if (name.includes('like') || name.includes('curtida')) {
      return 'YouTube - Curtidas';
    } else if (name.includes('comment') || name.includes('comentário')) {
      return 'YouTube - Comentários';
    } else if (name.includes('short')) {
      return 'YouTube - Shorts';
    } else if (name.includes('watch time') || name.includes('tempo')) {
      return 'YouTube - Tempo de Exibição';
    } else {
      return 'YouTube - Visualizações'; // Default para YouTube
    }
  }

  // Facebook
  else if (name.includes('facebook')) {
    if (name.includes('follower') || name.includes('seguidor')) {
      return 'Facebook - Seguidores';
    } else if (name.includes('like') || name.includes('curtida')) {
      return 'Facebook - Curtidas';
    } else if (name.includes('view') || name.includes('visualiza')) {
      return 'Facebook - Visualizações';
    } else {
      return 'Facebook - Curtidas'; // Default para Facebook
    }
  }

  // Twitter/X
  else if (name.includes('twitter') || name.includes(' x ')) {
    if (name.includes('follower') || name.includes('seguidor')) {
      return 'Twitter - Seguidores';
    } else if (name.includes('like') || name.includes('curtida')) {
      return 'Twitter - Curtidas';
    } else if (name.includes('retweet')) {
      return 'Twitter - Retweets';
    } else {
      return 'Twitter - Seguidores'; // Default para Twitter
    }
  }

  // Outras plataformas...
  else if (name.includes('telegram')) {
    return name.includes('member') || name.includes('membro') 
      ? 'Telegram - Membros' 
      : 'Telegram - Visualizações';
  }
  else if (name.includes('linkedin')) {
    return name.includes('follower') || name.includes('seguidor') 
      ? 'LinkedIn - Seguidores' 
      : 'LinkedIn - Curtidas';
  }
  else if (name.includes('spotify')) {
    return name.includes('follower') || name.includes('seguidor') 
      ? 'Spotify - Seguidores' 
      : 'Spotify - Reproduções';
  }
  else if (name.includes('twitch')) {
    return name.includes('follower') || name.includes('seguidor') 
      ? 'Twitch - Seguidores' 
      : 'Twitch - Visualizações';
  }
  else if (name.includes('google') && name.includes('review')) {
    return 'Google - Avaliações';
  }
  else if (name.includes('website') || name.includes('traffic')) {
    return 'Website - Tráfego';
  }

  return 'Outros'; // Default
}

async function improveCategoryTranslations() {
  console.log('🌐 MELHORANDO TRADUÇÕES DE CATEGORIAS');
  console.log('='.repeat(50));

  try {
    // 1. Buscar todas as categorias existentes
    console.log('\n📋 1. Buscando categorias existentes...');
    const { data: existingCategories, error: categoriesError } = await supabase
      .from('categories')
      .select('*')
      .order('sort_order');

    if (categoriesError) {
      console.error('❌ Erro ao buscar categorias:', categoriesError);
      return;
    }

    console.log(`✅ ${existingCategories.length} categorias encontradas`);

    // 2. Buscar todos os serviços
    console.log('\n📋 2. Buscando serviços...');
    const { data: services, error: servicesError } = await supabase
      .from('services')
      .select('*')
      .eq('status', 'active');

    if (servicesError) {
      console.error('❌ Erro ao buscar serviços:', servicesError);
      return;
    }

    console.log(`✅ ${services.length} serviços encontrados`);

    // 3. Analisar e melhorar categorias existentes
    console.log('\n📋 3. Analisando categorias existentes...');
    const categoriesToUpdate = [];
    const categoriesToCreate = new Set();

    // Coletar todas as categorias necessárias baseadas nos serviços
    services.forEach(service => {
      const improvedCategory = determineCategoryFromServiceName(service.name);
      categoriesToCreate.add(improvedCategory);
    });

    console.log(`📊 Categorias necessárias: ${categoriesToCreate.size}`);

    // 4. Criar/atualizar categorias
    console.log('\n📋 4. Criando/atualizando categorias...');
    let createdCount = 0;
    let updatedCount = 0;

    for (const categoryName of categoriesToCreate) {
      const categoryInfo = IMPROVED_CATEGORY_MAPPING[categoryName];
      
      if (!categoryInfo) {
        console.log(`⚠️ Categoria não mapeada: ${categoryName}`);
        continue;
      }

      // Verificar se já existe
      const existingCategory = existingCategories.find(cat => cat.name === categoryName);

      if (existingCategory) {
        // Atualizar categoria existente
        const { error: updateError } = await supabase
          .from('categories')
          .update({
            description: categoryInfo.description,
            icon: categoryInfo.icon,
            sort_order: categoryInfo.sort_order,
            is_active: true,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingCategory.id);

        if (updateError) {
          console.error(`❌ Erro ao atualizar ${categoryName}:`, updateError);
        } else {
          console.log(`✅ Atualizada: ${categoryName}`);
          updatedCount++;
        }
      } else {
        // Criar nova categoria
        const { error: insertError } = await supabase
          .from('categories')
          .insert({
            name: categoryInfo.name,
            description: categoryInfo.description,
            icon: categoryInfo.icon,
            sort_order: categoryInfo.sort_order,
            is_active: true
          });

        if (insertError) {
          console.error(`❌ Erro ao criar ${categoryName}:`, insertError);
        } else {
          console.log(`🆕 Criada: ${categoryName}`);
          createdCount++;
        }
      }
    }

    // 5. Atualizar serviços com as novas categorias
    console.log('\n📋 5. Atualizando serviços com categorias melhoradas...');
    
    // Buscar categorias atualizadas
    const { data: updatedCategories } = await supabase
      .from('categories')
      .select('*');

    let servicesUpdated = 0;

    for (const service of services) {
      const improvedCategoryName = determineCategoryFromServiceName(service.name);
      const category = updatedCategories.find(cat => cat.name === improvedCategoryName);

      if (category && service.category_id !== category.id) {
        const { error: updateServiceError } = await supabase
          .from('services')
          .update({
            category_id: category.id,
            updated_at: new Date().toISOString()
          })
          .eq('id', service.id);

        if (updateServiceError) {
          console.error(`❌ Erro ao atualizar serviço ${service.id}:`, updateServiceError);
        } else {
          servicesUpdated++;
        }
      }
    }

    // 6. Relatório final
    console.log('\n📊 RELATÓRIO FINAL:');
    console.log('='.repeat(30));
    console.log(`✅ Categorias criadas: ${createdCount}`);
    console.log(`✅ Categorias atualizadas: ${updatedCount}`);
    console.log(`✅ Serviços atualizados: ${servicesUpdated}`);
    console.log(`📊 Total de categorias ativas: ${categoriesToCreate.size}`);

    // 7. Mostrar estrutura final
    console.log('\n📋 ESTRUTURA FINAL DE CATEGORIAS:');
    console.log('='.repeat(40));
    
    const { data: finalCategories } = await supabase
      .from('categories')
      .select('*')
      .eq('is_active', true)
      .order('sort_order');

    finalCategories?.forEach(category => {
      console.log(`${category.icon} ${category.name}`);
      console.log(`   ${category.description}`);
      console.log(`   Ordem: ${category.sort_order}\n`);
    });

    console.log('✅ Melhoria das traduções concluída!');

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

// Executar
if (require.main === module) {
  improveCategoryTranslations().catch(console.error);
}

module.exports = { improveCategoryTranslations, determineCategoryFromServiceName };
