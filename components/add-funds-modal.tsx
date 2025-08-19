"use client"

import type React from "react"

import { useState } from "react"
import { useActionState } from "react"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Plus, CreditCard, Wallet, AlertCircle, CheckCircle, Smartphone } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { addFunds } from "@/lib/balance-actions"

interface AddFundsModalProps {
  trigger?: React.ReactNode
}

const paymentMethods = [
  { id: "pix", name: "PIX", icon: Smartphone, fee: "Grátis" },
  { id: "card", name: "Cartão de Crédito/Débito", icon: CreditCard, fee: "2,9% + R$ 1,50" },
  { id: "boleto", name: "Boleto Bancário", icon: Wallet, fee: "R$ 3,50" },
  { id: "transfer", name: "Transferência Bancária", icon: Wallet, fee: "Grátis" },
]

const quickAmounts = [20, 50, 100, 200, 500, 1000]

export default function AddFundsModal({ trigger }: AddFundsModalProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [amount, setAmount] = useState("")
  const [paymentMethod, setPaymentMethod] = useState("pix")
  const [state, formAction] = useActionState(addFunds, null)

  const amountNum = Number.parseFloat(amount) || 0
  const selectedMethod = paymentMethods.find((m) => m.id === paymentMethod)

  let fee = 0
  if (paymentMethod === "card" && amountNum > 0) {
    fee = amountNum * 0.029 + 1.5
  } else if (paymentMethod === "boleto" && amountNum > 0) {
    fee = 3.5
  }

  const total = amountNum > 0 ? (amountNum + fee).toFixed(2) : "0,00"

  const handleClose = () => {
    setAmount("")
    setPaymentMethod("pix")
    setIsOpen(false)
  }

  // Handle successful deposit
  if (state?.success) {
    return (
      <Sheet open={isOpen} onOpenChange={handleClose}>
        <SheetTrigger asChild>
          {trigger || (
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Fundos
            </Button>
          )}
        </SheetTrigger>
        <SheetContent className="sm:max-w-md">
          <SheetHeader>
            <SheetTitle className="flex items-center space-x-2 text-green-600">
              <CheckCircle className="h-5 w-5" />
              <span>Fundos Adicionados com Sucesso!</span>
            </SheetTitle>
            <SheetDescription>Seu saldo da conta foi atualizado.</SheetDescription>
          </SheetHeader>

          <div className="bg-green-50 border border-green-200 rounded-lg p-4 space-y-2 mt-4">
            <div className="flex justify-between text-sm">
              <span>Valor Adicionado:</span>
              <span className="font-semibold">R$ {amountNum.toFixed(2).replace(".", ",")}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Método de Pagamento:</span>
              <span>{selectedMethod?.name}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>ID da Transação:</span>
              <span className="font-mono">#{state.transactionId?.slice(0, 8)}</span>
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
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        {trigger || (
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Adicionar Fundos
          </Button>
        )}
      </SheetTrigger>
      <SheetContent className="sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center space-x-2">
            <Plus className="h-5 w-5" />
            <span>Adicionar Fundos</span>
          </SheetTitle>
          <SheetDescription>Adicione dinheiro ao seu saldo para fazer pedidos</SheetDescription>
        </SheetHeader>

        <form action={formAction} className="space-y-6 mt-4">
          {/* Error Display */}
          {state?.error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{state.error}</AlertDescription>
            </Alert>
          )}

          {/* Quick Amount Selection */}
          <div className="space-y-3">
            <Label>Valores Rápidos</Label>
            <div className="grid grid-cols-3 gap-2">
              {quickAmounts.map((quickAmount) => (
                <Button
                  key={quickAmount}
                  type="button"
                  variant={amount === quickAmount.toString() ? "default" : "outline"}
                  size="sm"
                  onClick={() => setAmount(quickAmount.toString())}
                >
                  R$ {quickAmount}
                </Button>
              ))}
            </div>
          </div>

          {/* Custom Amount */}
          <div className="space-y-2">
            <Label htmlFor="amount">Valor Personalizado *</Label>
            <Input
              id="amount"
              name="amount"
              type="number"
              min="10"
              max="5000"
              step="0.01"
              placeholder="Digite o valor"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
            <p className="text-xs text-muted-foreground">Mínimo: R$ 10,00 • Máximo: R$ 5.000,00</p>
          </div>

          {/* Payment Method Selection */}
          <div className="space-y-3">
            <Label>Método de Pagamento</Label>
            <input type="hidden" name="paymentMethod" value={paymentMethod} />
            <div className="space-y-2">
              {paymentMethods.map((method) => (
                <Card
                  key={method.id}
                  className={`cursor-pointer transition-colors ${
                    paymentMethod === method.id ? "ring-2 ring-blue-500 bg-blue-50" : "hover:bg-muted/50"
                  }`}
                  onClick={() => setPaymentMethod(method.id)}
                >
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <method.icon className="h-5 w-5" />
                        <span className="font-medium">{method.name}</span>
                      </div>
                      <div className="text-right">
                        <Badge variant="outline" className="text-xs">
                          {method.fee}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          <Separator />

          {/* Payment Summary */}
          <div className="space-y-3">
            <Label>Resumo do Pagamento</Label>
            <div className="bg-muted/50 rounded-lg p-3 space-y-2">
              <div className="flex justify-between text-sm">
                <span>Valor:</span>
                <span>R$ {amountNum.toFixed(2).replace(".", ",")}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Taxa de Processamento:</span>
                <span>R$ {fee.toFixed(2).replace(".", ",")}</span>
              </div>
              <Separator />
              <div className="flex justify-between font-semibold">
                <span>Total a Pagar:</span>
                <span>R$ {total.replace(".", ",")}</span>
              </div>
            </div>
          </div>

          <SheetFooter className="flex space-x-2 mt-6">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={amountNum < 10 || amountNum > 5000} className="flex-1">
              Adicionar R$ {amountNum.toFixed(2).replace(".", ",")}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  )
}
