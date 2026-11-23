'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import {
  Utensils, User, Lock, Loader2, LogIn, MapPin, Phone,
  AlertCircle, KeyRound, UserPlus,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Card, CardContent, CardHeader, CardTitle, CardDescription,
} from '@/components/ui/card'
import {
  Tabs, TabsList, TabsTrigger, TabsContent,
} from '@/components/ui/tabs'
import { toast } from 'sonner'
import { RESTAURANT_INFO } from '@/lib/restaurant'

export default function LoginClient({ needsSetup }: { needsSetup: boolean }) {
  const [tab, setTab] = useState<'login' | 'setup'>(needsSetup ? 'setup' : 'login')

  // حقول تسجيل الدخول
  const [loginUsername, setLoginUsername] = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  const [loginLoading, setLoginLoading] = useState(false)

  // حقول الإعداد الأولي (إنشاء أول admin)
  const [setupName, setSetupName] = useState('')
  const [setupUsername, setSetupUsername] = useState('')
  const [setupPassword, setSetupPassword] = useState('')
  const [setupConfirm, setSetupConfirm] = useState('')
  const [setupLoading, setSetupLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!loginUsername.trim() || !loginPassword) {
      toast.error('أدخل اسم المستخدم وكلمة المرور')
      return
    }
    setLoginLoading(true)
    try {
      const result = await signIn('credentials', {
        username: loginUsername.trim(),
        password: loginPassword,
        redirect: false,
      })
      if (result?.error) {
        toast.error('اسم المستخدم أو كلمة المرور غير صحيحة')
      } else {
        toast.success('تم تسجيل الدخول بنجاح')
        // إعادة تحميل الصفحة فوراً - استخدام reload بدلاً من href لتجنب مشاكل التوجيه
        setTimeout(() => {
          window.location.reload()
        }, 500)
      }
    } catch {
      toast.error('حدث خطأ، حاول مرة أخرى')
    } finally {
      setLoginLoading(false)
    }
  }

  const handleSetup = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!setupName.trim() || !setupUsername.trim() || !setupPassword) {
      toast.error('املأ جميع الحقول')
      return
    }
    if (setupPassword.length < 6) {
      toast.error('كلمة المرور يجب أن تكون 6 أحرف على الأقل')
      return
    }
    if (setupPassword !== setupConfirm) {
      toast.error('كلمتا المرور غير متطابقتين')
      return
    }
    setSetupLoading(true)
    try {
      const res = await fetch('/api/users/initial', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: setupName.trim(),
          username: setupUsername.trim(),
          password: setupPassword,
        }),
      })
      const json = await res.json()
      if (!res.ok) {
        throw new Error(json.error || 'فشل الإنشاء')
      }
      toast.success('تم إنشاء حساب المدير، يمكنك تسجيل الدخول الآن')
      // تسجيل الدخول مباشرة
      const result = await signIn('credentials', {
        username: setupUsername.trim(),
        password: setupPassword,
        redirect: false,
      })
      if (result && !result.error) {
        // إعادة تحميل الصفحة فوراً
        setTimeout(() => {
          window.location.reload()
        }, 500)
      } else {
        setTab('login')
      }
    } catch (err: any) {
      toast.error(err.message || 'فشل في الإعداد الأولي')
    } finally {
      setSetupLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-accent/40 via-background to-accent/20 p-4">
      <div className="w-full max-w-md">
        {/* شعار واسم المطعم */}
        <div className="text-center mb-6">
          <div className="inline-flex w-16 h-16 rounded-2xl bg-primary text-primary-foreground items-center justify-center shadow-lg mb-3">
            <Utensils className="h-8 w-8" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">{RESTAURANT_INFO.name}</h1>
          <p className="text-base text-primary font-medium">{RESTAURANT_INFO.subtitle}</p>
          <p className="text-xs text-muted-foreground mt-1 flex items-center justify-center gap-1">
            <MapPin className="h-3 w-3" /> {RESTAURANT_INFO.address}
          </p>
          <p className="text-xs text-muted-foreground flex items-center justify-center gap-1 mt-0.5">
            <Phone className="h-3 w-3" /> {RESTAURANT_INFO.phones.join(' - ')}
          </p>
        </div>

        <Card className="shadow-xl">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <LogIn className="h-5 w-5 text-primary" />
              {tab === 'login' ? 'تسجيل الدخول' : 'الإعداد الأولي'}
            </CardTitle>
            <CardDescription>
              {tab === 'login'
                ? 'أدخل بياناتك للوصول إلى نظام الحسابات'
                : 'أنشئ حساب المدير الأول لبدء استخدام النظام'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {needsSetup && (
              <div className="mb-4 p-3 rounded-lg bg-accent/50 border border-accent flex items-start gap-2 text-sm">
                <AlertCircle className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                <p>
                  مرحباً بك في أول تشغيل للنظام. يجب إنشاء حساب مدير أولاً
                  لإدارة المستخدمين الآخرين والإعدادات.
                </p>
              </div>
            )}

            <Tabs value={tab} onValueChange={(v) => setTab(v as any)}>
              {!needsSetup && (
                <TabsList className="grid grid-cols-1 mb-4">
                  <TabsTrigger value="login">تسجيل الدخول</TabsTrigger>
                </TabsList>
              )}

              <TabsContent value="login" className="m-0">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="username">اسم المستخدم</Label>
                    <div className="relative">
                      <User className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="username"
                        value={loginUsername}
                        onChange={(e) => setLoginUsername(e.target.value)}
                        placeholder="أدخل اسم المستخدم"
                        className="pr-9"
                        autoComplete="username"
                        autoFocus
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password">كلمة المرور</Label>
                    <div className="relative">
                      <Lock className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="password"
                        type="password"
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        placeholder="••••••••"
                        className="pr-9"
                        autoComplete="current-password"
                      />
                    </div>
                  </div>

                  <Button type="submit" className="w-full" size="lg" disabled={loginLoading}>
                    {loginLoading ? (
                      <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                    ) : (
                      <LogIn className="ml-2 h-4 w-4" />
                    )}
                    دخول
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="setup" className="m-0">
                <form onSubmit={handleSetup} className="space-y-3">
                  <div className="space-y-2">
                    <Label htmlFor="setupName">الاسم الكامل</Label>
                    <div className="relative">
                      <User className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="setupName"
                        value={setupName}
                        onChange={(e) => setSetupName(e.target.value)}
                        placeholder="الاسم الكامل للمدير"
                        className="pr-9"
                        autoFocus
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="setupUsername">اسم المستخدم</Label>
                    <div className="relative">
                      <UserPlus className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="setupUsername"
                        value={setupUsername}
                        onChange={(e) => setSetupUsername(e.target.value)}
                        placeholder="مثال: admin"
                        className="pr-9"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="setupPassword">كلمة المرور</Label>
                      <div className="relative">
                        <KeyRound className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="setupPassword"
                          type="password"
                          value={setupPassword}
                          onChange={(e) => setSetupPassword(e.target.value)}
                          placeholder="6 أحرف على الأقل"
                          className="pr-9"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="setupConfirm">تأكيد كلمة المرور</Label>
                      <div className="relative">
                        <KeyRound className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="setupConfirm"
                          type="password"
                          value={setupConfirm}
                          onChange={(e) => setSetupConfirm(e.target.value)}
                          placeholder="••••••••"
                          className="pr-9"
                        />
                      </div>
                    </div>
                  </div>

                  <Button type="submit" className="w-full" size="lg" disabled={setupLoading}>
                    {setupLoading ? (
                      <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                    ) : (
                      <UserPlus className="ml-2 h-4 w-4" />
                    )}
                    إنشاء حساب المدير
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground mt-6">
          © {new Date().getFullYear()} {RESTAURANT_INFO.name} - جميع الحقوق محفوظة
        </p>
      </div>
    </div>
  )
}
