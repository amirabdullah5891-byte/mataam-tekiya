import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { hashPassword } from '@/lib/password'

// POST /api/users/initial - إنشاء أول حساب مدير (بدون مصادقة، يعمل فقط إذا لم يوجد أي مستخدم)
export async function POST(request: NextRequest) {
  try {
    // فحص عدم وجود أي مستخدم
    const userCount = await db.user.count()
    if (userCount > 0) {
      return NextResponse.json(
        { error: 'يوجد مستخدمون بالفعل. استخدم تسجيل الدخول العادي' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { name, username, password } = body

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

    const existing = await db.user.findUnique({ where: { username: username.trim() } })
    if (existing) {
      return NextResponse.json({ error: 'اسم المستخدم محجوز' }, { status: 400 })
    }

    const hashedPassword = hashPassword(password)

    const user = await db.user.create({
      data: {
        name: name.trim(),
        username: username.trim(),
        password: hashedPassword,
        role: 'admin',
      },
      select: {
        id: true,
        name: true,
        username: true,
        role: true,
      },
    })

    return NextResponse.json(user, { status: 201 })
  } catch (error) {
    console.error('Error creating initial user:', error)
    return NextResponse.json({ error: 'فشل في إنشاء الحساب' }, { status: 500 })
  }
}
