// مساعد للتحقق من الجلسة في API routes
// نقرأ JWT token من cookie ونفك تشفيره يدوياً لتفادي مشاكل getToken مع NextRequest
import { decode } from 'next-auth/jwt'
import { db } from './db'

export type SessionUser = {
  id: string
  username: string
  name: string
  role: string
}

// قراءة قيمة cookie من headers - تعمل مع جميع أنواع الـ cookies
function getCookie(request: Request, name: string): string | undefined {
  const cookieHeader = request.headers.get('cookie') || ''
  if (!cookieHeader) return undefined

  // تقسيم الـ cookies بـ ;
  const cookies = cookieHeader.split(';')
  for (const c of cookies) {
    const trimmed = c.trim()
    // البحث عن "name=value"
    const eqIdx = trimmed.indexOf('=')
    if (eqIdx === -1) continue
    const k = trimmed.substring(0, eqIdx)
    const v = trimmed.substring(eqIdx + 1)
    if (k === name) {
      try {
        return decodeURIComponent(v)
      } catch {
        return v
      }
    }
  }
  return undefined
}

export async function getSessionUser(request: Request): Promise<SessionUser | null> {
  try {
    const secret = process.env.NEXTAUTH_SECRET
    if (!secret) {
      console.error('NEXTAUTH_SECRET is not set')
      return null
    }

    // نحاول أولاً الـ cookie العادي، ثم الـ secure cookie
    const sessionCookie =
      getCookie(request, 'next-auth.session-token') ||
      getCookie(request, '__Secure-next-auth.session-token')

    if (!sessionCookie) return null

    // فك تشفير الـ JWT
    const token = await decode({
      token: sessionCookie,
      secret,
    })

    if (!token?.id) return null

    const user = await db.user.findUnique({
      where: { id: token.id as string },
      select: {
        id: true,
        username: true,
        name: true,
        role: true,
        isActive: true,
      },
    })

    if (!user || !user.isActive) return null

    return {
      id: user.id,
      username: user.username,
      name: user.name,
      role: user.role,
    }
  } catch (e) {
    console.error('getSessionUser error:', e)
    return null
  }
}

export function unauthorizedResponse() {
  return Response.json({ error: 'غير مصرح' }, { status: 401 })
}

export function forbiddenResponse(message = 'هذه الميزة للمدير فقط') {
  return Response.json({ error: message }, { status: 403 })
}
