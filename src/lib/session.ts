// نظام الجلسة البسيط - بديل موثوق عن NextAuth
// يستخدم session token مخزن في قاعدة البيانات + cookie
import { db } from './db'

export const SESSION_COOKIE_NAME = 'restaurant-session'
const SESSION_DURATION = 30 * 24 * 60 * 60 * 1000 // 30 يوماً بالمللي ثانية

// توليد token عشوائي آمن
function generateToken(): string {
  const bytes = new Uint8Array(32)
  crypto.getRandomValues(bytes)
  return Array.from(bytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}

// قراءة قيمة cookie من headers
function getCookie(request: Request, name: string): string | undefined {
  const cookieHeader = request.headers.get('cookie') || ''
  if (!cookieHeader) return undefined
  const cookies = cookieHeader.split(';')
  for (const c of cookies) {
    const trimmed = c.trim()
    const eqIdx = trimmed.indexOf('=')
    if (eqIdx === -1) continue
    const k = trimmed.substring(0, eqIdx)
    const v = trimmed.substring(eqIdx + 1)
    if (k === name) {
      try { return decodeURIComponent(v) } catch { return v }
    }
  }
  return undefined
}

export type SessionUser = {
  id: string
  username: string
  name: string
  role: string
}

// إنشاء جلسة جديدة للمستخدم - تُرجع الـ token
export async function createSession(userId: string): Promise<string> {
  const token = generateToken()
  const expiresAt = new Date(Date.now() + SESSION_DURATION)

  await db.session.create({
    data: { token, userId, expiresAt },
  })

  return token
}

// حذف جلسة (تسجيل خروج)
export async function deleteSession(token: string): Promise<void> {
  try {
    await db.session.deleteMany({ where: { token } })
  } catch {
    // تجاهل
  }
}

// التحقق من الجلسة وقراءة المستخدم - يستخدم في كل API route
export async function getSessionUser(request: Request): Promise<SessionUser | null> {
  try {
    const token = getCookie(request, SESSION_COOKIE_NAME)
    if (!token) return null

    // البحث عن الجلسة في DB
    const session = await db.session.findUnique({
      where: { token },
      include: {
        user: {
          select: { id: true, username: true, name: true, role: true, isActive: true },
        },
      },
    })

    // الجلسة غير موجودة
    if (!session) return null

    // الجلسة منتهية الصلاحية
    if (session.expiresAt < new Date()) {
      await db.session.delete({ where: { id: session.id } }).catch(() => {})
      return null
    }

    // المستخدم غير نشط
    if (!session.user.isActive) {
      await db.session.delete({ where: { id: session.id } }).catch(() => {})
      return null
    }

    return {
      id: session.user.id,
      username: session.user.username,
      name: session.user.name,
      role: session.user.role,
    }
  } catch (e) {
    console.error('getSessionUser error:', e)
    return null
  }
}

// إنشاء response مع cookie الجلسة
export function createSessionResponse(token: string, body: any, status = 200) {
  const res = Response.json(body, { status })
  // إضافة cookie للـ response headers
  res.headers.set(
    'Set-Cookie',
    `${SESSION_COOKIE_NAME}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${SESSION_DURATION / 1000}`
  )
  return res
}

// إنشاء response لحذف الـ cookie (تسجيل خروج)
export function clearSessionResponse(body: any) {
  const res = Response.json(body)
  res.headers.set(
    'Set-Cookie',
    `${SESSION_COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`
  )
  return res
}

export function unauthorizedResponse() {
  return Response.json({ error: 'غير مصرح' }, { status: 401 })
}

export function forbiddenResponse(message = 'هذه الميزة للمدير فقط') {
  return Response.json({ error: message }, { status: 403 })
}
