/**
 * Integração com API MoreThanPanel (MTP)
 * Baseado na documentação PHP fornecida
 */

export interface MTPageOrderData {
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
  min?: number
  max?: number
  posts?: number
  old_posts?: number
  delay?: number
  expiry?: string
  answer_number?: string
  groups?: string
}

export interface MTPageOrderResponse {
  order?: number
  error?: string
}

export interface MTPageStatusResponse {
  charge: number
  start_count: number
  status: string
  remains: number
  currency: string
}

export interface MTPageService {
  service: number
  name: string
  type: string
  rate: number
  min: number
  max: number
  dripfeed: boolean
  refill: boolean
  cancel: boolean
  category: string
}

export interface MTPageBalanceResponse {
  balance: number
  currency: string
}

export interface MTPageRefillResponse {
  refill?: number
  error?: string
}

export class MTPageAPI {
  private apiUrl = 'https://morethanpanel.com/api/v2'
  private apiKey: string

  constructor(apiKey: string) {
    this.apiKey = apiKey
  }

  /**
   * Fazer requisição para API
   */
  private async makeRequest(data: Record<string, any>): Promise<any> {
    const formData = new URLSearchParams()
    formData.append('key', this.apiKey)
    
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        formData.append(key, String(value))
      }
    })

    try {
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': 'SMM-Panel-NextJS/1.0'
        },
        body: formData.toString()
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const text = await response.text()
      
      try {
        const parsed = JSON.parse(text)
        return parsed
      } catch (parseError) {
        throw new Error(`Invalid JSON response: ${text}`)
      }
    } catch (error) {
      throw error
    }
  }

  /**
   * Criar pedido
   */
  async createOrder(orderData: MTPageOrderData): Promise<MTPageOrderResponse> {
    return this.makeRequest({
      action: 'add',
      ...orderData
    })
  }

  /**
   * Verificar status de um pedido
   */
  async getOrderStatus(orderId: number): Promise<MTPageStatusResponse> {
    return this.makeRequest({
      action: 'status',
      order: orderId
    })
  }

  /**
   * Verificar status de múltiplos pedidos
   */
  async getMultipleOrderStatus(orderIds: number[]): Promise<MTPageStatusResponse[]> {
    return this.makeRequest({
      action: 'status',
      orders: orderIds.join(',')
    })
  }

  /**
   * Obter lista de serviços
   */
  async getServices(): Promise<MTPageService[]> {
    const response = await this.makeRequest({
      action: 'services'
    })
      
    return response || []
  }

  /**
   * Solicitar refill de um pedido
   */
  async refillOrder(orderId: number): Promise<MTPageRefillResponse> {
    return this.makeRequest({
      action: 'refill',
      order: orderId
    })
  }

  /**
   * Solicitar refill de múltiplos pedidos
   */
  async refillMultipleOrders(orderIds: number[]): Promise<MTPageRefillResponse[]> {
    return this.makeRequest({
      action: 'refill',
      orders: orderIds.join(',')
    })
  }

  /**
   * Verificar status de refill
   */
  async getRefillStatus(refillId: number): Promise<any> {
    return this.makeRequest({
      action: 'refill_status',
      refill: refillId
    })
  }

  /**
   * Verificar status de múltiplos refills
   */
  async getMultipleRefillStatus(refillIds: number[]): Promise<any[]> {
    return this.makeRequest({
      action: 'refill_status',
      refills: refillIds.join(',')
    })
  }

  /**
   * Cancelar pedidos
   */
  async cancelOrders(orderIds: number[]): Promise<any> {
    return this.makeRequest({
      action: 'cancel',
      orders: orderIds.join(',')
    })
  }

  /**
   * Verificar saldo da conta
   */
  async getBalance(): Promise<MTPageBalanceResponse> {
    return this.makeRequest({
      action: 'balance'
    })
  }

  /**
   * Testar conectividade da API
   */
  async testConnection(): Promise<boolean> {
    try {
      await this.getBalance()
      return true
    } catch {
      return false
    }
  }
} 