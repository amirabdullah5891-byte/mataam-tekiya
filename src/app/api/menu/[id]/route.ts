import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSessionUser, unauthorizedResponse } from '@/lib/session'

// PUT /api/menu/[id] - تعديل عنصر قائمة
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUser(request)
    if (!user) return unauthorizedResponse()

    const { id } = await params
    const body = await request.json()

    const { name, category, price, cost, description, isActive } = body

    const existing = await db.menuItem.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'العنصر غير موجود' }, { status: 404 })
    }

    const updated = await db.menuItem.update({
      where: { id },
      data: {
        name: name?.trim() ?? existing.name,
        category: category?.trim() ?? existing.category,
        price: price !== undefined ? Number(price) : existing.price,
        cost: cost !== undefined ? Number(cost) : existing.cost,
        description: description !== undefined ? (description?.trim() || null) : existing.description,
        isActive: isActive !== undefined ? Boolean(isActive) : existing.isActive,
      },
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Error updating menu item:', error)
    return NextResponse.json({ error: 'فشل في تعديل العنصر' }, { status: 500 })
  }
}

// DELETE /api/menu/[id] - حذف عنصر قائمة
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUser(request)
    if (!user) return unauthorizedResponse()

    const { id } = await params

    const existing = await db.menuItem.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'العنصر غير موجود' }, { status: 404 })
    }

    // تعطيل بدلاً من حذف حتى لا تنكسر الفواتير القديمة
    await db.menuItem.update({
      where: { id },
      data: { isActive: false },
    })

    return NextResponse.json({ success: true, message: 'تم تعطيل العنصر' })
  } catch (error) {
    console.error('Error deleting menu item:', error)
    return NextResponse.json({ error: 'فشل في حذف العنصر' }, { status: 500 })
  }
}
