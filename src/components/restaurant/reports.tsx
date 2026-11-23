'use client'
import { apiFetch } from '@/lib/api-client'

import { useEffect, useState, useCallback } from 'react'
import {
  BarChart3, Download, Loader2, TrendingUp, Receipt, Coins,
  ShoppingBag, Calendar as CalendarIcon,
} from 'lucide-react'
import {
  Card, CardContent, CardHeader, CardTitle, CardDescription,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, Legend,
} from 'recharts'
import {
  formatCurrency, formatNumber, formatDate, paymentMethodLabel,
} from '@/lib/format'

type ReportData = {
  period: { from: string; to: string }
  summary: {
    totalSales: number
    totalTax: number
    totalDiscount: number
    totalPaid: number
    invoiceCount: number
    avgInvoice: number
    itemCount: number
  }
  dailyBreakdown: { date: string; total: number; count: number; items: number }[]
  categorySales: Record<string, number>
  topItems: { name: string; quantity: number; total: number }[]
  paymentBreakdown: Record<string, { count: number; total: number }>
}

const CATEGORY_COLORS = ['#d97706', '#16a34a', '#dc2626', '#ca8a04', '#9333ea', '#0891b2', '#db2777']

export default function Reports() {
  const [data, setData] = useState<ReportData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // افتراضي: آخر 30 يوماً
  const today = new Date()
  const thirtyDaysAgo = new Date(today)
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 29)

  const [from, setFrom] = useState(formatISODate(thirtyDaysAgo))
  const [to, setTo] = useState(formatISODate(today))

  function formatISODate(d: Date): string {
    return d.toISOString().slice(0, 10)
  }

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await apiFetch(`/api/reports?from=${from}&to=${to}`)
      if (!res.ok) throw new Error()
      const json = await res.json()
      setData(json)
    } catch {
      setError('تعذر جلب التقرير')
    } finally {
      setLoading(false)
    }
  }, [from, to])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleQuickRange = (days: number) => {
    const end = new Date()
    const start = new Date()
    start.setDate(start.getDate() - (days - 1))
    setFrom(formatISODate(start))
    setTo(formatISODate(end))
  }

  const handleExportCSV = () => {
    if (!data) return
    const rows = [
      ['رقم الفاتورة', 'التاريخ', 'الزبون', 'الإجمالي', 'طريقة الدفع', 'الحالة'],
      ...data.invoices.map((inv: any) => [
        inv.invoiceNumber,
        formatDate(inv.createdAt),
        inv.customerName || '',
        inv.total,
        paymentMethodLabel(inv.paymentMethod),
        inv.status === 'completed' ? 'مكتملة' : 'ملغاة',
      ]),
    ]
    const csv = '\uFEFF' + rows.map(r => r.map(c => `"${c}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `تقرير_المبيعات_${from}_إلى_${to}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

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
          <Button onClick={fetchData}>إعادة المحاولة</Button>
        </CardContent>
      </Card>
    )
  }

  const { summary, dailyBreakdown, categorySales, topItems, paymentBreakdown } = data

  const categoryData = Object.entries(categorySales)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)

  const paymentData = Object.entries(paymentBreakdown).map(([method, info]) => ({
    name: paymentMethodLabel(method),
    value: info.total,
    count: info.count,
  }))

  return (
    <div className="space-y-6 animate-slide-up">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">التقارير</h2>
          <p className="text-muted-foreground text-sm">
            تقرير المبيعات من {formatDate(from)} إلى {formatDate(to)}
          </p>
        </div>
        <Button variant="outline" onClick={handleExportCSV} disabled={data.invoices.length === 0}>
          <Download className="ml-2 h-4 w-4" /> تصدير CSV
        </Button>
      </div>

      {/* اختيار الفترة */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-end gap-3">
            <div className="space-y-1">
              <Label className="text-xs flex items-center gap-1">
                <CalendarIcon className="h-3 w-3" /> من تاريخ
              </Label>
              <Input
                type="date"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                className="w-40"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs flex items-center gap-1">
                <CalendarIcon className="h-3 w-3" /> إلى تاريخ
              </Label>
              <Input
                type="date"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                className="w-40"
              />
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => handleQuickRange(7)}>آخر أسبوع</Button>
              <Button size="sm" variant="outline" onClick={() => handleQuickRange(30)}>آخر شهر</Button>
              <Button size="sm" variant="outline" onClick={() => handleQuickRange(90)}>آخر 3 أشهر</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* بطاقات الملخص */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard
          title="إجمالي المبيعات"
          value={formatCurrency(summary.totalSales)}
          icon={<TrendingUp className="h-5 w-5" />}
          tone="primary"
        />
        <SummaryCard
          title="عدد الفواتير"
          value={formatNumber(summary.invoiceCount)}
          subtitle={`متوسط: ${formatCurrency(summary.avgInvoice)}`}
          icon={<Receipt className="h-5 w-5" />}
          tone="accent"
        />
        <SummaryCard
          title="عدد الأصناف المباعة"
          value={formatNumber(summary.itemCount)}
          icon={<ShoppingBag className="h-5 w-5" />}
          tone="secondary"
        />
        <SummaryCard
          title="الضرائب المحصلة"
          value={formatCurrency(summary.totalTax)}
          subtitle={`المدفوع: ${formatCurrency(summary.totalPaid)}`}
          icon={<Coins className="h-5 w-5" />}
          tone="muted"
        />
      </div>

      {/* الرسوم البيانية */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* مبيعات يومية */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">تطور المبيعات اليومية</CardTitle>
            <CardDescription>المبيعات وعدد الفواتير لكل يوم</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-72" dir="ltr">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={dailyBreakdown} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(v) => {
                      const d = new Date(v)
                      return `${d.getDate()}/${d.getMonth() + 1}`
                    }}
                    fontSize={11}
                    className="text-muted-foreground"
                  />
                  <YAxis
                    tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                    fontSize={11}
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
                  <Line
                    type="monotone"
                    dataKey="total"
                    stroke="var(--primary)"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                    activeDot={{ r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* المبيعات حسب الفئة */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">المبيعات حسب الفئة</CardTitle>
            <CardDescription>توزيع المبيعات على فئات الطعام</CardDescription>
          </CardHeader>
          <CardContent>
            {categoryData.length === 0 ? (
              <div className="h-72 flex items-center justify-center text-muted-foreground">
                لا توجد بيانات
              </div>
            ) : (
              <div className="h-72" dir="ltr">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={70}
                      label={(entry: any) => `${(entry.percent * 100).toFixed(0)}%`}
                      labelLine={false}
                    >
                      {categoryData.map((_, i) => (
                        <Cell key={i} fill={CATEGORY_COLORS[i % CATEGORY_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(v: number) => formatCurrency(v)}
                      contentStyle={{ direction: 'rtl', borderRadius: '8px' }}
                    />
                    <Legend wrapperStyle={{ direction: 'rtl', fontSize: '11px' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* الجداول */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* الأطباق الأكثر مبيعاً */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">الأطباق الأكثر مبيعاً</CardTitle>
            <CardDescription>مرتبة حسب الإيرادات</CardDescription>
          </CardHeader>
          <CardContent>
            {topItems.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">لا توجد مبيعات</p>
            ) : (
              <ScrollArea className="h-96">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-right">#</TableHead>
                      <TableHead className="text-right">الطبق</TableHead>
                      <TableHead className="text-center">الكمية</TableHead>
                      <TableHead className="text-left">الإيراد</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {topItems.map((item, i) => (
                      <TableRow key={item.name}>
                        <TableCell className="font-bold text-muted-foreground">{i + 1}</TableCell>
                        <TableCell className="font-medium">{item.name}</TableCell>
                        <TableCell className="text-center">{formatNumber(item.quantity)}</TableCell>
                        <TableCell className="text-left font-semibold text-primary">
                          {formatCurrency(item.total)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            )}
          </CardContent>
        </Card>

        {/* ملخص يومي */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">الملخص اليومي</CardTitle>
            <CardDescription>تفصيل المبيعات لكل يوم</CardDescription>
          </CardHeader>
          <CardContent>
            {dailyBreakdown.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">لا توجد بيانات</p>
            ) : (
              <ScrollArea className="h-96">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-right">التاريخ</TableHead>
                      <TableHead className="text-center">الفواتير</TableHead>
                      <TableHead className="text-center">الأصناف</TableHead>
                      <TableHead className="text-left">المبيعات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {[...dailyBreakdown].reverse().map(d => (
                      <TableRow key={d.date}>
                        <TableCell className="text-muted-foreground text-sm">
                          {formatDate(d.date)}
                        </TableCell>
                        <TableCell className="text-center">{d.count}</TableCell>
                        <TableCell className="text-center">{d.items}</TableCell>
                        <TableCell className="text-left font-semibold text-primary">
                          {formatCurrency(d.total)}
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

      {/* طرق الدفع */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">توزيع طرق الدفع</CardTitle>
          <CardDescription>عدد الفواتير وقيمة المبيعات لكل طريقة دفع</CardDescription>
        </CardHeader>
        <CardContent>
          {paymentData.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">لا توجد بيانات</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {paymentData.map(p => (
                <div key={p.name} className="p-4 rounded-lg bg-muted/50 text-center">
                  <p className="text-sm text-muted-foreground mb-1">{p.name}</p>
                  <p className="text-xl font-bold text-primary">{formatCurrency(p.value)}</p>
                  <Badge variant="secondary" className="mt-2">{p.count} فاتورة</Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function SummaryCard({
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
    <Card>
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
