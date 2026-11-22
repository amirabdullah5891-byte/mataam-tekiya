'use client'

import { useState } from 'react'
import { Printer, Loader2, Utensils, MapPin, Phone, QrCode } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { RESTAURANT_INFO } from '@/lib/restaurant'

export default function QRCodePage() {
  // نبني الـ URL مرة واحدة عند أول render
  // window.location.origin متاح فقط على العميل، لذا نستخدم state lazy init
  const [state] = useState(() => {
    if (typeof window === 'undefined') {
      return { qrUrl: '', menuUrl: '/menu', loading: true }
    }
    const menuUrl = `${window.location.origin}/menu`
    return {
      qrUrl: `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(menuUrl)}`,
      menuUrl,
      loading: false,
    }
  })

  const handlePrint = () => {
    window.print()
  }

  if (state.loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-accent/20 to-background p-4">
      <div className="max-w-md mx-auto">
        {/* البطاقة القابلة للطباعة */}
        <div id="printable-card" className="bg-card rounded-2xl shadow-xl overflow-hidden">
          {/* رأس */}
          <div className="bg-primary text-primary-foreground p-6 text-center">
            <div className="inline-flex w-12 h-12 rounded-xl bg-primary-foreground/20 items-center justify-center mb-2">
              <Utensils className="h-6 w-6" />
            </div>
            <h1 className="text-xl font-bold">{RESTAURANT_INFO.name}</h1>
            <p className="text-sm opacity-90">{RESTAURANT_INFO.subtitle}</p>
          </div>

          {/* QR Code */}
          <div className="p-6 text-center">
            <p className="text-lg font-bold mb-1">امسح الرمز لعرض المنيو</p>
            <p className="text-sm text-muted-foreground mb-4">
              اطلب طعامك بسهولة عبر هاتفك
            </p>

            <div className="inline-block p-4 bg-white rounded-2xl shadow-md">
              <img
                src={state.qrUrl}
                alt="QR Code"
                className="w-64 h-64"
                crossOrigin="anonymous"
              />
            </div>

            <div className="mt-6 space-y-1 text-sm">
              <p className="flex items-center justify-center gap-1">
                <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                {RESTAURANT_INFO.address}
              </p>
              <p className="flex items-center justify-center gap-1" dir="ltr">
                <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                {RESTAURANT_INFO.phones.join(' - ')}
              </p>
            </div>
          </div>

          {/* تذييل */}
          <div className="bg-muted/50 p-3 text-center text-xs text-muted-foreground">
            <p>امسح الرمز بكاميرا هاتفك لعرض القائمة وإرسال طلبك</p>
          </div>
        </div>

        {/* أزرار التحكم */}
        <div className="mt-6 flex flex-col gap-2 print:hidden">
          <Button onClick={handlePrint} size="lg" className="w-full">
            <Printer className="ml-2 h-5 w-5" /> طباعة البطاقة
          </Button>
          <a href="/menu" className="w-full">
            <Button variant="outline" size="lg" className="w-full">
              <QrCode className="ml-2 h-5 w-5" /> معاينة المنيو
            </Button>
          </a>
          <a href="/" className="w-full">
            <Button variant="ghost" size="lg" className="w-full">
              العودة للرئيسية
            </Button>
          </a>
        </div>

        {/* تعليمات */}
        <div className="mt-6 p-4 bg-muted/50 rounded-lg text-sm space-y-2 print:hidden">
          <p className="font-semibold">طريقة الاستخدام:</p>
          <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
            <li>اطبع هذه البطاقة وعلّقها على طاولة المطعم</li>
            <li>الزبون يفتح كاميرا هاتفه ويمسح الرمز</li>
            <li>تظهر له القائمة، يختار الأطباق ويرسل الطلب</li>
            <li>يصلك الطلب في تبويب "طلبات الزبائن" بالإدارة</li>
            <li>يمكن للزبون شحن محفظته مسبقاً والدفع منها</li>
          </ol>
        </div>
      </div>

      {/* أنماط الطباعة */}
      <style jsx global>{`
        @media print {
          body * { visibility: hidden; }
          #printable-card, #printable-card * { visibility: visible; }
          #printable-card {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            box-shadow: none !important;
            border-radius: 0 !important;
          }
        }
      `}</style>
    </div>
  )
}
