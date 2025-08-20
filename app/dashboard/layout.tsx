import type React from "react"
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import DashboardSidebar from "@/components/dashboard-sidebar"
import DashboardHeader from "@/components/dashboard-header"
import { checkIsAdmin } from "@/lib/admin-actions"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // If Supabase is not configured, redirect to home
  if (!isSupabaseConfigured) {
    redirect("/")
  }

  // Check if user is authenticated
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // If no user, redirect to login
  if (!user) {
    redirect("/auth/login")
  }

  // SOLUÇÃO TEMPORÁRIA: Criar perfil mock para evitar problema de RLS
  // Verificar se é admin pelo email (evita problema de recursão RLS)
  const isAdmin = await checkIsAdmin()
  const profile = {
    id: user.id,
    email: user.email,
    full_name: user.user_metadata?.full_name || "",
    role: isAdmin ? "admin" : "user",
    status: "active",
    balance: 0,
    created_at: user.created_at
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <DashboardSidebar />
      <div className="lg:pl-64">
        <DashboardHeader user={user} profile={profile} />
        <main className="py-6">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">{children}</div>
        </main>
      </div>
    </div>
  )
}
