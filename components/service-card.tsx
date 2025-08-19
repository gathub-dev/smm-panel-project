"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Instagram, Facebook, Twitter, Youtube, Music, Linkedin, ShoppingCart, Info } from "lucide-react"
import OrderModal from "@/components/order-modal"

interface ServiceCardProps {
  service: {
    id: string
    name: string
    description: string
    rate: number
    min_quantity: number
    max_quantity: number
    type: string
    provider: string
    dripfeed: boolean
    refill: boolean
    cancel: boolean
    categories: {
      id: string
      name: string
      icon: string
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

export default function ServiceCard({ service }: ServiceCardProps) {
  const [showOrderModal, setShowOrderModal] = useState(false)
  const IconComponent = categoryIcons[service.categories.icon as keyof typeof categoryIcons] || Instagram

  const calculatePrice = (quantity: number) => {
    return ((quantity * service.rate) / 1000).toFixed(4)
  }

  return (
    <>
      <Card className="hover:shadow-lg transition-shadow">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-2">
              <div className="p-2 rounded-lg bg-muted">
                <IconComponent className="h-4 w-4" />
              </div>
              <div>
                <CardTitle className="text-sm font-medium leading-tight">{service.name}</CardTitle>
                <CardDescription className="text-xs">{service.categories.name}</CardDescription>
              </div>
            </div>
            <Badge variant="outline" className="text-xs">
              {service.provider.toUpperCase()}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground line-clamp-2">{service.description}</p>

          {/* Pricing */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Rate per 1000:</span>
              <span className="font-semibold">${service.rate}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Min/Max:</span>
              <span className="font-medium">
                {service.min_quantity.toLocaleString()} - {service.max_quantity.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Features */}
          <div className="flex flex-wrap gap-1">
            {service.dripfeed && (
              <Badge variant="secondary" className="text-xs">
                Dripfeed
              </Badge>
            )}
            {service.refill && (
              <Badge variant="secondary" className="text-xs">
                Refill
              </Badge>
            )}
            {service.cancel && (
              <Badge variant="secondary" className="text-xs">
                Cancel
              </Badge>
            )}
            <Badge variant="outline" className="text-xs">
              {service.type}
            </Badge>
          </div>

          {/* Example Pricing */}
          <div className="bg-muted/50 rounded-lg p-3 space-y-1">
            <div className="text-xs text-muted-foreground">Example pricing:</div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>1,000 = ${calculatePrice(1000)}</div>
              <div>5,000 = ${calculatePrice(5000)}</div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex space-x-2">
            <Button onClick={() => setShowOrderModal(true)} className="flex-1" size="sm">
              <ShoppingCart className="h-4 w-4 mr-2" />
              Order Now
            </Button>
            <Button variant="outline" size="sm">
              <Info className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      <OrderModal service={service} isOpen={showOrderModal} onClose={() => setShowOrderModal(false)} />
    </>
  )
}
