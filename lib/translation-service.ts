
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
    
    // Palavras comuns em português
    const portugueseWords = [
      'seguidores', 'curtidas', 'visualizações', 'comentários', 'compartilhamentos',
      'instagram', 'facebook', 'youtube', 'tiktok', 'twitter',
      'likes', 'views', 'followers', 'subscribers', 'members',
      'brasil', 'brasileiro', 'pt', 'br'
    ]
    
    const lowerText = text.toLowerCase()
    
    // Se contém palavras em português, provavelmente já está em português
    const hasPortuguese = portugueseWords.some(word => lowerText.includes(word))
    if (hasPortuguese) return true
    
    // Verificar caracteres especiais do português
    const hasPortugueseChars = /[áàâãéêíóôõúüç]/i.test(text)
    if (hasPortugueseChars) return true
    
    return false
  }

  /**
   * Traduzir texto para português
   */
  async translateToPortuguese(text: string): Promise<string> {
    if (!text || text.trim() === '') return text
    
    // Verificar se já está em português
    if (this.isPortuguese(text)) return text
    
    // Verificar cache
    const cacheKey = text.toLowerCase().trim()
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!
    }

    try {
      // Traduzir usando Google Translate
      const translated = await translate(text, { to: this.targetLanguage })
      
      // Armazenar no cache
      this.cache.set(cacheKey, translated)
      
      return translated
    } catch (error) {
      console.log(`⚠️ Erro na tradução de "${text}":`, error)
      return text // Retornar texto original se falhar
    }
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

      return {
        name: translatedName,
        description: translatedDescription,
        category: translatedCategory,
        // Manter originais para referência
        originalName: originalName !== translatedName ? originalName : undefined,
        originalDescription: originalDescription !== translatedDescription ? originalDescription : undefined,
        originalCategory: originalCategory !== translatedCategory ? originalCategory : undefined
      }
    } catch (error) {
      console.log('⚠️ Erro na tradução em lote:', error)
      return {
        name: serviceData.name,
        description: serviceData.description,
        category: serviceData.category
      }
    }
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
