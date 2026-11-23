'use client'

import { useState, useEffect } from 'react'
import QRCode from 'qrcode'
import {
  Printer, Loader2, Utensils, MapPin, Phone, QrCode, ExternalLink, Copy, Check,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RESTAURANT_INFO } from '@/lib/restaurant'

export default function QRCodePage() {
  // lazy init - يعمل على العميل فقط بعد hydration
  const [state] = useState<{
    mounted: boolean
    menuUrl: string
  }>(() => {
    if (typeof window === 'undefined') {
      return { mounted: false, menuUrl: '' }
    }
    return { mounted: true, menuUrl: `${window.location.origin}/menu` }
  })

  const [customDomain, setCustomDomain] = useState('')
  const [copied, setCopied] = useState(false)
  const [qrDataUrl, setQrDataUrl] = useState('')

  // الرابط النهائي (مخصص أو مكتشف)
  const finalUrl = customDomain.trim()
    ? `${customDomain.trim().replace(/\/$/, '')}/menu`
    : state.menuUrl

  // توليد QR Code محلياً (بدون اعتماد على خدمة خارجية)
  useEffect(() => {
    if (!finalUrl) return
    QRCode.toDataURL(finalUrl, {
      width: 400,
      margin: 1,
      color: { dark: '#000000', light: '#ffffff' },
      errorCorrectionLevel: 'M',
    })
      .then((url) => setQrDataUrl(url))
      .catch((err) => console.error('QR generation error:', err))
  }, [finalUrl])

  const handlePrint = () => {
    window.print()
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(finalUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // تجاهل
    }
  }

  const handleOpenMenu = () => {
    window.open(finalUrl, '_blank')
  }

  const handleDownloadQR = () => {
    if (!qrDataUrl) return
    const a = document.createElement('a')
    a.href = qrDataUrl
    a.download = `qr-${RESTAURANT_INFO.name}-menu.png`
    a.click()
  }

  if (!state.mounted) {
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
              {qrDataUrl ? (
                <img
                  src={qrDataUrl}
                  alt="QR Code لقائمة مطعم التكية"
                  className="w-64 h-64"
                />
              ) : (
                <div className="w-64 h-64 flex items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              )}
            </div>

            {/* الرابط كنص - مهم للطباعة والنسخ */}
            <div className="mt-4 p-2 bg-muted rounded-lg">
              <p className="text-xs text-muted-foreground mb-1">الرابط:</p>
              <p className="text-sm font-mono break-all" dir="ltr">{finalUrl}</p>
            </div>

            <div className="mt-4 space-y-1 text-sm">
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

        {/* إعدادات الرابط */}
        <div className="mt-6 p-4 bg-card rounded-xl shadow-sm print:hidden">
          <p className="font-semibold mb-2 text-sm">رابط المنيو الحالي:</p>
          <p className="text-xs text-muted-foreground mb-3" dir="ltr">{finalUrl}</p>

          <div className="space-y-2">
            <Label htmlFor="customDomain" className="text-xs">
              رابط مخصص (إن كنت تريد استخدام رابط آخر للهاتف)
            </Label>
            <Input
              id="customDomain"
              value={customDomain}
              onChange={(e) => setCustomDomain(e.target.value)}
              placeholder="https://example.com"
              dir="ltr"
              className="text-sm"
            />
            <p className="text-xs text-muted-foreground">
              اتركه فارغاً لاستخدام الرابط الحالي تلقائياً
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2 mt-3">
            <Button onClick={handleCopy} variant="outline" size="sm">
              {copied ? (
                <><Check className="h-4 w-4 ml-2" /> تم النسخ</>
              ) : (
                <><Copy className="h-4 w-4 ml-2" /> نسخ الرابط</>
              )}
            </Button>
            <Button onClick={handleOpenMenu} variant="outline" size="sm">
              <ExternalLink className="h-4 w-4 ml-2" /> فتح المنيو
            </Button>
          </div>
          <Button onClick={handleDownloadQR} variant="outline" size="sm" className="w-full mt-2">
            <QrCode className="h-4 w-4 ml-2" /> تنزيل صورة QR
          </Button>
        </div>

        {/* أزرار التحكم */}
        <div className="mt-4 flex flex-col gap-2 print:hidden">
          <Button onClick={handlePrint} size="lg" className="w-full">
            <Printer className="ml-2 h-5 w-5" /> طباعة البطاقة
          </Button>
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
          <div className="mt-3 p-2 bg-emerald-50 text-emerald-800 rounded text-xs">
            <strong>✓ يعمل على الشبكة المحلية:</strong> إذا كان الكمبيوتر والهاتف على نفس شبكة WiFi،
            امسح الرمز وستفتح القائمة مباشرة. لا حاجة لإنترنت خارجي.
          </div>
          <div className="mt-2 p-2 bg-amber-50 text-amber-800 rounded text-xs">
            <strong>للوصول من خارج المطعم:</strong> يجب نشر النظام على Vercel أو VPS
            (راجع دليل النشر).
          </div>
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
