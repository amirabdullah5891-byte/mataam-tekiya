'use client'

import { useEffect, useState } from 'react'
import { SessionProvider } from 'next-auth/react'
import LoginClient from '@/components/restaurant/login'
import AppClient, { type AppUser } from '@/components/restaurant/app'
import { Loader2 } from 'lucide-react'

export default function Home() {
  const [user, setUser] = useState<AppUser | null>(null)
  const [needsSetup, setNeedsSetup] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    async function check() {
      try {
        const res = await fetch('/api/session')
        if (!cancelled) {
          const json = await res.json()
          if (json.user) {
            setUser(json.user)
          } else {
            // فحص إذا كان هناك أي مستخدم موجود
            try {
              const setupRes = await fetch('/api/check-setup')
              const setupJson = await setupRes.json()
              setNeedsSetup(setupJson.needsSetup)
            } catch {
              setNeedsSetup(false)
            }
          }
        }
      } catch {
        if (!cancelled) {
          setNeedsSetup(false)
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    check()
    return () => { cancelled = true }
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!user) {
    return <LoginClient needsSetup={needsSetup} />
  }

  return <AppClient user={user} />
}
