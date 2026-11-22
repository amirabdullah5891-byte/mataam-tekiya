'use client'

import { useEffect, useState, useCallback } from 'react'
import {
  Plus, Loader2, Wallet, Trash2, TrendingDown,
  Users, Home, Zap, Droplet, Wrench, ShoppingBag, MoreHorizontal,
} from 'lucide-react'
import {
  Card, CardContent, CardHeader, CardTitle, CardDescription,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import {
  Tabs, TabsList, TabsTrigger,
} from '@/components/ui/tabs'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import { toast } from 'sonner'
import { formatCurrency, formatDate } from '@/lib/format'
import type { AppUser } from './app'

const CATEGORIES = [
  { id: 'رواتب', label: 'رواتب', icon: <Users className="h-4 w-4" /> },
  { id: 'إيجار', label: 'إيجار', icon: <Home className="h-4 w-4" /> },
  { id: 'كهرباء', label: 'كهرباء', icon: <Zap className="h-4 w-4" /> },
  { id: 'ماء', label: 'ماء', icon: <Droplet className="h-4 w-4" /> },
  { id: 'صيانة', label: 'صيانة', icon: <Wrench className="h-4 w-4" /> },
  { id: 'مشتريات', label: 'مشتريات', icon: <ShoppingBag className="h-4 w-4" /> },
  { id: 'أخرى', label: 'أخرى', icon: <MoreHorizontal className="h-4 w-4" /> },
]

const CATEGORY_COLORS: Record<string, string> = {
  'رواتب': '#d97706',
  'إيجار': '#16a34a',
  'كهرباء': '#ca8a04',
  'ماء': '#0891b2',
  'صيانة': '#dc2626',
  'مشتريات': '#9333ea',
  'أخرى': '#6b7280',
}

type Expense = {
  id: string
  category: string
  amount: number
  description: string | null
  date: string
  createdBy: { name: string } | null
}

export default function Expenses({ user }: { user: AppUser }) {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [total, setTotal] = useState(0)
  const [byCategory, setByCategory] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)
  const [filterCategory, setFilterCategory] = useState('all')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Expense | null>(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/expenses?limit=100')
      const json = await res.json()
      setExpenses(json.expenses || [])
      setTotal(json.total || 0)
      setByCategory(json.byCategory || {})
    } catch {
      toast.error('تعذر جلب المصروفات')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const filtered = expenses.filter(e =>
    filterCategory === 'all' || e.category === filterCategory
  )

  const chartData = Object.entries(byCategory).map(([name, value]) => ({
    name,
    value,
    color: CATEGORY_COLORS[name] || '#6b7280',
  }))

  return (
    <div className="space-y-6 animate-slide-up">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">المصروفات</h2>
          <p className="text-muted-foreground text-sm">
            تسجيل المصروفات: رواتب، إيجار، كهرباء، ماء، صيانة...
          </p>
        </div>
        <Button onClick={() => setDialogOpen(true)} size="lg">
          <Plus className="ml-2 h-5 w-5" /> مصروف جديد
        </Button>
      </div>

      {/* بطاقات الإحصائيات حسب الفئة */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {CATEGORIES.map(cat => {
          const amount = byCategory[cat.id] || 0
          return (
            <Card key={cat.id} className={amount === 0 ? 'opacity-60' : ''}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-1">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-white"
                    style={{ background: cat.color || '#6b7280' }}
                  >
                    {cat.icon}
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">{cat.label}</p>
                <p className="text-lg font-bold">{formatCurrency(amount)}</p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* رسم بياني */}
      {chartData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">المصروفات حسب الفئة</CardTitle>
            <CardDescription>إجمالي: {formatCurrency(total)}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64" dir="ltr">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="name" fontSize={11} className="text-muted-foreground" />
                  <YAxis tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} fontSize={11} className="text-muted-foreground" />
                  <Tooltip
                    formatter={(v: number) => [formatCurrency(v), 'المبلغ']}
                    contentStyle={{ direction: 'rtl', borderRadius: '8px' }}
                  />
                  <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                    {chartData.map((entry, i) => (
                      <Bar key={i} dataKey="value" fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* قائمة المصروفات */}
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <CardTitle className="text-lg">آخر المصروفات</CardTitle>
            <Tabs value={filterCategory} onValueChange={setFilterCategory}>
              <TabsList className="h-8 overflow-x-auto">
                <TabsTrigger value="all" className="text-xs">الكل</TabsTrigger>
                {CATEGORIES.map(c => (
                  <TabsTrigger key={c.id} value={c.id} className="text-xs">{c.label}</TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-12 text-center">
              <Wallet className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
              <p className="text-muted-foreground mb-4">لا توجد مصروفات مسجلة</p>
              <Button onClick={() => setDialogOpen(true)}>
                <Plus className="ml-2 h-4 w-4" /> أضف أول مصروف
              </Button>
            </div>
          ) : (
            <ScrollArea className="max-h-[500px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-right">الفئة</TableHead>
                    <TableHead className="text-right hidden md:table-cell">الوصف</TableHead>
                    <TableHead className="text-right hidden sm:table-cell">التاريخ</TableHead>
                    <TableHead className="text-right hidden lg:table-cell">المستخدم</TableHead>
                    <TableHead className="text-left">المبلغ</TableHead>
                    <TableHead className="text-center">إجراء</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map(exp => (
                    <TableRow key={exp.id}>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className="text-xs"
                          style={{
                            color: CATEGORY_COLORS[exp.category] || '#6b7280',
                            borderColor: CATEGORY_COLORS[exp.category] || '#6b7280',
                          }}
                        >
                          {exp.category}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden md:table-cell max-w-[200px] truncate text-sm">
                        {exp.description || <span className="text-muted-foreground">—</span>}
                      </TableCell>
                      <TableCell className="hidden sm:table-cell text-muted-foreground text-sm">
                        {formatDate(exp.date)}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell text-sm">
                        {exp.createdBy?.name || '—'}
                      </TableCell>
                      <TableCell className="text-left font-semibold text-destructive">
                        {formatCurrency(exp.amount)}
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-center">
                          <Button
                            size="sm" variant="ghost"
                            onClick={() => setDeleteTarget(exp)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      <ExpenseDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSuccess={fetchData}
        user={user}
      />

      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>حذف المصروف</AlertDialogTitle>
            <AlertDialogDescription>
              هل تريد حذف مصروف &laquo;{deleteTarget?.category}&raquo; بقيمة {deleteTarget && formatCurrency(deleteTarget.amount)}؟
              لا يمكن التراجع.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                if (!deleteTarget) return
                try {
                  const res = await fetch(`/api/expenses/${deleteTarget.id}`, { method: 'DELETE' })
                  if (!res.ok) throw new Error()
                  toast.success('تم حذف المصروف')
                  fetchData()
                } catch {
                  toast.error('فشل في الحذف')
                }
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              نعم، حذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

function ExpenseDialog({
  open, onOpenChange, onSuccess, user,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  onSuccess: () => void
  user: AppUser
}) {
  const [category, setCategory] = useState('رواتب')
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (open) {
      setCategory('رواتب'); setAmount(''); setDescription('')
      setDate(new Date().toISOString().slice(0, 10))
    }
  }, [open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!category || !amount || Number(amount) <= 0) {
      toast.error('الفئة والمبلغ مطلوبان')
      return
    }
    setSaving(true)
    try {
      const res = await fetch('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category,
          amount: Number(amount),
          description: description.trim() || undefined,
          date,
        }),
      })
      if (!res.ok) throw new Error()
      toast.success('تم إضافة المصروف')
      onOpenChange(false)
      onSuccess()
    } catch {
      toast.error('فشل في الإضافة')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>تسجيل مصروف جديد</DialogTitle>
          <DialogDescription>المستخدم: {user.name}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>الفئة *</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {CATEGORIES.map(c => (
                  <SelectItem key={c.id} value={c.id}>{c.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="amount">المبلغ (ج.س) *</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              min="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="date">التاريخ *</Label>
            <Input
              id="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">الوصف</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="مثال: راتب شهر نوفمبر - الشيف أحمد"
              rows={2}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>إلغاء</Button>
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
              إضافة المصروف
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
