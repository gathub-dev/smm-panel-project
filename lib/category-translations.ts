/**
 * Sistema de tradução automática dinâmica para categorias
 */

import { translationService } from './translation-service'

// Cache de traduções para evitar chamadas desnecessárias
const translationCache = new Map<string, string>()

/**
 * Tradução automática dinâmica usando serviço de tradução melhorado
 */
export async function translateCategory(category: string): Promise<string> {
  // Verificar cache primeiro
  if (translationCache.has(category)) {
    return translationCache.get(category)!
  }

  // Se já está em português, retornar como está
  if (isPortuguese(category)) {
    translationCache.set(category, category)
    return category
  }

  try {
    // Usar o serviço de tradução melhorado
    const translated = await translationService.translateToPortuguese(category)
    translationCache.set(category, translated)
    return translated
  } catch (error) {
    console.warn('Erro na tradução automática, usando fallback:', error)
    // Fallback para tradução baseada em padrões
    const fallback = autoTranslateCategory(category)
    translationCache.set(category, fallback)
    return fallback
  }
}

/**
 * Tradução síncrona para compatibilidade (usa cache ou fallback)
 */
export function translateCategorySync(category: string): string {
  // Verificar cache primeiro
  if (translationCache.has(category)) {
    return translationCache.get(category)!
  }

  // Se já está em português, retornar como está
  if (isPortuguese(category)) {
    return category
  }

  // Fallback para tradução baseada em padrões
  return autoTranslateCategory(category)
}

/**
 * Detectar se o texto já está em português
 */
function isPortuguese(text: string): boolean {
  const portugueseWords = [
    'curtidas', 'seguidores', 'visualizações', 'comentários', 
    'compartilhamentos', 'inscritos', 'membros', 'reações',
    'funcionando', 'atualização', 'após', 'última', 'fornecido',
    'promoções', 'novo', 'velocidade', 'máx', 'mín', 'dia',
    'garantia', 'reposição', 'sem', 'automático', 'personalizado',
    'serviços', 'serviço', 'melhores', 'vendidos', 'qualificados',
    'músicos', 'para', 'faixa', 'álbum', 'artista', 'perfil',
    'início', 'minutos', 'dias'
  ]
  
  const lowerText = text.toLowerCase()
  // Se tem muitas palavras em português, provavelmente já está traduzido
  const portugueseWordsFound = portugueseWords.filter(word => lowerText.includes(word)).length
  return portugueseWordsFound >= 2 || lowerText.includes('reposição') || lowerText.includes('velocidade')
}

/**
 * Tradução via API externa (MyMemory - gratuita)
 */
async function translateWithAPI(text: string): Promise<string> {
  const encodedText = encodeURIComponent(text)
  const url = `https://api.mymemory.translated.net/get?q=${encodedText}&langpair=en|pt`
  
  const response = await fetch(url)
  const data = await response.json()
  
  if (data.responseStatus === 200 && data.responseData?.translatedText) {
    return data.responseData.translatedText
  }
  
  throw new Error('Falha na tradução via API')
}

/**
 * Tradução automática baseada em padrões e palavras-chave (melhorada)
 */
function autoTranslateCategory(category: string): string {
  let translated = category
  
  // Traduções específicas completas primeiro
  const exactTranslations: Record<string, string> = {
    'Working After Update! - (Last Update:18/08/2025) (Provided By MTP)': 'Funcionando após atualização',
    'MTP Promotions': 'Promoções',
    'Instagram Likes': 'Curtidas Instagram',
    'Instagram Followers': 'Seguidores Instagram',
    'Instagram Views': 'Visualizações Instagram',
    'Instagram Comments': 'Comentários Instagram',
    'TikTok Views': 'Visualizações TikTok',
    'TikTok Likes': 'Curtidas TikTok',
    'TikTok Followers': 'Seguidores TikTok',
    'YouTube Views': 'Visualizações YouTube',
    'YouTube Subscribers': 'Inscritos YouTube',
    'YouTube Likes': 'Curtidas YouTube',
    'Telegram Post Shares': 'Compartilhamentos de Post Telegram',
    'X Tweet/Video Views': 'Visualizações de Tweet/Vídeo X',
    // Nomes de serviços específicos
    'Instagram Likes | No Refill | Speed 500-2K/Day | Max 100K | NEW!': 'Curtidas Instagram | Sem Reposição | Velocidade 500-2K/Dia | Máx 100K | NOVO!',
    'Instagram Likes | 30 Day Refill | Speed 1-3K/Day | Max 1M | NEW!': 'Curtidas Instagram | Reposição 30 Dias | Velocidade 1-3K/Dia | Máx 1M | NOVO!',
    'Instagram Likes | Lifetime Guaranteed | Speed 1-5K/Day | Max 1M | NEW!': 'Curtidas Instagram | Garantia Vitalícia | Velocidade 1-5K/Dia | Máx 1M | NOVO!',
    'Instagram Real Likes + Reach + Impressions | 30 Day Refill | Speed: 150-200K/Day | Max 500K | NEW!': 'Curtidas Reais Instagram + Alcance + Impressões | Reposição 30 Dias | Velocidade: 150-200K/Dia | Máx 500K | NOVO!',
    'Instagram Followers | No Refill | Speed: 250-1K/Day | Max 5K | NEW!': 'Seguidores Instagram | Sem Reposição | Velocidade: 250-1K/Dia | Máx 5K | NOVO!',
    'Instagram Followers | Speed: 10-20K/Day | Max 100K | Flag Must Be Disabled | Fast Service | NEW!': 'Seguidores Instagram | Velocidade: 10-20K/Dia | Máx 100K | Bandeira Deve Estar Desabilitada | Serviço Rápido | NOVO!',
    'Instagram Followers | 30 Day Refill | Speed: 500-2K/Day | Max 1M | NEW!': 'Seguidores Instagram | Reposição 30 Dias | Velocidade: 500-2K/Dia | Máx 1M | NOVO!',
    'Instagram Followers | Lifetime Guaranteed | Speed: 200-700/Day | Max 1M | NEW!': 'Seguidores Instagram | Garantia Vitalícia | Velocidade: 200-700/Dia | Máx 1M | NOVO!',
    'Instagram Real Followers | Lifetime Guaranteed | Speed: 10-50K/Day | Instant Start | Max 1M | NEW!': 'Seguidores Reais Instagram | Garantia Vitalícia | Velocidade: 10-50K/Dia | Início Instantâneo | Máx 1M | NOVO!',
    'Instagram Video Views | No Refill | Speed 100-500K/Day | Max 10M | NEW!': 'Visualizações de Vídeo Instagram | Sem Reposição | Velocidade 100-500K/Dia | Máx 10M | NOVO!',
    'TikTok Video Views | No Refill | 100-500K/Day | Max 100M | NEW!': 'Visualizações de Vídeo TikTok | Sem Reposição | 100-500K/Dia | Máx 100M | NOVO!',
    'Telegram Post Shares | Repost | Fake |': 'Compartilhamentos de Post Telegram | Repost | Falso |',
    'X Tweet/Video Views | Speed 100K/Day | Max 100M |': 'Visualizações de Tweet/Vídeo X | Velocidade 100K/Dia | Máx 100M |',
    // Categorias específicas
    'Morethan Best Selling and Qualified Mix Services': 'Serviços Mix Mais Vendidos e Qualificados da Morethan',
    '🔵 Services For Musicians': '🔵 Serviços Para Músicos',
    'Deezer': 'Deezer',
    // Nomes específicos do Deezer
    '👇👇👇👇👇👇👇👇👇 DEEZER SERVICES 👇👇👇👇👇👇👇👇👇': '👇👇👇👇👇👇👇👇👇 SERVIÇOS DEEZER 👇👇👇👇👇👇👇👇👇',
    '🟢 Deezer Seguidores | Playlist-Album-Artist-Profile | 30 Dia Reposição | Start 0-30/Minutes | Velocidade 100K/Dia | Máx 1M |': '🟢 Seguidores Deezer | Playlist-Álbum-Artista-Perfil | Reposição 30 Dias | Início 0-30/Minutos | Velocidade 100K/Dia | Máx 1M |',
    '🟢 Deezer Seguidores | Playlist-Album-Artist-Profile ⌊ 30 Dia Reposição | Start 0-30/Minutes | Velocidade 100K/Dia | Máx 1M |': '🟢 Seguidores Deezer | Playlist-Álbum-Artista-Perfil ⌊ Reposição 30 Dias | Início 0-30/Minutos | Velocidade 100K/Dia | Máx 1M |',
    '🟢 Deezer Curtidas | Track-Show | 30 Dia Reposição ⌊ Start 0-30/Minutes | Velocidade 100k/Dia | Máx 1M |': '🟢 Curtidas Deezer | Faixa-Show | Reposição 30 Dias ⌊ Início 0-30/Minutos | Velocidade 100k/Dia | Máx 1M |',
    '🟢 Deezer Curtidas | Track-Show | 30 Dia Reposição | Start 0-30/Minutes | Velocidade 100k/Dia | Máx 1M |': '🟢 Curtidas Deezer | Faixa-Show | Reposição 30 Dias | Início 0-30/Minutos | Velocidade 100k/Dia | Máx 1M |'
  }
  
  // Verificar tradução exata primeiro
  if (exactTranslations[category]) {
    return exactTranslations[category]
  }
  
  // Mapeamento de palavras-chave comuns
  const keywordMap: Record<string, string> = {
    // Plataformas
    'Instagram': 'Instagram',
    'TikTok': 'TikTok', 
    'YouTube': 'YouTube',
    'Facebook': 'Facebook',
    'Twitter': 'Twitter/X',
    'LinkedIn': 'LinkedIn',
    'Telegram': 'Telegram',
    'Snapchat': 'Snapchat',
    'Pinterest': 'Pinterest',
    'Reddit': 'Reddit',
    'Discord': 'Discord',
    'Twitch': 'Twitch',
    'Spotify': 'Spotify',
    
    // Ações/Métricas
    'Likes': 'Curtidas',
    'Followers': 'Seguidores',
    'Views': 'Visualizações',
    'Comments': 'Comentários',
    'Shares': 'Compartilhamentos',
    'Subscribers': 'Inscritos',
    'Members': 'Membros',
    'Reactions': 'Reações',
    'Saves': 'Salvamentos',
    'Impressions': 'Impressões',
    'Reach': 'Alcance',
    'Engagement': 'Engajamento',
    'Traffic': 'Tráfego',
    'Visitors': 'Visitantes',
    'Reviews': 'Avaliações',
    'Upvotes': 'Upvotes',
    'Downvotes': 'Downvotes',
    'Repins': 'Repins',
    'Retweets': 'Retweets',
    'Plays': 'Reproduções',
    'Video': 'Vídeo',
    'Post': 'Post',
    'Story': 'Story',
    'Reel': 'Reel',
    'Live': 'Ao Vivo',
    'Stream': 'Stream',
    'Track': 'Faixa',
    'Show': 'Show',
    'Album': 'Álbum',
    'Artist': 'Artista',
    'Profile': 'Perfil',
    'Playlist': 'Playlist',
    'Services': 'Serviços',
    'Service': 'Serviço',
    'Best': 'Melhores',
    'Selling': 'Vendidos',
    'Qualified': 'Qualificados',
    'Mix': 'Mix',
    'Musicians': 'Músicos',
    'For': 'Para',
    
    // Qualificadores
    'Real': 'Reais',
    'High Quality': 'Alta Qualidade',
    'Premium': 'Premium',
    'VIP': 'VIP',
    'Fast': 'Rápido',
    'Instant': 'Instantâneo',
    'Auto': 'Automático',
    'Custom': 'Personalizado',
    'Targeted': 'Segmentado',
    'Worldwide': 'Mundial',
    'Lifetime': 'Vitalício',
    'Guaranteed': 'Garantido',
    'Guarantee': 'Garantia',
    'Refill': 'Reposição',
    'No Refill': 'Sem Reposição',
    'Working': 'Funcionando',
    'Update': 'Atualização',
    'After': 'Após',
    'Last': 'Última',
    'Provided': 'Fornecido',
    'By': 'por',
    'Promotions': 'Promoções',
    'NEW': 'NOVO',
    'Speed': 'Velocidade',
    'Max': 'Máx',
    'Min': 'Mín',
    'Day': 'Dia',
    'Month': 'Mês',
    'Year': 'Ano',
    'Hour': 'Hora',
    'Flag': 'Bandeira',
    'Must': 'Deve',
    'Be': 'Ser',
    'Disabled': 'Desabilitado',
    'Default': 'Padrão',
    'Random': 'Aleatório',
    'Tweet': 'Tweet',
    'Start': 'Início',
    'Minutes': 'Minutos',
    'and': 'e',
    'SERVICES': 'SERVIÇOS'
  }
  
  // Aplicar traduções de palavras-chave (preservando maiúsculas/minúsculas)
  Object.entries(keywordMap).forEach(([english, portuguese]) => {
    // Traduzir palavras completas (com limites de palavra)
    const regex = new RegExp(`\\b${english}\\b`, 'g')
    translated = translated.replace(regex, portuguese)
  })
  
  // Padrões específicos comuns
  translated = translated
    // Datas no formato DD/MM/YYYY
    .replace(/(\d{2})\/(\d{2})\/(\d{4})/g, '$1/$2/$3')
    // Parênteses com informações específicas
    .replace(/\(Last Update:/gi, '(Última Atualização:')
    .replace(/\(Provided By/gi, '(Fornecido por')
    // Siglas comuns
    .replace(/\bMTP\b/g, 'MTP')
    .replace(/\bJAP\b/g, 'JAP')
    // Números com unidades
    .replace(/(\d+)-(\d+)K/g, '$1-$2K')
    .replace(/(\d+)K/g, '$1K')
    .replace(/(\d+)M/g, '$1M')
  
  return translated
}

/**
 * Obter categoria em inglês a partir do português (função de compatibilidade)
 */
export function getCategoryInEnglish(portugueseCategory: string): string {
  // Para compatibilidade, retorna a própria categoria
  return portugueseCategory
}

/**
 * Detectar idioma da categoria (função de compatibilidade)
 */
export function detectCategoryLanguage(category: string): 'en' | 'pt' {
  // Detecta se tem palavras em inglês comuns
  const englishWords = ['Instagram', 'TikTok', 'YouTube', 'Likes', 'Followers', 'Views', 'Comments']
  const hasEnglish = englishWords.some(word => category.includes(word))
  return hasEnglish ? 'en' : 'pt'
}

/**
 * Obter ambas as versões da categoria (função de compatibilidade)
 */
export function getBothCategoryVersions(category: string): { en: string; pt: string } {
  return {
    en: category,
    pt: translateCategorySync(category)
  }
}
