"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { promoteUserToAdmin, demoteAdminToUser } from "@/lib/admin-actions"
import { toast } from "sonner"
import { Shield, ShieldCheck, UserMinus, UserPlus } from "lucide-react"

interface User {
  id: string
  email: string
  full_name: string | null
  role: string
  status: string
  created_at: string
}

interface AdminUserManagementProps {
  users: User[]
}

export function AdminUserManagement({ users }: AdminUserManagementProps) {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)

  const handlePromoteUser = async () => {
    if (!email.trim()) {
      toast.error("Digite um email válido")
      return
    }

    setLoading(true)
    try {
      const result = await promoteUserToAdmin(email.trim())
      if (result.success) {
        toast.success(result.message)
        setEmail("")
      } else {
        toast.error(result.message)
      }
    } catch (error) {
      toast.error("Erro ao promover usuário")
    } finally {
      setLoading(false)
    }
  }

  const handleDemoteUser = async (userEmail: string) => {
    setLoading(true)
    try {
      const result = await demoteAdminToUser(userEmail)
      if (result.success) {
        toast.success(result.message)
      } else {
        toast.error(result.message)
      }
    } catch (error) {
      toast.error("Erro ao remover privilégios")
    } finally {
      setLoading(false)
    }
  }

  const admins = users.filter((user) => user.role === "admin")
  const regularUsers = users.filter((user) => user.role === "user")

  return (
    <div className="space-y-6">
      {/* Promover Usuário */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Promover Usuário a Admin
          </CardTitle>
          <CardDescription>Digite o email do usuário que deseja promover a administrador</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email do Usuário</Label>
            <Input
              id="email"
              type="email"
              placeholder="usuario@exemplo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <Button onClick={handlePromoteUser} disabled={loading || !email.trim()} className="w-full">
            <Shield className="h-4 w-4 mr-2" />
            Promover a Administrador
          </Button>
        </CardContent>
      </Card>

      {/* Lista de Administradores */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5" />
            Administradores ({admins.length})
          </CardTitle>
          <CardDescription>Lista de todos os administradores do sistema</CardDescription>
        </CardHeader>
        <CardContent>
          {admins.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">Nenhum administrador encontrado</p>
          ) : (
            <div className="space-y-3">
              {admins.map((admin) => (
                <div key={admin.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{admin.full_name || "Sem nome"}</p>
                      <Badge variant="secondary">
                        <Shield className="h-3 w-3 mr-1" />
                        Admin
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{admin.email}</p>
                    <p className="text-xs text-muted-foreground">
                      Criado em: {new Date(admin.created_at).toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDemoteUser(admin.email)}
                    disabled={loading || admins.length <= 1}
                  >
                    <UserMinus className="h-4 w-4 mr-2" />
                    Remover Admin
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Lista de Usuários Regulares */}
      <Card>
        <CardHeader>
          <CardTitle>Usuários Regulares ({regularUsers.length})</CardTitle>
          <CardDescription>Lista de usuários que podem ser promovidos a administradores</CardDescription>
        </CardHeader>
        <CardContent>
          {regularUsers.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">Nenhum usuário regular encontrado</p>
          ) : (
            <div className="space-y-3">
              {regularUsers.slice(0, 10).map((user) => (
                <div key={user.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{user.full_name || "Sem nome"}</p>
                      <Badge variant="outline">Usuário</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{user.email}</p>
                    <p className="text-xs text-muted-foreground">
                      Criado em: {new Date(user.created_at).toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setEmail(user.email)
                      handlePromoteUser()
                    }}
                    disabled={loading}
                  >
                    <Shield className="h-4 w-4 mr-2" />
                    Promover
                  </Button>
                </div>
              ))}
              {regularUsers.length > 10 && (
                <p className="text-sm text-muted-foreground text-center">
                  E mais {regularUsers.length - 10} usuários...
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
