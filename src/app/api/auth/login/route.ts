import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { verifyPassword } from '@/lib/password'
import { createSession, createSessionResponse } from '@/lib/session'
import { logAudit, getClientIP, getUserAgent } from '@/lib/audit'
import { checkRateLimit, rateLimitResponse, getRateLimitIdentifier } from '@/lib/rate-limit'

// POST /api/auth/login - تسجيل الدخول وإنشاء جلسة
// مع Rate Limiting للمحاولات الفاشلة فقط (20 محاولة/15 دقيقة)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { username, password } = body

    if (!username || !password) {
      return Response.json({ error: 'اسم المستخدم وكلمة المرور مطلوبان' }, { status: 400 })
    }

    // فحص Rate Limit - 20 محاولة كل 15 دقيقة (مقبول للمستخدمين الحقيقيين)
    const identifier = getRateLimitIdentifier(request, 'login')
    const limit = checkRateLimit(identifier, 20, 15 * 60 * 1000)
    if (!limit.allowed) {
      return Response.json({
        error: `تجاوزت الحد المسموح من المحاولات. حاول مرة أخرى بعد ${Math.ceil((limit.resetTime - Date.now()) / 60 / 1000)} دقيقة`,
      }, { status: 429 })
    }

    const user = await db.user.findUnique({
      where: { username: username.trim() },
    })

    // تسجيل محاولة الدخول الفاشلة عند عدم وجود المستخدم
    if (!user || !user.isActive) {
      await logAudit({
        action: 'login_failed',
        entityType: 'session',
        description: `محاولة دخول فاشلة: ${username.trim()}`,
        ipAddress: getClientIP(request),
        userAgent: getUserAgent(request),
        status: 'failed',
      })
      return Response.json({ error: 'اسم المستخدم أو كلمة المرور غير صحيحة' }, { status: 401 })
    }

    const valid = verifyPassword(password, user.password)
    if (!valid) {
      await logAudit({
        action: 'login_failed',
        entityType: 'session',
        entityId: user.id,
        description: `محاولة دخول فاشلة بكلمة مرور خاطئة`,
        userId: user.id,
        ipAddress: getClientIP(request),
        userAgent: getUserAgent(request),
        status: 'failed',
      })
      return Response.json({ error: 'اسم المستخدم أو كلمة المرور غير صحيحة' }, { status: 401 })
    }

    // تحديث آخر تسجيل دخول
    await db.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() },
    })

    // إنشاء جلسة جديدة
    const token = await createSession(user.id)

    // تسجيل الدخول الناجح
    await logAudit({
      action: 'login',
      entityType: 'session',
      entityId: user.id,
      description: `تسجيل دخول ناجح: ${user.username}`,
      userId: user.id,
      ipAddress: getClientIP(request),
      userAgent: getUserAgent(request),
    })

    return createSessionResponse(token, {
      success: true,
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        role: user.role,
      },
    })
  } catch (error) {
    console.error('Login error:', error)
    return Response.json({ error: 'فشل في تسجيل الدخول' }, { status: 500 })
  }
}
