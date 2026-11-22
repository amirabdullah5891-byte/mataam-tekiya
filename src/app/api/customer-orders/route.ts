import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSessionUser, unauthorizedResponse } from '@/lib/session'

// GET /api/customer-orders - قائمة طلبات الزبائن (للإدارة)
export async function GET(request: NextRequest) {
  try {
    const user = await getSessionUser(request)
    if (!user) return unauthorizedResponse()

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const limit = Number(searchParams.get('limit') || '50')

    const where: { status?: string } = {}
    if (status && status !== 'all') where.status = status

    const orders = await db.customerOrder.findMany({
      where,
      include: {
        items: true,
        customer: { select: { name: true, phone: true, balance: true } },
        acceptedBy: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    })

    // إحصائيات سريعة
    const stats = {
      pending: await db.customerOrder.count({ where: { status: 'pending' } }),
      confirmed: await db.customerOrder.count({ where: { status: 'confirmed' } }),
      preparing: await db.customerOrder.count({ where: { status: 'preparing' } }),
      ready: await db.customerOrder.count({ where: { status: 'ready' } }),
      completed: await db.customerOrder.count({ where: { status: 'completed' } }),
      cancelled: await db.customerOrder.count({ where: { status: 'cancelled' } }),
    }

    return NextResponse.json({ orders, stats })
  } catch (error) {
    console.error('Error fetching customer orders:', error)
    return NextResponse.json({ error: 'فشل في جلب الطلبات' }, { status: 500 })
  }
}
