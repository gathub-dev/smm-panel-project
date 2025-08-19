import type React from "react"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Shield } from "lucide-react"

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // SOLUÇÃO SIMPLES: Verificar se o usuário é admin pelo email
  // Isso evita problemas com RLS e recursão infinita
  const adminEmails = [
    "lhost2025@gmail.com",
    // Adicione outros emails de admin aqui se necessário
  ]
  
  const isAdmin = adminEmails.includes(user.email || "")

  if (!isAdmin) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
            <p className="text-muted-foreground">You don't have permission to access the admin panel.</p>
            <div className="mt-4 text-sm text-muted-foreground">
              <p>User ID: {user.id}</p>
              <p>Email: {user.email}</p>
              <p>Admin check: {isAdmin ? "Yes" : "No"}</p>
              <p>Admin emails: {adminEmails.join(", ")}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return <>{children}</>
}
