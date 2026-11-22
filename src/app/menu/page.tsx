'use client'

import { useEffect, useState, useCallback } from 'react'
import {
  ShoppingCart, Search, Plus, Minus, X, Loader2, Utensils,
  MapPin, Phone, CheckCircle2, Wallet, ArrowLeft, Star, Bell,
  ImageOff, MessageSquare, AlertCircle, RefreshCw,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  Card, CardContent,
} from '@/components/ui/card'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { toast } from 'sonner'
import { formatCurrency } from '@/lib/format'
import { RESTAURANT_INFO } from '@/lib/restaurant'

type MenuItem = {
  id: string
  name: string
  category: string
  price: number
  description: string | null
  imageUrl: string | null
  prepTime: number | null
  isAvailable: boolean
  avgRating: number
  totalReviews: number
}

type CartItem = {
  menuItemId: string
  name: string
  price: number
  quantity: number
  notes?: string
}

type Review = {
  id: string
  customerName: string | null
  rating: number
  comment: string | null
  createdAt: string
}

type Notification = {
  id: string
  message: string
  type: string
  reference: string | null
  createdAt: string
}

export default function MenuPage() {
  const [items, setItems] = useState<MenuItem[]>([])
  const [grouped, setGrouped] = useState<Record<string, MenuItem[]>>({})
  const [categories, setCategories] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState<string>('all')
  const [cart, setCart] = useState<CartItem[]>([])
  const [cartOpen, setCartOpen] = useState(false)
  const [checkoutOpen, setCheckoutOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [lastOrder, setLastOrder] = useState<any>(null)

  // حقول الدفع
  const [customerName, setCustomerName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [tableNumber, setTableNumber] = useState('')
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'wallet'>('cash')
  const [notes, setNotes] = useState('')

  // التقييمات
  const [reviewsOpen, setReviewsOpen] = useState<MenuItem | null>(null)
  const [reviewList, setReviewList] = useState<Review[]>([])
  const [reviewsLoading, setReviewsLoading] = useState(false)
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false)
  const [reviewItem, setReviewItem] = useState<MenuItem | null>(null)
  const [reviewRating, setReviewRating] = useState(5)
  const [reviewComment, setReviewComment] = useState('')
  const [reviewName, setReviewName] = useState('')
  const [reviewSubmitting, setReviewSubmitting] = useState(false)

  // الإشعارات
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])

  const fetchMenu = useCallback(async () => {
    setLoading(true)
    setLoadError(null)
    try {
      const res = await fetch('/api/public/menu')
      if (!res.ok) throw new Error('فشل الاتصال بالخادم')
      const json = await res.json()
      setItems(json.items || [])
      setGrouped(json.grouped || {})
      setCategories(json.categories || [])
    } catch (e: any) {
      setLoadError(e.message || 'تعذر جلب القائمة. تحقق من اتصالك بالإنترنت وحاول مرة أخرى.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchMenu()
  }, [fetchMenu])

  // فحص الإشعارات عند إدخال رقم الهاتف
  const fetchNotifications = useCallback(async () => {
    if (!customerPhone.trim()) {
      setNotifications([])
      return
    }
    try {
      const res = await fetch(`/api/public/notifications?phone=${encodeURIComponent(customerPhone.trim())}`)
      const json = await res.json()
      setNotifications(json.notifications || [])
    } catch {
      // تجاهل
    }
  }, [customerPhone])

  useEffect(() => {
    if (customerPhone.length >= 9) {
      fetchNotifications()
    }
  }, [customerPhone, fetchNotifications])

  // تحديث الإشعارات تلقائياً كل 15 ثانية
  useEffect(() => {
    if (!customerPhone.trim() || customerPhone.length < 9) return
    const interval = setInterval(fetchNotifications, 15000)
    return () => clearInterval(interval)
  }, [customerPhone, fetchNotifications])

  const filteredItems = items.filter(it => {
    const matchSearch = !search ||
      it.name.toLowerCase().includes(search.toLowerCase()) ||
      (it.description || '').toLowerCase().includes(search.toLowerCase())
    const matchCat = activeCategory === 'all' || it.category === activeCategory
    return matchSearch && matchCat
  })

  const cartCount = cart.reduce((s, it) => s + it.quantity, 0)
  const cartTotal = cart.reduce((s, it) => s + it.price * it.quantity, 0)

  const addToCart = (item: MenuItem) => {
    if (!item.isAvailable) {
      toast.error('هذا الصنف غير متاح حالياً')
      return
    }
    setCart(prev => {
      const existing = prev.find(c => c.menuItemId === item.id)
      if (existing) {
        return prev.map(c =>
          c.menuItemId === item.id ? { ...c, quantity: c.quantity + 1 } : c
        )
      }
      return [...prev, {
        menuItemId: item.id,
        name: item.name,
        price: item.price,
        quantity: 1,
      }]
    })
    toast.success(`أضيف: ${item.name}`)
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

  const handleSubmitOrder = async () => {
    if (cart.length === 0) {
      toast.error('السلة فارغة')
      return
    }
    if (!customerPhone.trim() && paymentMethod === 'wallet') {
      toast.error('يجب إدخال رقم الهاتف للدفع من المحفظة')
      return
    }
    setSubmitting(true)
    try {
      const res = await fetch('/api/public/place-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: customerName.trim(),
          customerPhone: customerPhone.trim(),
          tableNumber: tableNumber.trim(),
          items: cart,
          paymentMethod,
          notes: notes.trim(),
        }),
      })
      const json = await res.json()
      if (!res.ok) {
        throw new Error(json.error || 'فشل في إرسال الطلب')
      }
      setLastOrder(json.order)
      setCart([])
      setCheckoutOpen(false)
      setCustomerName(''); setTableNumber(''); setNotes('')
      setPaymentMethod('cash')
      toast.success(json.message)
    } catch (e: any) {
      toast.error(e.message || 'فشل في إرسال الطلب')
    } finally {
      setSubmitting(false)
    }
  }

  // عرض تقييمات طبق
  const openReviews = async (item: MenuItem) => {
    setReviewsOpen(item)
    setReviewsLoading(true)
    try {
      const res = await fetch(`/api/public/reviews?menuItemId=${item.id}`)
      const json = await res.json()
      setReviewList(json.reviews || [])
    } catch {
      toast.error('تعذر جلب التقييمات')
    } finally {
      setReviewsLoading(false)
    }
  }

  // فتح نافذة إضافة تقييم
  const openReviewDialog = (item: MenuItem) => {
    setReviewItem(item)
    setReviewRating(5)
    setReviewComment('')
    setReviewName(customerName || '')
    setReviewDialogOpen(true)
  }

  const submitReview = async () => {
    if (!reviewItem) return
    if (!reviewComment.trim() && !reviewName.trim()) {
      toast.error('أضف تعليقاً أو اسمك على الأقل')
      return
    }
    setReviewSubmitting(true)
    try {
      const res = await fetch('/api/public/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          menuItemId: reviewItem.id,
          customerName: reviewName.trim() || undefined,
          customerPhone: customerPhone.trim() || undefined,
          rating: reviewRating,
          comment: reviewComment.trim() || undefined,
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error)
      toast.success('شكراً لك! تم إضافة تقييمك')
      setReviewDialogOpen(false)
      fetchMenu() // إعادة تحديث القائمة بمتوسط التقييم الجديد
      if (reviewsOpen?.id === reviewItem.id) {
        openReviews(reviewItem)
      }
    } catch (e: any) {
      toast.error(e.message || 'فشل في إضافة التقييم')
    } finally {
      setReviewSubmitting(false)
    }
  }

  const unreadCount = notifications.length

  return (
    <div className="min-h-screen bg-gradient-to-b from-accent/20 to-background">
      {/* رأس الصفحة */}
      <header className="sticky top-0 z-30 bg-card/95 backdrop-blur-md border-b shadow-sm">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between gap-3">
            <a href="/" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-4 w-4" />
              العودة
            </a>
            <div className="text-center flex-1">
              <h1 className="text-base font-bold">{RESTAURANT_INFO.name}</h1>
              <p className="text-xs text-primary">{RESTAURANT_INFO.subtitle}</p>
            </div>
            <button
              onClick={() => setNotificationsOpen(true)}
              className="relative p-2 rounded-lg hover:bg-muted transition-colors"
              aria-label="الإشعارات"
            >
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -left-1 bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full h-4 min-w-4 px-1 flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* شعار المطعم */}
      <div className="bg-primary text-primary-foreground py-6">
        <div className="container mx-auto px-4 text-center">
          <div className="inline-flex w-14 h-14 rounded-2xl bg-primary-foreground/20 items-center justify-center mb-2">
            <Utensils className="h-7 w-7" />
          </div>
          <h2 className="text-xl font-bold">{RESTAURANT_INFO.name}</h2>
          <p className="text-sm opacity-90">{RESTAURANT_INFO.subtitle}</p>
          <div className="flex items-center justify-center gap-4 mt-2 text-xs opacity-90">
            <span className="flex items-center gap-1">
              <MapPin className="h-3 w-3" /> {RESTAURANT_INFO.address}
            </span>
            <span className="flex items-center gap-1" dir="ltr">
              <Phone className="h-3 w-3" /> {RESTAURANT_INFO.phones[0]}
            </span>
          </div>
        </div>
      </div>

      {/* تنبيه رقم الهاتف للاطلاع على الإشعارات */}
      {customerPhone && customerPhone.length >= 9 && unreadCount > 0 && (
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 text-center text-sm text-amber-800">
          لديك {unreadCount} إشعار جديد. <button onClick={() => setNotificationsOpen(true)} className="font-bold underline">عرض</button>
        </div>
      )}

      {/* البحث */}
      <div className="sticky top-[60px] z-20 bg-background/95 backdrop-blur border-b">
        <div className="container mx-auto px-4 py-3">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="ابحث عن طبق..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pr-9"
            />
          </div>
          {/* فئات أفقية */}
          <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
            <button
              onClick={() => setActiveCategory('all')}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                activeCategory === 'all' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
              }`}
            >
              الكل
            </button>
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  activeCategory === cat ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* القائمة */}
      <main className="container mx-auto px-4 py-4 pb-32">
        {loading ? (
          <div className="flex flex-col justify-center items-center py-20 gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">جاري تحميل القائمة...</p>
          </div>
        ) : loadError ? (
          <div className="py-20 text-center">
            <AlertCircle className="h-12 w-12 mx-auto mb-3 text-destructive" />
            <p className="text-destructive mb-4 px-4">{loadError}</p>
            <Button onClick={fetchMenu} variant="outline">
              <RefreshCw className="h-4 w-4 ml-2" /> إعادة المحاولة
            </Button>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="py-20 text-center text-muted-foreground">
            <Utensils className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>لا توجد أصناف متاحة</p>
          </div>
        ) : (
          <div className="space-y-6">
            {activeCategory === 'all' ? (
              Object.entries(grouped).map(([category, catItems]) => (
                <section key={category}>
                  <h2 className="text-lg font-bold mb-3 px-1">{category}</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {catItems.map(item => (
                      <MenuItemCard
                        key={item.id}
                        item={item}
                        onAdd={addToCart}
                        onViewReviews={openReviews}
                        onAddReview={openReviewDialog}
                      />
                    ))}
                  </div>
                </section>
              ))
            ) : (
              <section>
                <h2 className="text-lg font-bold mb-3 px-1">{activeCategory}</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {filteredItems.map(item => (
                    <MenuItemCard
                      key={item.id}
                      item={item}
                      onAdd={addToCart}
                      onViewReviews={openReviews}
                      onAddReview={openReviewDialog}
                    />
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </main>

      {/* زر السلة العائم */}
      {cart.length > 0 && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 w-full max-w-md px-4">
          <Button
            onClick={() => setCartOpen(true)}
            className="w-full h-14 rounded-full shadow-lg flex items-center justify-between px-6"
            size="lg"
          >
            <div className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              <span className="font-medium">{cartCount} صنف</span>
            </div>
            <span className="font-bold">{formatCurrency(cartTotal)}</span>
          </Button>
        </div>
      )}

      {/* نافذة السلة */}
      <Dialog open={cartOpen} onOpenChange={setCartOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" /> سلة الطلبات
            </DialogTitle>
            <DialogDescription>راجع طلبك قبل الإرسال</DialogDescription>
          </DialogHeader>

          {cart.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">السلة فارغة</p>
          ) : (
            <div className="space-y-3">
              <ScrollArea className="max-h-[300px] -mx-2 px-2">
                <div className="space-y-2">
                  {cart.map(item => (
                    <div key={item.menuItemId} className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{item.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatCurrency(item.price)} × {item.quantity}
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
              </ScrollArea>

              <div className="p-3 rounded-lg bg-muted">
                <div className="flex justify-between font-bold text-base">
                  <span>الإجمالي</span>
                  <span className="text-primary">{formatCurrency(cartTotal)}</span>
                </div>
              </div>

              <Button
                onClick={() => { setCartOpen(false); setCheckoutOpen(true) }}
                className="w-full"
                size="lg"
              >
                متابعة الطلب
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* نافذة إتمام الطلب */}
      <Dialog open={checkoutOpen} onOpenChange={setCheckoutOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>إتمام الطلب</DialogTitle>
            <DialogDescription>أدخل بياناتك لإرسال الطلب للمطعم</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="customerName">الاسم</Label>
              <Input
                id="customerName"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="اسمك الكامل"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="customerPhone">رقم الهاتف *</Label>
              <Input
                id="customerPhone"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder="0123456789"
                dir="ltr"
                required
              />
              <p className="text-xs text-muted-foreground">
                يُستخدم لربط الطلب بمحفظتك وتلقي إشعارات حالة الطلب
              </p>
              {customerPhone.length >= 9 && unreadCount > 0 && (
                <p className="text-xs text-amber-600 flex items-center gap-1">
                  <Bell className="h-3 w-3" />
                  لديك {unreadCount} إشعار جديد
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="tableNumber">رقم الطاولة (إن وجد)</Label>
              <Input
                id="tableNumber"
                value={tableNumber}
                onChange={(e) => setTableNumber(e.target.value)}
                placeholder="مثال: 5"
              />
            </div>

            <div className="space-y-2">
              <Label>طريقة الدفع</Label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('cash')}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    paymentMethod === 'cash' ? 'border-primary bg-primary/10' : 'border-border'
                  }`}
                >
                  <div className="text-center">
                    <Wallet className="h-5 w-5 mx-auto mb-1" />
                    <p className="text-sm font-medium">نقداً</p>
                    <p className="text-xs text-muted-foreground">عند الاستلام</p>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('wallet')}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    paymentMethod === 'wallet' ? 'border-primary bg-primary/10' : 'border-border'
                  }`}
                >
                  <div className="text-center">
                    <Wallet className="h-5 w-5 mx-auto mb-1" />
                    <p className="text-sm font-medium">المحفظة</p>
                    <p className="text-xs text-muted-foreground">شحن مسبق</p>
                  </div>
                </button>
              </div>
              {paymentMethod === 'wallet' && (
                <p className="text-xs text-amber-600 mt-1">
                  سيتم خصم المبلغ من رصيد محفظتك المرتبطة برقم هاتفك
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">ملاحظات</Label>
              <Input
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="مثال: بدون بصل، حار..."
              />
            </div>

            <div className="p-3 rounded-lg bg-muted">
              <div className="flex justify-between font-bold text-base">
                <span>الإجمالي</span>
                <span className="text-primary">{formatCurrency(cartTotal)}</span>
              </div>
            </div>

            <Button
              onClick={handleSubmitOrder}
              disabled={submitting || !customerPhone.trim()}
              className="w-full"
              size="lg"
            >
              {submitting && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
              إرسال الطلب
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* نافذة نجاح الطلب */}
      <Dialog open={!!lastOrder} onOpenChange={(o) => !o && setLastOrder(null)}>
        <DialogContent className="max-w-md">
          <div className="text-center py-4">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <h3 className="text-lg font-bold mb-2">تم استلام طلبك!</h3>
            <p className="text-muted-foreground mb-4">
              رقم طلبك: <span className="font-mono font-bold text-primary">{lastOrder?.orderNumber}</span>
            </p>
            {lastOrder?.paymentMethod === 'wallet' ? (
              <p className="text-sm bg-emerald-50 text-emerald-700 p-3 rounded-lg mb-4">
                تم خصم {formatCurrency(lastOrder?.total)} من محفظتك
              </p>
            ) : (
              <p className="text-sm bg-muted p-3 rounded-lg mb-4">
                سيتم تأكيد طلبك قريباً. الدفع نقداً عند الاستلام.
              </p>
            )}
            <p className="text-xs text-muted-foreground mb-4 flex items-center justify-center gap-1">
              <Bell className="h-3 w-3" />
              ستتلقى إشعارات بحالة طلبك على رقم هاتفك
            </p>
            <Button
              onClick={() => { setLastOrder(null); fetchMenu() }}
              variant="outline"
              className="w-full"
            >
              متابعة التصفح
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* نافذة التقييمات */}
      <Dialog open={!!reviewsOpen} onOpenChange={(o) => !o && setReviewsOpen(null)}>
        <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Star className="h-5 w-5 text-amber-500" />
              تقييمات: {reviewsOpen?.name}
            </DialogTitle>
            <DialogDescription>
              {reviewsOpen && (
                <span className="flex items-center gap-2 mt-1">
                  <span className="flex items-center gap-1">
                    <Star className="h-4 w-4 fill-amber-500 text-amber-500" />
                    <span className="font-bold">{reviewsOpen.avgRating}</span>
                  </span>
                  <span className="text-muted-foreground">
                    ({reviewsOpen.totalReviews} تقييم)
                  </span>
                </span>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            {reviewsLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : reviewList.length === 0 ? (
              <div className="text-center py-8">
                <MessageSquare className="h-10 w-10 mx-auto mb-2 text-muted-foreground opacity-50" />
                <p className="text-muted-foreground text-sm">لا توجد تقييمات بعد</p>
                <p className="text-muted-foreground text-xs">كن أول من يقيّم هذا الطبق!</p>
              </div>
            ) : (
              <ScrollArea className="max-h-[400px] -mx-2 px-2">
                <div className="space-y-3">
                  {reviewList.map(review => (
                    <div key={review.id} className="p-3 rounded-lg bg-muted/50">
                      <div className="flex items-center justify-between mb-1">
                        <p className="font-medium text-sm">{review.customerName || 'زبون'}</p>
                        <div className="flex items-center gap-0.5">
                          {[1, 2, 3, 4, 5].map(n => (
                            <Star
                              key={n}
                              className={`h-3 w-3 ${
                                n <= review.rating
                                  ? 'fill-amber-500 text-amber-500'
                                  : 'text-muted-foreground'
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                      {review.comment && (
                        <p className="text-sm text-muted-foreground">{review.comment}</p>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(review.createdAt).toLocaleDateString('ar-SD')}
                      </p>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}

            {reviewsOpen && (
              <Button
                onClick={() => openReviewDialog(reviewsOpen)}
                variant="outline"
                className="w-full"
              >
                <Star className="h-4 w-4 ml-2" />
                أضف تقييمك
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* نافذة إضافة تقييم */}
      <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>تقييم: {reviewItem?.name}</DialogTitle>
            <DialogDescription>شاركنا رأيك في هذا الطبق</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>التقييم *</Label>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map(n => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setReviewRating(n)}
                    className="p-1"
                  >
                    <Star
                      className={`h-8 w-8 transition-colors ${
                        n <= reviewRating
                          ? 'fill-amber-500 text-amber-500'
                          : 'text-muted-foreground hover:text-amber-400'
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="reviewName">الاسم</Label>
              <Input
                id="reviewName"
                value={reviewName}
                onChange={(e) => setReviewName(e.target.value)}
                placeholder="اسمك (اختياري)"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="reviewComment">التعليق</Label>
              <Textarea
                id="reviewComment"
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                placeholder="كيف كان الطعم؟ هل تنصح به؟"
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setReviewDialogOpen(false)}>إلغاء</Button>
            <Button onClick={submitReview} disabled={reviewSubmitting}>
              {reviewSubmitting && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
              إرسال التقييم
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* نافذة الإشعارات */}
      <Dialog open={notificationsOpen} onOpenChange={setNotificationsOpen}>
        <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              الإشعارات
            </DialogTitle>
            <DialogDescription>
              {customerPhone
                ? `مرتبطة برقم: ${customerPhone}`
                : 'أدخل رقم هاتفك في نموذج الطلب لرؤية إشعاراتك'}
            </DialogDescription>
          </DialogHeader>

          {notifications.length === 0 ? (
            <div className="text-center py-8">
              <Bell className="h-10 w-10 mx-auto mb-2 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground text-sm">لا توجد إشعارات</p>
            </div>
          ) : (
            <ScrollArea className="max-h-[500px] -mx-2 px-2">
              <div className="space-y-2">
                {notifications.map(notif => (
                  <div key={notif.id} className="p-3 rounded-lg bg-muted/50 border-r-4 border-primary">
                    <p className="text-sm">{notif.message}</p>
                    {notif.reference && (
                      <p className="text-xs text-muted-foreground mt-1 font-mono">
                        طلب: {notif.reference}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(notif.createdAt).toLocaleString('ar-SD')}
                    </p>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

function MenuItemCard({
  item, onAdd, onViewReviews, onAddReview,
}: {
  item: MenuItem
  onAdd: (item: MenuItem) => void
  onViewReviews: (item: MenuItem) => void
  onAddReview: (item: MenuItem) => void
}) {
  return (
    <Card className={`overflow-hidden ${!item.isAvailable ? 'opacity-60' : ''}`}>
      {/* صورة الطبق */}
      {item.imageUrl ? (
        <div className="aspect-video bg-muted overflow-hidden">
          { }
          <img
            src={item.imageUrl}
            alt={item.name}
            className="w-full h-full object-cover"
            onError={(e) => {
              const target = e.currentTarget
              target.style.display = 'none'
            }}
          />
        </div>
      ) : (
        <div className="aspect-video bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center">
          <ImageOff className="h-10 w-10 text-muted-foreground/40" />
        </div>
      )}

      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold mb-1">{item.name}</h4>
            {item.description && (
              <p className="text-xs text-muted-foreground mb-2 line-clamp-2">{item.description}</p>
            )}
            <div className="flex items-center gap-2 flex-wrap mb-2">
              <p className="text-primary font-bold">{formatCurrency(item.price)}</p>
              {item.prepTime && (
                <Badge variant="outline" className="text-xs">
                  {item.prepTime} دقيقة
                </Badge>
              )}
              {!item.isAvailable && (
                <Badge variant="destructive" className="text-xs">غير متاح</Badge>
              )}
            </div>

            {/* التقييم */}
            {item.totalReviews > 0 && (
              <button
                onClick={() => onViewReviews(item)}
                className="flex items-center gap-1 text-xs hover:underline"
              >
                <div className="flex items-center gap-0.5">
                  {[1, 2, 3, 4, 5].map(n => (
                    <Star
                      key={n}
                      className={`h-3 w-3 ${
                        n <= Math.round(item.avgRating)
                          ? 'fill-amber-500 text-amber-500'
                          : 'text-muted-foreground'
                      }`}
                    />
                  ))}
                </div>
                <span className="font-bold">{item.avgRating}</span>
                <span className="text-muted-foreground">({item.totalReviews})</span>
              </button>
            )}
          </div>
        </div>

        {/* أزرار */}
        <div className="flex gap-2 mt-3">
          <Button
            size="sm"
            onClick={() => onAdd(item)}
            disabled={!item.isAvailable}
            className="flex-1"
          >
            <Plus className="h-4 w-4 ml-1" /> إضافة
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => onAddReview(item)}
          >
            <Star className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
