'use client'

import { useState, useEffect } from 'react'

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

// مكون لعرض زر "تثبيت التطبيق" عند توفر PWA
export default function InstallPWAButton() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showBanner, setShowBanner] = useState(false)
  // lazy init لتفادي setState في effect
  const [isStandalone] = useState(() => {
    if (typeof window === 'undefined') return false
    return (
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true
    )
  })

  useEffect(() => {
    if (isStandalone) return

    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      setShowBanner(true)
    }

    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [isStandalone])

  const handleInstall = async () => {
    if (!deferredPrompt) return
    await deferredPrompt.prompt()
    const choice = await deferredPrompt.userChoice
    if (choice.outcome === 'accepted') {
      console.log('تم تثبيت التطبيق')
    }
    setDeferredPrompt(null)
    setShowBanner(false)
  }

  if (isStandalone || !showBanner) return null

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 max-w-md w-full px-4 print:hidden">
      <div className="bg-card border rounded-lg shadow-lg p-4 flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-primary text-primary-foreground flex items-center justify-center flex-shrink-0">
          📱
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium">ثبّت التطبيق على جهازك</p>
          <p className="text-xs text-muted-foreground">للوصول السريع والعمل بدون متصفح</p>
        </div>
        <div className="flex gap-1 flex-shrink-0">
          <button
            onClick={handleInstall}
            className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90"
          >
            تثبيت
          </button>
          <button
            onClick={() => setShowBanner(false)}
            className="px-2 py-1.5 rounded-lg text-muted-foreground text-xs hover:bg-muted"
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  )
}
