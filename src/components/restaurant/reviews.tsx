'use client'
import { apiFetch } from '@/lib/api-client'

import { useEffect, useState, useCallback } from 'react'
import {
  Star, Eye, EyeOff, Trash2, Loader2, TrendingUp, MessageSquare,
} from 'lucide-react'
import {
  Card, CardContent, CardHeader, CardTitle, CardDescription,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { ScrollArea } from '@/components/ui/scroll-area'
import { toast } from 'sonner'
import { formatDateTime } from '@/lib/format'
import type { AppUser } from './app'

type Review = {
  id: string
  customerName: string | null
  customerPhone: string | null
  rating: number
  comment: string | null
  isHidden: boolean
  createdAt: string
  menuItem: { name: string; category: string }
}

type Stats = {
  total: number
  avgRating: number
  hidden: number
}

type TopDish = {
  id: string
  name: string
  category: string
  avgRating: number
  totalReviews: number
}

export default function ReviewsManagement({ user }: { user: AppUser }) {
  const [reviews, setReviews] = useState<Review[]>([])
  const [stats, setStats] = useState<Stats>({ total: 0, avgRating: 0, hidden: 0 })
  const [topDishes, setTopDishes] = useState<TopDish[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'visible' | 'hidden'>('all')

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const hiddenParam = filter === 'all' ? '' : `?hidden=${filter === 'hidden'}`
      const res = await apiFetch(`/api/reviews${hiddenParam}`)
      const json = await res.json()
      setReviews(json.reviews || [])
      setStats(json.stats || { total: 0, avgRating: 0, hidden: 0 })
      setTopDishes(json.topDishes || [])
    } catch {
      toast.error('تعذر جلب التقييمات')
    } finally {
      setLoading(false)
    }
  }, [filter])

  useEffect(() => { fetchData() }, [fetchData])

  const toggleHide = async (review: Review) => {
    try {
      const res = await apiFetch(`/api/reviews/${review.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isHidden: !review.isHidden }),
      })
      if (!res.ok) throw new Error()
      toast.success(review.isHidden ? 'تم إظهار التقييم' : 'تم إخفاء التقييم')
      fetchData()
    } catch {
      toast.error('فشل في التحديث')
    }
  }

  const handleDelete = async (review: Review) => {
    if (!confirm('حذف هذا التقييم نهائياً؟')) return
    try {
      const res = await apiFetch(`/api/reviews/${review.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      toast.success('تم حذف التقييم')
      fetchData()
    } catch {
      toast.error('فشل في الحذف')
    }
  }

  return (
    <div className="space-y-6 animate-slide-up">
      <div>
        <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Star className="h-6 w-6 text-amber-500" />
          تقييمات الأطباق
        </h2>
        <p className="text-muted-foreground text-sm">
          مراجعة وإدارة تقييمات الزبائن للأطباق
        </p>
      </div>

      {/* بطاقات الإحصائيات */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">إجمالي التقييمات</p>
              <p className="text-2xl font-bold">{stats.total}</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
              <MessageSquare className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">متوسط التقييم</p>
              <p className="text-2xl font-bold text-amber-600 flex items-center gap-1">
                {stats.avgRating}
                <Star className="h-5 w-5 fill-amber-500 text-amber-500" />
              </p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
              <Star className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">تقييمات مخفية</p>
              <p className="text-2xl font-bold">{stats.hidden}</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-muted text-muted-foreground flex items-center justify-center">
              <EyeOff className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* أعلى الأطباق تقييماً */}
      {topDishes.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-emerald-600" />
              أعلى الأطباق تقييماً
            </CardTitle>
            <CardDescription>أفضل 5 أطباق حسب متوسط التقييم</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              {topDishes.map((dish, i) => (
                <div key={dish.id} className="p-3 rounded-lg border text-center">
                  <div className="text-xs text-muted-foreground mb-1">#{i + 1}</div>
                  <p className="font-medium text-sm mb-1 line-clamp-1">{dish.name}</p>
                  <div className="flex items-center justify-center gap-0.5 mb-1">
                    {[1, 2, 3, 4, 5].map(n => (
                      <Star
                        key={n}
                        className={`h-3 w-3 ${
                          n <= Math.round(dish.avgRating)
                            ? 'fill-amber-500 text-amber-500'
                            : 'text-muted-foreground'
                        }`}
                      />
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {dish.avgRating.toFixed(1)} · {dish.totalReviews} تقييم
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* فلتر */}
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <CardTitle className="text-lg">كل التقييمات</CardTitle>
            <Select value={filter} onValueChange={(v) => setFilter(v as any)}>
              <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">الكل</SelectItem>
                <SelectItem value="visible">الظاهرة فقط</SelectItem>
                <SelectItem value="hidden">المخفية فقط</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : reviews.length === 0 ? (
            <div className="py-12 text-center">
              <Star className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground">لا توجد تقييمات في هذا الفلتر</p>
            </div>
          ) : (
            <ScrollArea className="max-h-[600px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-right">الطبق</TableHead>
                    <TableHead className="text-right hidden sm:table-cell">الزبون</TableHead>
                    <TableHead className="text-center">التقييم</TableHead>
                    <TableHead className="text-right hidden md:table-cell">التعليق</TableHead>
                    <TableHead className="text-center hidden lg:table-cell">التاريخ</TableHead>
                    <TableHead className="text-center">الحالة</TableHead>
                    <TableHead className="text-center">إجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reviews.map(review => (
                    <TableRow key={review.id} className={review.isHidden ? 'opacity-60' : ''}>
                      <TableCell>
                        <p className="font-medium text-sm">{review.menuItem.name}</p>
                        <p className="text-xs text-muted-foreground">{review.menuItem.category}</p>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell text-sm">
                        {review.customerName || <span className="text-muted-foreground">زبون</span>}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-center gap-0.5">
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
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-sm max-w-[250px]">
                        <p className="line-clamp-2">
                          {review.comment || <span className="text-muted-foreground">—</span>}
                        </p>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell text-xs text-muted-foreground">
                        {formatDateTime(review.createdAt)}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant={review.isHidden ? 'secondary' : 'default'}>
                          {review.isHidden ? 'مخفي' : 'ظاهر'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-center gap-1">
                          <Button
                            size="sm" variant="ghost"
                            onClick={() => toggleHide(review)}
                            title={review.isHidden ? 'إظهار' : 'إخفاء'}
                            disabled={user.role === 'cashier'}
                          >
                            {review.isHidden ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                          </Button>
                          <Button
                            size="sm" variant="ghost"
                            onClick={() => handleDelete(review)}
                            className="text-destructive hover:text-destructive"
                            disabled={user.role === 'cashier'}
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
    </div>
  )
}
