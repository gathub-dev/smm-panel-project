"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function promoteUserToAdmin(email: string) {
  const supabase = await createClient()

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
  const supabase = await createClient()

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
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return false
  
  // A verificação de admin deve ser feita apenas através do Supabase
  if (user.user_metadata?.role === "admin") { 
    console.log("Admin verificado via user_metadata")
    return true
  }
  
  try {
    const { data: userData } = await supabase.from("users").select("role").eq("id", user.id).single()
    if (userData?.role === "admin") {
      console.log("Admin verificado via tabela users")
      return true
    }
  } catch (error) {
    console.log("Erro ao verificar role na tabela users:", error)
  }
  
  return false
}
