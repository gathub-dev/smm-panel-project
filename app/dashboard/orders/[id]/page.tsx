import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Progress } from "@/components/ui/progress"
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
  ExternalLink,
  ArrowLeft,
} from "lucide-react"
import Link from "next/link"
import { notFound } from "next/navigation"

const categoryIcons = {
  instagram: Instagram,
  facebook: Facebook,
  twitter: Twitter,
  youtube: Youtube,
  tiktok: Music,
  linkedin: Linkedin,
}

const statusConfig = {
  pending: { color: "bg-yellow-500", icon: Clock, label: "Pending", description: "Order is waiting to be processed" },
  in_progress: {
    color: "bg-blue-500",
    icon: AlertCircle,
    label: "In Progress",
    description: "Order is currently being processed",
  },
  processing: {
    color: "bg-blue-500",
    icon: AlertCircle,
    label: "Processing",
    description: "Order is being delivered",
  },
  completed: {
    color: "bg-green-500",
    icon: CheckCircle,
    label: "Completed",
    description: "Order has been successfully completed",
  },
  partial: {
    color: "bg-orange-500",
    icon: AlertCircle,
    label: "Partial",
    description: "Order was partially completed",
  },
  canceled: { color: "bg-red-500", icon: XCircle, label: "Cancelled", description: "Order was cancelled" },
}

export default async function OrderDetailPage({ params }: { params: { id: string } }) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return notFound()

  // Get order details
  const { data: order, error } = await supabase
    .from("orders")
    .select(`
      *,
      services (
        *,
        categories (
          name,
          icon
        )
      )
    `)
    .eq("id", params.id)
    .eq("user_id", user.id)
    .single()

  if (error || !order) {
    return notFound()
  }

  const IconComponent = categoryIcons[order.services.categories.icon as keyof typeof categoryIcons] || Instagram
  const statusInfo = statusConfig[order.status as keyof typeof statusConfig] || statusConfig.pending

  const progress = order.quantity > 0 ? ((order.quantity - order.remains) / order.quantity) * 100 : 0
  const delivered = order.quantity - order.remains

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Link href="/dashboard/orders">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Orders
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Order Details</h1>
          <p className="text-muted-foreground">Order #{order.id.slice(0, 8)}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Order Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <statusInfo.icon className="h-5 w-5" />
              <span>Order Status</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${statusInfo.color}`} />
              <span className="font-semibold">{statusInfo.label}</span>
            </div>
            <p className="text-sm text-muted-foreground">{statusInfo.description}</p>

            {order.status !== "canceled" && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Progress</span>
                  <span>{progress.toFixed(1)}%</span>
                </div>
                <Progress value={progress} className="h-3" />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Delivered: {delivered.toLocaleString()}</span>
                  <span>Remaining: {order.remains.toLocaleString()}</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Service Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <IconComponent className="h-5 w-5" />
              <span>Service Details</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="font-semibold">{order.services.name}</p>
              <p className="text-sm text-muted-foreground">{order.services.categories.name}</p>
            </div>
            <Separator />
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Service Type:</span>
                <Badge variant="outline">{order.services.type}</Badge>
              </div>
              <div className="flex justify-between text-sm">
                <span>Provider:</span>
                <span className="font-medium">{order.services.provider.toUpperCase()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Rate per 1000:</span>
                <span className="font-medium">${order.services.rate}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Order Information */}
        <Card>
          <CardHeader>
            <CardTitle>Order Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Order ID:</span>
                <span className="font-mono">{order.id.slice(0, 8)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Created:</span>
                <span>{new Date(order.created_at).toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Quantity:</span>
                <span className="font-semibold">{order.quantity.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Start Count:</span>
                <span>{order.start_count.toLocaleString()}</span>
              </div>
            </div>
            <Separator />
            <div className="flex justify-between font-semibold">
              <span>Total Cost:</span>
              <span>${order.charge.toFixed(4)}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Target Link */}
      <Card>
        <CardHeader>
          <CardTitle>Target Link</CardTitle>
          <CardDescription>The link where the service is being delivered</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
            <span className="font-mono text-sm truncate flex-1 mr-4">{order.link}</span>
            <Button variant="outline" size="sm" asChild>
              <a href={order.link} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4 mr-2" />
                Visit
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
