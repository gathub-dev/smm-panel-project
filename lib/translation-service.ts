
import translate from 'translate-google'

/**
 * Serviço de tradução automática
 */
export class TranslationService {
  private static instance: TranslationService
  private cache = new Map<string, string>()
  private readonly targetLanguage = 'pt'
  
  static getInstance(): TranslationService {
    if (!TranslationService.instance) {
      TranslationService.instance = new TranslationService()
    }
    return TranslationService.instance
  }

  /**
   * Detectar se o texto está em português
   */
  private isPortuguese(text: string): boolean {
    if (!text || text.length < 3) return true
    
    // Palavras EXCLUSIVAMENTE em português (não incluir palavras em inglês)
    const portugueseWords = [
      'seguidores', 'curtidas', 'visualizações', 'comentários', 'compartilhamentos',
      'inscritos', 'membros', 'reações', 'reposição', 'garantia', 'vitalícia',
      'velocidade', 'máximo', 'mínimo', 'funcionando', 'atualização',
      'brasil', 'brasileiro', 'pt', 'br', 'após', 'última', 'fornecido'
    ]
    
    const lowerText = text.toLowerCase()
    
    // Se contém palavras CLARAMENTE em português, está em português
    const hasPortuguese = portugueseWords.some(word => lowerText.includes(word))
    if (hasPortuguese) {
      return true
    }
    
    // Verificar caracteres especiais do português
    const hasPortugueseChars = /[áàâãéêíóôõúüç]/i.test(text)
    if (hasPortugueseChars) {
      return true
    }
    
    return false
  }

  /**
   * Tradução manual para termos comuns de SMM
   */
  private getManualTranslation(text: string): string | null {
    const translations: Record<string, string> = {
      // Plataformas
      'instagram': 'Instagram',
      'facebook': 'Facebook',
      'youtube': 'YouTube',
      'tiktok': 'TikTok',
      'twitter': 'Twitter',
      'linkedin': 'LinkedIn',
      'telegram': 'Telegram',
      'discord': 'Discord',
      'twitch': 'Twitch',
      'spotify': 'Spotify',
      
      // Tipos de serviços
      'followers': 'Seguidores',
      'likes': 'Curtidas',
      'views': 'Visualizações',
      'comments': 'Comentários',
      'shares': 'Compartilhamentos',
      'subscribers': 'Inscritos',
      'members': 'Membros',
      'reactions': 'Reações',
      'story views': 'Visualizações de Story',
      'reel views': 'Visualizações de Reels',
      'video views': 'Visualizações de Vídeo',
      'live views': 'Visualizações ao Vivo',
      'post likes': 'Curtidas em Posts',
      'photo likes': 'Curtidas em Fotos',
      'auto likes': 'Curtidas Automáticas',
      'real followers': 'Seguidores Reais',
      'premium followers': 'Seguidores Premium',
      'targeted followers': 'Seguidores Segmentados',
      'global followers': 'Seguidores Globais',
      'brazilian followers': 'Seguidores Brasileiros',
      'usa followers': 'Seguidores Americanos',
      'worldwide': 'Mundial',
      'brazil': 'Brasil',
      'usa': 'EUA',
      'europe': 'Europa',
      
      // Termos específicos comuns
      'refill': 'Reposição',
      'no refill': 'Sem Reposição',
      '30 day refill': 'Reposição 30 Dias',
      'lifetime guaranteed': 'Garantia Vitalícia',
      'speed': 'Velocidade',
      'day': 'Dia',
      'hour': 'Hora',
      'guaranteed': 'Garantido',
      'working': 'Funcionando',
      'update': 'Atualização',
      'new': 'Novo',
      
      // Qualidade
      'high quality': 'Alta Qualidade',
      'premium': 'Premium',
      'real': 'Real',
      'active': 'Ativo',
      'fast': 'Rápido',
      'instant': 'Instantâneo',
      'slow': 'Lento',
      'cheap': 'Barato',
      'best': 'Melhor',
      'top': 'Top',
      'super': 'Super',
      'max': 'Máximo',
      'min': 'Mínimo',
      
      // Categorias comuns
      'social media': 'Redes Sociais',
      'smm': 'SMM',
      'marketing': 'Marketing',
      'engagement': 'Engajamento',
      'growth': 'Crescimento',
      'boost': 'Impulsionamento',
      'promotion': 'Promoção'
    }
    
    const lowerText = text.toLowerCase().trim()
    return translations[lowerText] || null
  }

  /**
   * Traduzir texto para português
   */
  async translateToPortuguese(text: string): Promise<string> {
    if (!text || text.trim() === '') return text
    
    // Verificar se já está em português
    const isAlreadyPortuguese = this.isPortuguese(text)
    if (isAlreadyPortuguese) return text
    
    // Verificar cache
    const cacheKey = text.toLowerCase().trim()
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!
    }

    // Tentar tradução manual primeiro (mais rápido)
    const manualTranslation = this.getManualTranslation(text)
    if (manualTranslation) {
      const cleanedManual = this.cleanProviderInfo(manualTranslation)
      this.cache.set(cacheKey, cleanedManual)
      return cleanedManual
    }

    // TEMPORARIAMENTE: Usar apenas tradução básica até resolver problema da biblioteca
    const basicTranslation = this.getBasicTranslation(text)
    
    // Limpar informações internas dos provedores
    const cleanedTranslation = this.cleanProviderInfo(basicTranslation)
    
    // Verificar se realmente traduziu
    if (cleanedTranslation !== text) {
      }
    
    this.cache.set(cacheKey, cleanedTranslation)
    return cleanedTranslation

    // TODO: Reativar Google Translate quando biblioteca estiver funcionando
    /*
    try {
      // Traduzir usando Google Translate
      const translated = await translate(text, { to: this.targetLanguage })
      
      // Verificar se a tradução é válida
      if (!translated || translated === text || translated.trim() === '') {
        const basicTranslation = this.getBasicTranslation(text)
        this.cache.set(cacheKey, basicTranslation)
        return basicTranslation
      }
      
      // Armazenar no cache
      this.cache.set(cacheKey, translated)
      
      return translated
    } catch (error: any) {
      const basicTranslation = this.getBasicTranslation(text)
      this.cache.set(cacheKey, basicTranslation)
      return basicTranslation
    }
    */
  }

  /**
   * Tradução básica inteligente para quando o serviço está indisponível
   */
  private getBasicTranslation(text: string): string {
    let translated = text
    
    // Substituições básicas mais abrangentes e inteligentes
    const basicReplacements: Record<string, string> = {
      // Tipos de serviços
      'followers': 'Seguidores',
      'likes': 'Curtidas', 
      'views': 'Visualizações',
      'comments': 'Comentários',
      'shares': 'Compartilhamentos',
      'subscribers': 'Inscritos',
      'members': 'Membros',
      'reactions': 'Reações',
      
      // Plataformas
      'instagram': 'Instagram',
      'facebook': 'Facebook',
      'youtube': 'YouTube',
      'tiktok': 'TikTok',
      'twitter': 'Twitter',
      'linkedin': 'LinkedIn',
      'telegram': 'Telegram',
      'discord': 'Discord',
      'twitch': 'Twitch',
      'spotify': 'Spotify',
      
      // Características do serviço
      'refill': 'Reposição',
      'no refill': 'Sem Reposição',
      '30 day refill': 'Reposição 30 Dias',
      'lifetime guaranteed': 'Garantia Vitalícia',
      'lifetime': 'Vitalício',
      'guaranteed': 'Garantido',
      'speed': 'Velocidade',
      'fast': 'Rápido',
      'slow': 'Lento',
      'instant': 'Instantâneo',
      
      // Tempo
      'day': 'Dia',
      'hour': 'Hora',
      'minute': 'Minuto',
      'second': 'Segundo',
      
      // Quantidades
      'max': 'Máx',
      'min': 'Mín',
      'k': 'K',
      'm': 'M',
      
      // Qualidade
      'high quality': 'Alta Qualidade',
      'premium': 'Premium',
      'real': 'Real',
      'active': 'Ativo',
      'cheap': 'Barato',
      'best': 'Melhor',
      'top': 'Top',
      'super': 'Super',
      
      // Status
      'working': 'Funcionando',
      'new': 'Novo',
      'update': 'Atualização',
      'updated': 'Atualizado',
      
      // Conectores e preposições comuns
      'after': 'após',
      'before': 'antes',
      'with': 'com',
      'without': 'sem',
      'and': 'e',
      'or': 'ou',
      'for': 'para',
      'from': 'de',
      'to': 'para'
    }
    
    // Substituições de frases completas primeiro (mais específicas)
    const phraseReplacements: Record<string, string> = {
      'working after update': 'Funcionando após atualização',
      'last update': 'última atualização',
      'provided by': 'fornecido por',
      'speed 1-3k/day': 'Velocidade 1-3K/Dia',
      'speed 500-2k/day': 'Velocidade 500-2K/Dia',
      'speed 200-700/day': 'Velocidade 200-700/Dia',
      'speed 10-50k/day': 'Velocidade 10-50K/Dia'
    }
    
    // Aplicar substituições de frases primeiro
    Object.entries(phraseReplacements).forEach(([en, pt]) => {
      const regex = new RegExp(en.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi')
      translated = translated.replace(regex, pt)
    })
    
    // Aplicar substituições de palavras individuais
    Object.entries(basicReplacements).forEach(([en, pt]) => {
      const regex = new RegExp(`\\b${en.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi')
      translated = translated.replace(regex, pt)
    })
    
    // Substituições de padrões numéricos
    translated = translated.replace(/(\d+)-(\d+)k?\s*\/?\s*day/gi, '$1-$2K/Dia')
    translated = translated.replace(/max\s+(\d+[km]?)/gi, 'Máx $1')
    translated = translated.replace(/min\s+(\d+[km]?)/gi, 'Mín $1')
    
    
    return translated
  }

  /**
   * Traduzir múltiplos textos em lote
   */
  async translateBatch(texts: string[]): Promise<string[]> {
    const translations = await Promise.all(
      texts.map(text => this.translateToPortuguese(text))
    )
    return translations
  }

  /**
   * Traduzir dados de serviço
   */
  async translateServiceData(serviceData: {
    name: string
    description?: string
    category?: string
  }): Promise<{
    name: string
    description?: string
    category?: string
    originalName?: string
    originalDescription?: string
    originalCategory?: string
  }> {
    const originalName = serviceData.name
    const originalDescription = serviceData.description
    const originalCategory = serviceData.category

    try {
      const [translatedName, translatedDescription, translatedCategory] = await Promise.all([
        this.translateToPortuguese(serviceData.name),
        serviceData.description ? this.translateToPortuguese(serviceData.description) : undefined,
        serviceData.category ? this.translateToPortuguese(serviceData.category) : undefined
      ])

      // Limpar informações internas dos provedores dos textos traduzidos
      const cleanedName = this.cleanProviderInfo(translatedName)
      const cleanedDescription = translatedDescription ? this.cleanProviderInfo(translatedDescription) : undefined
      const cleanedCategory = translatedCategory ? this.cleanProviderInfo(translatedCategory) : undefined

      return {
        name: cleanedName,
        description: cleanedDescription,
        category: cleanedCategory,
        // Manter originais para referência
        originalName: originalName !== cleanedName ? originalName : undefined,
        originalDescription: originalDescription !== cleanedDescription ? originalDescription : undefined,
        originalCategory: originalCategory !== cleanedCategory ? originalCategory : undefined
      }
    } catch (error) {       
      // Mesmo em caso de erro, limpar as informações internas
      return {
        name: this.cleanProviderInfo(serviceData.name),
        description: serviceData.description ? this.cleanProviderInfo(serviceData.description) : undefined,
        category: serviceData.category ? this.cleanProviderInfo(serviceData.category) : undefined
      }
    }
  }

  /**
   * Limpar informações internas dos provedores dos textos
   * Remove referências a MTP, JAP e outras informações que clientes não devem ver
   */
  cleanProviderInfo(text: string): string {
    if (!text) return text

    let cleaned = text
    
    // Remover referências específicas a provedores (várias variações)
    cleaned = cleaned.replace(/\(fornecido por MTP\!?\)/gi, '')
    cleaned = cleaned.replace(/\(provided by MTP\!?\)/gi, '')
    cleaned = cleaned.replace(/\(fornecido por JAP\!?\)/gi, '')
    cleaned = cleaned.replace(/\(provided by JAP\!?\)/gi, '')
    
    // Remover variações sem parênteses
    cleaned = cleaned.replace(/fornecido por MTP\!?/gi, '')
    cleaned = cleaned.replace(/provided by MTP\!?/gi, '')
    cleaned = cleaned.replace(/fornecido por JAP\!?/gi, '')
    cleaned = cleaned.replace(/provided by JAP\!?/gi, '')
    
    // Remover informações de atualização com referências a provedores
    cleaned = cleaned.replace(/- \(última atualização:.*?\) \(fornecido por \w+\!?\)/gi, '')
    cleaned = cleaned.replace(/- \(last update:.*?\) \(provided by \w+\!?\)/gi, '')
    cleaned = cleaned.replace(/\(última atualização:.*?\) \(fornecido por \w+\!?\)/gi, '')
    cleaned = cleaned.replace(/\(last update:.*?\) \(provided by \w+\!?\)/gi, '')
    
    // Remover padrões específicos encontrados
    cleaned = cleaned.replace(/working after update.*?provided by \w+\!?/gi, '')
    cleaned = cleaned.replace(/funcionando após atualização.*?fornecido por \w+\!?/gi, '')
    
    // Remover outras referências internas
    cleaned = cleaned.replace(/\bMTP\!\b/g, '')
    cleaned = cleaned.replace(/\bJAP\!\b/g, '')
    cleaned = cleaned.replace(/\bMTP\b\!/g, '') // MTP seguido de !
    cleaned = cleaned.replace(/\bJAP\b\!/g, '') // JAP seguido de !
    
    // Remover traços e exclamações órfãos
    cleaned = cleaned.replace(/\s*-\s*\(fornecido por.*?\)/gi, '')
    cleaned = cleaned.replace(/\s*-\s*\(provided by.*?\)/gi, '')
    
    // Limpar espaços extras e pontuação dupla
    cleaned = cleaned.replace(/\s+/g, ' ')
    cleaned = cleaned.replace(/\s*-\s*$/, '') // Remove traços no final
    cleaned = cleaned.replace(/\s*\!\s*$/, '') // Remove exclamações no final
    cleaned = cleaned.replace(/\s*-\s*\!\s*$/, '') // Remove traço + exclamação no final
    cleaned = cleaned.trim()
    
    return cleaned
  }

  /**
   * Limpar cache (para economizar memória)
   */
  clearCache(): void {
    this.cache.clear()
  }

  /**
   * Obter estatísticas do cache
   */
  getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()).slice(0, 10) // Primeiras 10 chaves
    }
  }
}

/**
 * Instância singleton do serviço de tradução
 */
export const translationService = TranslationService.getInstance()
