import { createClient } from "@/lib/supabase/server"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, ArrowLeft, Download } from "lucide-react"
import Link from "next/link"
import TransactionCard from "@/components/transaction-card"

export default async function TransactionHistoryPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  // Get all transactions
  const { data: transactions } = await supabase
    .from("transactions")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })

  // Get transaction counts by type
  const { count: totalTransactions } = await supabase
    .from("transactions")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)

  const { count: deposits } = await supabase
    .from("transactions")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("type", "deposit")

  const { count: orders } = await supabase
    .from("transactions")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("type", "order")

  const { count: refunds } = await supabase
    .from("transactions")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("type", "refund")

  const transactionCounts = {
    all: totalTransactions || 0,
    deposit: deposits || 0,
    order: orders || 0,
    refund: refunds || 0,
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Link href="/dashboard/balance">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Balance
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Transaction History</h1>
          <p className="text-muted-foreground">Complete history of your account transactions</p>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search transactions..." className="pl-10" />
            </div>
            <Select defaultValue="all">
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Transaction Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="deposit">Deposits</SelectItem>
                <SelectItem value="order">Orders</SelectItem>
                <SelectItem value="refund">Refunds</SelectItem>
                <SelectItem value="bonus">Bonuses</SelectItem>
              </SelectContent>
            </Select>
            <Select defaultValue="30">
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Time Period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">Last 7 days</SelectItem>
                <SelectItem value="30">Last 30 days</SelectItem>
                <SelectItem value="90">Last 90 days</SelectItem>
                <SelectItem value="all">All time</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Transaction Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{transactionCounts.all}</div>
            <p className="text-sm text-muted-foreground">Total Transactions</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">{transactionCounts.deposit}</div>
            <p className="text-sm text-muted-foreground">Deposits</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-600">{transactionCounts.order}</div>
            <p className="text-sm text-muted-foreground">Orders</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-orange-600">{transactionCounts.refund}</div>
            <p className="text-sm text-muted-foreground">Refunds</p>
          </CardContent>
        </Card>
      </div>

      {/* Transactions by Type */}
      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="all">All ({transactionCounts.all})</TabsTrigger>
          <TabsTrigger value="deposit">Deposits ({transactionCounts.deposit})</TabsTrigger>
          <TabsTrigger value="order">Orders ({transactionCounts.order})</TabsTrigger>
          <TabsTrigger value="refund">Refunds ({transactionCounts.refund})</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-6">
          <div className="space-y-4">
            {transactions?.map((transaction) => (
              <TransactionCard key={transaction.id} transaction={transaction} detailed />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="deposit" className="mt-6">
          <div className="space-y-4">
            {transactions
              ?.filter((t) => t.type === "deposit")
              .map((transaction) => (
                <TransactionCard key={transaction.id} transaction={transaction} detailed />
              ))}
          </div>
        </TabsContent>

        <TabsContent value="order" className="mt-6">
          <div className="space-y-4">
            {transactions
              ?.filter((t) => t.type === "order")
              .map((transaction) => (
                <TransactionCard key={transaction.id} transaction={transaction} detailed />
              ))}
          </div>
        </TabsContent>

        <TabsContent value="refund" className="mt-6">
          <div className="space-y-4">
            {transactions
              ?.filter((t) => t.type === "refund")
              .map((transaction) => (
                <TransactionCard key={transaction.id} transaction={transaction} detailed />
              ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Empty State */}
      {(!transactions || transactions.length === 0) && (
        <Card>
          <CardContent className="p-12 text-center">
            <div className="mx-auto w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-4">
              <Search className="h-12 w-12 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No Transactions Found</h3>
            <p className="text-muted-foreground mb-4">Start by adding funds to your account.</p>
            <Link href="/dashboard/balance">
              <Button>Go to Balance</Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
