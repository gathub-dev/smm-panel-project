import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { DollarSign, Plus, TrendingUp, TrendingDown, CreditCard, Wallet, History } from "lucide-react"
import Link from "next/link"
import AddFundsModal from "@/components/add-funds-modal"
import TransactionCard from "@/components/transaction-card"

export default async function BalancePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  // Get user profile with balance
  const { data: profile } = await supabase.from("users").select("*").eq("id", user.id).single()

  // Get recent transactions
  const { data: transactions } = await supabase
    .from("transactions")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(10)

  // Get transaction statistics
  const { data: deposits } = await supabase
    .from("transactions")
    .select("amount")
    .eq("user_id", user.id)
    .eq("type", "deposit")

  const { data: orders } = await supabase
    .from("transactions")
    .select("amount")
    .eq("user_id", user.id)
    .eq("type", "order")

  const totalDeposits = deposits?.reduce((sum, t) => sum + Number(t.amount), 0) || 0
  const totalSpent = Math.abs(orders?.reduce((sum, t) => sum + Number(t.amount), 0) || 0)
  const currentBalance = profile?.balance || 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Balance & Transactions</h1>
          <p className="text-muted-foreground">Manage your account balance and view transaction history</p>
        </div>
        <AddFundsModal />
      </div>

      {/* Balance Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-gradient-to-r from-green-500 to-emerald-600 text-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium flex items-center space-x-2">
              <Wallet className="h-5 w-5" />
              <span>Current Balance</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">${currentBalance.toFixed(2)}</div>
            <p className="text-green-100 text-sm">Available for orders</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-green-500" />
              <span>Total Deposits</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">${totalDeposits.toFixed(2)}</div>
            <p className="text-muted-foreground text-sm">All time deposits</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium flex items-center space-x-2">
              <TrendingDown className="h-5 w-5 text-blue-500" />
              <span>Total Spent</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">${totalSpent.toFixed(2)}</div>
            <p className="text-muted-foreground text-sm">On orders</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Manage your account balance</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <AddFundsModal
              trigger={
                <Button className="w-full h-20 flex flex-col space-y-2">
                  <Plus className="h-6 w-6" />
                  <span>Add Funds</span>
                </Button>
              }
            />
            <Link href="/dashboard/services">
              <Button variant="outline" className="w-full h-20 flex flex-col space-y-2 bg-transparent">
                <CreditCard className="h-6 w-6" />
                <span>Place Order</span>
              </Button>
            </Link>
            <Link href="/dashboard/balance/history">
              <Button variant="outline" className="w-full h-20 flex flex-col space-y-2 bg-transparent">
                <History className="h-6 w-6" />
                <span>View History</span>
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Recent Transactions */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Recent Transactions</CardTitle>
            <CardDescription>Your latest account activity</CardDescription>
          </div>
          <Link href="/dashboard/balance/history">
            <Button variant="outline" size="sm">
              View All
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          {transactions && transactions.length > 0 ? (
            <div className="space-y-4">
              {transactions.map((transaction) => (
                <TransactionCard key={transaction.id} transaction={transaction} />
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <DollarSign className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground mb-4">No transactions yet</p>
              <AddFundsModal
                trigger={
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Your First Deposit
                  </Button>
                }
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Balance Tips */}
      <Card>
        <CardHeader>
          <CardTitle>Balance Management Tips</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-start space-x-3">
            <div className="w-2 h-2 rounded-full bg-blue-500 mt-2" />
            <div>
              <p className="font-medium">Minimum deposit is $5.00</p>
              <p className="text-sm text-muted-foreground">Add funds to start placing orders</p>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <div className="w-2 h-2 rounded-full bg-green-500 mt-2" />
            <div>
              <p className="font-medium">Instant balance updates</p>
              <p className="text-sm text-muted-foreground">Your balance is updated immediately after deposits</p>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <div className="w-2 h-2 rounded-full bg-purple-500 mt-2" />
            <div>
              <p className="font-medium">Secure transactions</p>
              <p className="text-sm text-muted-foreground">All payments are processed securely</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
