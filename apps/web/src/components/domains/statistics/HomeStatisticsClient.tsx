'use client'
import { api } from '@/lib/trpc/client'
import { format } from 'date-fns'
import { BarChart } from './charts/BarChart'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '@/server/domains/household-finance/household-finance.categories'

// From PR #7 / TripStatisticsClient: show a real currency label next to amounts instead of a
// bare number, since transactions are entered with their own currency.
function currencyLabel(currencies: string[]): string {
  if (currencies.length === 0) return ''
  if (currencies.length > 1) return 'mixed currencies'
  return currencies[0] === 'HUF' ? 'Ft' : (currencies[0] ?? '')
}

function StatTile({ label, value, hint, tone }: { label: string; value: string; hint: string; tone?: 'positive' | 'negative' }) {
  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-xs text-muted-foreground mb-1">{label}</p>
        <p className={`text-2xl font-semibold ${tone === 'positive' ? 'text-chart-2' : tone === 'negative' ? 'text-destructive' : ''}`}>{value}</p>
        <p className="text-xs text-muted-foreground mt-1">{hint}</p>
      </CardContent>
    </Card>
  )
}

function categoryLabel(list: { value: string; label: string }[], value: string): string {
  return list.find((c) => c.value === value)?.label ?? value
}

export function HomeStatisticsClient({ itemId }: { itemId: string }) {
  const stats = api.householdFinance.getStatistics.useQuery({ itemId })
  const cookingLog = api.cooking.listByItemId.useQuery({ itemId })

  if (stats.isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)}
        </div>
        <Skeleton className="h-48 rounded-xl" />
      </div>
    )
  }

  const data = stats.data
  const hasAnyData = data && (data.monthly.length > 0 || data.allTime.expense > 0 || data.allTime.income > 0)

  if (!data || !hasAnyData) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground text-sm">Log a transaction to see statistics here.</p>
        </CardContent>
      </Card>
    )
  }

  const { allTime, last30Days, monthly, expenseByCategory, incomeByCategory, expenseByPaidBy, incomeByPaidBy, netBalanceByPerson, currencies } = data
  const currency = currencyLabel(currencies)
  const mixedCurrencies = currencies.length > 1
  const costHint = mixedCurrencies ? 'Amounts added as-is, not converted' : undefined

  const currentMonthKey = format(new Date(), 'yyyy-MM')
  const currentMonth = monthly.find((m) => m.month === currentMonthKey) ?? {
    month: currentMonthKey,
    income: 0,
    expense: 0,
    balance: 0,
  }

  const mealCounts = new Map<string, number>()
  for (const entry of cookingLog.data ?? []) {
    mealCounts.set(entry.name, (mealCounts.get(entry.name) ?? 0) + 1)
  }
  const mealFrequency = Array.from(mealCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">This month</CardTitle>
          <CardDescription>The whole household's income, expense, and what's left over — {format(new Date(), 'MMMM yyyy')}.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <StatTile label="Income" value={`${currentMonth.income.toLocaleString()} ${currency}`} hint={costHint ?? 'This month'} tone="positive" />
            <StatTile label="Expense" value={`${currentMonth.expense.toLocaleString()} ${currency}`} hint={costHint ?? 'This month'} />
            <StatTile
              label="Remaining"
              value={`${currentMonth.balance >= 0 ? '+' : ''}${currentMonth.balance.toLocaleString()} ${currency}`}
              hint={currentMonth.balance >= 0 ? 'Left over so far' : 'Over budget so far'}
              tone={currentMonth.balance >= 0 ? 'positive' : 'negative'}
            />
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <StatTile label="Total expense" value={`${allTime.expense.toLocaleString()} ${currency}`} hint={costHint ?? 'All-time'} />
        <StatTile label="Total income" value={`${allTime.income.toLocaleString()} ${currency}`} hint={costHint ?? 'All-time'} />
        <StatTile label="Expense (last 30 days)" value={`${last30Days.expense.toLocaleString()} ${currency}`} hint={costHint ?? 'Recent use only'} />
        <StatTile label="Income (last 30 days)" value={`${last30Days.income.toLocaleString()} ${currency}`} hint={costHint ?? 'Recent use only'} />
      </div>

      {netBalanceByPerson.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Net balance per person</CardTitle>
            <CardDescription>What each person has put into the shared pool minus what's attributed to their spending.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {netBalanceByPerson.map((p) => (
                <StatTile
                  key={p.paidBy}
                  label={p.paidBy}
                  value={`${p.net >= 0 ? '+' : ''}${p.net.toLocaleString()} ${currency}`}
                  hint={p.net >= 0 ? 'In credit' : 'In deficit'}
                  tone={p.net >= 0 ? 'positive' : 'negative'}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Expense per month</CardTitle>
          <CardDescription>How much you spent each month.</CardDescription>
        </CardHeader>
        <CardContent>
          <BarChart
            data={monthly.map((m) => ({ label: m.month, values: { expense: m.expense } }))}
            series={[{ key: 'expense', label: 'Expense', colorClass: 'fill-chart-1' }]}
            valueFormatter={(n) => `${n.toLocaleString()} ${currency}`}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Income per month</CardTitle>
          <CardDescription>How much came in each month.</CardDescription>
        </CardHeader>
        <CardContent>
          <BarChart
            data={monthly.map((m) => ({ label: m.month, values: { income: m.income } }))}
            series={[{ key: 'income', label: 'Income', colorClass: 'fill-chart-2' }]}
            valueFormatter={(n) => `${n.toLocaleString()} ${currency}`}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Monthly balance</CardTitle>
          <CardDescription>Income minus expense — negative months are shown as a deficit.</CardDescription>
        </CardHeader>
        <CardContent>
          <BarChart
            data={monthly.map((m) => ({ label: m.month, values: { balance: m.balance } }))}
            series={[{ key: 'balance', label: 'Balance', colorClass: 'fill-chart-3' }]}
            valueFormatter={(n) => `${n.toLocaleString()} ${currency}`}
          />
        </CardContent>
      </Card>

      {expenseByCategory.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Expense by category</CardTitle>
            <CardDescription>Where the money went.</CardDescription>
          </CardHeader>
          <CardContent>
            <BarChart
              data={expenseByCategory.map((c) => ({ label: categoryLabel(EXPENSE_CATEGORIES, c.category), values: { amount: c.amount } }))}
              series={[{ key: 'amount', label: 'Expense', colorClass: 'fill-chart-1' }]}
              valueFormatter={(n) => `${n.toLocaleString()} ${currency}`}
            />
          </CardContent>
        </Card>
      )}

      {incomeByCategory.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Income by category</CardTitle>
            <CardDescription>Where the money came from.</CardDescription>
          </CardHeader>
          <CardContent>
            <BarChart
              data={incomeByCategory.map((c) => ({ label: categoryLabel(INCOME_CATEGORIES, c.category), values: { amount: c.amount } }))}
              series={[{ key: 'amount', label: 'Income', colorClass: 'fill-chart-2' }]}
              valueFormatter={(n) => `${n.toLocaleString()} ${currency}`}
            />
          </CardContent>
        </Card>
      )}

      {expenseByPaidBy.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Who paid the expenses</CardTitle>
            <CardDescription>Expense total attributed to each person.</CardDescription>
          </CardHeader>
          <CardContent>
            <BarChart
              data={expenseByPaidBy.map((p) => ({ label: p.paidBy, values: { amount: p.amount } }))}
              series={[{ key: 'amount', label: 'Expense', colorClass: 'fill-chart-1' }]}
              valueFormatter={(n) => `${n.toLocaleString()} ${currency}`}
            />
          </CardContent>
        </Card>
      )}

      {incomeByPaidBy.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Who contributed the income</CardTitle>
            <CardDescription>Income total attributed to each person.</CardDescription>
          </CardHeader>
          <CardContent>
            <BarChart
              data={incomeByPaidBy.map((p) => ({ label: p.paidBy, values: { amount: p.amount } }))}
              series={[{ key: 'amount', label: 'Income', colorClass: 'fill-chart-2' }]}
              valueFormatter={(n) => `${n.toLocaleString()} ${currency}`}
            />
          </CardContent>
        </Card>
      )}

      {mealFrequency.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Most-cooked meals</CardTitle>
            <CardDescription>How many times each meal has been logged.</CardDescription>
          </CardHeader>
          <CardContent>
            <BarChart
              data={mealFrequency.map(([name, count]) => ({ label: name, values: { count } }))}
              series={[{ key: 'count', label: 'Times cooked', colorClass: 'fill-chart-4' }]}
            />
          </CardContent>
        </Card>
      )}
    </div>
  )
}
