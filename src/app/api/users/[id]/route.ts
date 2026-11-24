import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSessionUser, unauthorizedResponse, forbiddenResponse } from '@/lib/session'
import { hashPassword } from '@/lib/password'

// PUT /api/users/[id] - تعديل مستخدم
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUser(request)
    if (!user) return unauthorizedResponse()
    if (user.role !== 'admin') return forbiddenResponse()

    const { id } = await params
    const body = await request.json()
    const { name, username, password, role, isActive, jobTitle, permissions } = body

    const existing = await db.user.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'المستخدم غير موجود' }, { status: 404 })
    }

    if (username && username.trim() !== existing.username) {
      const dup = await db.user.findUnique({ where: { username: username.trim() } })
      if (dup) {
        return NextResponse.json({ error: 'اسم المستخدم محجوز' }, { status: 400 })
      }
    }

    const data: {
      name?: string
      username?: string
      password?: string
      role?: string
      jobTitle?: string | null
      permissions?: string
      isActive?: boolean
    } = {}

    if (name !== undefined) data.name = name.trim()
    if (username !== undefined) data.username = username.trim()
    if (password) {
      if (password.length < 6) {
        return NextResponse.json(
          { error: 'كلمة المرور يجب أن تكون 6 أحرف على الأقل' },
          { status: 400 }
        )
      }
      data.password = hashPassword(password)
    }
    if (role !== undefined) {
      const validRoles = ['admin', 'manager', 'cashier']
      if (!validRoles.includes(role)) {
        return NextResponse.json({ error: 'دور غير صالح' }, { status: 400 })
      }
      data.role = role
    }
    if (jobTitle !== undefined) data.jobTitle = jobTitle?.trim() || null
    if (isActive !== undefined) data.isActive = Boolean(isActive)
    if (permissions !== undefined) {
      const { serializePermissions } = await import('@/lib/permissions')
      data.permissions = serializePermissions(permissions)
    }

    const updated = await db.user.update({
      where: { id },
      data,
      select: {
        id: true,
        name: true,
        username: true,
        role: true,
        jobTitle: true,
        isActive: true,
        createdAt: true,
        permissions: true,
      },
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Error updating user:', error)
    return NextResponse.json({ error: 'فشل في تعديل المستخدم' }, { status: 500 })
  }
}

// DELETE /api/users/[id] - تعطيل مستخدم
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUser(request)
    if (!user) return unauthorizedResponse()
    if (user.role !== 'admin') return forbiddenResponse()

    const { id } = await params

    if (id === user.id) {
      return NextResponse.json(
        { error: 'لا يمكنك تعطيل حسابك الحالي' },
        { status: 400 }
      )
    }

    const existing = await db.user.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'المستخدم غير موجود' }, { status: 404 })
    }

    await db.user.update({
      where: { id },
      data: { isActive: false },
    })

    return NextResponse.json({ success: true, message: 'تم تعطيل المستخدم' })
  } catch (error) {
    console.error('Error deleting user:', error)
    return NextResponse.json({ error: 'فشل في تعطيل المستخدم' }, { status: 500 })
  }
}
