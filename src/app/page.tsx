'use client'

import { useState, useEffect } from 'react'
import {
  LayoutDashboard, Receipt, UtensilsCrossed, BarChart3,
  Utensils, Database, Loader2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Card, CardContent,
} from '@/components/ui/card'
import Dashboard from '@/components/restaurant/dashboard'
import Invoices from '@/components/restaurant/invoices'
import MenuManagement from '@/components/restaurant/menu-management'
import Reports from '@/components/restaurant/reports'

type Tab = 'dashboard' | 'invoices' | 'menu' | 'reports'

const TABS: { id: Tab; label: string; icon: React.ReactNode; description: string }[] = [
  { id: 'dashboard', label: 'لوحة المعلومات', icon: <LayoutDashboard className="h-5 w-5" />, description: 'نظرة عامة وإحصائيات' },
  { id: 'invoices', label: 'الفواتير', icon: <Receipt className="h-5 w-5" />, description: 'إنشاء وإدارة الفواتير' },
  { id: 'menu', label: 'قائمة الطعام', icon: <UtensilsCrossed className="h-5 w-5" />, description: 'إدارة الأطباق والأسعار' },
  { id: 'reports', label: 'التقارير', icon: <BarChart3 className="h-5 w-5" />, description: 'تقارير المبيعات' },
]

export default function Home() {
  const [tab, setTab] = useState<Tab>('dashboard')
  const [menuCount, setMenuCount] = useState<number | null>(null)
  const [seeding, setSeeding] = useState(false)
  const [showSeedBanner, setShowSeedBanner] = useState(false)

  // فحص عدد عناصر القائمة لعرض زر البيانات الأولية
  useEffect(() => {
    fetch('/api/menu')
      .then(r => r.json())
      .then(json => {
        const count = json.items?.length || 0
        setMenuCount(count)
        if (count === 0) setShowSeedBanner(true)
      })
      .catch(() => setMenuCount(0))
  }, [])

  const handleSeed = async () => {
    setSeeding(true)
    try {
      const res = await fetch('/api/seed', { method: 'POST' })
      const json = await res.json()
      if (!res.ok) throw new Error()
      setMenuCount(json.count)
      setShowSeedBanner(false)
      // إعادة تحميل الصفحة الحالية
      window.location.reload()
    } catch {
      // تجاهل
    } finally {
      setSeeding(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* الترويسة */}
      <header className="sticky top-0 z-40 border-b bg-card/80 backdrop-blur-md shadow-sm">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-primary text-primary-foreground flex items-center justify-center shadow-md">
                <Utensils className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-lg md:text-xl font-bold leading-tight">
                  حسابات المطعم البلدي
                </h1>
                <p className="text-xs text-muted-foreground hidden sm:block">
                  نظام إدارة المبيعات والفواتير - جوبا
                </p>
              </div>
            </div>

            <div className="hidden md:flex items-center gap-1 text-xs text-muted-foreground bg-muted/60 px-3 py-1.5 rounded-full">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              متصل بقاعدة البيانات
            </div>
          </div>
        </div>
      </header>

      {/* شريط التبويبات */}
      <nav className="sticky top-[68px] z-30 bg-background/95 backdrop-blur border-b">
        <div className="container mx-auto px-4">
          <div className="flex gap-1 overflow-x-auto py-2">
            {TABS.map(t => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                  tab === t.id
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                }`}
              >
                {t.icon}
                <span>{t.label}</span>
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* المحتوى الرئيسي */}
      <main className="flex-1 container mx-auto px-4 py-6">
        {/* لافتة البيانات الأولية */}
        {showSeedBanner && (
          <Card className="mb-6 border-primary/40 bg-accent/30">
            <CardContent className="p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary text-primary-foreground flex items-center justify-center flex-shrink-0">
                    <Database className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold">قائمة الطعام فارغة</h3>
                    <p className="text-sm text-muted-foreground">
                      أضف بيانات أولية لـ 26 طبقاً سودانياً جاهزاً (مشويات، أطباق رئيسية، مشروبات، خبز، حساء، حلويات) للبدء سريعاً، أو أضف أطباقك يدوياً من تبويب قائمة الطعام.
                    </p>
                  </div>
                </div>
                <Button onClick={handleSeed} disabled={seeding}>
                  {seeding ? <Loader2 className="ml-2 h-4 w-4 animate-spin" /> : <Database className="ml-2 h-4 w-4" />}
                  إضافة البيانات الأولية
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {tab === 'dashboard' && <Dashboard />}
        {tab === 'invoices' && <Invoices />}
        {tab === 'menu' && <MenuManagement />}
        {tab === 'reports' && <Reports />}
      </main>

      {/* التذييل */}
      <footer className="border-t bg-card mt-auto">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-muted-foreground">
            <p>© {new Date().getFullYear()} مطعم بلدي - جوبا، جنوب السودان</p>
            <p className="text-xs">
              العملة: الجنيه الجنوب سوداني (ج.س) · إصدار 1.0
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
