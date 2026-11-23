'use client'
import { apiFetch } from '@/lib/api-client'

import { useEffect, useState, useCallback } from 'react'
import {
  Plus, Search, Edit, Loader2, Boxes, AlertTriangle,
  TrendingUp, TrendingDown, History, Package,
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
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { toast } from 'sonner'
import { formatCurrency, formatNumber, formatDateTime } from '@/lib/format'
import type { AppUser } from './app'

type InventoryItem = {
  id: string
  name: string
  category: string
  unit: string
  quantity: number
  minQuantity: number
  costPerUnit: number
  isActive: boolean
  notes: string | null
  updatedAt: string
}

type Movement = {
  id: string
  type: string
  quantity: number
  reason: string | null
  reference: string | null
  createdAt: string
  inventoryItem: { name: string }
}

const DEFAULT_CATEGORIES = ['لحوم', 'خضروات', 'مواد جافة', 'مشروبات', 'توابل', 'أخرى']
const DEFAULT_UNITS = ['كجم', 'لتر', 'قطعة', 'كيس', 'علبة', 'حزمة', 'علبة']

export default function Inventory({ user }: { user: AppUser }) {
  const [items, setItems] = useState<InventoryItem[]>([])
  const [grouped, setGrouped] = useState<Record<string, InventoryItem[]>>({})
  const [categories, setCategories] = useState<string[]>([])
  const [stats, setStats] = useState({ total: 0, totalValue: 0, lowStock: 0 })
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterCategory, setFilterCategory] = useState('all')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null)
  const [tab, setTab] = useState<'items' | 'movements'>('items')
  const [movements, setMovements] = useState<Movement[]>([])
  const [movementsLoading, setMovementsLoading] = useState(false)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await apiFetch('/api/inventory')
      const json = await res.json()
      setItems(json.items)
      setGrouped(json.grouped)
      setCategories(json.categories)
      setStats(json.stats)
    } catch {
      toast.error('تعذر جلب المخزون')
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchMovements = useCallback(async () => {
    setMovementsLoading(true)
    try {
      const res = await apiFetch('/api/inventory/movements?limit=50')
      const json = await res.json()
      setMovements(json.movements || [])
    } catch {
      toast.error('تعذر جلب الحركات')
    } finally {
      setMovementsLoading(false)
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  useEffect(() => {
    if (tab === 'movements') fetchMovements()
  }, [tab, fetchMovements])

  const filteredItems = items.filter(it => {
    const matchSearch = !search || it.name.toLowerCase().includes(search.toLowerCase())
    const matchCat = filterCategory === 'all' || it.category === filterCategory
    return matchSearch && matchCat
  })

  const filteredGrouped: Record<string, InventoryItem[]> = {}
  for (const item of filteredItems) {
    if (!filteredGrouped[item.category]) filteredGrouped[item.category] = []
    filteredGrouped[item.category].push(item)
  }

  return (
    <div className="space-y-6 animate-slide-up">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">المخزون</h2>
          <p className="text-muted-foreground text-sm">
            {stats.total} صنف - قيمة المخزون: {formatCurrency(stats.totalValue)}
          </p>
        </div>
        <Button onClick={() => { setEditingItem(null); setDialogOpen(true) }}>
          <Plus className="ml-2 h-4 w-4" /> إضافة صنف
        </Button>
      </div>

      {/* بطاقات إحصائية */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">إجمالي الأصناف</p>
              <p className="text-2xl font-bold">{formatNumber(stats.total)}</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-secondary text-secondary-foreground flex items-center justify-center">
              <Boxes className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">قيمة المخزون</p>
              <p className="text-2xl font-bold text-primary">{formatCurrency(stats.totalValue)}</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-primary text-primary-foreground flex items-center justify-center">
              <Package className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
        <Card className={stats.lowStock > 0 ? 'border-amber-400' : ''}>
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">تنبيهات النواقص</p>
              <p className="text-2xl font-bold text-amber-600">{stats.lowStock}</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
              <AlertTriangle className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as any)}>
        <TabsList>
          <TabsTrigger value="items"><Boxes className="h-4 w-4 ml-2" /> الأصناف</TabsTrigger>
          <TabsTrigger value="movements"><History className="h-4 w-4 ml-2" /> سجل الحركات</TabsTrigger>
        </TabsList>

        <TabsContent value="items" className="space-y-4 mt-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-wrap gap-3">
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="ابحث عن صنف..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pr-9"
                  />
                </div>
                <Select value={filterCategory} onValueChange={setFilterCategory}>
                  <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">كل الفئات</SelectItem>
                    {categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {loading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filteredItems.length === 0 ? (
            <Card>
              <CardContent className="py-16 text-center">
                <Boxes className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
                <p className="text-muted-foreground mb-4">لا توجد أصناف</p>
                <Button onClick={() => { setEditingItem(null); setDialogOpen(true) }}>
                  <Plus className="ml-2 h-4 w-4" /> أضف أول صنف
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {Object.entries(filteredGrouped).map(([category, catItems]) => (
                <Card key={category}>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Package className="h-5 w-5 text-primary" />
                      {category}
                      <Badge variant="secondary">{catItems.length}</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="max-h-[400px]">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="text-right">الصنف</TableHead>
                            <TableHead className="text-center">الكمية</TableHead>
                            <TableHead className="text-center">حد التنبيه</TableHead>
                            <TableHead className="text-center">التكلفة/وحدة</TableHead>
                            <TableHead className="text-left">القيمة الإجمالية</TableHead>
                            <TableHead className="text-center">إجراء</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {catItems.map(item => {
                            const isLow = item.quantity <= item.minQuantity
                            const totalValue = item.quantity * item.costPerUnit
                            return (
                              <TableRow key={item.id} className={!item.isActive ? 'opacity-60' : ''}>
                                <TableCell className="font-medium">
                                  {item.name}
                                  {isLow && (
                                    <Badge variant="destructive" className="mr-2 text-xs">
                                      <AlertTriangle className="h-3 w-3 ml-1" />
                                      ناقص
                                    </Badge>
                                  )}
                                </TableCell>
                                <TableCell className="text-center">
                                  <span className={isLow ? 'font-bold text-amber-600' : ''}>
                                    {formatNumber(item.quantity)}
                                  </span>
                                  <span className="text-xs text-muted-foreground mr-1">{item.unit}</span>
                                </TableCell>
                                <TableCell className="text-center text-muted-foreground">
                                  {formatNumber(item.minQuantity)} {item.unit}
                                </TableCell>
                                <TableCell className="text-center">
                                  {formatCurrency(item.costPerUnit)}
                                </TableCell>
                                <TableCell className="text-left font-semibold text-primary">
                                  {formatCurrency(totalValue)}
                                </TableCell>
                                <TableCell>
                                  <div className="flex justify-center">
                                    <Button size="sm" variant="ghost" onClick={() => { setEditingItem(item); setDialogOpen(true) }}>
                                      <Edit className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            )
                          })}
                        </TableBody>
                      </Table>
                    </ScrollArea>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="movements" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <History className="h-5 w-5 text-primary" />
                سجل حركات المخزون
              </CardTitle>
              <CardDescription>آخر 50 حركة (شراء، استخدام، تسوية)</CardDescription>
            </CardHeader>
            <CardContent>
              {movementsLoading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : movements.length === 0 ? (
                <p className="text-center text-muted-foreground py-12">لا توجد حركات بعد</p>
              ) : (
                <ScrollArea className="max-h-[500px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-right">الصنف</TableHead>
                        <TableHead className="text-center">النوع</TableHead>
                        <TableHead className="text-center">الكمية</TableHead>
                        <TableHead className="text-right">السبب</TableHead>
                        <TableHead className="text-right">المرجع</TableHead>
                        <TableHead className="text-left">التاريخ</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {movements.map(m => {
                        const isIn = m.type === 'in'
                        const isAdjust = m.type === 'adjust'
                        return (
                          <TableRow key={m.id}>
                            <TableCell className="font-medium">{m.inventoryItem.name}</TableCell>
                            <TableCell className="text-center">
                              <Badge variant={isIn ? 'default' : isAdjust ? 'secondary' : 'destructive'}>
                                {isIn ? <><TrendingUp className="h-3 w-3 ml-1" /> وارد</> : isAdjust ? 'تسوية' : <><TrendingDown className="h-3 w-3 ml-1" /> صادر</>}
                              </Badge>
                            </TableCell>
                            <TableCell className={`text-center font-bold ${m.quantity > 0 ? 'text-emerald-600' : 'text-destructive'}`}>
                              {m.quantity > 0 ? '+' : ''}{formatNumber(m.quantity)}
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">{m.reason || '—'}</TableCell>
                            <TableCell className="font-mono text-xs">{m.reference || '—'}</TableCell>
                            <TableCell className="text-muted-foreground text-sm">{formatDateTime(m.createdAt)}</TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <InventoryDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        item={editingItem}
        categories={categories}
        onSuccess={fetchData}
      />
    </div>
  )
}

function InventoryDialog({
  open, onOpenChange, item, categories, onSuccess,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  item: InventoryItem | null
  categories: string[]
  onSuccess: () => void
}) {
  const [name, setName] = useState('')
  const [category, setCategory] = useState('لحوم')
  const [unit, setUnit] = useState('كجم')
  const [quantity, setQuantity] = useState('')
  const [minQuantity, setMinQuantity] = useState('')
  const [costPerUnit, setCostPerUnit] = useState('')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (open) {
      if (item) {
        setName(item.name); setCategory(item.category); setUnit(item.unit)
        setQuantity(String(item.quantity)); setMinQuantity(String(item.minQuantity))
        setCostPerUnit(String(item.costPerUnit)); setNotes(item.notes || '')
      } else {
        setName(''); setCategory(categories[0] || 'لحوم'); setUnit('كجم')
        setQuantity(''); setMinQuantity(''); setCostPerUnit(''); setNotes('')
      }
    }
  }, [open, item, categories])

  const allCategories = Array.from(new Set([...DEFAULT_CATEGORIES, ...categories]))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !category || !unit) {
      toast.error('الاسم والفئة والوحدة مطلوبة')
      return
    }
    setSaving(true)
    try {
      const body = {
        name: name.trim(),
        category: category.trim(),
        unit: unit.trim(),
        quantity: Number(quantity) || 0,
        minQuantity: Number(minQuantity) || 0,
        costPerUnit: Number(costPerUnit) || 0,
        notes: notes.trim() || undefined,
      }
      const url = item ? `/api/inventory/${item.id}` : '/api/inventory'
      const method = item ? 'PUT' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) throw new Error()
      toast.success(item ? 'تم تعديل الصنف' : 'تم إضافة الصنف')
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
          <DialogTitle>{item ? 'تعديل صنف' : 'إضافة صنف مخزون'}</DialogTitle>
          <DialogDescription>
            {item ? 'عدّل بيانات الصنف' : 'أدخل بيانات الصنف الجديد في المخزون'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">اسم الصنف *</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="مثال: لحم ضأن" required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>الفئة *</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {allCategories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>الوحدة *</Label>
              <Select value={unit} onValueChange={setUnit}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {DEFAULT_UNITS.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="quantity">الكمية الحالية</Label>
              <Input id="quantity" type="number" step="0.01" min="0" value={quantity} onChange={(e) => setQuantity(e.target.value)} placeholder="0" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="minQuantity">حد التنبيه</Label>
              <Input id="minQuantity" type="number" step="0.01" min="0" value={minQuantity} onChange={(e) => setMinQuantity(e.target.value)} placeholder="0" />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="costPerUnit">التكلفة لكل وحدة (ج.س)</Label>
            <Input id="costPerUnit" type="number" step="0.01" min="0" value={costPerUnit} onChange={(e) => setCostPerUnit(e.target.value)} placeholder="0" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">ملاحظات</Label>
            <Textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="ملاحظات إضافية..." rows={2} />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>إلغاء</Button>
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
              {item ? 'حفظ التعديلات' : 'إضافة الصنف'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
