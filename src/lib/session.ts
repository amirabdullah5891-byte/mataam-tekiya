// نظام الجلسة البسيط - يستخدم قاعدة البيانات + localStorage
// يعمل في كل البيئات بما فيها iframe (المعاينة)
import { db } from './db'

export const SESSION_TOKEN_HEADER = 'x-session-token'
const SESSION_DURATION = 30 * 24 * 60 * 60 * 1000 // 30 يوماً بالمللي ثانية

// توليد token عشوائي آمن
function generateToken(): string {
  const bytes = new Uint8Array(32)
  crypto.getRandomValues(bytes)
  return Array.from(bytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}

export type SessionUser = {
  id: string
  username: string
  name: string
  role: string
  jobTitle: string | null
  permissions: Record<string, boolean>
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

// قراءة الـ token من request (header أو cookie)
export function getRequestToken(request: Request): string | null {
  // 1. محاولة من header المخصص
  const headerToken = request.headers.get(SESSION_TOKEN_HEADER)
  if (headerToken) return headerToken

  // 2. محاولة من Authorization header
  const authHeader = request.headers.get('authorization')
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.substring(7)
  }

  // 3. محاولة من cookie (للتوافق مع الإصدارات السابقة)
  const cookieHeader = request.headers.get('cookie') || ''
  if (cookieHeader) {
    const cookies = cookieHeader.split(';')
    for (const c of cookies) {
      const trimmed = c.trim()
      const eqIdx = trimmed.indexOf('=')
      if (eqIdx === -1) continue
      const k = trimmed.substring(0, eqIdx)
      const v = trimmed.substring(eqIdx + 1)
      if (k === 'restaurant-session') {
        try { return decodeURIComponent(v) } catch { return v }
      }
    }
  }

  return null
}

// التحقق من الجلسة وقراءة المستخدم
export async function getSessionUser(request: Request): Promise<SessionUser | null> {
  try {
    const token = getRequestToken(request)
    if (!token) return null

    // البحث عن الجلسة في DB
    const session = await db.session.findUnique({
      where: { token },
      include: {
        user: {
          select: { id: true, username: true, name: true, role: true, isActive: true, jobTitle: true, permissions: true },
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

    // استيراد نظام الصلاحيات
    const { parsePermissions } = await import('./permissions')
    const permissions = parsePermissions(session.user.permissions, session.user.role)

    return {
      id: session.user.id,
      username: session.user.username,
      name: session.user.name,
      role: session.user.role,
      jobTitle: session.user.jobTitle,
      permissions,
    }
  } catch (e) {
    console.error('getSessionUser error:', e)
    return null
  }
}

// إنشاء response مع token (يرجع في body، لا cookie)
export function createSessionResponse(token: string, body: any, status = 200) {
  return Response.json({
    ...body,
    token, // إرجاع الـ token في body ليخزن في localStorage
  }, { status })
}

// إنشاء response لحذف الجلسة
export function clearSessionResponse(body: any) {
  return Response.json(body)
}

export function unauthorizedResponse() {
  return Response.json({ error: 'غير مصرح' }, { status: 401 })
}

export function forbiddenResponse(message = 'هذه الميزة للمدير فقط') {
  return Response.json({ error: message }, { status: 403 })
}
