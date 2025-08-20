"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function addFunds(prevState: any, formData: FormData) {
  const supabase = await createClient()

  try {
    // Get current users
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return { error: "Authentication required" }
    }

    // Extract form data
    const amount = Number.parseFloat(formData.get("amount") as string)
    const paymentMethod = formData.get("paymentMethod") as string

    if (!amount || amount < 5 || amount > 1000) {
      return { error: "Amount must be between $5.00 and $1,000.00" }
    }

    if (!paymentMethod) {
      return { error: "Payment method is required" }
    }

    // TODO: Process payment with actual payment provider
    // This is where you would integrate with Stripe, PayPal, etc.
    // For now, we'll simulate a successful payment

    // Simulate payment processing delay
    await new Promise((resolve) => setTimeout(resolve, 1000))

    // Add funds to user balance using the stored function
    const { error: balanceError } = await supabase.rpc("update_user_balance", {
      user_uuid: user.id,
      transaction_type: "deposit",
      amount_change: amount,
      description_text: `Deposit via ${paymentMethod} - $${amount.toFixed(2)}`,
      related_order_id: null,
    })

    if (balanceError) {
      return { error: "Failed to process deposit" }
    }

    // Get the transaction ID for confirmation
    const { data: transaction } = await supabase
      .from("transactions")
      .select("id")
      .eq("user_id", user.id)
      .eq("type", "deposit")
      .eq("amount", amount)
      .order("created_at", { ascending: false })
      .limit(1)
      .single()

    revalidatePath("/dashboard")
    revalidatePath("/dashboard/balance")
    revalidatePath("/dashboard/balance/history")

    return { success: true, transactionId: transaction?.id }
  } catch (error) {
    return { error: "An unexpected error occurred" }
  }
}

export async function processRefund(orderId: string, amount: number, reason: string) {
  const supabase = await createClient()

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { error: "Authentication required" }
    }

    // Add refund to user balance
    const { error: balanceError } = await supabase.rpc("update_user_balance", {
      user_uuid: user.id,
      transaction_type: "refund",
      amount_change: amount,
      description_text: `Refund: ${reason}`,
      related_order_id: orderId,
    })

    if (balanceError) {
      return { error: "Failed to process refund" }
    }

    revalidatePath("/dashboard/balance")
    revalidatePath("/dashboard/balance/history")

    return { success: true }
  } catch (error) {
    return { error: "An unexpected error occurred" }
  }
}
