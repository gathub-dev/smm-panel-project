import { createClient } from "@/lib/supabase/server"
import { checkIsAdmin } from "@/lib/admin-actions"
import { redirect } from "next/navigation"
import { AdminUserManagement } from "@/components/admin-user-management"
import { AdminNavigation } from "@/components/admin-navigation"

export default async function AdminUsersPage() {
  const isAdmin = await checkIsAdmin()

  if (!isAdmin) {
    redirect("/dashboard")
  }

  const supabase = createClient()

  const { data: users } = await supabase
    .from("users")
    .select("id, email, full_name, role, status, created_at")
    .order("created_at", { ascending: false })

  return (
    <div className="space-y-6">
      <AdminNavigation />
      
      <AdminUserManagement users={users || []} />
    </div>
  )
}
