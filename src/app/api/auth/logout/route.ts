import { NextRequest } from 'next/server'
import { deleteSession, clearSessionResponse, SESSION_COOKIE_NAME } from '@/lib/session'

// POST /api/auth/logout - تسجيل الخروج وحذف الجلسة
export async function POST(request: NextRequest) {
  try {
    // قراءة الـ token من cookie
    const cookieHeader = request.headers.get('cookie') || ''
    const cookies = cookieHeader.split(';')
    let token: string | undefined
    for (const c of cookies) {
      const trimmed = c.trim()
      const eqIdx = trimmed.indexOf('=')
      if (eqIdx === -1) continue
      const k = trimmed.substring(0, eqIdx)
      const v = trimmed.substring(eqIdx + 1)
      if (k === SESSION_COOKIE_NAME) {
        token = v
        break
      }
    }

    if (token) {
      await deleteSession(token)
    }

    return clearSessionResponse({ success: true })
  } catch (error) {
    console.error('Logout error:', error)
    return clearSessionResponse({ success: true })
  }
}
