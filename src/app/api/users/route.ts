import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSessionUser, unauthorizedResponse, forbiddenResponse } from '@/lib/session'
import { logAudit } from '@/lib/audit'

// GET /api/users - قائمة المستخدمين (admin فقط)
export async function GET(request: NextRequest) {
  try {
    const user = await getSessionUser(request)
    if (!user) return unauthorizedResponse()
    if (user.role !== 'admin') return forbiddenResponse()

    const users = await db.user.findMany({
      select: {
        id: true,
        username: true,
        name: true,
        role: true,
        isActive: true,
        lastLogin: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'asc' },
    })

    return NextResponse.json({ users })
  } catch (error) {
    console.error('Error fetching users:', error)
    return NextResponse.json({ error: 'فشل في جلب المستخدمين' }, { status: 500 })
  }
}

// POST /api/users - إضافة مستخدم جديد (admin فقط)
export async function POST(request: NextRequest) {
  try {
    const user = await getSessionUser(request)
    if (!user) return unauthorizedResponse()
    if (user.role !== 'admin') return forbiddenResponse()

    const body = await request.json()
    const { name, username, password, role } = body

    if (!name || !username || !password) {
      return NextResponse.json(
        { error: 'الاسم واسم المستخدم وكلمة المرور مطلوبة' },
        { status: 400 }
      )
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'كلمة المرور يجب أن تكون 6 أحرف على الأقل' },
        { status: 400 }
      )
    }

    const validRoles = ['admin', 'manager', 'cashier']
    if (role && !validRoles.includes(role)) {
      return NextResponse.json({ error: 'دور غير صالح' }, { status: 400 })
    }

    const existing = await db.user.findUnique({ where: { username: username.trim() } })
    if (existing) {
      return NextResponse.json({ error: 'اسم المستخدم محجوز' }, { status: 400 })
    }

    const { hashPassword } = await import('@/lib/password')

    const newUser = await db.user.create({
      data: {
        name: name.trim(),
        username: username.trim(),
        password: hashPassword(password),
        role: role || 'cashier',
      },
      select: {
        id: true,
        name: true,
        username: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    })

    // تسجيل إنشاء مستخدم جديد
    await logAudit({
      action: 'user_create',
      entityType: 'user',
      entityId: newUser.id,
      description: `إنشاء مستخدم جديد: ${newUser.username} (${newUser.role})`,
      userId: user.id,
      metadata: { username: newUser.username, role: newUser.role },
    })

    return NextResponse.json(newUser, { status: 201 })
  } catch (error) {
    console.error('Error creating user:', error)
    return NextResponse.json({ error: 'فشل في إضافة المستخدم' }, { status: 500 })
  }
}
