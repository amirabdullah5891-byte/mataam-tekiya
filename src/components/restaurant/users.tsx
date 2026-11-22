'use client'

import { useEffect, useState, useCallback } from 'react'
import {
  Plus, Loader2, Users, Edit, UserCheck, UserX,
  Shield, User as UserIcon, UserCog,
} from 'lucide-react'
import {
  Card, CardContent, CardHeader, CardTitle, CardDescription,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
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
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { toast } from 'sonner'
import { formatDateTime } from '@/lib/format'
import type { AppUser } from './app'

type UserRow = {
  id: string
  username: string
  name: string
  role: string
  isActive: boolean
  lastLogin: string | null
  createdAt: string
}

const ROLES = [
  { id: 'admin', label: 'مدير', icon: <Shield className="h-4 w-4" />, color: '#dc2626' },
  { id: 'manager', label: 'مشرف', icon: <UserCog className="h-4 w-4" />, color: '#d97706' },
  { id: 'cashier', label: 'كاشير', icon: <UserIcon className="h-4 w-4" />, color: '#16a34a' },
]

export default function UsersManagement({ currentUser }: { currentUser: AppUser }) {
  const [users, setUsers] = useState<UserRow[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<UserRow | null>(null)
  const [toggleTarget, setToggleTarget] = useState<UserRow | null>(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/users')
      if (!res.ok) {
        const json = await res.json()
        throw new Error(json.error)
      }
      const json = await res.json()
      setUsers(json.users || [])
    } catch (e: any) {
      toast.error(e.message || 'تعذر جلب المستخدمين')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const handleToggleActive = async (user: UserRow) => {
    try {
      const res = await fetch(`/api/users/${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !user.isActive }),
      })
      if (!res.ok) throw new Error()
      toast.success(user.isActive ? 'تم تعطيل المستخدم' : 'تم تفعيل المستخدم')
      fetchData()
    } catch {
      toast.error('فشل في العملية')
    }
  }

  return (
    <div className="space-y-6 animate-slide-up">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">المستخدمون</h2>
          <p className="text-muted-foreground text-sm">
            {users.length} مستخدم - إدارة حسابات الموظفين والصلاحيات
          </p>
        </div>
        <Button onClick={() => { setEditingUser(null); setDialogOpen(true) }}>
          <Plus className="ml-2 h-4 w-4" /> إضافة مستخدم
        </Button>
      </div>

      {/* بطاقات الأدوار */}
      <div className="grid grid-cols-3 gap-3">
        {ROLES.map(role => {
          const count = users.filter(u => u.role === role.id).length
          return (
            <Card key={role.id}>
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">{role.label}</p>
                  <p className="text-2xl font-bold">{count}</p>
                </div>
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center text-white"
                  style={{ background: role.color }}
                >
                  {role.icon}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">قائمة المستخدمين</CardTitle>
          <CardDescription>إدارة الحسابات والصلاحيات</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : users.length === 0 ? (
            <p className="text-center text-muted-foreground py-12">لا يوجد مستخدمون</p>
          ) : (
            <ScrollArea className="max-h-[600px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-right">الاسم</TableHead>
                    <TableHead className="text-right">اسم المستخدم</TableHead>
                    <TableHead className="text-right">الدور</TableHead>
                    <TableHead className="text-center">الحالة</TableHead>
                    <TableHead className="text-right hidden lg:table-cell">آخر دخول</TableHead>
                    <TableHead className="text-center">إجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map(u => {
                    const role = ROLES.find(r => r.id === u.role)
                    const isCurrentUser = u.id === currentUser.id
                    return (
                      <TableRow key={u.id} className={!u.isActive ? 'opacity-60' : ''}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <div
                              className="w-8 h-8 rounded-full text-white flex items-center justify-center text-sm font-bold flex-shrink-0"
                              style={{ background: role?.color || '#6b7280' }}
                            >
                              {u.name.charAt(0)}
                            </div>
                            <div>
                              <p>{u.name}</p>
                              {isCurrentUser && (
                                <span className="text-xs text-primary">(أنت)</span>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-sm" dir="ltr">{u.username}</TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className="text-xs"
                            style={{ color: role?.color, borderColor: role?.color }}
                          >
                            {role?.icon}
                            <span className="mr-1">{role?.label}</span>
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          {u.isActive ? (
                            <Badge variant="default" className="bg-emerald-600">
                              <UserCheck className="h-3 w-3 ml-1" /> نشط
                            </Badge>
                          ) : (
                            <Badge variant="secondary">
                              <UserX className="h-3 w-3 ml-1" /> معطل
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">
                          {u.lastLogin ? formatDateTime(u.lastLogin) : '—'}
                        </TableCell>
                        <TableCell>
                          <div className="flex justify-center gap-1">
                            <Button
                              size="sm" variant="ghost"
                              onClick={() => { setEditingUser(u); setDialogOpen(true) }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            {!isCurrentUser && (
                              <Switch
                                checked={u.isActive}
                                onCheckedChange={() => setToggleTarget(u)}
                              />
                            )}
                          </div>
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

      <UserDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        user={editingUser}
        onSuccess={fetchData}
      />

      <AlertDialog open={!!toggleTarget} onOpenChange={(o) => !o && setToggleTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {toggleTarget?.isActive ? 'تعطيل المستخدم' : 'تفعيل المستخدم'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              هل تريد {toggleTarget?.isActive ? 'تعطيل' : 'تفعيل'} حساب &laquo;{toggleTarget?.name}&raquo;؟
              {toggleTarget?.isActive && ' لن يتمكن من تسجيل الدخول حتى يتم تفعيله مرة أخرى.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction onClick={() => toggleTarget && handleToggleActive(toggleTarget)}>
              تأكيد
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

function UserDialog({
  open, onOpenChange, user, onSuccess,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  user: UserRow | null
  onSuccess: () => void
}) {
  const [name, setName] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState('cashier')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (open) {
      if (user) {
        setName(user.name)
        setUsername(user.username)
        setRole(user.role)
        setPassword('')
      } else {
        setName(''); setUsername(''); setRole('cashier'); setPassword('')
      }
    }
  }, [open, user])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !username.trim()) {
      toast.error('الاسم واسم المستخدم مطلوبان')
      return
    }
    if (!user && !password) {
      toast.error('كلمة المرور مطلوبة لمستخدم جديد')
      return
    }
    if (password && password.length < 6) {
      toast.error('كلمة المرور يجب أن تكون 6 أحرف على الأقل')
      return
    }
    setSaving(true)
    try {
      const body: {
        name: string
        username: string
        role: string
        password?: string
      } = {
        name: name.trim(),
        username: username.trim(),
        role,
      }
      if (password) body.password = password

      const url = user ? `/api/users/${user.id}` : '/api/users'
      const method = user ? 'PUT' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const json = await res.json()
        throw new Error(json.error || 'فشل')
      }
      toast.success(user ? 'تم تعديل المستخدم' : 'تم إضافة المستخدم')
      onOpenChange(false)
      onSuccess()
    } catch (e: any) {
      toast.error(e.message || 'فشل في الحفظ')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{user ? 'تعديل مستخدم' : 'إضافة مستخدم جديد'}</DialogTitle>
          <DialogDescription>
            {user ? 'عدّل بيانات المستخدم - اترك كلمة المرور فارغة لعدم تغييرها' : 'أدخل بيانات المستخدم الجديد'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">الاسم الكامل *</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="مثال: أحمد محمد" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="username">اسم المستخدم *</Label>
            <Input
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="مثال: ahmed"
              required
              dir="ltr"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">
              كلمة المرور {user && '(اتركها فارغة لعدم التغيير)'} {!user && '*'}
            </Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="6 أحرف على الأقل"
              required={!user}
            />
          </div>
          <div className="space-y-2">
            <Label>الدور *</Label>
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {ROLES.map(r => (
                  <SelectItem key={r.id} value={r.id}>
                    <div className="flex items-center gap-2">
                      {r.icon}
                      <span>{r.label}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground mt-1">
              {role === 'admin' && 'صلاحيات كاملة: إدارة المستخدمين، الفواتير، المشتريات، المخزون، المصروفات، التقارير'}
              {role === 'manager' && 'صلاحيات إدارية: الفواتير، المشتريات، المخزون، المصروفات، التقارير'}
              {role === 'cashier' && 'صلاحيات محدودة: الفواتير والعرض فقط'}
            </p>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>إلغاء</Button>
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
              {user ? 'حفظ التعديلات' : 'إضافة المستخدم'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
