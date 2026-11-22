import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSessionUser, unauthorizedResponse, forbiddenResponse } from '@/lib/session'

// GET /api/customers/[id] - تفاصيل زبون + سجل المعاملات + الطلبات
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUser(request)
    if (!user) return unauthorizedResponse()

    const { id } = await params

    const customer = await db.customer.findUnique({
      where: { id },
      include: {
        walletTransactions: {
          orderBy: { createdAt: 'desc' },
          take: 50,
          include: { createdBy: { select: { name: true } } },
        },
        orders: {
          orderBy: { createdAt: 'desc' },
          take: 20,
          include: { items: true },
        },
      },
    })

    if (!customer) {
      return NextResponse.json({ error: 'الزبون غير موجود' }, { status: 404 })
    }

    return NextResponse.json({ customer })
  } catch (error) {
    console.error('Error fetching customer:', error)
    return NextResponse.json({ error: 'فشل في جلب بيانات الزبون' }, { status: 500 })
  }
}
