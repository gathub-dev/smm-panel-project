"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import {
  Instagram,
  Facebook,
  Twitter,
  Youtube,
  Music,
  Linkedin,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  MoreHorizontal,
  ExternalLink,
  RefreshCw,
  X,
} from "lucide-react"
import { cancelOrder } from "@/lib/order-actions"

interface OrderCardProps {
  order: {
    id: string
    link: string
    quantity: number
    start_count: number
    remains: number
    charge: number
    status: string
    created_at: string
    services: {
      id: string
      name: string
      categories: {
        name: string
        icon: string
      }
    }
  }
}

const categoryIcons = {
  instagram: Instagram,
  facebook: Facebook,
  twitter: Twitter,
  youtube: Youtube,
  tiktok: Music,
  linkedin: Linkedin,
}

const statusConfig = {
  pending: { color: "bg-yellow-500", icon: Clock, label: "Pending" },
  in_progress: { color: "bg-blue-500", icon: RefreshCw, label: "In Progress" },
  processing: { color: "bg-blue-500", icon: RefreshCw, label: "Processing" },
  completed: { color: "bg-green-500", icon: CheckCircle, label: "Completed" },
  partial: { color: "bg-orange-500", icon: AlertCircle, label: "Partial" },
  canceled: { color: "bg-red-500", icon: XCircle, label: "Cancelled" },
}

export default function OrderCard({ order }: OrderCardProps) {
  const [loading, setLoading] = useState(false)
  const IconComponent = categoryIcons[order.services.categories.icon as keyof typeof categoryIcons] || Instagram
  const statusInfo = statusConfig[order.status as keyof typeof statusConfig] || statusConfig.pending

  const progress = order.quantity > 0 ? ((order.quantity - order.remains) / order.quantity) * 100 : 0
  const delivered = order.quantity - order.remains

  const handleCancelOrder = async () => {
    if (!confirm("Are you sure you want to cancel this order?")) return

    setLoading(true)
    try {
      const result = await cancelOrder(order.id)
      if (result.error) {
        alert(result.error)
      }
    } catch (error) {
      console.error("Cancel order error:", error)
      alert("Failed to cancel order")
    } finally {
      setLoading(false)
    }
  }

  const canCancel = ["pending", "in_progress"].includes(order.status)

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-muted">
              <IconComponent className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-semibold text-sm">{order.services.name}</h3>
              <p className="text-xs text-muted-foreground">Order #{order.id.slice(0, 8)}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant="outline" className="flex items-center space-x-1">
              <div className={`w-2 h-2 rounded-full ${statusInfo.color}`} />
              <span>{statusInfo.label}</span>
            </Badge>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <a href={order.link} target="_blank" rel="noopener noreferrer" className="flex items-center">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    View Link
                  </a>
                </DropdownMenuItem>
                {canCancel && (
                  <DropdownMenuItem onClick={handleCancelOrder} disabled={loading} className="text-red-600">
                    <X className="h-4 w-4 mr-2" />
                    {loading ? "Cancelling..." : "Cancel Order"}
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <div>
            <p className="text-xs text-muted-foreground">Quantity</p>
            <p className="font-semibold">{order.quantity.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Delivered</p>
            <p className="font-semibold">{delivered.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Remaining</p>
            <p className="font-semibold">{order.remains.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Cost</p>
            <p className="font-semibold">${order.charge.toFixed(4)}</p>
          </div>
        </div>

        {/* Progress Bar */}
        {order.status !== "canceled" && (
          <div className="mb-4">
            <div className="flex justify-between text-xs text-muted-foreground mb-1">
              <span>Progress</span>
              <span>{progress.toFixed(1)}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        )}

        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Created: {new Date(order.created_at).toLocaleDateString()}</span>
          <span className="truncate max-w-xs">{order.link}</span>
        </div>
      </CardContent>
    </Card>
  )
}
