"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BarChart3, Users, RefreshCw, Settings, Database, TrendingUp, Eye, Package } from "lucide-react"

interface AdminNavigationProps {
  activeTab?: string
  onTabChange?: (tab: string) => void
}

export function AdminNavigation({ activeTab, onTabChange }: AdminNavigationProps) {
  const pathname = usePathname()

  const navItems = [
    {
      href: "/dashboard/admin",
      label: "Dashboard",
      icon: BarChart3,
      description: "Visão geral do sistema"
    },
    {
      href: "/dashboard/admin/users",
      label: "Usuários",
      icon: Users,
      description: "Gerenciar usuários"
    },
    {
      href: "/dashboard/admin/sync",
      label: "Sincronização",
      icon: RefreshCw,
      description: "Sincronizar serviços"
    },
    {
      href: "/dashboard/admin/settings",
      label: "Configurações",
      icon: Settings,
      description: "Configurações do sistema"
    }
  ]

  const isActive = (href: string) => {
    if (href === "/dashboard/admin") {
      return pathname === href
    }
    return pathname.startsWith(href)
  }

  return (
    <div className="space-y-6">
      {/* Header do Painel */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Settings className="h-8 w-8" />
            Painel Administrativo
          </h1>
          <p className="text-muted-foreground mt-1">
            Gerencie todos os aspectos da sua plataforma SMM
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <TrendingUp className="h-4 w-4 mr-2" />
            Teste Debug
          </Button>
          <Button variant="outline" size="sm">
            <Database className="h-4 w-4 mr-2" />
            API Keys
          </Button>
          <Button size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Sincronizar Serviços
          </Button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b">
        {pathname === "/dashboard/admin" && activeTab && onTabChange ? (
          // Tabs internas para página principal do admin
          <Tabs value={activeTab} onValueChange={onTabChange}>
            <TabsList className="h-auto p-0 bg-transparent">
              <TabsTrigger value="overview" className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Visão Geral
              </TabsTrigger>
              <TabsTrigger value="services" className="flex items-center gap-2">
                <Package className="h-4 w-4" />
                Serviços
              </TabsTrigger>
              <TabsTrigger value="lp-control" className="flex items-center gap-2">
                <Eye className="h-4 w-4" />
                Controle LP
              </TabsTrigger>
              <TabsTrigger value="settings" className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Configurações
              </TabsTrigger>
            </TabsList>
          </Tabs>
        ) : (
          // Navigation normal para outras páginas
          <nav className="flex space-x-8">
            {navItems.map((item) => {
              const Icon = item.icon
              const active = isActive(item.href)
              
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`
                    flex items-center gap-2 pb-4 border-b-2 transition-colors
                    ${active 
                      ? 'border-primary text-primary font-medium' 
                      : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground'
                    }
                  `}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              )
            })}
          </nav>
        )}
      </div>
    </div>
  )
}
