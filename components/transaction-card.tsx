import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowUpRight, ArrowDownRight, RotateCcw, Gift } from "lucide-react"

interface TransactionCardProps {
  transaction: {
    id: string
    type: string
    amount: number
    balance_before: number
    balance_after: number
    description: string | null
    created_at: string
  }
  detailed?: boolean
}

const transactionConfig = {
  deposit: {
    icon: ArrowUpRight,
    color: "text-green-600",
    bgColor: "bg-green-100",
    label: "Deposit",
    description: "Funds added to account",
  },
  order: {
    icon: ArrowDownRight,
    color: "text-blue-600",
    bgColor: "bg-blue-100",
    label: "Order",
    description: "Payment for service order",
  },
  refund: {
    icon: RotateCcw,
    color: "text-orange-600",
    bgColor: "bg-orange-100",
    label: "Refund",
    description: "Refund for cancelled order",
  },
  bonus: {
    icon: Gift,
    color: "text-purple-600",
    bgColor: "bg-purple-100",
    label: "Bonus",
    description: "Promotional bonus",
  },
}

export default function TransactionCard({ transaction, detailed = false }: TransactionCardProps) {
  const config = transactionConfig[transaction.type as keyof typeof transactionConfig] || transactionConfig.deposit
  const IconComponent = config.icon
  const isPositive = transaction.amount > 0

  return (
    <Card className="hover:shadow-sm transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-full ${config.bgColor}`}>
              <IconComponent className={`h-4 w-4 ${config.color}`} />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <p className="font-medium text-sm">{config.label}</p>
                <Badge variant="outline" className="text-xs">
                  {transaction.type}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">{transaction.description || config.description}</p>
              {detailed && (
                <p className="text-xs text-muted-foreground">
                  ID: {transaction.id.slice(0, 8)} • {new Date(transaction.created_at).toLocaleString()}
                </p>
              )}
            </div>
          </div>
          <div className="text-right">
            <p className={`font-semibold ${isPositive ? "text-green-600" : "text-red-600"}`}>
              {isPositive ? "+" : ""}${Math.abs(transaction.amount).toFixed(2)}
            </p>
            <p className="text-xs text-muted-foreground">Balance: ${transaction.balance_after.toFixed(2)}</p>
            {!detailed && (
              <p className="text-xs text-muted-foreground">{new Date(transaction.created_at).toLocaleDateString()}</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
