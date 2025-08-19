"use server"

import { createClient } from '@/lib/supabase/server'

export interface MostSoldService {
  id: string
  name: string
  description: string
  shop_category: string
  rate: number
  quantities: number[]
  lp_visible: boolean
  featured: boolean
  provider_rate: number
  markup_type: string
  markup_value: number
  total_orders: number
  total_quantity: number
  total_revenue: number
  avg_order_value: number
}

export async function getMostSoldServices(limit: number = 10): Promise<MostSoldService[]> {
  try {
    console.log(`📊 [MOST-SOLD] Buscando ${limit} serviços mais vendidos...`)
    
    const supabase = createClient()
    
    const { data, error } = await supabase
      .from('most_sold_services')
      .select('*')
      .limit(limit)
    
    if (error) {
      console.error('❌ [MOST-SOLD] Erro ao buscar mais vendidos:', error)
      return []
    }
    
    const services = data || []
    console.log(`✅ [MOST-SOLD] Encontrados ${services.length} serviços mais vendidos`)
    
    return services.map(service => ({
      ...service,
      quantities: Array.isArray(service.quantities) ? service.quantities : []
    }))
    
  } catch (error: any) {
    console.error('❌ [MOST-SOLD] Erro geral:', error)
    return []
  }
}

export async function getMostSoldByCategory(category: string, limit: number = 5): Promise<MostSoldService[]> {
  try {
    console.log(`📊 [MOST-SOLD] Buscando mais vendidos da categoria: ${category}`)
    
    const supabase = createClient()
    
    const { data, error } = await supabase
      .from('most_sold_services')
      .select('*')
      .eq('shop_category', category)
      .limit(limit)
    
    if (error) {
      console.error('❌ [MOST-SOLD] Erro ao buscar por categoria:', error)
      return []
    }
    
    const services = data || []
    console.log(`✅ [MOST-SOLD] Encontrados ${services.length} serviços na categoria ${category}`)
    
    return services.map(service => ({
      ...service,
      quantities: Array.isArray(service.quantities) ? service.quantities : []
    }))
    
  } catch (error: any) {
    console.error('❌ [MOST-SOLD] Erro geral por categoria:', error)
    return []
  }
}

export async function getOrdersStats() {
  try {
    console.log('📈 [STATS] Buscando estatísticas de pedidos...')
    
    const supabase = createClient()
    
    // Total de pedidos nos últimos 30 dias
    const { data: totalOrders, error: totalError } = await supabase
      .from('orders')
      .select('id', { count: 'exact' })
      .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
    
    // Pedidos completados nos últimos 30 dias
    const { data: completedOrders, error: completedError } = await supabase
      .from('orders')
      .select('id', { count: 'exact' })
      .eq('status', 'completed')
      .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
    
    // Receita total nos últimos 30 dias
    const { data: revenueData, error: revenueError } = await supabase
      .from('orders')
      .select('total_price')
      .eq('status', 'completed')
      .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
    
    const totalRevenue = revenueData?.reduce((sum, order) => sum + (order.total_price || 0), 0) || 0
    
    const stats = {
      totalOrders: totalOrders?.length || 0,
      completedOrders: completedOrders?.length || 0,
      totalRevenue: totalRevenue,
      conversionRate: totalOrders?.length ? (completedOrders?.length || 0) / totalOrders.length * 100 : 0
    }
    
    console.log('✅ [STATS] Estatísticas calculadas:', stats)
    return stats
    
  } catch (error: any) {
    console.error('❌ [STATS] Erro ao buscar estatísticas:', error)
    return {
      totalOrders: 0,
      completedOrders: 0,
      totalRevenue: 0,
      conversionRate: 0
    }
  }
}
