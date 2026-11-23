import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSessionUser, unauthorizedResponse, forbiddenResponse } from '@/lib/session'

// PUT /api/reviews/[id] - إظهار/إخفاء تقييم
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUser(request)
    if (!user) return unauthorizedResponse()
    if (user.role === 'cashier') return forbiddenResponse()

    const { id } = await params
    const body = await request.json()
    const { isHidden } = body

    const existing = await db.review.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'التقييم غير موجود' }, { status: 404 })
    }

    const updated = await db.review.update({
      where: { id },
      data: { isHidden: Boolean(isHidden) },
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Error updating review:', error)
    return NextResponse.json({ error: 'فشل في تحديث التقييم' }, { status: 500 })
  }
}

// DELETE /api/reviews/[id] - حذف تقييم
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUser(request)
    if (!user) return unauthorizedResponse()
    if (user.role === 'cashier') return forbiddenResponse()

    const { id } = await params

    const existing = await db.review.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'التقييم غير موجود' }, { status: 404 })
    }

    await db.review.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting review:', error)
    return NextResponse.json({ error: 'فشل في حذف التقييم' }, { status: 500 })
  }
}
