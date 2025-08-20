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
    const supabase = await createClient()
    
    const { data, error } = await (supabase as any)
      .from('most_sold_services')
      .select('*')
      .order('total_orders', { ascending: false })
      .limit(limit)
    
    if (error) {
      return []
    }
    
    const services = data || []
    
    return services.map((service: any) => ({
      ...service,
      quantities: Array.isArray(service.quantities) ? service.quantities : []
    }))
    
  } catch (error: any) {
    return []
  }
}

export async function getMostSoldByCategory(category: string, limit: number = 5): Promise<MostSoldService[]> {
  try {
    const supabase = await createClient()
    
    const { data, error } = await (supabase as any)
      .from('most_sold_services')
      .select('*')
      .eq('shop_category', category)
      .order('total_orders', { ascending: false })
      .limit(limit)
    
    if (error) {
      return []
    }
    
    const services = data || []
    
    return services.map((service: any) => ({
      ...service,
      quantities: Array.isArray(service.quantities) ? service.quantities : []
    }))
    
  } catch (error: any) {
    return []
  }
}

export async function getOrdersStats() {
  try {
    const supabase = await createClient()
    
    // Total de pedidos nos últimos 30 dias
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
    const { count: totalOrdersCount, error: totalError } = await (supabase as any)
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', thirtyDaysAgo)
    
    // Pedidos completados nos últimos 30 dias
    const { count: completedOrdersCount, error: completedError } = await (supabase as any)
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'completed')
      .gte('created_at', thirtyDaysAgo)
    
    // Receita total nos últimos 30 dias
    const { data: revenueData, error: revenueError } = await (supabase as any)
      .from('orders')
      .select('total_price')
      .eq('status', 'completed')
      .gte('created_at', thirtyDaysAgo)
    
    const totalRevenue = revenueData?.reduce((sum: number, order: any) => sum + (order.total_price || 0), 0) || 0
    
    const stats = {
      totalOrders: totalOrdersCount || 0,
      completedOrders: completedOrdersCount || 0,
      totalRevenue: totalRevenue,
      conversionRate: totalOrdersCount ? (completedOrdersCount || 0) / totalOrdersCount * 100 : 0
    }
    
    return stats
    
  } catch (error: any) {
    return {
      totalOrders: 0,
      completedOrders: 0,
      totalRevenue: 0,
      conversionRate: 0
    }
  }
}
