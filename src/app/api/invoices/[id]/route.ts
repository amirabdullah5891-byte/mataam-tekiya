import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSessionUser, unauthorizedResponse } from '@/lib/session'

// GET /api/invoices/[id] - تفاصيل فاتورة واحدة
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUser(request)
    if (!user) return unauthorizedResponse()

    const { id } = await params

    const invoice = await db.invoice.findUnique({
      where: { id },
      include: { items: true },
    })

    if (!invoice) {
      return NextResponse.json({ error: 'الفاتورة غير موجودة' }, { status: 404 })
    }

    return NextResponse.json(invoice)
  } catch (error) {
    console.error('Error fetching invoice:', error)
    return NextResponse.json({ error: 'فشل في جلب الفاتورة' }, { status: 500 })
  }
}

// PUT /api/invoices/[id] - تعديل فاتورة (إلغاء، تغيير الحالة)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUser(request)
    if (!user) return unauthorizedResponse()

    const { id } = await params
    const body = await request.json()

    const { status, notes } = body

    const existing = await db.invoice.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'الفاتورة غير موجودة' }, { status: 404 })
    }

    const data: { status?: string; notes?: string | null } = {}
    if (status) data.status = status
    if (notes !== undefined) data.notes = notes?.trim() || null

    const updated = await db.invoice.update({
      where: { id },
      data,
      include: { items: true },
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Error updating invoice:', error)
    return NextResponse.json({ error: 'فشل في تعديل الفاتورة' }, { status: 500 })
  }
}

// DELETE /api/invoices/[id] - حذف/إلغاء فاتورة
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUser(request)
    if (!user) return unauthorizedResponse()

    const { id } = await params

    const existing = await db.invoice.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'الفاتورة غير موجودة' }, { status: 404 })
    }

    await db.invoice.update({
      where: { id },
      data: { status: 'cancelled' },
    })

    return NextResponse.json({ success: true, message: 'تم إلغاء الفاتورة' })
  } catch (error) {
    console.error('Error cancelling invoice:', error)
    return NextResponse.json({ error: 'فشل في إلغاء الفاتورة' }, { status: 500 })
  }
}
