import { createClient } from "@/lib/supabase/server"
import { checkIsAdmin } from "@/lib/admin-actions"
import { redirect } from "next/navigation"
import { AdminSyncPanel } from "@/components/admin-sync-panel"
import { AdminNavigation } from "@/components/admin-navigation"

export default async function AdminSyncPage() {
  const isAdmin = await checkIsAdmin()

  if (!isAdmin) {
    redirect("/dashboard")
  }

  return (
    <div className="space-y-6">
      <AdminNavigation />
      
      <AdminSyncPanel />
    </div>
  )
}
