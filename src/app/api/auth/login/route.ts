import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { verifyPassword } from '@/lib/password'
import { createSession, createSessionResponse } from '@/lib/session'

// POST /api/auth/login - تسجيل الدخول وإنشاء جلسة
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { username, password } = body

    if (!username || !password) {
      return Response.json({ error: 'اسم المستخدم وكلمة المرور مطلوبان' }, { status: 400 })
    }

    const user = await db.user.findUnique({
      where: { username: username.trim() },
    })

    if (!user || !user.isActive) {
      return Response.json({ error: 'اسم المستخدم أو كلمة المرور غير صحيحة' }, { status: 401 })
    }

    const valid = verifyPassword(password, user.password)
    if (!valid) {
      return Response.json({ error: 'اسم المستخدم أو كلمة المرور غير صحيحة' }, { status: 401 })
    }

    // تحديث آخر تسجيل دخول
    await db.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() },
    })

    // إنشاء جلسة جديدة
    const token = await createSession(user.id)

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
