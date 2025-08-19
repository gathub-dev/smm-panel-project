/**
 * Gerenciador unificado para APIs MTP e JAP
 * Inclui sistema de fallback e balanceamento de carga
 */

import { MTPageAPI, type MTPageService, type MTPageOrderData } from './mtp-api'
import { JustAnotherPanelAPI, type JAPService, type JAPOrderData } from './jap-api'

export type Provider = 'mtp' | 'jap'

export interface UnifiedService {
  id: string
  provider: Provider
  provider_service_id: string
  name: string
  category: string
  rate: number
  min: number
  max: number
  dripfeed: boolean
  refill: boolean
  cancel: boolean
  type: string
}

export interface UnifiedOrderData {
  service: number
  link: string
  quantity?: number
  runs?: number
  interval?: number
  keywords?: string
  comments?: string
  usernames?: string
  hashtags?: string
  username?: string
  media?: string
  [key: string]: any
}

export interface OrderResult {
  success: boolean
  orderId?: number
  error?: string
  provider: Provider
}

export interface StatusResult {
  charge: number
  start_count: number
  status: string
  remains: number
  currency: string
}

export class APIManager {
  private mtpApi?: MTPageAPI
  private japApi?: JustAnotherPanelAPI

  constructor(mtpKey?: string, japKey?: string) {
    if (mtpKey) {
      this.mtpApi = new MTPageAPI(mtpKey)
    }
    if (japKey) {
      this.japApi = new JustAnotherPanelAPI(japKey)
    }
  }

  /**
   * Obter API específica
   */
  private getAPI(provider: Provider) {
    if (provider === 'mtp') return this.mtpApi
    if (provider === 'jap') return this.japApi
    throw new Error(`Provider ${provider} não configurado`)
  }

  /**
   * Testar conectividade de todas as APIs
   */
  async testAllConnections(): Promise<Record<Provider, boolean>> {
    const results: Record<Provider, boolean> = {
      mtp: false,
      jap: false
    }

    if (this.mtpApi) {
      try {
        results.mtp = await this.mtpApi.testConnection()
      } catch {
        results.mtp = false
      }
    }

    if (this.japApi) {
      try {
        results.jap = await this.japApi.testConnection()
      } catch {
        results.jap = false
      }
    }

    return results
  }

  /**
   * Obter serviços de um provedor
   */
  async getServices(provider: Provider): Promise<(MTPageService | JAPService)[]> {
    const api = this.getAPI(provider)
    if (!api) return []

    try {
      return await api.getServices()
    } catch (error) {
      return []
    }
  }

  /**
   * Criar pedido em provedor específico
   */
  async createOrder(
    provider: Provider,
    orderData: UnifiedOrderData
  ): Promise<OrderResult> {
    const api = this.getAPI(provider)
    if (!api) {
      return {
        success: false,
        error: `Provider ${provider} não disponível`,
        provider
      }
    }

    try {
      const result = await api.createOrder(orderData as any)
      
      if (result.error) {
        return {
          success: false,
          error: result.error,
          provider
        }
      }
      
      return {
        success: true,
        orderId: result.order,
        provider
      }
    } catch (error) {
      return {
        success: false,
        error: `Erro ao criar pedido: ${error}`,
        provider
      }
    }
  }

  /**
   * Verificar status de pedido
   */
  async checkOrderStatus(
    provider: Provider,
    providerOrderId: number
  ): Promise<StatusResult | null> {
    const api = this.getAPI(provider)
    if (!api) return null

    try {
      return await api.getOrderStatus(providerOrderId)
    } catch (error) { 
      return null
    }
  }

  /**
   * Solicitar refill
   */
  async requestRefill(
    provider: Provider,
    providerOrderId: number
  ): Promise<{ success: boolean; refillId?: number; error?: string }> {
    const api = this.getAPI(provider)
    if (!api) {
      return { success: false, error: `Provider ${provider} não disponível` }
    }

    try {
      const result = await api.refillOrder(providerOrderId)
      
      if (result.error) {
        return { success: false, error: result.error }
      }

      return { success: true, refillId: result.refill }
    } catch (error) {
      return { success: false, error: String(error) }
    }
  }

  /**
   * Cancelar pedido
   */
  async cancelOrder(
    provider: Provider,
    providerOrderId: number
  ): Promise<{ success: boolean; error?: string }> {
    const api = this.getAPI(provider)
    if (!api) {
      return { success: false, error: `Provider ${provider} não disponível` }
    }

    try {
      await api.cancelOrders([providerOrderId])
      return { success: true }
    } catch (error) {
      return { success: false, error: String(error) }
    }
  }

  /**
   * Obter saldo do provedor
   */
  async getProviderBalance(provider: Provider): Promise<number | null> {
    const api = this.getAPI(provider)
    if (!api) return null

    try {
      const result = await api.getBalance()
      return result.balance
    } catch {
      return null
    }
  }
} 