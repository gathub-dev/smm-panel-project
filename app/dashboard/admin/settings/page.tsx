import { createClient } from "@/lib/supabase/server"
import { checkIsAdmin } from "@/lib/admin-actions"
import { redirect } from "next/navigation"
import { AdminNavigation } from "@/components/admin-navigation"
import { AdminSettingsPanel } from "@/components/admin-settings-panel"

export default async function AdminSettingsPage() {
  const isAdmin = await checkIsAdmin()

  if (!isAdmin) {
    redirect("/dashboard")
  }

  return (
    <div className="space-y-6">
      <AdminNavigation />
      
      <AdminSettingsPanel />
    </div>
  )
}
