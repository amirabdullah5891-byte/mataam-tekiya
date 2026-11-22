'use client'

import { useEffect, useState, useCallback } from 'react'
import {
  Plus, Search, Edit, Trash2, Loader2, UtensilsCrossed,
  ToggleLeft, ToggleRight, Tag,
} from 'lucide-react'
import {
  Card, CardContent, CardHeader, CardTitle, CardDescription,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { toast } from 'sonner'
import { formatCurrency } from '@/lib/format'

type MenuItem = {
  id: string
  name: string
  category: string
  price: number
  cost: number
  description: string | null
  isActive: boolean
  createdAt: string
}

const DEFAULT_CATEGORIES = [
  'مشويات', 'أطباق رئيسية', 'مشروبات', 'خبز', 'حساء', 'حلويات', 'أخرى',
]

export default function MenuManagement() {
  const [items, setItems] = useState<MenuItem[]>([])
  const [grouped, setGrouped] = useState<Record<string, MenuItem[]>>({})
  const [categories, setCategories] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterCategory, setFilterCategory] = useState('all')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<MenuItem | null>(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/menu')
      const json = await res.json()
      setItems(json.items)
      setGrouped(json.grouped)
      setCategories(json.categories)
    } catch {
      toast.error('تعذر جلب بيانات القائمة')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const filteredItems = items.filter(it => {
    const matchSearch = !search ||
      it.name.toLowerCase().includes(search.toLowerCase()) ||
      (it.description || '').toLowerCase().includes(search.toLowerCase())
    const matchCat = filterCategory === 'all' || it.category === filterCategory
    return matchSearch && matchCat
  })

  const filteredGrouped: Record<string, MenuItem[]> = {}
  for (const item of filteredItems) {
    if (!filteredGrouped[item.category]) filteredGrouped[item.category] = []
    filteredGrouped[item.category].push(item)
  }

  return (
    <div className="space-y-6 animate-slide-up">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">إدارة قائمة الطعام</h2>
          <p className="text-muted-foreground text-sm">
            {items.length} عنصر في {categories.length} فئة
          </p>
        </div>
        <Button onClick={() => { setEditingItem(null); setDialogOpen(true) }}>
          <Plus className="ml-2 h-4 w-4" /> إضافة طبق جديد
        </Button>
      </div>

      {/* أدوات البحث */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="ابحث عن طبق بالاسم..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pr-9"
              />
            </div>
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">كل الفئات</SelectItem>
                {categories.map(cat => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* عرض القائمة حسب الفئة */}
      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : filteredItems.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <UtensilsCrossed className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
            <p className="text-muted-foreground mb-4">لا توجد عناصر مطابقة</p>
            <Button onClick={() => { setEditingItem(null); setDialogOpen(true) }}>
              <Plus className="ml-2 h-4 w-4" /> أضف أول طبق
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {Object.entries(filteredGrouped).map(([category, catItems]) => (
            <Card key={category}>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Tag className="h-5 w-5 text-primary" />
                  {category}
                  <Badge variant="secondary" className="text-xs">
                    {catItems.length}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                  {catItems.map(item => (
                    <div
                      key={item.id}
                      className={`p-4 rounded-lg border transition-all hover:shadow-sm ${
                        !item.isActive ? 'opacity-60' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h4 className="font-semibold leading-tight">{item.name}</h4>
                        <Badge variant={item.isActive ? 'default' : 'secondary'} className="text-xs">
                          {item.isActive ? 'متاح' : 'متوقف'}
                        </Badge>
                      </div>
                      {item.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                          {item.description}
                        </p>
                      )}
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-lg font-bold text-primary">
                            {formatCurrency(item.price)}
                          </p>
                          {item.cost > 0 && (
                            <p className="text-xs text-muted-foreground">
                              تكلفة: {formatCurrency(item.cost)}
                            </p>
                          )}
                        </div>
                        <div className="flex gap-1">
                          <Button
                            size="sm" variant="ghost"
                            onClick={() => { setEditingItem(item); setDialogOpen(true) }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm" variant="ghost"
                            onClick={() => setDeleteTarget(item)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* نافذة الإضافة/التعديل */}
      <MenuItemDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        item={editingItem}
        categories={categories}
        onSuccess={fetchData}
      />

      {/* تأكيد الحذف */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>تعطيل العنصر</AlertDialogTitle>
            <AlertDialogDescription>
              هل تريد تعطيل &laquo;{deleteTarget?.name}&raquo;؟ سيبقى العنصر محفوظاً في القائمة ولن يظهر عند إنشاء فواتير جديدة، ويمكنك إعادة تفعيله لاحقاً.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                if (!deleteTarget) return
                try {
                  const res = await fetch(`/api/menu/${deleteTarget.id}`, { method: 'DELETE' })
                  if (!res.ok) throw new Error()
                  toast.success('تم تعطيل العنصر')
                  fetchData()
                } catch {
                  toast.error('فشل في التعطيل')
                }
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              نعم، تعطيل
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

function MenuItemDialog({
  open, onOpenChange, item, categories, onSuccess,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  item: MenuItem | null
  categories: string[]
  onSuccess: () => void
}) {
  const [name, setName] = useState('')
  const [category, setCategory] = useState('مشويات')
  const [price, setPrice] = useState('')
  const [cost, setCost] = useState('')
  const [description, setDescription] = useState('')
  const [isActive, setIsActive] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (open) {
      if (item) {
        setName(item.name)
        setCategory(item.category)
        setPrice(String(item.price))
        setCost(item.cost ? String(item.cost) : '')
        setDescription(item.description || '')
        setIsActive(item.isActive)
      } else {
        setName(''); setCategory(categories[0] || 'مشويات')
        setPrice(''); setCost(''); setDescription(''); setIsActive(true)
      }
    }
  }, [open, item, categories])

  const allCategories = Array.from(new Set([...DEFAULT_CATEGORIES, ...categories]))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !category.trim() || !price) {
      toast.error('الاسم والفئة والسعر مطلوبة')
      return
    }
    setSaving(true)
    try {
      const body = {
        name: name.trim(),
        category: category.trim(),
        price: Number(price),
        cost: cost ? Number(cost) : 0,
        description: description.trim() || undefined,
        isActive,
      }
      const url = item ? `/api/menu/${item.id}` : '/api/menu'
      const method = item ? 'PUT' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) throw new Error()
      toast.success(item ? 'تم تعديل العنصر بنجاح' : 'تم إضافة العنصر بنجاح')
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
          <DialogTitle>{item ? 'تعديل طبق' : 'إضافة طبق جديد'}</DialogTitle>
          <DialogDescription>
            {item ? 'عدّل بيانات الطبق' : 'أدخل بيانات الطبق الجديد في القائمة'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">اسم الطبق *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="مثال: شوي لحم ضأن"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">الفئة *</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger id="category">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {allCategories.map(cat => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="price">سعر البيع (ج.س) *</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                min="0"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="5000"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cost">التكلفة (اختياري)</Label>
              <Input
                id="cost"
                type="number"
                step="0.01"
                min="0"
                value={cost}
                onChange={(e) => setCost(e.target.value)}
                placeholder="2500"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">وصف الطبق</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="وصف مختصر للطبق..."
              rows={2}
            />
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
            <Label htmlFor="active" className="cursor-pointer">متاح للبيع</Label>
            <Switch
              id="active"
              checked={isActive}
              onCheckedChange={setIsActive}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              إلغاء
            </Button>
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
              {item ? 'حفظ التعديلات' : 'إضافة الطبق'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
