import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSessionUser, unauthorizedResponse } from '@/lib/session'

// GET /api/purchases/[id] - تفاصيل فاتورة شراء
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUser(request)
    if (!user) return unauthorizedResponse()

    const { id } = await params
    const purchase = await db.purchase.findUnique({
      where: { id },
      include: { supplier: true, items: true },
    })

    if (!purchase) {
      return NextResponse.json({ error: 'الفاتورة غير موجودة' }, { status: 404 })
    }

    return NextResponse.json(purchase)
  } catch (error) {
    console.error('Error fetching purchase:', error)
    return NextResponse.json({ error: 'فشل في جلب الفاتورة' }, { status: 500 })
  }
}
