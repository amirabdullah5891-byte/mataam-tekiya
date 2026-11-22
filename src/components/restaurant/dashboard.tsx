'use client'

import { useEffect, useState, useCallback } from 'react'
import {
  TrendingUp, Receipt, Users, ShoppingCart, Crown,
  ArrowUp, ArrowDown, Calendar, RefreshCw, Loader2,
} from 'lucide-react'
import {
  Card, CardContent, CardHeader, CardTitle, CardDescription,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts'
import {
  formatCurrency, formatNumber, formatDateTime, rangeLabel,
  paymentMethodLabel,
} from '@/lib/format'

type DashboardData = {
  range: string
  period: { start: string; end: string }
  summary: {
    totalSales: number
    totalTax: number
    totalDiscount: number
    invoiceCount: number
    avgInvoice: number
  }
  byPaymentMethod: Record<string, number>
  topItems: { name: string; quantity: number; total: number }[]
  dailySales: { date: string; total: number; count: number }[]
  recentInvoices: any[]
}

const PAYMENT_COLORS: Record<string, string> = {
  cash: '#d97706',
  card: '#16a34a',
  transfer: '#dc2626',
  credit: '#9333ea',
}

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [range, setRange] = useState<'today' | 'week' | 'month'>('today')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/dashboard?range=${range}`)
      if (!res.ok) throw new Error('فشل')
      const json = await res.json()
      setData(json)
    } catch {
      setError('تعذر جلب البيانات، حاول مرة أخرى')
    } finally {
      setLoading(false)
    }
  }, [range])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  if (loading && !data) {
    return (
      <div className="flex justify-center items-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (error || !data) {
    return (
      <Card className="border-destructive/50">
        <CardContent className="py-10 text-center">
          <p className="text-destructive mb-4">{error || 'لا توجد بيانات'}</p>
          <Button onClick={fetchData}>
            <RefreshCw className="ml-2 h-4 w-4" /> إعادة المحاولة
          </Button>
        </CardContent>
      </Card>
    )
  }

  const { summary, byPaymentMethod, topItems, dailySales, recentInvoices } = data

  const paymentData = Object.entries(byPaymentMethod).map(([method, value]) => ({
    name: paymentMethodLabel(method),
    value,
    method,
  }))

  return (
    <div className="space-y-6 animate-slide-up">
      {/* رأس لوحة المعلومات */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">لوحة المعلومات</h2>
          <p className="text-muted-foreground text-sm">
            نظرة عامة على أداء المطعم خلال {rangeLabel(range)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <Select value={range} onValueChange={(v) => setRange(v as any)}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">اليوم</SelectItem>
              <SelectItem value="week">آخر أسبوع</SelectItem>
              <SelectItem value="month">آخر شهر</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" onClick={fetchData} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* بطاقات الإحصائيات */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="إجمالي المبيعات"
          value={formatCurrency(summary.totalSales)}
          icon={<TrendingUp className="h-5 w-5" />}
          subtitle={`${summary.invoiceCount} فاتورة`}
          tone="primary"
        />
        <StatCard
          title="متوسط الفاتورة"
          value={formatCurrency(summary.avgInvoice)}
          icon={<Receipt className="h-5 w-5" />}
          subtitle="لكل فاتورة"
          tone="accent"
        />
        <StatCard
          title="ضريبة محصلة"
          value={formatCurrency(summary.totalTax)}
          icon={<ShoppingCart className="h-5 w-5" />}
          subtitle="ضريبة القيمة المضافة"
          tone="secondary"
        />
        <StatCard
          title="إجمالي الخصومات"
          value={formatCurrency(summary.totalDiscount)}
          icon={<Users className="h-5 w-5" />}
          subtitle="خصومات منحها المطعم"
          tone="muted"
        />
      </div>

      {/* الرسوم البيانية */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* مبيعات يومية */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">المبيعات اليومية</CardTitle>
            <CardDescription>تطور المبيعات خلال {rangeLabel(range)}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-72" dir="ltr">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dailySales} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(v) => {
                      const d = new Date(v)
                      return `${d.getDate()}/${d.getMonth() + 1}`
                    }}
                    fontSize={12}
                    className="text-muted-foreground"
                  />
                  <YAxis
                    tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                    fontSize={12}
                    className="text-muted-foreground"
                  />
                  <Tooltip
                    formatter={(v: number) => [formatCurrency(v), 'المبيعات']}
                    labelFormatter={(label) => {
                      const d = new Date(label)
                      return d.toLocaleDateString('ar-SD')
                    }}
                    contentStyle={{ direction: 'rtl', borderRadius: '8px' }}
                  />
                  <Bar dataKey="total" fill="var(--primary)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* طرق الدفع */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">طرق الدفع</CardTitle>
            <CardDescription>توزيع المبيعات حسب طريقة الدفع</CardDescription>
          </CardHeader>
          <CardContent>
            {paymentData.length === 0 ? (
              <div className="h-72 flex items-center justify-center text-muted-foreground">
                لا توجد بيانات
              </div>
            ) : (
              <div className="h-72" dir="ltr">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={paymentData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label={(entry: any) => `${(entry.percent * 100).toFixed(0)}%`}
                      labelLine={false}
                    >
                      {paymentData.map((entry) => (
                        <Cell key={entry.method} fill={PAYMENT_COLORS[entry.method] || '#d97706'} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(v: number) => formatCurrency(v)}
                      contentStyle={{ direction: 'rtl', borderRadius: '8px' }}
                    />
                    <Legend wrapperStyle={{ direction: 'rtl', fontSize: '12px' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* الأكثر مبيعاً وآخر الفواتير */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* الأكثر مبيعاً */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Crown className="h-5 w-5 text-primary" />
              الأطباق الأكثر مبيعاً
            </CardTitle>
            <CardDescription>أعلى 8 أطباق من حيث الكمية المباعة</CardDescription>
          </CardHeader>
          <CardContent>
            {topItems.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">لا توجد مبيعات في هذه الفترة</p>
            ) : (
              <ScrollArea className="h-80">
                <div className="space-y-2">
                  {topItems.map((item, i) => (
                    <div
                      key={item.name}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
                          {i + 1}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium truncate">{item.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {formatNumber(item.quantity)} وحدة
                          </p>
                        </div>
                      </div>
                      <div className="text-left">
                        <p className="font-semibold text-primary">
                          {formatCurrency(item.total)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>

        {/* آخر الفواتير */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">آخر الفواتير</CardTitle>
            <CardDescription>أحدث 5 فواتير مسجلة</CardDescription>
          </CardHeader>
          <CardContent>
            {recentInvoices.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">لا توجد فواتير بعد</p>
            ) : (
              <ScrollArea className="h-80">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-right">رقم الفاتورة</TableHead>
                      <TableHead className="text-right">الوقت</TableHead>
                      <TableHead className="text-left">المبلغ</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentInvoices.map((inv: any) => (
                      <TableRow key={inv.id}>
                        <TableCell className="font-mono text-sm">{inv.invoiceNumber}</TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {formatDateTime(inv.createdAt)}
                        </TableCell>
                        <TableCell className="text-left font-semibold text-primary">
                          {formatCurrency(inv.total)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function StatCard({
  title, value, icon, subtitle, tone,
}: {
  title: string
  value: string
  icon: React.ReactNode
  subtitle?: string
  tone: 'primary' | 'accent' | 'secondary' | 'muted'
}) {
  const toneClasses = {
    primary: 'bg-primary text-primary-foreground',
    accent: 'bg-accent text-accent-foreground',
    secondary: 'bg-secondary text-secondary-foreground',
    muted: 'bg-muted text-muted-foreground',
  }[tone]

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="space-y-1 min-w-0">
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-xl md:text-2xl font-bold truncate">{value}</p>
            {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
          </div>
          <div className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center ${toneClasses}`}>
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
