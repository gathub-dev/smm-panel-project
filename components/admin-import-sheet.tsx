"use client"

import { useState } from "react"
import { AdminImportPreview } from "@/components/admin-import-preview"

interface AdminImportSheetProps {
  children: React.ReactNode
}

export function AdminImportSheet({ children }: AdminImportSheetProps) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <div onClick={() => setOpen(true)}>
        {children}
      </div>
      <AdminImportPreview open={open} onOpenChange={setOpen} />
    </>
  )
}
