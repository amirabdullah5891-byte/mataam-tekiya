'use client'
import { apiFetch } from '@/lib/api-client'

import { useEffect, useState, useCallback } from 'react'
import {
  Plus, Search, Edit, Trash2, Loader2, Truck, Phone, MapPin, User,
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
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { toast } from 'sonner'
import { formatCurrency } from '@/lib/format'
import type { AppUser } from './app'

type Supplier = {
  id: string
  name: string
  phone: string | null
  address: string | null
  balance: number
  notes: string | null
  _count?: { purchases: number }
  createdAt: string
}

export default function Suppliers({ user }: { user: AppUser }) {
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Supplier | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Supplier | null>(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await apiFetch('/api/suppliers')
      const json = await res.json()
      setSuppliers(json.suppliers || [])
    } catch {
      toast.error('تعذر جلب الموردين')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const filtered = suppliers.filter(s =>
    !search ||
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    (s.phone || '').includes(search)
  )

  return (
    <div className="space-y-6 animate-slide-up">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">الموردون</h2>
          <p className="text-muted-foreground text-sm">
            {suppliers.length} مورد - إدارة بيانات الموردين والأرصدة
          </p>
        </div>
        <Button onClick={() => { setEditing(null); setDialogOpen(true) }}>
          <Plus className="ml-2 h-4 w-4" /> إضافة مورد
        </Button>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="ابحث بالاسم أو الهاتف..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pr-9"
            />
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <Truck className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
            <p className="text-muted-foreground mb-4">لا يوجد موردون</p>
            <Button onClick={() => { setEditing(null); setDialogOpen(true) }}>
              <Plus className="ml-2 h-4 w-4" /> أضف أول مورد
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(s => (
            <Card key={s.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-lg bg-primary text-primary-foreground flex items-center justify-center flex-shrink-0">
                      <Truck className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-semibold truncate">{s.name}</h4>
                      {s._count && (
                        <p className="text-xs text-muted-foreground">
                          {s._count.purchases} فاتورة شراء
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    <Button size="sm" variant="ghost" onClick={() => { setEditing(s); setDialogOpen(true) }}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm" variant="ghost"
                      onClick={() => setDeleteTarget(s)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="space-y-1.5 text-sm">
                  {s.phone && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Phone className="h-3.5 w-3.5" />
                      <span dir="ltr">{s.phone}</span>
                    </div>
                  )}
                  {s.address && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <MapPin className="h-3.5 w-3.5" />
                      <span className="truncate">{s.address}</span>
                    </div>
                  )}
                  {s.balance > 0 && (
                    <div className="mt-2 pt-2 border-t">
                      <Badge variant="destructive">
                        مستحقات: {formatCurrency(s.balance)}
                      </Badge>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <SupplierDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        supplier={editing}
        onSuccess={fetchData}
      />

      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>حذف المورد</AlertDialogTitle>
            <AlertDialogDescription>
              هل تريد حذف &laquo;{deleteTarget?.name}&raquo;؟
              {!deleteTarget?._count?.purchases && ' لا يمكن التراجع عن هذا الإجراء.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                if (!deleteTarget) return
                try {
                  const res = await apiFetch(`/api/suppliers/${deleteTarget.id}`, { method: 'DELETE' })
                  const json = await res.json()
                  if (!res.ok) throw new Error(json.error)
                  toast.success('تم حذف المورد')
                  fetchData()
                } catch (e: any) {
                  toast.error(e.message || 'فشل في الحذف')
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

function SupplierDialog({
  open, onOpenChange, supplier, onSuccess,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  supplier: Supplier | null
  onSuccess: () => void
}) {
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')
  const [notes, setNotes] = useState('')
  const [balance, setBalance] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (open) {
      if (supplier) {
        setName(supplier.name)
        setPhone(supplier.phone || '')
        setAddress(supplier.address || '')
        setNotes(supplier.notes || '')
        setBalance(supplier.balance ? String(supplier.balance) : '')
      } else {
        setName(''); setPhone(''); setAddress(''); setNotes(''); setBalance('')
      }
    }
  }, [open, supplier])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      toast.error('اسم المورد مطلوب')
      return
    }
    setSaving(true)
    try {
      const body = {
        name: name.trim(),
        phone: phone.trim(),
        address: address.trim(),
        notes: notes.trim(),
        balance: balance ? Number(balance) : 0,
      }
      const url = supplier ? `/api/suppliers/${supplier.id}` : '/api/suppliers'
      const method = supplier ? 'PUT' : 'POST'
      const res = await apiFetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) throw new Error()
      toast.success(supplier ? 'تم تعديل المورد' : 'تم إضافة المورد')
      onOpenChange(false)
      onSuccess()
    } catch {
      toast.error('فشل في الحفظ')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{supplier ? 'تعديل مورد' : 'إضافة مورد جديد'}</DialogTitle>
          <DialogDescription>
            {supplier ? 'عدّل بيانات المورد' : 'أدخل بيانات المورد الجديد'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">اسم المورد *</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="مثال: شركة اللحوم الطازجة" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">رقم الهاتف</Label>
            <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="0123456789" dir="ltr" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="address">العنوان</Label>
            <Textarea id="address" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="العنوان الكامل..." rows={2} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="balance">الرصيد الافتتاحي (مستحقات)</Label>
            <Input id="balance" type="number" step="0.01" min="0" value={balance} onChange={(e) => setBalance(e.target.value)} placeholder="0" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">ملاحظات</Label>
            <Textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="ملاحظات إضافية..." rows={2} />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>إلغاء</Button>
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
              {supplier ? 'حفظ التعديلات' : 'إضافة المورد'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
