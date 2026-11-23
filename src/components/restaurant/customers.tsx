'use client'
import { apiFetch } from '@/lib/api-client'

import { useEffect, useState, useCallback } from 'react'
import {
  Plus, Search, Loader2, Wallet, User, Phone, Eye, ChevronLeft,
  TrendingUp, TrendingDown, History, RefreshCw,
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
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { ScrollArea } from '@/components/ui/scroll-area'
import { toast } from 'sonner'
import { formatCurrency, formatDateTime } from '@/lib/format'
import type { AppUser } from './app'

type Customer = {
  id: string
  phone: string
  name: string | null
  balance: number
  isActive: boolean
  notes: string | null
  createdAt: string
  _count?: { orders: number; walletTransactions: number }
}

type WalletTransaction = {
  id: string
  type: string
  amount: number
  balanceBefore: number
  balanceAfter: number
  description: string | null
  reference: string | null
  createdBy: { name: string } | null
  createdAt: string
}

type CustomerWithDetails = Customer & {
  walletTransactions: WalletTransaction[]
  orders: any[]
}

export default function CustomersManagement({ user }: { user: AppUser }) {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [viewCustomer, setViewCustomer] = useState<CustomerWithDetails | null>(null)
  const [topupOpen, setTopupOpen] = useState(false)
  const [topupCustomer, setTopupCustomer] = useState<Customer | null>(null)
  const [topupAmount, setTopupAmount] = useState('')
  const [topupDescription, setTopupDescription] = useState('')
  const [topupSubmitting, setTopupSubmitting] = useState(false)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const url = `/api/customers${search ? `?search=${encodeURIComponent(search)}` : ''}`
      const res = await fetch(url)
      const json = await res.json()
      setCustomers(json.customers || [])
    } catch {
      toast.error('تعذر جلب الزبائن')
    } finally {
      setLoading(false)
    }
  }, [search])

  useEffect(() => { fetchData() }, [fetchData])

  const viewCustomerDetails = async (customer: Customer) => {
    try {
      const res = await apiFetch(`/api/customers/${customer.id}`)
      const json = await res.json()
      setViewCustomer(json.customer)
    } catch {
      toast.error('تعذر جلب تفاصيل الزبون')
    }
  }

  const openTopup = (customer: Customer) => {
    setTopupCustomer(customer)
    setTopupAmount('')
    setTopupDescription('')
    setTopupOpen(true)
  }

  const submitTopup = async () => {
    if (!topupCustomer) return
    if (!topupAmount || Number(topupAmount) <= 0) {
      toast.error('أدخل مبلغاً صحيحاً')
      return
    }
    setTopupSubmitting(true)
    try {
      const res = await apiFetch('/api/wallet/topup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: topupCustomer.id,
          amount: Number(topupAmount),
          description: topupDescription.trim() || undefined,
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error)
      toast.success(`تم شحن ${formatCurrency(Number(topupAmount))} لمحفظة ${topupCustomer.phone}`)
      setTopupOpen(false)
      fetchData()
      if (viewCustomer?.id === topupCustomer.id) {
        viewCustomerDetails(topupCustomer)
      }
    } catch (e: any) {
      toast.error(e.message || 'فشل في الشحن')
    } finally {
      setTopupSubmitting(false)
    }
  }

  const totalBalance = customers.reduce((s, c) => s + c.balance, 0)

  return (
    <div className="space-y-6 animate-slide-up">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">المحافظ الرقمية</h2>
          <p className="text-muted-foreground text-sm">
            {customers.length} زبون · إجمالي الأرصدة: {formatCurrency(totalBalance)}
          </p>
        </div>
        <Button onClick={() => setDialogOpen(true)} disabled={user.role === 'cashier'}>
          <Plus className="ml-2 h-4 w-4" /> محفظة جديدة
        </Button>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="ابحث برقم الهاتف أو الاسم..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pr-9"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : customers.length === 0 ? (
            <div className="py-12 text-center">
              <Wallet className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
              <p className="text-muted-foreground mb-4">لا يوجد زبائن مسجلون بعد</p>
              <Button onClick={() => setDialogOpen(true)} disabled={user.role === 'cashier'}>
                <Plus className="ml-2 h-4 w-4" /> أنشئ أول محفظة
              </Button>
            </div>
          ) : (
            <ScrollArea className="max-h-[600px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-right">الزبون</TableHead>
                    <TableHead className="text-right hidden sm:table-cell">رقم الطلبات</TableHead>
                    <TableHead className="text-left">الرصيد</TableHead>
                    <TableHead className="text-center">إجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {customers.map(c => (
                    <TableRow key={c.id} className={!c.isActive ? 'opacity-60' : ''}>
                      <TableCell>
                        <div>
                          <p className="font-medium">
                            {c.name || 'بدون اسم'}
                          </p>
                          <p className="text-xs text-muted-foreground font-mono" dir="ltr">
                            {c.phone}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <Badge variant="secondary">
                          {c._count?.orders || 0} طلب
                        </Badge>
                      </TableCell>
                      <TableCell className="text-left">
                        <span className={`font-bold ${c.balance > 0 ? 'text-emerald-600' : 'text-muted-foreground'}`}>
                          {formatCurrency(c.balance)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-center gap-1">
                          <Button
                            size="sm" variant="ghost"
                            onClick={() => viewCustomerDetails(c)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => openTopup(c)}
                            disabled={user.role === 'cashier'}
                            className="bg-emerald-600 hover:bg-emerald-700"
                          >
                            <Wallet className="h-4 w-4 ml-1" /> شحن
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

      {/* نافذة إنشاء محفظة */}
      <NewCustomerDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSuccess={fetchData}
      />

      {/* نافذة شحن المحفظة */}
      <Dialog open={topupOpen} onOpenChange={setTopupOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Wallet className="h-5 w-5 text-emerald-600" />
              شحن المحفظة
            </DialogTitle>
            <DialogDescription>
              {topupCustomer && (
                <>
                  الزبون: <span className="font-medium">{topupCustomer.name || topupCustomer.phone}</span>
                  <br />
                  الرصيد الحالي: <span className="font-bold">{formatCurrency(topupCustomer.balance)}</span>
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="topupAmount">مبلغ الشحن (ج.س) *</Label>
              <Input
                id="topupAmount"
                type="number"
                step="0.01"
                min="0"
                value={topupAmount}
                onChange={(e) => setTopupAmount(e.target.value)}
                placeholder="مثال: 50000"
                className="text-lg"
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="topupDescription">الوصف (اختياري)</Label>
              <Textarea
                id="topupDescription"
                value={topupDescription}
                onChange={(e) => setTopupDescription(e.target.value)}
                placeholder="مثال: شحن نقدي في المطعم"
                rows={2}
              />
            </div>
            {topupAmount && Number(topupAmount) > 0 && topupCustomer && (
              <div className="p-3 rounded-lg bg-emerald-50 text-emerald-700 text-sm">
                الرصيد بعد الشحن: <span className="font-bold">{formatCurrency(topupCustomer.balance + Number(topupAmount))}</span>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTopupOpen(false)}>إلغاء</Button>
            <Button
              onClick={submitTopup}
              disabled={topupSubmitting || !topupAmount}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {topupSubmitting && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
              تأكيد الشحن
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* نافذة تفاصيل الزبون */}
      <Dialog open={!!viewCustomer} onOpenChange={(o) => !o && setViewCustomer(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>تفاصيل المحفظة</DialogTitle>
            <DialogDescription>
              {viewCustomer?.name || viewCustomer?.phone}
            </DialogDescription>
          </DialogHeader>
          {viewCustomer && (
            <div className="space-y-4">
              {/* بطاقة الرصيد */}
              <div className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground rounded-xl p-5">
                <p className="text-sm opacity-90">الرصيد الحالي</p>
                <p className="text-3xl font-bold">{formatCurrency(viewCustomer.balance)}</p>
                <div className="flex items-center gap-2 mt-2 text-xs opacity-90">
                  <Phone className="h-3 w-3" />
                  <span dir="ltr">{viewCustomer.phone}</span>
                  {viewCustomer.name && (
                    <>
                      <span>·</span>
                      <User className="h-3 w-3" />
                      <span>{viewCustomer.name}</span>
                    </>
                  )}
                </div>
              </div>

              {/* أزرار سريعة */}
              <div className="grid grid-cols-2 gap-2">
                <Button
                  onClick={() => {
                    setViewCustomer(null)
                    openTopup(viewCustomer)
                  }}
                  className="bg-emerald-600 hover:bg-emerald-700"
                  disabled={user.role === 'cashier'}
                >
                  <TrendingUp className="h-4 w-4 ml-2" /> شحن
                </Button>
                <Button variant="outline" disabled>
                  <History className="h-4 w-4 ml-2" /> السجل
                </Button>
              </div>

              {/* سجل المعاملات */}
              <div>
                <p className="font-semibold mb-2">آخر المعاملات</p>
                {viewCustomer.walletTransactions.length === 0 ? (
                  <p className="text-center text-muted-foreground py-4 text-sm">
                    لا توجد معاملات بعد
                  </p>
                ) : (
                  <ScrollArea className="max-h-[300px]">
                    <div className="space-y-2">
                      {viewCustomer.walletTransactions.map(tx => {
                        const isIn = tx.amount > 0
                        return (
                          <div key={tx.id} className="flex items-center gap-2 p-2 rounded-lg bg-muted/50 text-sm">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                              isIn ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                            }`}>
                              {isIn ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium truncate">{tx.description || 'معاملة'}</p>
                              <p className="text-xs text-muted-foreground">
                                {formatDateTime(tx.createdAt)}
                                {tx.reference && ` · ${tx.reference}`}
                              </p>
                            </div>
                            <div className="text-left">
                              <p className={`font-bold ${isIn ? 'text-emerald-600' : 'text-red-600'}`}>
                                {isIn ? '+' : ''}{formatCurrency(tx.amount)}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                → {formatCurrency(tx.balanceAfter)}
                              </p>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </ScrollArea>
                )}
              </div>

              {/* آخر الطلبات */}
              {viewCustomer.orders.length > 0 && (
                <div>
                  <p className="font-semibold mb-2">آخر الطلبات</p>
                  <div className="space-y-1">
                    {viewCustomer.orders.slice(0, 5).map((order: any) => (
                      <div key={order.id} className="flex justify-between text-sm p-2 rounded bg-muted/30">
                        <span className="font-mono">{order.orderNumber}</span>
                        <span className="font-medium">{formatCurrency(order.total)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

function NewCustomerDialog({
  open, onOpenChange, onSuccess,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  onSuccess: () => void
}) {
  const [phone, setPhone] = useState('')
  const [name, setName] = useState('')
  const [balance, setBalance] = useState('')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (open) {
      setPhone(''); setName(''); setBalance(''); setNotes('')
    }
  }, [open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!phone.trim()) {
      toast.error('رقم الهاتف مطلوب')
      return
    }
    setSaving(true)
    try {
      const res = await apiFetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: phone.trim(),
          name: name.trim() || undefined,
          balance: balance ? Number(balance) : 0,
          notes: notes.trim() || undefined,
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error)
      toast.success('تم إنشاء المحفظة بنجاح')
      onOpenChange(false)
      onSuccess()
    } catch (e: any) {
      toast.error(e.message || 'فشل في الإنشاء')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>إنشاء محفظة جديدة</DialogTitle>
          <DialogDescription>
            أنشئ محفظة رقمية لزبون، يمكنه استخدامها للدفع على الطلبات
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="phone">رقم الهاتف *</Label>
            <Input
              id="phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="0123456789"
              dir="ltr"
              required
              autoFocus
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="name">الاسم (اختياري)</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="اسم الزبون"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="balance">الرصيد الافتتاحي (اختياري)</Label>
            <Input
              id="balance"
              type="number"
              step="0.01"
              min="0"
              value={balance}
              onChange={(e) => setBalance(e.target.value)}
              placeholder="0"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">ملاحظات</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="ملاحظات إضافية..."
              rows={2}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>إلغاء</Button>
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
              إنشاء المحفظة
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
