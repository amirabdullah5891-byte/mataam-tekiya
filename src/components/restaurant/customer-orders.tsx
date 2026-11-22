'use client'

import { useEffect, useState, useCallback } from 'react'
import {
  Bell, Loader2, Eye, CheckCircle2, Clock, ChefHat, Package,
  XCircle, ShoppingCart, User, Phone, Wallet, Receipt,
} from 'lucide-react'
import {
  Card, CardContent, CardHeader, CardTitle, CardDescription,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { ScrollArea } from '@/components/ui/scroll-area'
import { toast } from 'sonner'
import { formatCurrency, formatDateTime } from '@/lib/format'
import { RESTAURANT_INFO } from '@/lib/restaurant'
import type { AppUser } from './app'

type OrderItem = {
  id: string
  name: string
  quantity: number
  price: number
  total: number
  notes: string | null
}

type CustomerOrder = {
  id: string
  orderNumber: string
  customerName: string | null
  customerPhone: string | null
  tableNumber: string | null
  items: OrderItem[]
  subtotal: number
  total: number
  paymentMethod: string
  status: string
  notes: string | null
  acceptedBy: { name: string } | null
  acceptedAt: string | null
  completedAt: string | null
  createdAt: string
}

const STATUS_FLOW = [
  { id: 'pending', label: 'بانتظار التأكيد', icon: <Clock className="h-3.5 w-3.5" />, color: 'bg-amber-500' },
  { id: 'confirmed', label: 'مؤكد', icon: <CheckCircle2 className="h-3.5 w-3.5" />, color: 'bg-blue-500' },
  { id: 'preparing', label: 'قيد التحضير', icon: <ChefHat className="h-3.5 w-3.5" />, color: 'bg-purple-500' },
  { id: 'ready', label: 'جاهز', icon: <Package className="h-3.5 w-3.5" />, color: 'bg-emerald-500' },
  { id: 'completed', label: 'مكتمل', icon: <CheckCircle2 className="h-3.5 w-3.5" />, color: 'bg-emerald-700' },
  { id: 'cancelled', label: 'ملغى', icon: <XCircle className="h-3.5 w-3.5" />, color: 'bg-red-500' },
]

function statusLabel(status: string): string {
  return STATUS_FLOW.find(s => s.id === status)?.label || status
}

function statusBadge(status: string) {
  const s = STATUS_FLOW.find(x => x.id === status)
  if (!s) return <Badge variant="secondary">{status}</Badge>
  return (
    <Badge className={`${s.color} text-white`}>
      {s.icon}
      <span className="mr-1">{s.label}</span>
    </Badge>
  )
}

export default function CustomerOrders({ user }: { user: AppUser }) {
  const [orders, setOrders] = useState<CustomerOrder[]>([])
  const [stats, setStats] = useState<any>({})
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('pending')
  const [viewOrder, setViewOrder] = useState<CustomerOrder | null>(null)
  const [updating, setUpdating] = useState(false)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/customer-orders?status=${statusFilter}&limit=50`)
      const json = await res.json()
      setOrders(json.orders || [])
      setStats(json.stats || {})
    } catch {
      toast.error('تعذر جلب الطلبات')
    } finally {
      setLoading(false)
    }
  }, [statusFilter])

  useEffect(() => {
    fetchData()
    // إعادة التحميل التلقائي كل 30 ثانية للطلبات الجديدة
    const interval = setInterval(fetchData, 30000)
    return () => clearInterval(interval)
  }, [fetchData])

  const updateStatus = async (orderId: string, newStatus: string) => {
    setUpdating(true)
    try {
      const res = await fetch(`/api/customer-orders/${orderId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error)

      toast.success(
        newStatus === 'cancelled'
          ? json.message || 'تم إلغاء الطلب'
          : `تم تحديث الحالة إلى: ${statusLabel(newStatus)}`
      )
      fetchData()
      if (viewOrder?.id === orderId) {
        setViewOrder({ ...viewOrder, status: newStatus })
      }
    } catch (e: any) {
      toast.error(e.message || 'فشل في تحديث الحالة')
    } finally {
      setUpdating(false)
    }
  }

  return (
    <div className="space-y-6 animate-slide-up">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Bell className="h-6 w-6 text-primary" />
            طلبات الزبائن
          </h2>
          <p className="text-muted-foreground text-sm">
            الطلبات الواردة من واجهة المنيو - يتم تحديثها تلقائياً كل 30 ثانية
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchData} disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Bell className="h-4 w-4" />}
          تحديث
        </Button>
      </div>

      {/* بطاقات الإحصائيات حسب الحالة */}
      <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
        {STATUS_FLOW.map(s => (
          <button
            key={s.id}
            onClick={() => setStatusFilter(s.id)}
            className={`p-3 rounded-lg border-2 transition-all text-center ${
              statusFilter === s.id ? 'border-primary bg-primary/5' : 'border-border'
            }`}
          >
            <div className={`w-8 h-8 rounded-lg ${s.color} text-white flex items-center justify-center mx-auto mb-1`}>
              {s.icon}
            </div>
            <p className="text-xs text-muted-foreground">{s.label}</p>
            <p className="text-lg font-bold">{stats[s.id] || 0}</p>
          </button>
        ))}
      </div>

      {/* قائمة الطلبات */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            {statusFilter === 'all' ? 'كل الطلبات' : `طلبات: ${statusLabel(statusFilter)}`}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : orders.length === 0 ? (
            <div className="py-12 text-center">
              <Bell className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
              <p className="text-muted-foreground">لا توجد طلبات في هذه الحالة</p>
            </div>
          ) : (
            <ScrollArea className="max-h-[600px]">
              <div className="space-y-3 p-4">
                {orders.map(order => (
                  <div
                    key={order.id}
                    className="border rounded-lg p-4 hover:shadow-sm transition-shadow"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono font-bold text-sm">{order.orderNumber}</span>
                          {statusBadge(order.status)}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatDateTime(order.createdAt)}
                        </p>
                      </div>
                      <div className="text-left">
                        <p className="font-bold text-primary text-lg">
                          {formatCurrency(order.total)}
                        </p>
                        <Badge variant="outline" className="text-xs">
                          {order.paymentMethod === 'wallet' ? (
                            <><Wallet className="h-3 w-3 ml-1" /> محفظة</>
                          ) : (
                            <><Receipt className="h-3 w-3 ml-1" /> نقداً</>
                          )}
                        </Badge>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm mb-3">
                      {order.customerName && (
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <User className="h-3.5 w-3.5" />
                          <span>{order.customerName}</span>
                        </div>
                      )}
                      {order.customerPhone && (
                        <div className="flex items-center gap-1 text-muted-foreground" dir="ltr">
                          <Phone className="h-3.5 w-3.5" />
                          <span>{order.customerPhone}</span>
                        </div>
                      )}
                      {order.tableNumber && (
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <ShoppingCart className="h-3.5 w-3.5" />
                          <span>طاولة {order.tableNumber}</span>
                        </div>
                      )}
                    </div>

                    {/* معاينة البنود */}
                    <div className="text-sm mb-3">
                      <p className="text-muted-foreground text-xs mb-1">البنود ({order.items.length}):</p>
                      <p className="line-clamp-2">
                        {order.items.map(it => `${it.name} ×${it.quantity}`).join('، ')}
                      </p>
                    </div>

                    {/* أزرار الإجراء */}
                    <div className="flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setViewOrder(order)}
                      >
                        <Eye className="h-4 w-4 ml-1" /> تفاصيل
                      </Button>
                      {order.status === 'pending' && (
                        <Button
                          size="sm"
                          onClick={() => updateStatus(order.id, 'confirmed')}
                          disabled={updating}
                        >
                          <CheckCircle2 className="h-4 w-4 ml-1" /> تأكيد
                        </Button>
                      )}
                      {order.status === 'confirmed' && (
                        <Button
                          size="sm"
                          onClick={() => updateStatus(order.id, 'preparing')}
                          disabled={updating}
                        >
                          <ChefHat className="h-4 w-4 ml-1" /> بدء التحضير
                        </Button>
                      )}
                      {order.status === 'preparing' && (
                        <Button
                          size="sm"
                          onClick={() => updateStatus(order.id, 'ready')}
                          disabled={updating}
                        >
                          <Package className="h-4 w-4 ml-1" /> جاهز للتسليم
                        </Button>
                      )}
                      {order.status === 'ready' && (
                        <Button
                          size="sm"
                          onClick={() => updateStatus(order.id, 'completed')}
                          disabled={updating}
                          className="bg-emerald-600 hover:bg-emerald-700"
                        >
                          <CheckCircle2 className="h-4 w-4 ml-1" /> إكمال
                        </Button>
                      )}
                      {['pending', 'confirmed', 'preparing'].includes(order.status) && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            if (confirm('إلغاء هذا الطلب؟')) updateStatus(order.id, 'cancelled')
                          }}
                          disabled={updating}
                          className="text-destructive border-destructive/30 hover:bg-destructive/10"
                        >
                          <XCircle className="h-4 w-4 ml-1" /> إلغاء
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* نافذة التفاصيل */}
      <Dialog open={!!viewOrder} onOpenChange={(o) => !o && setViewOrder(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5" />
              تفاصيل الطلب
            </DialogTitle>
            <DialogDescription>
              رقم: <span className="font-mono font-medium">{viewOrder?.orderNumber}</span>
            </DialogDescription>
          </DialogHeader>

          {viewOrder && (
            <div className="space-y-4">
              {/* معلومات الزبون */}
              <div className="p-3 rounded-lg bg-muted/50 space-y-1.5 text-sm">
                {viewOrder.customerName && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">الزبون:</span>
                    <span className="font-medium">{viewOrder.customerName}</span>
                  </div>
                )}
                {viewOrder.customerPhone && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">الهاتف:</span>
                    <span className="font-mono" dir="ltr">{viewOrder.customerPhone}</span>
                  </div>
                )}
                {viewOrder.tableNumber && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">الطاولة:</span>
                    <span>{viewOrder.tableNumber}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">الحالة:</span>
                  {statusBadge(viewOrder.status)}
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">طريقة الدفع:</span>
                  <span>{viewOrder.paymentMethod === 'wallet' ? 'محفظة رقمية' : 'نقداً'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">الوقت:</span>
                  <span>{formatDateTime(viewOrder.createdAt)}</span>
                </div>
                {viewOrder.acceptedBy && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">استلمه:</span>
                    <span>{viewOrder.acceptedBy.name}</span>
                  </div>
                )}
              </div>

              {/* البنود */}
              <div className="border-t pt-3">
                <p className="font-semibold mb-2">البنود</p>
                <div className="space-y-2">
                  {viewOrder.items.map(item => (
                    <div key={item.id} className="flex justify-between text-sm p-2 rounded bg-muted/30">
                      <div>
                        <p className="font-medium">{item.name} × {item.quantity}</p>
                        {item.notes && (
                          <p className="text-xs text-muted-foreground">ملاحظة: {item.notes}</p>
                        )}
                      </div>
                      <p className="font-medium">{formatCurrency(item.total)}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* الإجمالي */}
              <div className="border-t pt-3 space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">المجموع الفرعي</span>
                  <span>{formatCurrency(viewOrder.subtotal)}</span>
                </div>
                <div className="flex justify-between font-bold text-base">
                  <span>الإجمالي</span>
                  <span className="text-primary">{formatCurrency(viewOrder.total)}</span>
                </div>
              </div>

              {viewOrder.notes && (
                <div className="p-2 bg-amber-50 text-amber-800 rounded text-sm">
                  <span className="font-medium">ملاحظات الزبون:</span> {viewOrder.notes}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
