"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function createOrder(prevState: any, formData: FormData) {
  const supabase = await createClient()
  try {
    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return { error: "Authentication required" }
    }

    // Extract form data
    const serviceId = formData.get("serviceId") as string
    const link = formData.get("link") as string
    const quantity = Number.parseInt(formData.get("quantity") as string)
    const comments = formData.get("comments") as string

    if (!serviceId || !link || !quantity) {
      return { error: "Missing required fields" }
    }

    // Get service details
    const { data: service, error: serviceError } = await supabase
      .from("services")
      .select("*")
      .eq("id", serviceId)
      .single()

    if (serviceError || !service) {
      return { error: "Service not found" }
    }

    // Validate quantity
    if (quantity < service.min_quantity || quantity > service.max_quantity) {
      return { error: `Quantity must be between ${service.min_quantity} and ${service.max_quantity}` }
    }

    // Calculate charge
    const charge = (quantity * service.rate) / 1000

    // Get user profile to check balance
    const { data: profile, error: profileError } = await supabase
      .from("users")
      .select("balance")
      .eq("id", user.id)
      .single()

    if (profileError || !profile) {
      return { error: "User profile not found" }
    }

    // Check if user has sufficient balance
    if (profile.balance < charge) {
      return {
        error: `Insufficient balance. Required: $${charge.toFixed(4)}, Available: $${profile.balance.toFixed(2)}`,
      }
    }

    // Create order
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        user_id: user.id,
        service_id: serviceId,
        link,
        quantity,
        charge,
        status: "pending",
      })
      .select()
      .single()

    if (orderError) {
      return { error: "Failed to create order" }
    }

    // Update user balance using the stored function
    const { error: balanceError } = await supabase.rpc("update_user_balance", {
      user_uuid: user.id,
      transaction_type: "order",
      amount_change: -charge,
      description_text: `Order #${order.id.slice(0, 8)} - ${service.name}`,
      related_order_id: order.id,
    })

    if (balanceError) {
      // If balance update fails, delete the order
      await supabase.from("orders").delete().eq("id", order.id)
      return { error: "Failed to process payment" }
    }

    // Enviar pedido para provedor externo
    try {
      // Obter chaves de API
      const { data: apiKeys } = await supabase
        .from("api_keys")
        .select("*")
        .eq("is_active", true)

      if (apiKeys && apiKeys.length > 0) {
        const mtpKey = apiKeys.find((key: any) => key.provider === 'mtp')?.api_key
        const japKey = apiKeys.find((key: any) => key.provider === 'jap')?.api_key

        if (service.provider && (mtpKey || japKey)) {
          const { APIManager } = await import("./providers/api-manager")
          const apiManager = new APIManager(mtpKey, japKey)

          const orderData = {
            service: parseInt(service.provider_service_id),
            link,
            quantity,
            ...(comments && { comments }),
            ...(service.type === 'custom_comments' && { comments }),
            ...(service.dripfeed && formData.get("runs") && { 
              runs: parseInt(formData.get("runs") as string),
              interval: parseInt(formData.get("interval") as string) || 60
            })
          }

          const result = await apiManager.createOrder(service.provider as 'mtp' | 'jap', orderData)
          
          if (result.success && result.orderId) {
            // Atualizar pedido com ID do provedor
            await supabase
              .from("orders")
              .update({
                provider_order_id: result.orderId.toString(),
                provider: service.provider,
                provider_cost: service.provider_rate * quantity / 1000,
                markup_percentage: service.markup_value,
                profit: charge - (service.provider_rate * quantity / 1000),
                status: "processing"
              })
              .eq("id", order.id)
          } else {
            // Se falhou, marcar como erro
            await supabase
              .from("orders")
              .update({
                status: "error",
                error_message: result.error || "Erro desconhecido"
              })
              .eq("id", order.id)
          }
        }
      }
    } catch (apiError) {
      // Marcar pedido como erro se API falhar
      await supabase
        .from("orders")
        .update({
          status: "error",
          error_message: `Erro na API: ${apiError}`
        })
        .eq("id", order.id)
    }

    revalidatePath("/dashboard")
    revalidatePath("/dashboard/orders")
    revalidatePath("/dashboard/balance")

    return { success: true, orderId: order.id }
  } catch (error) {   
    return { error: "An unexpected error occurred" }
  }
}

export async function cancelOrder(orderId: string) {
  const supabase = await createClient()

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { error: "Authentication required" }
    }

    // Get order details
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("*, services(*)")
      .eq("id", orderId)
      .eq("user_id", user.id)
      .single()

    if (orderError || !order) {
      return { error: "Order not found" }
    }

    // Check if order can be cancelled
    if (!["pending", "in_progress"].includes(order.status)) {
      return { error: "Order cannot be cancelled" }
    }

    if (!order.services.cancel) {
      return { error: "This service does not support cancellation" }
    }

    // Update order status
    const { error: updateError } = await supabase.from("orders").update({ status: "canceled" }).eq("id", orderId)

    if (updateError) {
      return { error: "Failed to cancel order" }
    }

    // Refund the amount
    const { error: refundError } = await supabase.rpc("update_user_balance", {
      user_uuid: user.id,
      transaction_type: "refund",
      amount_change: order.charge,
      description_text: `Refund for cancelled order #${order.id.slice(0, 8)}`,
      related_order_id: order.id,
    })

    if (refundError) {
        // Don't return error here as order is already cancelled
    }

    revalidatePath("/dashboard/orders")
    revalidatePath("/dashboard/balance")

    return { success: true }
  } catch (error) {
    return { error: "An unexpected error occurred" }
  }
}
