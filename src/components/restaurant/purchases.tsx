'use client'

import { useEffect, useState, useCallback } from 'react'
import {
  Plus, Search, Loader2, ShoppingCart, Eye, Truck,
  Calendar, CheckCircle2, Clock, X, Printer,
} from 'lucide-react'
import {
  Card, CardContent,
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
import { ScrollArea } from '@/components/ui/scroll-area'
import { toast } from 'sonner'
import { formatCurrency, formatDateTime, formatDate } from '@/lib/format'
import { RESTAURANT_INFO } from '@/lib/restaurant'
import type { AppUser } from './app'

type Supplier = { id: string; name: string; balance: number }
type InventoryItem = {
  id: string; name: string; category: string; unit: string
  quantity: number; costPerUnit: number
}

type PurchaseItem = {
  id: string
  inventoryItemId: string | null
  name: string
  quantity: number
  unit: string | null
  unitCost: number
  total: number
}

type Purchase = {
  id: string
  purchaseNumber: string
  supplierId: string
  supplier: Supplier
  items: PurchaseItem[]
  subtotal: number
  total: number
  paidAmount: number
  status: string
  notes: string | null
  createdAt: string
}

export default function Purchases({ user }: { user: AppUser }) {
  const [purchases, setPurchases] = useState<Purchase[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [createOpen, setCreateOpen] = useState(false)
  const [viewPurchase, setViewPurchase] = useState<Purchase | null>(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/purchases?limit=50')
      const json = await res.json()
      setPurchases(json.purchases || [])
    } catch {
      toast.error('تعذر جلب المشتريات')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const filtered = purchases.filter(p =>
    !search ||
    p.purchaseNumber.toLowerCase().includes(search.toLowerCase()) ||
    p.supplier.name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6 animate-slide-up">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">المشتريات</h2>
          <p className="text-muted-foreground text-sm">
            {purchases.length} فاتورة شراء - شراء المواد من الموردين
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)} size="lg">
          <Plus className="ml-2 h-5 w-5" /> فاتورة شراء جديدة
        </Button>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="ابحث برقم الفاتورة أو المورد..."
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
            <div className="flex justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-16 text-center">
              <ShoppingCart className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
              <p className="text-muted-foreground mb-4">لا توجد مشتريات بعد</p>
              <Button onClick={() => setCreateOpen(true)}>
                <Plus className="ml-2 h-4 w-4" /> إنشاء أول فاتورة شراء
              </Button>
            </div>
          ) : (
            <ScrollArea className="max-h-[70vh]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-right">رقم الفاتورة</TableHead>
                    <TableHead className="text-right hidden md:table-cell">المورد</TableHead>
                    <TableHead className="text-right hidden lg:table-cell">التاريخ</TableHead>
                    <TableHead className="text-right hidden sm:table-cell">الحالة</TableHead>
                    <TableHead className="text-left">الإجمالي</TableHead>
                    <TableHead className="text-center">إجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map(p => (
                    <TableRow key={p.id}>
                      <TableCell className="font-mono text-sm">{p.purchaseNumber}</TableCell>
                      <TableCell className="hidden md:table-cell">
                        <div className="flex items-center gap-2">
                          <Truck className="h-3.5 w-3.5 text-muted-foreground" />
                          <span className="truncate max-w-[150px]">{p.supplier.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell text-muted-foreground text-sm">
                        {formatDateTime(p.createdAt)}
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <Badge variant={p.status === 'completed' ? 'default' : p.status === 'pending' ? 'secondary' : 'destructive'}>
                          {p.status === 'completed' ? <><CheckCircle2 className="h-3 w-3 ml-1" /> مكتملة</> : p.status === 'pending' ? <><Clock className="h-3 w-3 ml-1" /> معلقة</> : 'ملغاة'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-left font-semibold text-primary">
                        {formatCurrency(p.total)}
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-center">
                          <Button size="sm" variant="ghost" onClick={() => setViewPurchase(p)}>
                            <Eye className="h-4 w-4" />
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

      <NewPurchaseDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSuccess={fetchData}
        user={user}
      />

      <PurchaseViewDialog
        purchase={viewPurchase}
        onOpenChange={(open) => !open && setViewPurchase(null)}
      />
    </div>
  )
}

function NewPurchaseDialog({
  open, onOpenChange, onSuccess, user,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  onSuccess: () => void
  user: AppUser
}) {
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([])
  const [supplierId, setSupplierId] = useState('')
  const [cart, setCart] = useState<{
    inventoryItemId: string
    name: string
    quantity: string
    unit: string
    unitCost: string
  }[]>([])
  const [paidAmount, setPaidAmount] = useState('')
  const [notes, setNotes] = useState('')
  const [search, setSearch] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (open) {
      fetch('/api/suppliers')
        .then(r => r.json())
        .then(json => setSuppliers(json.suppliers || []))
        .catch(() => toast.error('تعذر جلب الموردين'))
      fetch('/api/inventory?active=true')
        .then(r => r.json())
        .then(json => setInventoryItems(json.items || []))
        .catch(() => toast.error('تعذر جلب المخزون'))
    }
  }, [open])

  const subtotal = cart.reduce((s, it) => {
    const q = Number(it.quantity) || 0
    const c = Number(it.unitCost) || 0
    return s + q * c
  }, 0)
  const paid = Number(paidAmount) || 0
  const remaining = Math.max(0, subtotal - paid)

  const filteredItems = inventoryItems.filter(it =>
    !search || it.name.toLowerCase().includes(search.toLowerCase())
  )

  const addItem = (item: InventoryItem) => {
    setCart(prev => {
      if (prev.find(c => c.inventoryItemId === item.id)) {
        return prev.map(c =>
          c.inventoryItemId === item.id ? { ...c } : c
        )
      }
      return [...prev, {
        inventoryItemId: item.id,
        name: item.name,
        quantity: '1',
        unit: item.unit,
        unitCost: String(item.costPerUnit),
      }]
    })
  }

  const updateItem = (id: string, field: 'quantity' | 'unitCost', value: string) => {
    setCart(prev => prev.map(c => c.inventoryItemId === id ? { ...c, [field]: value } : c))
  }

  const removeItem = (id: string) => {
    setCart(prev => prev.filter(c => c.inventoryItemId !== id))
  }

  const resetForm = () => {
    setSupplierId(''); setCart([]); setPaidAmount(''); setNotes(''); setSearch('')
  }

  const handleSubmit = async () => {
    if (!supplierId) {
      toast.error('اختر المورد أولاً')
      return
    }
    if (cart.length === 0) {
      toast.error('أضف صنفاً واحداً على الأقل')
      return
    }
    for (const item of cart) {
      if (!Number(item.quantity) || Number(item.quantity) <= 0) {
        toast.error(`الكمية غير صحيحة لـ ${item.name}`)
        return
      }
    }
    setSaving(true)
    try {
      const res = await fetch('/api/purchases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          supplierId,
          items: cart.map(c => ({
            inventoryItemId: c.inventoryItemId,
            name: c.name,
            quantity: Number(c.quantity),
            unit: c.unit,
            unitCost: Number(c.unitCost),
          })),
          paidAmount: Number(paidAmount) || 0,
          notes,
        }),
      })
      if (!res.ok) throw new Error()
      const p = await res.json()
      toast.success(`تم إنشاء فاتورة الشراء ${p.purchaseNumber}`)
      resetForm()
      onOpenChange(false)
      onSuccess()
    } catch {
      toast.error('فشل في إنشاء فاتورة الشراء')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) resetForm() }}>
      <DialogContent className="max-w-5xl max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">فاتورة شراء جديدة</DialogTitle>
          <DialogDescription>
            اختر المواد من المخزون وأدخل الكميات والأسعار - الموظف: {user.name}
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* قسم اختيار المواد */}
          <div className="space-y-3">
            <div className="space-y-2">
              <Label>المورد *</Label>
              <Select value={supplierId} onValueChange={setSupplierId}>
                <SelectTrigger><SelectValue placeholder="اختر المورد..." /></SelectTrigger>
                <SelectContent>
                  {suppliers.map(s => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}{s.balance > 0 ? ` (مستحق: ${formatCurrency(s.balance)})` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="ابحث في المخزون..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pr-9"
              />
            </div>

            <ScrollArea className="h-[400px] pr-2 border rounded-lg p-2">
              <div className="space-y-2">
                {filteredItems.map(item => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => addItem(item)}
                    className="w-full text-right p-2 rounded-lg border hover:border-primary hover:bg-accent transition-all"
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-medium text-sm">{item.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {item.category} · متوفر: {item.quantity} {item.unit}
                        </p>
                      </div>
                      <p className="text-xs text-primary">
                        آخر سعر: {formatCurrency(item.costPerUnit)}
                      </p>
                    </div>
                  </button>
                ))}
                {filteredItems.length === 0 && (
                  <p className="text-center text-muted-foreground py-8 text-sm">
                    لا توجد أصناف مطابقة
                  </p>
                )}
              </div>
            </ScrollArea>
          </div>

          {/* قسم السلة */}
          <div className="space-y-3 flex flex-col">
            <div className="flex items-center gap-2 text-sm font-medium">
              <ShoppingCart className="h-4 w-4 text-primary" />
              البنود ({cart.length})
            </div>

            <ScrollArea className="h-[300px] pr-2 border rounded-lg p-2">
              {cart.length === 0 ? (
                <p className="text-center text-muted-foreground py-8 text-sm">
                  اضغط على صنف من المخزون لإضافته
                </p>
              ) : (
                <div className="space-y-2">
                  {cart.map(item => (
                    <div key={item.inventoryItemId} className="p-2 rounded-lg bg-muted/50">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <p className="font-medium text-sm">{item.name}</p>
                        <Button
                          size="sm" variant="ghost" type="button"
                          onClick={() => removeItem(item.inventoryItemId)}
                          className="h-6 w-6 p-0 text-destructive"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Label className="text-xs">الكمية ({item.unit})</Label>
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            value={item.quantity}
                            onChange={(e) => updateItem(item.inventoryItemId, 'quantity', e.target.value)}
                            className="h-8 text-sm"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">سعر الوحدة</Label>
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            value={item.unitCost}
                            onChange={(e) => updateItem(item.inventoryItemId, 'unitCost', e.target.value)}
                            className="h-8 text-sm"
                          />
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1 text-left">
                        الإجمالي: {formatCurrency((Number(item.quantity) || 0) * (Number(item.unitCost) || 0))}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>

            <div className="space-y-1">
              <Label className="text-xs">ملاحظات</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="ملاحظات اختيارية..."
                rows={2}
                className="text-sm"
              />
            </div>

            <div className="p-3 rounded-lg bg-muted space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">الإجمالي</span>
                <span className="font-bold text-primary">{formatCurrency(subtotal)}</span>
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs">المبلغ المدفوع</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={paidAmount}
                onChange={(e) => setPaidAmount(e.target.value)}
                placeholder="0"
                className="h-8 text-sm"
              />
              {remaining > 0 && (
                <p className="text-xs text-amber-600">
                  متبقي على المطعم: {formatCurrency(remaining)} (سيُضاف للمستحقات)
                </p>
              )}
            </div>

            <Button onClick={handleSubmit} disabled={saving || cart.length === 0} className="w-full" size="lg">
              {saving && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
              حفظ فاتورة الشراء
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function PurchaseViewDialog({
  purchase, onOpenChange,
}: {
  purchase: Purchase | null
  onOpenChange: (v: boolean) => void
}) {
  if (!purchase) return null

  const handlePrint = () => {
    const itemsHtml = purchase.items.map(item => `
      <tr>
        <td class="name">${item.name}</td>
        <td class="qty">${item.quantity} ${item.unit || ''}</td>
        <td class="price">${formatCurrency(item.unitCost)}</td>
        <td class="total">${formatCurrency(item.total)}</td>
      </tr>
    `).join('')

    const html = `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="UTF-8">
        <title>فاتورة شراء ${purchase.purchaseNumber}</title>
        <style>
          @page { size: 80mm auto; margin: 2mm; }
          body { font-family: 'Cairo', sans-serif; width: 76mm; margin: 0 auto; padding: 2mm; font-size: 11px; color: #000; }
          .header { text-align: center; border-bottom: 1px dashed #000; padding-bottom: 3mm; margin-bottom: 3mm; }
          .header .name { font-size: 16px; font-weight: bold; }
          .header .sub { font-size: 12px; font-weight: bold; margin-top: 1mm; }
          .header .phones { font-size: 11px; margin-top: 1mm; }
          .info { font-size: 11px; }
          .info div { display: flex; justify-content: space-between; padding: 0.5mm 0; }
          table { width: 100%; border-collapse: collapse; margin: 2mm 0; }
          th { text-align: right; font-size: 10px; border-bottom: 1px dashed #000; padding: 1mm 0; }
          td { font-size: 10px; padding: 1mm 0; border-bottom: 1px dotted #ccc; }
          td.qty { text-align: center; }
          td.price { text-align: center; }
          td.total { text-align: left; font-weight: bold; }
          .totals { margin-top: 2mm; }
          .totals div { display: flex; justify-content: space-between; padding: 0.8mm 0; font-size: 11px; }
          .grand { border-top: 1px dashed #000; margin-top: 1mm; padding-top: 1.5mm; font-size: 14px; font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="name">${RESTAURANT_INFO.name}</div>
          <div class="sub">${RESTAURANT_INFO.subtitle}</div>
          <div class="phones">ت: ${RESTAURANT_INFO.phones.join(' - ')}</div>
        </div>
        <div class="info">
          <div><span>رقم الفاتورة:</span><span>${purchase.purchaseNumber}</span></div>
          <div><span>المورد:</span><span>${purchase.supplier.name}</span></div>
          <div><span>التاريخ:</span><span>${formatDateTime(purchase.createdAt)}</span></div>
        </div>
        <table>
          <thead><tr><th>الصنف</th><th>الكمية</th><th>سعر</th><th>إجمالي</th></tr></thead>
          <tbody>${itemsHtml}</tbody>
        </table>
        <div class="totals">
          <div><span>الإجمالي:</span><span>${formatCurrency(purchase.total)}</span></div>
          <div><span>المدفوع:</span><span>${formatCurrency(purchase.paidAmount)}</span></div>
          ${purchase.total - purchase.paidAmount > 0 ? `<div><span>متبقي:</span><span>${formatCurrency(purchase.total - purchase.paidAmount)}</span></div>` : ''}
          <div class="grand"><span>الحالة:</span><span>${purchase.status === 'completed' ? 'مكتملة' : 'معلقة'}</span></div>
        </div>
      </body>
      </html>
    `
    const win = window.open('', '_blank', 'width=400,height=600')
    if (!win) { toast.error('يرجى السماح بالنوافذ المنبثقة'); return }
    win.document.write(html)
    win.document.close()
    win.focus()
    setTimeout(() => win.print(), 300)
  }

  return (
    <Dialog open={!!purchase} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>تفاصيل فاتورة الشراء</span>
            <Button size="sm" variant="outline" onClick={handlePrint}>
              <Printer className="h-4 w-4 ml-1" /> طباعة
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div className="text-center border-b-2 border-dashed pb-3 mb-3">
          <h2 className="text-xl font-bold text-primary">{RESTAURANT_INFO.name}</h2>
          <p className="text-sm font-medium">{RESTAURANT_INFO.subtitle}</p>
          <p className="text-sm font-bold mt-1" dir="ltr">{RESTAURANT_INFO.phones.join(' - ')}</p>
        </div>

        <div className="space-y-1 text-sm mb-4">
          <div className="flex justify-between">
            <span className="text-muted-foreground">رقم الفاتورة:</span>
            <span className="font-mono font-medium">{purchase.purchaseNumber}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">المورد:</span>
            <span>{purchase.supplier.name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">التاريخ:</span>
            <span>{formatDateTime(purchase.createdAt)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">الحالة:</span>
            <Badge variant={purchase.status === 'completed' ? 'default' : 'secondary'}>
              {purchase.status === 'completed' ? 'مكتملة' : 'معلقة'}
            </Badge>
          </div>
        </div>

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
            {purchase.items.map(item => (
              <TableRow key={item.id}>
                <TableCell className="text-sm py-2">{item.name}</TableCell>
                <TableCell className="text-center text-sm">
                  {item.quantity} {item.unit || ''}
                </TableCell>
                <TableCell className="text-center text-sm">{formatCurrency(item.unitCost)}</TableCell>
                <TableCell className="text-left text-sm font-medium">{formatCurrency(item.total)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        <div className="space-y-1 mt-4 pt-3 border-t border-dashed text-sm">
          <div className="flex justify-between font-bold text-base">
            <span>الإجمالي</span>
            <span className="text-primary">{formatCurrency(purchase.total)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">المدفوع</span>
            <span>{formatCurrency(purchase.paidAmount)}</span>
          </div>
          {purchase.total - purchase.paidAmount > 0 && (
            <div className="flex justify-between text-amber-600">
              <span>متبقي (مستحق)</span>
              <span>{formatCurrency(purchase.total - purchase.paidAmount)}</span>
            </div>
          )}
        </div>

        {purchase.notes && (
          <div className="mt-3 p-2 bg-muted rounded text-sm">
            <span className="text-muted-foreground">ملاحظات: </span>
            {purchase.notes}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
