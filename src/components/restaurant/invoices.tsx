'use client'
import { apiFetch } from '@/lib/api-client'

import { useEffect, useState, useCallback } from 'react'
import {
  Plus, Search, Eye, Trash2, Loader2, Receipt, Printer,
  Minus, X, ShoppingCart, User, Phone,
} from 'lucide-react'
import {
  Card, CardContent,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
import { ScrollArea } from '@/components/ui/scroll-area'
import { toast } from 'sonner'
import {
  formatCurrency, formatDate, formatDateTime,
  paymentMethodLabel, statusLabel,
} from '@/lib/format'
import { RESTAURANT_INFO } from '@/lib/restaurant'
import type { AppUser } from './app'

type MenuItem = {
  id: string
  name: string
  category: string
  price: number
  isActive: boolean
}

type InvoiceItem = {
  id: string
  menuItemId: string | null
  name: string
  quantity: number
  price: number
  total: number
}

type Invoice = {
  id: string
  invoiceNumber: string
  customerName: string | null
  customerPhone: string | null
  tableNumber: string | null
  subtotal: number
  taxRate: number
  taxAmount: number
  discount: number
  total: number
  paidAmount: number
  change: number
  paymentMethod: string
  status: string
  notes: string | null
  shift: string | null
  createdAt: string
  items: InvoiceItem[]
}

export default function Invoices({ user }: { user: AppUser }) {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'completed' | 'cancelled'>('all')
  const [createOpen, setCreateOpen] = useState(false)
  const [viewInvoice, setViewInvoice] = useState<Invoice | null>(null)

  const fetchInvoices = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/invoices?status=${statusFilter}&limit=50`)
      const json = await res.json()
      setInvoices(json.invoices || [])
    } catch {
      toast.error('تعذر جلب الفواتير')
    } finally {
      setLoading(false)
    }
  }, [statusFilter])

  useEffect(() => {
    fetchInvoices()
  }, [fetchInvoices])

  const filtered = invoices.filter(inv => {
    if (!search) return true
    const q = search.toLowerCase()
    return (
      inv.invoiceNumber.toLowerCase().includes(q) ||
      (inv.customerName || '').toLowerCase().includes(q) ||
      (inv.customerPhone || '').includes(q)
    )
  })

  const handleCancel = async (invoice: Invoice) => {
    if (!confirm(`إلغاء الفاتورة ${invoice.invoiceNumber}؟`)) return
    try {
      const res = await fetch(`/api/invoices/${invoice.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      toast.success('تم إلغاء الفاتورة')
      fetchInvoices()
    } catch {
      toast.error('فشل في الإلغاء')
    }
  }

  return (
    <div className="space-y-6 animate-slide-up">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">الفواتير</h2>
          <p className="text-muted-foreground text-sm">
            {invoices.length} فاتورة - إنشاء وطباعة الفواتير الحرارية
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)} size="lg">
          <Plus className="ml-2 h-5 w-5" /> فاتورة جديدة
        </Button>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="ابحث برقم الفاتورة أو اسم/هاتف الزبون..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pr-9"
              />
            </div>
            <Tabs value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)}>
              <TabsList>
                <TabsTrigger value="all">الكل</TabsTrigger>
                <TabsTrigger value="completed">مكتملة</TabsTrigger>
                <TabsTrigger value="cancelled">ملغاة</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-16 text-center">
              <Receipt className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
              <p className="text-muted-foreground mb-4">لا توجد فواتير</p>
              <Button onClick={() => setCreateOpen(true)}>
                <Plus className="ml-2 h-4 w-4" /> إنشاء أول فاتورة
              </Button>
            </div>
          ) : (
            <ScrollArea className="max-h-[70vh]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-right">رقم الفاتورة</TableHead>
                    <TableHead className="text-right hidden md:table-cell">الزبون</TableHead>
                    <TableHead className="text-right hidden lg:table-cell">الهاتف</TableHead>
                    <TableHead className="text-right hidden lg:table-cell">التاريخ</TableHead>
                    <TableHead className="text-right hidden sm:table-cell">الدفع</TableHead>
                    <TableHead className="text-right">الحالة</TableHead>
                    <TableHead className="text-left">الإجمالي</TableHead>
                    <TableHead className="text-center">إجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map(inv => (
                    <TableRow key={inv.id} className={inv.status === 'cancelled' ? 'opacity-60' : ''}>
                      <TableCell className="font-mono text-sm">{inv.invoiceNumber}</TableCell>
                      <TableCell className="hidden md:table-cell max-w-[150px] truncate">
                        {inv.customerName || <span className="text-muted-foreground">—</span>}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell text-sm font-mono" dir="ltr">
                        {inv.customerPhone || <span className="text-muted-foreground">—</span>}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell text-muted-foreground text-sm">
                        {formatDateTime(inv.createdAt)}
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <Badge variant="outline">{paymentMethodLabel(inv.paymentMethod)}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={inv.status === 'completed' ? 'default' : 'destructive'}>
                          {statusLabel(inv.status)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-left font-semibold text-primary">
                        {formatCurrency(inv.total)}
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-center gap-1">
                          <Button size="sm" variant="ghost" onClick={() => setViewInvoice(inv)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          {inv.status === 'completed' && (
                            <Button
                              size="sm" variant="ghost"
                              onClick={() => handleCancel(inv)}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
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

      <NewInvoiceDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSuccess={fetchInvoices}
        user={user}
      />

      <InvoiceViewDialog
        invoice={viewInvoice}
        onOpenChange={(open) => !open && setViewInvoice(null)}
      />
    </div>
  )
}

// ===== نافذة إنشاء فاتورة جديدة =====
function NewInvoiceDialog({
  open, onOpenChange, onSuccess, user,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  onSuccess: () => void
  user: AppUser
}) {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [cart, setCart] = useState<{ menuItemId: string; name: string; price: number; quantity: number }[]>([])
  const [customerName, setCustomerName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [tableNumber, setTableNumber] = useState('')
  const [taxRate, setTaxRate] = useState('0')
  const [discount, setDiscount] = useState('0')
  const [paidAmount, setPaidAmount] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('cash')
  const [notes, setNotes] = useState('')
  const [shift, setShift] = useState<'صباحية' | 'مسائية' | ''>('')
  const [search, setSearch] = useState('')
  const [filterCategory, setFilterCategory] = useState('all')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (open) {
      apiFetch('/api/menu?active=true')
        .then(r => r.json())
        .then(json => setMenuItems(json.items || []))
        .catch(() => toast.error('تعذر جلب القائمة'))
    }
  }, [open])

  const subtotal = cart.reduce((s, it) => s + it.price * it.quantity, 0)
  const taxAmount = subtotal * (Number(taxRate) || 0) / 100
  const total = Math.max(0, subtotal + taxAmount - (Number(discount) || 0))
  const change = Math.max(0, (Number(paidAmount) || 0) - total)

  const categories = Array.from(new Set(menuItems.map(m => m.category)))
  const filteredItems = menuItems.filter(m => {
    const matchSearch = !search || m.name.toLowerCase().includes(search.toLowerCase())
    const matchCat = filterCategory === 'all' || m.category === filterCategory
    return matchSearch && matchCat
  })

  const addToCart = (item: MenuItem) => {
    setCart(prev => {
      const existing = prev.find(c => c.menuItemId === item.id)
      if (existing) {
        return prev.map(c =>
          c.menuItemId === item.id ? { ...c, quantity: c.quantity + 1 } : c
        )
      }
      return [...prev, { menuItemId: item.id, name: item.name, price: item.price, quantity: 1 }]
    })
  }

  const updateQty = (menuItemId: string, delta: number) => {
    setCart(prev =>
      prev
        .map(c =>
          c.menuItemId === menuItemId
            ? { ...c, quantity: Math.max(0, c.quantity + delta) }
            : c
        )
        .filter(c => c.quantity > 0)
    )
  }

  const removeFromCart = (menuItemId: string) => {
    setCart(prev => prev.filter(c => c.menuItemId !== menuItemId))
  }

  const resetForm = () => {
    setCart([]); setCustomerName(''); setCustomerPhone(''); setTableNumber('')
    setTaxRate('0'); setDiscount('0'); setPaidAmount('')
    setPaymentMethod('cash'); setNotes(''); setShift('')
    setSearch(''); setFilterCategory('all')
  }

  const handleSubmit = async () => {
    if (cart.length === 0) {
      toast.error('أضف عنصراً واحداً على الأقل')
      return
    }
    if (!paidAmount || Number(paidAmount) < total) {
      toast.error('المبلغ المدفوع أقل من الإجمالي')
      return
    }
    setSaving(true)
    try {
      const res = await apiFetch('/api/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName,
          customerPhone,
          tableNumber,
          items: cart.map(c => ({
            menuItemId: c.menuItemId, name: c.name, quantity: c.quantity, price: c.price,
          })),
          taxRate: Number(taxRate),
          discount: Number(discount),
          paidAmount: Number(paidAmount),
          paymentMethod,
          notes, shift: shift || undefined,
        }),
      })
      if (!res.ok) throw new Error()
      const inv = await res.json()
      toast.success(`تم إنشاء الفاتورة ${inv.invoiceNumber}`)
      resetForm()
      onOpenChange(false)
      onSuccess()
    } catch {
      toast.error('فشل في إنشاء الفاتورة')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) resetForm() }}>
      <DialogContent className="max-w-5xl max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">فاتورة جديدة</DialogTitle>
          <DialogDescription>
            اختر الأطباق من القائمة، ثم أدخل تفاصيل الدفع - الكاشير: {user.name}
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* قسم القائمة */}
          <div className="space-y-3">
            <div className="flex gap-2">
              <Input
                placeholder="بحث..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="flex-1"
              />
              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">الكل</SelectItem>
                  {categories.map(c => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <ScrollArea className="h-[420px] pr-2">
              <div className="grid grid-cols-2 gap-2">
                {filteredItems.map(item => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => addToCart(item)}
                    className="text-right p-3 rounded-lg border hover:border-primary hover:bg-accent transition-all"
                  >
                    <p className="font-medium text-sm leading-tight mb-1">{item.name}</p>
                    <p className="text-xs text-muted-foreground mb-2">{item.category}</p>
                    <p className="text-primary font-semibold">{formatCurrency(item.price)}</p>
                  </button>
                ))}
                {filteredItems.length === 0 && (
                  <p className="col-span-2 text-center text-muted-foreground py-8">
                    لا توجد عناصر مطابقة
                  </p>
                )}
              </div>
            </ScrollArea>
          </div>

          {/* قسم السلة */}
          <div className="space-y-3 flex flex-col">
            <div className="flex items-center gap-2 text-sm font-medium">
              <ShoppingCart className="h-4 w-4 text-primary" />
              السلة ({cart.length})
            </div>

            <ScrollArea className="h-[260px] pr-2 border rounded-lg p-2">
              {cart.length === 0 ? (
                <p className="text-center text-muted-foreground py-8 text-sm">
                  اضغط على طبق من القائمة لإضافته
                </p>
              ) : (
                <div className="space-y-2">
                  {cart.map(item => (
                    <div key={item.menuItemId} className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{item.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatCurrency(item.price)} × {item.quantity} = {formatCurrency(item.price * item.quantity)}
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button size="sm" variant="outline" type="button" onClick={() => updateQty(item.menuItemId, -1)} className="h-7 w-7 p-0">
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="w-6 text-center text-sm font-medium">{item.quantity}</span>
                        <Button size="sm" variant="outline" type="button" onClick={() => updateQty(item.menuItemId, 1)} className="h-7 w-7 p-0">
                          <Plus className="h-3 w-3" />
                        </Button>
                        <Button size="sm" variant="ghost" type="button" onClick={() => removeFromCart(item.menuItemId)} className="h-7 w-7 p-0 text-destructive">
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>

            {/* معلومات الزبون */}
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-xs flex items-center gap-1"><User className="h-3 w-3" /> اسم الزبون</Label>
                <Input value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="اختياري" className="h-8 text-sm" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs flex items-center gap-1"><Phone className="h-3 w-3" /> هاتف الزبون</Label>
                <Input
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="مثال: 0123456789"
                  className="h-8 text-sm"
                  dir="ltr"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-xs">رقم الطاولة</Label>
                <Input value={tableNumber} onChange={(e) => setTableNumber(e.target.value)} placeholder="اختياري" className="h-8 text-sm" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">الوردية</Label>
                <Select value={shift} onValueChange={(v) => setShift(v as any)}>
                  <SelectTrigger className="h-8 text-sm"><SelectValue placeholder="—" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="صباحية">صباحية</SelectItem>
                    <SelectItem value="مسائية">مسائية</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-xs">ضريبة %</Label>
                <Input type="number" step="0.01" min="0" value={taxRate} onChange={(e) => setTaxRate(e.target.value)} className="h-8 text-sm" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">خصم (ج.س)</Label>
                <Input type="number" step="0.01" min="0" value={discount} onChange={(e) => setDiscount(e.target.value)} className="h-8 text-sm" />
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs">طريقة الدفع</Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">نقداً</SelectItem>
                  <SelectItem value="card">بطاقة</SelectItem>
                  <SelectItem value="transfer">تحويل</SelectItem>
                  <SelectItem value="credit">آجل</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label className="text-xs">ملاحظات</Label>
              <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="اختياري" className="h-8 text-sm" />
            </div>

            {/* ملخص الفاتورة */}
            <div className="p-3 rounded-lg bg-muted space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">المجموع الفرعي</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">الضريبة ({taxRate || 0}%)</span>
                <span>{formatCurrency(taxAmount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">الخصم</span>
                <span>- {formatCurrency(Number(discount) || 0)}</span>
              </div>
              <div className="flex justify-between font-bold text-base pt-1 border-t">
                <span>الإجمالي</span>
                <span className="text-primary">{formatCurrency(total)}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-xs">المبلغ المدفوع</Label>
                <Input type="number" step="0.01" min="0" value={paidAmount} onChange={(e) => setPaidAmount(e.target.value)} className="h-8 text-sm" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">الباقي</Label>
                <div className="h-8 px-2 flex items-center text-sm font-semibold text-primary bg-muted rounded">
                  {formatCurrency(change)}
                </div>
              </div>
            </div>

            <Button onClick={handleSubmit} disabled={saving || cart.length === 0} className="w-full" size="lg">
              {saving && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
              حفظ وطباعة الفاتورة
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ===== نافذة عرض الفاتورة + طباعة حرارية =====
function InvoiceViewDialog({
  invoice, onOpenChange,
}: {
  invoice: Invoice | null
  onOpenChange: (v: boolean) => void
}) {
  if (!invoice) return null

  const handleThermalPrint = () => {
    const itemsHtml = invoice.items.map(item => `
      <tr>
        <td class="name">${item.name}</td>
        <td class="qty">${item.quantity}</td>
        <td class="price">${formatCurrency(item.price)}</td>
        <td class="total">${formatCurrency(item.total)}</td>
      </tr>
    `).join('')

    const printContents = `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="UTF-8">
        <title>فاتورة ${invoice.invoiceNumber}</title>
        <style>
          @page { size: 80mm auto; margin: 2mm; }
          * { box-sizing: border-box; }
          body {
            font-family: 'Cairo', 'Tahoma', sans-serif;
            width: 76mm;
            margin: 0 auto;
            padding: 2mm;
            font-size: 11px;
            color: #000;
          }
          .header { text-align: center; border-bottom: 1px dashed #000; padding-bottom: 4mm; margin-bottom: 3mm; }
          .header .name { font-size: 16px; font-weight: bold; }
          .header .sub { font-size: 12px; font-weight: bold; margin-top: 1mm; }
          .header .addr { font-size: 10px; margin-top: 1mm; }
          .header .phones { font-size: 11px; font-weight: bold; margin-top: 1mm; }
          .info { margin-bottom: 3mm; font-size: 11px; }
          .info div { display: flex; justify-content: space-between; padding: 0.5mm 0; }
          .info .label { color: #555; }
          table { width: 100%; border-collapse: collapse; margin: 2mm 0; }
          thead th {
            text-align: right;
            font-size: 10px;
            border-bottom: 1px dashed #000;
            padding: 1mm 0;
            font-weight: bold;
          }
          tbody td {
            font-size: 10px;
            padding: 1mm 0;
            border-bottom: 1px dotted #ccc;
          }
          td.name { width: 45%; }
          td.qty { width: 12%; text-align: center; }
          td.price { width: 20%; text-align: center; }
          td.total { width: 23%; text-align: left; font-weight: bold; }
          .totals { margin-top: 2mm; }
          .totals div { display: flex; justify-content: space-between; padding: 0.8mm 0; font-size: 11px; }
          .totals .grand {
            border-top: 1px dashed #000;
            margin-top: 1mm;
            padding-top: 1.5mm;
            font-size: 14px;
            font-weight: bold;
          }
          .footer { text-align: center; margin-top: 4mm; padding-top: 2mm; border-top: 1px dashed #000; font-size: 10px; }
          .footer .thanks { font-weight: bold; margin-bottom: 1mm; }
          @media print {
            body { width: 76mm; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="name">${RESTAURANT_INFO.name}</div>
          <div class="sub">${RESTAURANT_INFO.subtitle}</div>
          <div class="addr">${RESTAURANT_INFO.address}</div>
          <div class="phones">ت: ${RESTAURANT_INFO.phones.join(' - ')}</div>
        </div>
        <div class="info">
          <div><span class="label">رقم الفاتورة:</span><span>${invoice.invoiceNumber}</span></div>
          <div><span class="label">التاريخ:</span><span>${formatDateTime(invoice.createdAt)}</span></div>
          ${invoice.customerName ? `<div><span class="label">الزبون:</span><span>${invoice.customerName}</span></div>` : ''}
          ${invoice.customerPhone ? `<div><span class="label">الهاتف:</span><span dir="ltr">${invoice.customerPhone}</span></div>` : ''}
          ${invoice.tableNumber ? `<div><span class="label">الطاولة:</span><span>${invoice.tableNumber}</span></div>` : ''}
          <div><span class="label">الدفع:</span><span>${paymentMethodLabel(invoice.paymentMethod)}</span></div>
        </div>
        <table>
          <thead>
            <tr>
              <th class="name">الصنف</th>
              <th class="qty">كمية</th>
              <th class="price">سعر</th>
              <th class="total">إجمالي</th>
            </tr>
          </thead>
          <tbody>${itemsHtml}</tbody>
        </table>
        <div class="totals">
          <div><span>المجموع الفرعي:</span><span>${formatCurrency(invoice.subtotal)}</span></div>
          ${invoice.taxAmount > 0 ? `<div><span>ضريبة (${invoice.taxRate}%):</span><span>${formatCurrency(invoice.taxAmount)}</span></div>` : ''}
          ${invoice.discount > 0 ? `<div><span>خصم:</span><span>- ${formatCurrency(invoice.discount)}</span></div>` : ''}
          <div class="grand"><span>الإجمالي:</span><span>${formatCurrency(invoice.total)}</span></div>
          <div><span>المدفوع:</span><span>${formatCurrency(invoice.paidAmount)}</span></div>
          ${invoice.change > 0 ? `<div><span>الباقي:</span><span>${formatCurrency(invoice.change)}</span></div>` : ''}
        </div>
        ${invoice.notes ? `<div style="margin-top:2mm;font-size:10px;"><b>ملاحظات:</b> ${invoice.notes}</div>` : ''}
        <div class="footer">
          <div class="thanks">شكراً لزيارتكم</div>
          <div>ننتظر عودتكم</div>
          <div style="margin-top:1mm;">${RESTAURANT_INFO.name}</div>
        </div>
      </body>
      </html>
    `

    const win = window.open('', '_blank', 'width=400,height=600')
    if (!win) {
      toast.error('يرجى السماح بالنوافذ المنبثقة للطباعة')
      return
    }
    win.document.write(printContents)
    win.document.close()
    win.focus()
    setTimeout(() => {
      win.print()
    }, 300)
  }

  return (
    <Dialog open={!!invoice} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>تفاصيل الفاتورة</span>
            <Button size="sm" onClick={handleThermalPrint}>
              <Printer className="h-4 w-4 ml-1" /> طباعة حرارية
            </Button>
          </DialogTitle>
        </DialogHeader>

        {/* ترويسة الطباعة على الشاشة */}
        <div className="text-center border-b-2 border-dashed pb-3 mb-3">
          <h2 className="text-xl font-bold text-primary">{RESTAURANT_INFO.name}</h2>
          <p className="text-sm font-medium">{RESTAURANT_INFO.subtitle}</p>
          <p className="text-xs text-muted-foreground">{RESTAURANT_INFO.address}</p>
          <p className="text-sm font-bold mt-1" dir="ltr">
            {RESTAURANT_INFO.phones.join(' - ')}
          </p>
        </div>

        <div className="space-y-1 text-sm mb-4">
          <div className="flex justify-between">
            <span className="text-muted-foreground">رقم الفاتورة:</span>
            <span className="font-mono font-medium">{invoice.invoiceNumber}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">التاريخ:</span>
            <span>{formatDateTime(invoice.createdAt)}</span>
          </div>
          {invoice.customerName && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">الزبون:</span>
              <span>{invoice.customerName}</span>
            </div>
          )}
          {invoice.customerPhone && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">هاتف الزبون:</span>
              <span className="font-mono" dir="ltr">{invoice.customerPhone}</span>
            </div>
          )}
          {invoice.tableNumber && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">الطاولة:</span>
              <span>{invoice.tableNumber}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-muted-foreground">طريقة الدفع:</span>
            <span>{paymentMethodLabel(invoice.paymentMethod)}</span>
          </div>
        </div>

        <div className="border-t border-dashed pt-3">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-right text-xs">الصنف</TableHead>
                <TableHead className="text-center text-xs">كمية</TableHead>
                <TableHead className="text-center text-xs">سعر</TableHead>
                <TableHead className="text-left text-xs">إجمالي</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoice.items.map(item => (
                <TableRow key={item.id}>
                  <TableCell className="text-sm py-2">{item.name}</TableCell>
                  <TableCell className="text-center text-sm">{item.quantity}</TableCell>
                  <TableCell className="text-center text-sm">{formatCurrency(item.price)}</TableCell>
                  <TableCell className="text-left text-sm font-medium">{formatCurrency(item.total)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <div className="space-y-1 mt-4 pt-3 border-t border-dashed text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">المجموع الفرعي</span>
            <span>{formatCurrency(invoice.subtotal)}</span>
          </div>
          {invoice.taxAmount > 0 && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">ضريبة ({invoice.taxRate}%)</span>
              <span>{formatCurrency(invoice.taxAmount)}</span>
            </div>
          )}
          {invoice.discount > 0 && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">خصم</span>
              <span>- {formatCurrency(invoice.discount)}</span>
            </div>
          )}
          <div className="flex justify-between font-bold text-base pt-1 border-t border-dashed mt-1">
            <span>الإجمالي</span>
            <span className="text-primary">{formatCurrency(invoice.total)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">المدفوع</span>
            <span>{formatCurrency(invoice.paidAmount)}</span>
          </div>
          {invoice.change > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">الباقي</span>
              <span>{formatCurrency(invoice.change)}</span>
            </div>
          )}
        </div>

        {invoice.notes && (
          <div className="mt-3 p-2 bg-muted rounded text-sm">
            <span className="text-muted-foreground">ملاحظات: </span>
            {invoice.notes}
          </div>
        )}

        <p className="text-center text-xs text-muted-foreground mt-4 pt-3 border-t border-dashed">
          شكراً لزيارتكم - {RESTAURANT_INFO.name}
        </p>
      </DialogContent>
    </Dialog>
  )
}
