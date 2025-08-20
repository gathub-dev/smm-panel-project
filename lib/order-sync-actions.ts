"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { APIManager } from "./providers/api-manager"

/**
 * Sincronizar status de todos os pedidos pendentes
 */
export async function syncAllOrdersStatus() {
  const supabase = await createClient()

  try {
    // Obter pedidos que precisam de sincronização
    const { data: orders } = await supabase
      .from("orders")
      .select("*, services(provider, provider_service_id)")
      .in("status", ["pending", "processing", "in_progress"])
      .not("provider_order_id", "is", null)
      .order("created_at", { ascending: false })
      .limit(100) // Limitar para não sobrecarregar

    if (!orders || orders.length === 0) {
      return { success: true, updated: 0, message: "Nenhum pedido para sincronizar" }
    }

    // Obter chaves de API
    const { data: apiKeys } = await supabase
      .from("api_keys")
      .select("*")
      .eq("is_active", true)

    if (!apiKeys || apiKeys.length === 0) {
      return { error: "Nenhuma chave de API configurada" }
    }

    const mtpKey = apiKeys.find((key: any) => key.provider === 'mtp')?.api_key
    const japKey = apiKeys.find((key: any) => key.provider === 'jap')?.api_key

    const apiManager = new APIManager(mtpKey, japKey)
    let updated = 0

    for (const order of orders) {
      try {
        if (!order.provider || !order.provider_order_id) continue

        const status = await apiManager.checkOrderStatus(
          order.provider as 'mtp' | 'jap',
          parseInt(order.provider_order_id)
        )

        if (status) {
          // Mapear status da API para nosso sistema
          const mappedStatus = mapProviderStatus(status.status)
          
          const updateData: any = {
            status: mappedStatus,
            start_count: status.start_count || order.start_count,
            remains: status.remains || 0,
            last_status_check: new Date().toISOString()
          }

          // Se o pedido foi completado, calcular o lucro final
          if (mappedStatus === 'completed') {
            updateData.profit = order.charge - (status.charge || order.provider_cost || 0)
          }

          await supabase
            .from("orders")
            .update(updateData)
            .eq("id", order.id)

          updated++
        }
      } catch (error) {
        
        // Marcar como erro se muitas tentativas falharam
        const hoursSinceCreated = (Date.now() - new Date(order.created_at).getTime()) / (1000 * 60 * 60)
        if (hoursSinceCreated > 24) { // Após 24 horas
          await supabase
            .from("orders")
            .update({
              status: "error",
              error_message: "Falha na sincronização após 24h",
              last_status_check: new Date().toISOString()
            })
            .eq("id", order.id)
        }
      }
    }

    revalidatePath("/dashboard/orders")
    revalidatePath("/dashboard/admin")

    return { success: true, updated, message: `${updated} pedidos sincronizados` }
  } catch (error) {
    return { error: `Erro na sincronização: ${error}` }
  }
}

/**
 * Sincronizar status de um pedido específico
 */
export async function syncOrderStatus(orderId: string) {
  const supabase = await createClient()

  try {
    // Obter pedido
    const { data: order } = await supabase
      .from("orders")
      .select("*, services(provider)")
      .eq("id", orderId)
      .single()

    if (!order || !order.provider_order_id) {
      return { error: "Pedido não encontrado ou sem ID do provedor" }
    }

    // Obter chaves de API
    const { data: apiKeys } = await supabase
      .from("api_keys")
      .select("*")
      .eq("is_active", true)

    if (!apiKeys || apiKeys.length === 0) {
      return { error: "Nenhuma chave de API configurada" }
    }

    const mtpKey = apiKeys.find((key: any) => key.provider === 'mtp')?.api_key
    const japKey = apiKeys.find((key: any) => key.provider === 'jap')?.api_key

    const apiManager = new APIManager(mtpKey, japKey)
    
    const status = await apiManager.checkOrderStatus(
      order.provider as 'mtp' | 'jap',
      parseInt(order.provider_order_id)
    )

    if (!status) {
      return { error: "Não foi possível obter status do provedor" }
    }

    // Atualizar pedido
    const mappedStatus = mapProviderStatus(status.status)
    
    const updateData: any = {
      status: mappedStatus,
      start_count: status.start_count || order.start_count,
      remains: status.remains || 0,
      last_status_check: new Date().toISOString()
    }

    if (mappedStatus === 'completed') {
      updateData.profit = order.charge - (status.charge || order.provider_cost || 0)
    }

    await supabase
      .from("orders")
      .update(updateData)
      .eq("id", orderId)

    revalidatePath("/dashboard/orders")
    
    return { 
      success: true, 
      status: mappedStatus,
      message: "Status atualizado com sucesso" 
    }
  } catch (error) {
    return { error: `Erro ao sincronizar: ${error}` }
  }
}

/**
 * Solicitar refill para um pedido
 */
export async function requestOrderRefill(orderId: string) {
  const supabase = await createClient()

  try {
    // Verificar se usuário pode fazer refill
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: "Não autenticado" }

    // Obter pedido
    const { data: order } = await supabase
      .from("orders")
      .select("*, services(refill, provider)")
      .eq("id", orderId)
      .eq("user_id", user.id)
      .single()

    if (!order) {
      return { error: "Pedido não encontrado" }
    }

    if (!order.services?.refill) {
      return { error: "Este serviço não suporta refill" }
    }

    if (!order.provider_order_id) {
      return { error: "Pedido ainda não foi processado pelo provedor" }
    }

    if (order.status !== 'completed' && order.status !== 'partial') {
      return { error: "Refill só é possível para pedidos completados ou parciais" }
    }

    // Obter chaves de API
    const { data: apiKeys } = await supabase
      .from("api_keys")
      .select("*")
      .eq("is_active", true)

    if (!apiKeys || apiKeys.length === 0) {
      return { error: "Nenhuma chave de API configurada" }
    }

    const mtpKey = apiKeys.find((key: any) => key.provider === 'mtp')?.api_key
    const japKey = apiKeys.find((key: any) => key.provider === 'jap')?.api_key

    const apiManager = new APIManager(mtpKey, japKey)
    
    const result = await apiManager.requestRefill(
      order.provider as 'mtp' | 'jap',
      parseInt(order.provider_order_id)
    )

    if (!result.success) {
      return { error: result.error || "Falha ao solicitar refill" }
    }

    // Atualizar pedido com ID do refill
    await supabase
      .from("orders")
      .update({
        refill_id: result.refillId?.toString(),
        updated_at: new Date().toISOString()
      })
      .eq("id", orderId)

    revalidatePath("/dashboard/orders")
    
    return { 
      success: true, 
      refillId: result.refillId,
      message: "Refill solicitado com sucesso" 
    }
  } catch (error) {
    return { error: `Erro ao solicitar refill: ${error}` }
  }
}

/**
 * Cancelar pedido via API
 */
export async function cancelOrderViaAPI(orderId: string) {
  const supabase = await createClient()

  try {
    // Verificar se usuário pode cancelar
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: "Não autenticado" }

    // Obter pedido
    const { data: order } = await supabase
      .from("orders")
      .select("*, services(cancel, provider)")
      .eq("id", orderId)
      .eq("user_id", user.id)
      .single()

    if (!order) {
      return { error: "Pedido não encontrado" }
    }

    if (!order.services?.cancel) {
      return { error: "Este serviço não suporta cancelamento" }
    }

    if (!["pending", "processing", "in_progress"].includes(order.status)) {
      return { error: "Pedido não pode ser cancelado neste status" }
    }

    if (!order.provider_order_id) {
      // Se ainda não foi enviado para o provedor, cancelar localmente
      await supabase
        .from("orders")
        .update({ status: "canceled" })
        .eq("id", orderId)

      // Processar reembolso
      await supabase.rpc("update_user_balance", {
        user_uuid: user.id,
        transaction_type: "refund",
        amount_change: order.charge,
        description_text: `Reembolso do pedido cancelado #${order.id.slice(0, 8)}`,
        related_order_id: order.id,
      })

      revalidatePath("/dashboard/orders")
      revalidatePath("/dashboard/balance")
      
      return { success: true, message: "Pedido cancelado e reembolsado" }
    }

    // Cancelar via API do provedor
    const { data: apiKeys } = await supabase
      .from("api_keys")
      .select("*")
      .eq("is_active", true)

    if (!apiKeys || apiKeys.length === 0) {
      return { error: "Nenhuma chave de API configurada" }
    }

    const mtpKey = apiKeys.find((key: any) => key.provider === 'mtp')?.api_key
    const japKey = apiKeys.find((key: any) => key.provider === 'jap')?.api_key

    const apiManager = new APIManager(mtpKey, japKey)
    
    const result = await apiManager.cancelOrder(
      order.provider as 'mtp' | 'jap',
      parseInt(order.provider_order_id)
    )

    if (!result.success) {
      return { error: result.error || "Falha ao cancelar via API" }
    }

    // Atualizar status local
    await supabase
      .from("orders")
      .update({ status: "canceled" })
      .eq("id", orderId)

    // Processar reembolso
    await supabase.rpc("update_user_balance", {
      user_uuid: user.id,
      transaction_type: "refund",
      amount_change: order.charge,
      description_text: `Reembolso do pedido cancelado #${order.id.slice(0, 8)}`,
      related_order_id: order.id,
    })

    revalidatePath("/dashboard/orders")
    revalidatePath("/dashboard/balance")
    
    return { success: true, message: "Pedido cancelado via API e reembolsado" }
  } catch (error) {
    return { error: `Erro ao cancelar: ${error}` }
  }
}

/**
 * Mapear status do provedor para nosso sistema
 */
function mapProviderStatus(providerStatus: string): string {
  const statusMap: Record<string, string> = {
    'Pending': 'pending',
    'In progress': 'in_progress',
    'Processing': 'processing',
    'Completed': 'completed',
    'Partial': 'partial',
    'Canceled': 'canceled',
    'Cancelled': 'canceled',
    'Error': 'error',
    'Refunded': 'refunded'
  }

  return statusMap[providerStatus] || 'processing'
}

/**
 * Obter estatísticas de sincronização
 */
export async function getSyncStats() {
  const supabase = await createClient()

  try {
    // Pedidos pendentes de sincronização
    const { count: pendingSync } = await supabase
      .from("orders")
      .select("*", { count: 'exact', head: true })
      .in("status", ["pending", "processing", "in_progress"])
      .not("provider_order_id", "is", null)

    // Pedidos com erro
    const { count: errorOrders } = await supabase
      .from("orders")
      .select("*", { count: 'exact', head: true })
      .eq("status", "error")

    // Última sincronização
    const { data: lastSync } = await supabase
      .from("orders")
      .select("last_status_check")
      .not("last_status_check", "is", null)
      .order("last_status_check", { ascending: false })
      .limit(1)
      .single()

    return {
      success: true,
      stats: {
        pendingSync: pendingSync || 0,
        errorOrders: errorOrders || 0,
        lastSync: lastSync?.last_status_check
      }
    }
  } catch (error) {
    return { error: `Erro ao obter estatísticas: ${error}` }
  }
} 