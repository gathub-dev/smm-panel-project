"use client"

import { useState } from "react"
import { useActionState } from "react"
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Calculator, AlertCircle, ShoppingCart, CheckCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { createOrder } from "@/lib/order-actions"

interface OrderModalProps {
  service: {
    id: string
    name: string
    description: string
    rate: number
    min_quantity: number
    max_quantity: number
    type: string
    categories: {
      name: string
    }
  }
  isOpen: boolean
  onClose: () => void
}

export default function OrderModal({ service, isOpen, onClose }: OrderModalProps) {
  const [link, setLink] = useState("")
  const [quantity, setQuantity] = useState(service.min_quantity.toString())
  const [comments, setComments] = useState("")
  const [state, formAction] = useActionState(createOrder, null)

  const quantityNum = Number.parseInt(quantity) || 0
  const totalCost = ((quantityNum * service.rate) / 1000).toFixed(4)

  const isValidQuantity = quantityNum >= service.min_quantity && quantityNum <= service.max_quantity

  // Reset form when modal closes
  const handleClose = () => {
    setLink("")
    setQuantity(service.min_quantity.toString())
    setComments("")
    onClose()
  }

  // Handle successful order
  if (state?.success) {
    return (
      <Sheet open={isOpen} onOpenChange={handleClose}>
        <SheetContent className="sm:max-w-md">
          <SheetHeader>
            <SheetTitle className="flex items-center space-x-2 text-green-600">
              <CheckCircle className="h-5 w-5" />
              <span>Pedido Realizado com Sucesso!</span>
            </SheetTitle>
            <SheetDescription>Seu pedido foi enviado e está sendo processado.</SheetDescription>
          </SheetHeader>

          <div className="bg-green-50 border border-green-200 rounded-lg p-4 space-y-2 mt-4">
            <div className="flex justify-between text-sm">
              <span>ID do Pedido:</span>
              <span className="font-mono">#{state.orderId.slice(0, 8)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Serviço:</span>
              <span>{service.name}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Quantidade:</span>
              <span>{quantityNum.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm font-semibold">
              <span>Custo Total:</span>
              <span>R$ {totalCost}</span>
            </div>
          </div>

          <SheetFooter className="mt-6">
            <Button onClick={handleClose} className="w-full">
              Fechar
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    )
  }

  return (
    <Sheet open={isOpen} onOpenChange={handleClose}>
      <SheetContent className="sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center space-x-2">
            <ShoppingCart className="h-5 w-5" />
            <span>Fazer Pedido</span>
          </SheetTitle>
          <SheetDescription>
            Pedir {service.name} de {service.categories.name}
          </SheetDescription>
        </SheetHeader>

        <form action={formAction} className="space-y-4 mt-4">
          {/* Hidden service ID */}
          <input type="hidden" name="serviceId" value={service.id} />

          {/* Service Info */}
          <div className="bg-muted/50 rounded-lg p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">{service.name}</span>
              <Badge variant="outline">{service.type}</Badge>
            </div>
            <div className="text-xs text-muted-foreground">{service.description}</div>
            <div className="flex items-center justify-between text-sm">
              <span>Taxa por 1000:</span>
              <span className="font-semibold">R$ {service.rate}</span>
            </div>
          </div>

          {/* Error Display */}
          {state?.error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{state.error}</AlertDescription>
            </Alert>
          )}

          {/* Link Input */}
          <div className="space-y-2">
            <Label htmlFor="link">Link *</Label>
            <Input
              id="link"
              name="link"
              type="url"
              placeholder="https://instagram.com/usuario"
              value={link}
              onChange={(e) => setLink(e.target.value)}
              required
            />
          </div>

          {/* Quantity Input */}
          <div className="space-y-2">
            <Label htmlFor="quantity">Quantidade *</Label>
            <Input
              id="quantity"
              name="quantity"
              type="number"
              min={service.min_quantity}
              max={service.max_quantity}
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              required
            />
            <div className="text-xs text-muted-foreground">
              Mín: {service.min_quantity.toLocaleString()} - Máx: {service.max_quantity.toLocaleString()}
            </div>
            {!isValidQuantity && quantityNum > 0 && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  A quantidade deve estar entre {service.min_quantity.toLocaleString()} e{" "}
                  {service.max_quantity.toLocaleString()}
                </AlertDescription>
              </Alert>
            )}
          </div>

          {/* Comments (for specific service types) */}
          {(service.type.includes("comments") || service.type.includes("custom")) && (
            <div className="space-y-2">
              <Label htmlFor="comments">Comentários</Label>
              <Textarea
                id="comments"
                name="comments"
                placeholder="Digite os comentários (um por linha)"
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                rows={3}
              />
              <div className="text-xs text-muted-foreground">
                Para serviços de comentários personalizados, digite um comentário por linha
              </div>
            </div>
          )}

          <Separator />

          {/* Order Summary */}
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Calculator className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">Resumo do Pedido</span>
            </div>
            <div className="bg-muted/50 rounded-lg p-3 space-y-2">
              <div className="flex justify-between text-sm">
                <span>Serviço:</span>
                <span>{service.name}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Quantidade:</span>
                <span>{quantityNum.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Taxa:</span>
                <span>R$ {service.rate} por 1000</span>
              </div>
              <Separator />
              <div className="flex justify-between font-semibold">
                <span>Custo Total:</span>
                <span>R$ {totalCost}</span>
              </div>
            </div>
          </div>

          <SheetFooter className="flex space-x-2 mt-6">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={!link || !isValidQuantity} className="flex-1">
              Fazer Pedido - R$ {totalCost}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  )
}
