"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  LayoutDashboard,
  ShoppingCart,
  DollarSign,
  Clock,
  User,
  Settings,
  LogOut,
  Menu,
  X,
  Zap,
  Shield,
} from "lucide-react"
import { signOut } from "@/lib/actions"

const navigation = [
  { name: "Painel", href: "/dashboard", icon: LayoutDashboard },
  { name: "Serviços", href: "/dashboard/services", icon: ShoppingCart },
  { name: "Pedidos", href: "/dashboard/orders", icon: Clock },
  { name: "Saldo", href: "/dashboard/balance", icon: DollarSign },
  { name: "Perfil", href: "/dashboard/profile", icon: User },
]

export default function DashboardSidebar() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const pathname = usePathname()

  return (
    <>
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)} />
          <div className="fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-gray-900 shadow-xl">
            <SidebarContent pathname={pathname} onClose={() => setSidebarOpen(false)} />
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-64 lg:flex-col">
        <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800">
          <SidebarContent pathname={pathname} />
        </div>
      </div>

      {/* Mobile menu button */}
      <div className="lg:hidden">
        <Button variant="ghost" size="sm" className="fixed top-4 left-4 z-40" onClick={() => setSidebarOpen(true)}>
          <Menu className="h-6 w-6" />
        </Button>
      </div>
    </>
  )
}

function SidebarContent({ pathname, onClose }: { pathname: string; onClose?: () => void }) {
  return (
    <>
      {/* Logo */}
      <div className="flex h-16 shrink-0 items-center px-6 border-b border-gray-200 dark:border-gray-800">
        <div className="flex items-center space-x-2">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
            <Zap className="h-5 w-5 text-white" />
          </div>
          <span className="text-xl font-bold">Painel SMM Pro</span>
        </div>
        {onClose && (
          <Button variant="ghost" size="sm" className="ml-auto lg:hidden" onClick={onClose}>
            <X className="h-6 w-6" />
          </Button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex flex-1 flex-col px-6 py-4">
        <ul role="list" className="flex flex-1 flex-col gap-y-7">
          <li>
            <ul role="list" className="-mx-2 space-y-1">
              {navigation.map((item) => (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    onClick={onClose}
                    className={cn(
                      pathname === item.href
                        ? "bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400"
                        : "text-gray-700 hover:text-blue-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:text-blue-400 dark:hover:bg-gray-800",
                      "group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold transition-colors",
                    )}
                  >
                    <item.icon
                      className={cn(
                        pathname === item.href
                          ? "text-blue-700 dark:text-blue-400"
                          : "text-gray-400 group-hover:text-blue-700 dark:group-hover:text-blue-400",
                        "h-6 w-6 shrink-0",
                      )}
                    />
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </li>

          {/* Admin Section (if user is admin) */}
          <li>
            <div className="text-xs font-semibold leading-6 text-gray-400 dark:text-gray-500">Administração</div>
            <ul role="list" className="-mx-2 mt-2 space-y-1">
              <li>
                <Link
                  href="/dashboard/admin"
                  onClick={onClose}
                  className={cn(
                    pathname.startsWith("/dashboard/admin")
                      ? "bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400"
                      : "text-gray-700 hover:text-blue-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:text-blue-400 dark:hover:bg-gray-800",
                    "group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold transition-colors",
                  )}
                >
                  <Shield className="h-6 w-6 shrink-0 text-gray-400 group-hover:text-blue-700 dark:group-hover:text-blue-400" />
                  Painel Admin
                </Link>
              </li>
            </ul>
          </li>

          {/* Settings and Logout */}
          <li className="mt-auto">
            <ul role="list" className="-mx-2 space-y-1">
              <li>
                <Link
                  href="/dashboard/settings"
                  onClick={onClose}
                  className="text-gray-700 hover:text-blue-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:text-blue-400 dark:hover:bg-gray-800 group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold transition-colors"
                >
                  <Settings className="h-6 w-6 shrink-0 text-gray-400 group-hover:text-blue-700 dark:group-hover:text-blue-400" />
                  Configurações
                </Link>
              </li>
              <li>
                <form action={signOut}>
                  <button
                    type="submit"
                    className="w-full text-gray-700 hover:text-red-700 hover:bg-red-50 dark:text-gray-300 dark:hover:text-red-400 dark:hover:bg-red-900/20 group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold transition-colors"
                  >
                    <LogOut className="h-6 w-6 shrink-0 text-gray-400 group-hover:text-red-700 dark:group-hover:text-red-400" />
                    Sair
                  </button>
                </form>
              </li>
            </ul>
          </li>
        </ul>
      </nav>
    </>
  )
}
