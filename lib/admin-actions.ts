"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function promoteUserToAdmin(email: string) {
  const supabase = createClient()

  try {
    const { data, error } = await supabase.rpc("promote_user_to_admin", {
      user_email: email,
    })

    if (error) throw error

    revalidatePath("/dashboard/admin")
    return { success: true, message: "Usuário promovido a administrador com sucesso!" }
  } catch (error: any) {
    return { success: false, message: error.message }
  }
}

export async function demoteAdminToUser(email: string) {
  const supabase = createClient()

  try {
    const { data, error } = await supabase.rpc("demote_admin_to_user", {
      user_email: email,
    })

    if (error) throw error

    revalidatePath("/dashboard/admin")
    return { success: true, message: "Privilégios de administrador removidos com sucesso!" }
  } catch (error: any) {
    return { success: false, message: error.message } 
  }
}

export async function checkIsAdmin() {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return false
  
  // Primeiro, verificar no user_metadata (mais confiável para autenticação do Supabase)
  if (user.user_metadata?.role === "admin") { 
    return true
  }
  
  // Como fallback, verificar na tabela users
  try {
    const { data: userData } = await supabase.from("users").select("role").eq("id", user.id).single()
    return userData?.role === "admin"
  } catch (error) {
    console.log("Erro ao verificar role na tabela users:", error)
    return false
  }
}
