'use client'

import { useState } from 'react'
import { signOut } from 'next-auth/react'
import {
  LayoutDashboard, Receipt, ShoppingCart, Boxes, Wallet,
  Truck, BarChart3, Users, Utensils, LogOut, Menu, ChevronLeft, Bell, QrCode,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Sheet, SheetContent, SheetTrigger,
} from '@/components/ui/sheet'
import { RESTAURANT_INFO } from '@/lib/restaurant'
import { toast } from 'sonner'

import Dashboard from './dashboard'
import Invoices from './invoices'
import Purchases from './purchases'
import Inventory from './inventory'
import Expenses from './expenses'
import Suppliers from './suppliers'
import Reports from './reports'
import UsersManagement from './users'
import CustomerOrders from './customer-orders'
import CustomersManagement from './customers'

export type AppUser = {
  id: string
  username: string
  name: string
  role: string
}

type Tab =
  | 'dashboard'
  | 'invoices'
  | 'purchases'
  | 'inventory'
  | 'expenses'
  | 'suppliers'
  | 'reports'
  | 'users'
  | 'customerOrders'
  | 'customers'

const NAV_SECTIONS: {
  title: string
  items: {
    id: Tab
    label: string
    icon: React.ReactNode
    adminOnly?: boolean
  }[]
}[] = [
  {
    title: 'العمليات اليومية',
    items: [
      { id: 'dashboard', label: 'لوحة المعلومات', icon: <LayoutDashboard className="h-5 w-5" /> },
      { id: 'customerOrders', label: 'طلبات الزبائن', icon: <Bell className="h-5 w-5" /> },
      { id: 'invoices', label: 'الفواتير', icon: <Receipt className="h-5 w-5" /> },
      { id: 'purchases', label: 'المشتريات', icon: <ShoppingCart className="h-5 w-5" /> },
    ],
  },
  {
    title: 'الإدارة',
    items: [
      { id: 'customers', label: 'المحافظ الرقمية', icon: <Wallet className="h-5 w-5" /> },
      { id: 'inventory', label: 'المخزون', icon: <Boxes className="h-5 w-5" /> },
      { id: 'suppliers', label: 'الموردون', icon: <Truck className="h-5 w-5" /> },
      { id: 'expenses', label: 'المصروفات', icon: <Wallet className="h-5 w-5" /> },
    ],
  },
  {
    title: 'النظام',
    items: [
      { id: 'reports', label: 'التقارير', icon: <BarChart3 className="h-5 w-5" /> },
      { id: 'users', label: 'المستخدمون', icon: <Users className="h-5 w-5" />, adminOnly: true },
    ],
  },
]

const roleLabel: Record<string, string> = {
  admin: 'مدير',
  manager: 'مشرف',
  cashier: 'كاشير',
}

type SidebarContentProps = {
  user: AppUser
  tab: Tab
  onSelectTab: (tab: Tab) => void
  onSignOut: () => void
}

function SidebarContent({ user, tab, onSelectTab, onSignOut }: SidebarContentProps) {
  return (
    <div className="flex flex-col h-full">
      {/* رأس الشريط */}
      <div className="p-4 border-b">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-primary text-primary-foreground flex items-center justify-center shadow-md flex-shrink-0">
            <Utensils className="h-6 w-6" />
          </div>
          <div className="min-w-0">
            <h1 className="text-base font-bold leading-tight truncate">{RESTAURANT_INFO.name}</h1>
            <p className="text-xs text-primary font-medium leading-tight truncate">
              {RESTAURANT_INFO.subtitle}
            </p>
          </div>
        </div>
      </div>

      {/* روابط التنقل */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-4">
        {/* روابط العموم */}
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3 mb-2">
            واجهة الزبون
          </p>
          <div className="space-y-1">
            <a
              href="/menu"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all text-right text-muted-foreground hover:text-foreground hover:bg-muted"
            >
              <Utensils className="h-5 w-5" />
              <span className="flex-1">عرض المنيو</span>
            </a>
            <a
              href="/qrcode"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all text-right text-muted-foreground hover:text-foreground hover:bg-muted"
            >
              <QrCode className="h-5 w-5" />
              <span className="flex-1">طباعة QR Code</span>
            </a>
          </div>
        </div>

        {NAV_SECTIONS.map(section => {
          const visibleItems = section.items.filter(
            item => !item.adminOnly || user.role === 'admin'
          )
          if (visibleItems.length === 0) return null
          return (
            <div key={section.title}>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3 mb-2">
                {section.title}
              </p>
              <div className="space-y-1">
                {visibleItems.map(item => (
                  <button
                    key={item.id}
                    onClick={() => onSelectTab(item.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all text-right ${
                      tab === item.id
                        ? 'bg-primary text-primary-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                    }`}
                  >
                    {item.icon}
                    <span className="flex-1">{item.label}</span>
                    {tab === item.id && <ChevronLeft className="h-4 w-4" />}
                  </button>
                ))}
              </div>
            </div>
          )
        })}
      </nav>

      {/* بطاقة المستخدم */}
      <div className="p-3 border-t">
        <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
          <div className="w-9 h-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold flex-shrink-0">
            {user.name.charAt(0)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{user.name}</p>
            <Badge variant="secondary" className="text-xs">
              {roleLabel[user.role] || user.role}
            </Badge>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onSignOut}
          className="w-full mt-2 text-destructive hover:text-destructive"
        >
          <LogOut className="ml-2 h-4 w-4" />
          تسجيل الخروج
        </Button>
      </div>
    </div>
  )
}

export default function AppClient({ user }: { user: AppUser }) {
  const [tab, setTab] = useState<Tab>('dashboard')
  const [mobileOpen, setMobileOpen] = useState(false)

  const handleSignOut = async () => {
    await signOut({ redirect: false })
    toast.success('تم تسجيل الخروج')
    // إعادة تحميل كاملة للصفحة لمسح الجلسة
    setTimeout(() => {
      window.location.href = '/'
    }, 300)
  }

  const handleSelectTab = (newTab: Tab) => {
    setTab(newTab)
    setMobileOpen(false)
  }

  const sidebarProps: SidebarContentProps = {
    user,
    tab,
    onSelectTab: handleSelectTab,
    onSignOut: handleSignOut,
  }

  return (
    <div className="min-h-screen flex bg-background">
      {/* الشريط الجانبي - سطح المكتب */}
      <aside className="hidden lg:flex w-72 flex-col border-l bg-card sticky top-0 h-screen flex-shrink-0">
        <SidebarContent {...sidebarProps} />
      </aside>

      {/* الشريط الجانبي - الجوال */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="right" className="w-72 p-0">
          <SidebarContent {...sidebarProps} />
        </SheetContent>
      </Sheet>

      {/* المحتوى الرئيسي */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* رأس علوي للجوال */}
        <header className="lg:hidden sticky top-0 z-30 border-b bg-card/90 backdrop-blur-md">
          <div className="flex items-center justify-between p-3">
            <Button variant="outline" size="icon" onClick={() => setMobileOpen(true)}>
              <Menu className="h-5 w-5" />
            </Button>
            <div className="text-center">
              <p className="text-sm font-bold leading-tight">{RESTAURANT_INFO.name}</p>
              <p className="text-xs text-primary">{RESTAURANT_INFO.subtitle}</p>
            </div>
            <div className="w-10" />
          </div>
        </header>

        <main className="flex-1 overflow-x-hidden p-4 lg:p-6">
          <div className="max-w-7xl mx-auto">
            {tab === 'dashboard' && <Dashboard user={user} />}
            {tab === 'customerOrders' && <CustomerOrders user={user} />}
            {tab === 'invoices' && <Invoices user={user} />}
            {tab === 'purchases' && <Purchases user={user} />}
            {tab === 'customers' && <CustomersManagement user={user} />}
            {tab === 'inventory' && <Inventory user={user} />}
            {tab === 'expenses' && <Expenses user={user} />}
            {tab === 'suppliers' && <Suppliers user={user} />}
            {tab === 'reports' && <Reports />}
            {tab === 'users' && user.role === 'admin' && <UsersManagement currentUser={user} />}
          </div>
        </main>
      </div>
    </div>
  )
}
