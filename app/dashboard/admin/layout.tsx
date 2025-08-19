import type React from "react"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Shield } from "lucide-react"
import { checkIsAdmin } from "@/lib/admin-actions"

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

  // Usar a mesma função robusta de verificação admin
  const isAdmin = await checkIsAdmin()

  if (!isAdmin) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Acesso Negado</h2>
            <p className="text-muted-foreground">Você não tem permissão para acessar o painel administrativo.</p>
            <div className="mt-4 text-sm text-muted-foreground">
              <p>User ID: {user.id}</p>
              <p>Email: {user.email}</p>
              <p>Admin check: {isAdmin ? "Sim" : "Não"}</p>
              <p>Verificação: Usando função checkIsAdmin()</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return <>{children}</>
}
