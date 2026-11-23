'use client'

import { useEffect, useState, useCallback } from 'react'
import LoginClient from '@/components/restaurant/login'
import AppClient, { type AppUser } from '@/components/restaurant/app'
import { Loader2 } from 'lucide-react'
import { apiFetch } from '@/lib/api-client'

export default function Home() {
  const [user, setUser] = useState<AppUser | null>(null)
  const [needsSetup, setNeedsSetup] = useState(false)
  const [loading, setLoading] = useState(true)

  const checkSession = useCallback(async () => {
    try {
      const res = await apiFetch('/api/session')
      const json = await res.json()
      if (json.user) {
        setUser(json.user)
        return true
      } else {
        try {
          const setupRes = await fetch('/api/check-setup')
          const setupJson = await setupRes.json()
          setNeedsSetup(setupJson.needsSetup)
        } catch {
          setNeedsSetup(false)
        }
        return false
      }
    } catch (e) {
      console.error('Session check error:', e)
      setNeedsSetup(false)
      return false
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    async function check() {
      await checkSession()
      if (!cancelled) setLoading(false)
    }
    check()
    return () => { cancelled = true }
  }, [checkSession])

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
