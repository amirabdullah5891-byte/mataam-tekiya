'use client'

import { useEffect, useState, useCallback } from 'react'
import {
  Shield, Loader2, LogIn, LogOut, Receipt, Wallet, ShoppingCart,
  Users, Eye, RefreshCw, AlertCircle,
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

type AuditLog = {
  id: string
  action: string
  entityType: string
  entityId: string | null
  description: string | null
  ipAddress: string | null
  userId: string | null
  status: string
  createdAt: string
}

const ACTION_LABELS: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  login: { label: 'تسجيل دخول', icon: <LogIn className="h-3.5 w-3.5" />, color: 'bg-emerald-500' },
  login_failed: { label: 'دخول فاشل', icon: <AlertCircle className="h-3.5 w-3.5" />, color: 'bg-red-500' },
  logout: { label: 'تسجيل خروج', icon: <LogOut className="h-3.5 w-3.5" />, color: 'bg-gray-500' },
  invoice_create: { label: 'إنشاء فاتورة', icon: <Receipt className="h-3.5 w-3.5" />, color: 'bg-blue-500' },
  wallet_topup: { label: 'شحن محفظة', icon: <Wallet className="h-3.5 w-3.5" />, color: 'bg-amber-500' },
  user_create: { label: 'إنشاء مستخدم', icon: <Users className="h-3.5 w-3.5" />, color: 'bg-purple-500' },
  expense_create: { label: 'إضافة مصروف', icon: <Wallet className="h-3.5 w-3.5" />, color: 'bg-red-400' },
  order_status_change: { label: 'تغيير حالة طلب', icon: <ShoppingCart className="h-3.5 w-3.5" />, color: 'bg-indigo-500' },
}

function getActionInfo(action: string) {
  return ACTION_LABELS[action] || { label: action, icon: <Eye className="h-3.5 w-3.5" />, color: 'bg-gray-400' }
}

export default function AuditLogView({ user }: { user: AppUser }) {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [stats, setStats] = useState<{ action: string; count: number }[]>([])
  const [total, setTotal] = useState(0)
  const [today, setToday] = useState(0)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const url = `/api/audit${filter !== 'all' ? `?action=${filter}` : ''}`
      const res = await fetch(url)
      if (!res.ok) {
        const json = await res.json()
        throw new Error(json.error || 'فشل')
      }
      const json = await res.json()
      setLogs(json.logs || [])
      setStats(json.stats || [])
      setTotal(json.total || 0)
      setToday(json.today || 0)
    } catch (e: any) {
      toast.error(e.message || 'تعذر جلب السجل')
    } finally {
      setLoading(false)
    }
  }, [filter])

  useEffect(() => { fetchData() }, [fetchData])

  return (
    <div className="space-y-6 animate-slide-up">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Shield className="h-6 w-6 text-primary" />
            سجل الأحداث الأمنية
          </h2>
          <p className="text-muted-foreground text-sm">
            تتبع كل العمليات الحساسة في النظام
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchData} disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
        </Button>
      </div>

      {/* بطاقات الإحصائيات */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">إجمالي الأحداث</p>
            <p className="text-2xl font-bold">{total}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">أحداث اليوم</p>
            <p className="text-2xl font-bold text-primary">{today}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">أنواع العمليات</p>
            <p className="text-2xl font-bold">{stats.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">آخر تحديث</p>
            <p className="text-sm font-medium">
              {new Date().toLocaleTimeString('ar-SD')}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* فلتر */}
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <CardTitle className="text-lg">سجل العمليات</CardTitle>
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">كل العمليات</SelectItem>
                <SelectItem value="login">تسجيلات الدخول</SelectItem>
                <SelectItem value="login_failed">محاولات فاشلة</SelectItem>
                <SelectItem value="invoice_create">إنشاء الفواتير</SelectItem>
                <SelectItem value="wallet_topup">شحن المحافظ</SelectItem>
                <SelectItem value="user_create">إنشاء المستخدمين</SelectItem>
                <SelectItem value="expense_create">المصروفات</SelectItem>
                <SelectItem value="order_status_change">طلبات الزبائن</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : logs.length === 0 ? (
            <div className="py-12 text-center">
              <Shield className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground">لا توجد أحداث في هذا الفلتر</p>
            </div>
          ) : (
            <ScrollArea className="max-h-[600px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-right">العملية</TableHead>
                    <TableHead className="text-right">الوصف</TableHead>
                    <TableHead className="text-right hidden md:table-cell">الوقت</TableHead>
                    <TableHead className="text-right hidden lg:table-cell">IP</TableHead>
                    <TableHead className="text-center">الحالة</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map(log => {
                    const info = getActionInfo(log.action)
                    return (
                      <TableRow key={log.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className={`w-6 h-6 rounded ${info.color} text-white flex items-center justify-center flex-shrink-0`}>
                              {info.icon}
                            </div>
                            <span className="text-sm font-medium">{info.label}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm max-w-[300px]">
                          <p className="line-clamp-2">{log.description || '—'}</p>
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-xs text-muted-foreground">
                          {formatDateTime(log.createdAt)}
                        </TableCell>
                        <TableCell className="hidden lg:table-cell text-xs font-mono" dir="ltr">
                          {log.ipAddress || '—'}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge
                            variant={log.status === 'success' ? 'default' : 'destructive'}
                            className="text-xs"
                          >
                            {log.status === 'success' ? 'نجاح' : 'فشل'}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
