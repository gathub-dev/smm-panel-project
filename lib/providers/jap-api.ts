/**
 * Integração com API JustAnotherPanel (JAP)
 * Baseado na documentação PHP fornecida
 */

export interface JAPOrderData {
  service: number
  link: string
  quantity?: number
  runs?: number
  interval?: number
  keywords?: string
  comments?: string
  usernames?: string
  hashtags?: string
  hashtag?: string
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
  country?: string
  device?: string
  type_of_traffic?: number
  google_keyword?: string
}

export interface JAPOrderResponse {
  order?: number
  error?: string
}

export interface JAPStatusResponse {
  charge: number
  start_count: number
  status: string
  remains: number
  currency: string
}

export interface JAPService {
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

export interface JAPBalanceResponse {
  balance: number
  currency: string
}

export interface JAPRefillResponse {
  refill?: number
  error?: string
}

export class JustAnotherPanelAPI {
  private apiUrl = 'https://justanotherpanel.com/api/v2'
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
        return JSON.parse(text)
      } catch {
        throw new Error(`Invalid JSON response: ${text}`)
      }
    } catch (error) {
      console.error('JAP API Error:', error)
      throw error
    }
  }

  /**
   * Criar pedido
   */
  async createOrder(orderData: JAPOrderData): Promise<JAPOrderResponse> {
    return this.makeRequest({
      action: 'add',
      ...orderData
    })
  }

  /**
   * Verificar status de um pedido
   */
  async getOrderStatus(orderId: number): Promise<JAPStatusResponse> {
    return this.makeRequest({
      action: 'status',
      order: orderId
    })
  }

  /**
   * Verificar status de múltiplos pedidos
   */
  async getMultipleOrderStatus(orderIds: number[]): Promise<JAPStatusResponse[]> {
    return this.makeRequest({
      action: 'status',
      orders: orderIds.join(',')
    })
  }

  /**
   * Obter lista de serviços
   */
  async getServices(): Promise<JAPService[]> {
    return this.makeRequest({
      action: 'services'
    })
  }

  /**
   * Solicitar refill de um pedido
   */
  async refillOrder(orderId: number): Promise<JAPRefillResponse> {
    return this.makeRequest({
      action: 'refill',
      order: orderId
    })
  }

  /**
   * Solicitar refill de múltiplos pedidos
   */
  async refillMultipleOrders(orderIds: number[]): Promise<JAPRefillResponse[]> {
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
  async getBalance(): Promise<JAPBalanceResponse> {
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