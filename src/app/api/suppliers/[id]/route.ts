import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSessionUser, unauthorizedResponse, forbiddenResponse } from '@/lib/session'

// PUT /api/suppliers/[id]
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
    const { name, phone, address, notes, balance } = body

    const existing = await db.supplier.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'المورد غير موجود' }, { status: 404 })
    }

    const updated = await db.supplier.update({
      where: { id },
      data: {
        name: name?.trim() ?? existing.name,
        phone: phone !== undefined ? (phone?.trim() || null) : existing.phone,
        address: address !== undefined ? (address?.trim() || null) : existing.address,
        notes: notes !== undefined ? (notes?.trim() || null) : existing.notes,
        balance: balance !== undefined ? Number(balance) : existing.balance,
      },
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Error updating supplier:', error)
    return NextResponse.json({ error: 'فشل في تعديل المورد' }, { status: 500 })
  }
}

// DELETE /api/suppliers/[id]
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUser(request)
    if (!user) return unauthorizedResponse()
    if (user.role === 'cashier') return forbiddenResponse()

    const { id } = await params

    const existing = await db.supplier.findUnique({
      where: { id },
      include: { _count: { select: { purchases: true } } },
    })
    if (!existing) {
      return NextResponse.json({ error: 'المورد غير موجود' }, { status: 404 })
    }

    if (existing._count.purchases > 0) {
      return NextResponse.json(
        { error: 'لا يمكن حذف مورد له مشتريات مسجلة. عدّل البيانات بدلاً من الحذف' },
        { status: 400 }
      )
    }

    await db.supplier.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting supplier:', error)
    return NextResponse.json({ error: 'فشل في حذف المورد' }, { status: 500 })
  }
}
