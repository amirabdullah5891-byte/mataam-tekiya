import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSessionUser, unauthorizedResponse } from '@/lib/session'

// GET /api/reports/suppliers - تقرير الموردين الشامل
export async function GET(request: NextRequest) {
  try {
    const user = await getSessionUser(request)
    if (!user) return unauthorizedResponse()

    const { searchParams } = new URL(request.url)
    const from = searchParams.get('from')
    const to = searchParams.get('to')

    // كل الموردين
    const suppliers = await db.supplier.findMany({
      include: {
        purchases: {
          where: (from || to) ? {
            createdAt: {
              gte: from ? new Date(from) : undefined,
              lte: to ? new Date(to) : undefined,
            },
          } : undefined,
          include: { items: true },
          orderBy: { createdAt: 'desc' },
        },
        _count: { select: { purchases: true } },
      },
      orderBy: { name: 'asc' },
    })

    // إحصائيات
    const totalBalance = suppliers.reduce((s, sup) => s + sup.balance, 0)
    const totalPurchases = suppliers.reduce((s, sup) => s + sup._count.purchases, 0)
    const totalPurchaseValue = suppliers.reduce(
      (s, sup) => s + sup.purchases.reduce((ps, p) => ps + p.total, 0),
      0
    )

    return NextResponse.json({
      summary: {
        totalSuppliers: suppliers.length,
        totalBalance,
        totalPurchases,
        totalPurchaseValue,
      },
      suppliers: suppliers.map(sup => ({
        id: sup.id,
        name: sup.name,
        phone: sup.phone,
        address: sup.address,
        balance: sup.balance,
        notes: sup.notes,
        totalPurchases: sup._count.purchases,
        purchaseValue: sup.purchases.reduce((s, p) => s + p.total, 0),
        recentPurchases: sup.purchases.slice(0, 5).map(p => ({
          id: p.id,
          purchaseNumber: p.purchaseNumber,
          total: p.total,
          paidAmount: p.paidAmount,
          status: p.status,
          date: p.createdAt,
          itemCount: p.items.length,
        })),
      })),
    })
  } catch (error) {
    console.error('Error fetching suppliers report:', error)
    return NextResponse.json({ error: 'فشل في جلب التقرير' }, { status: 500 })
  }
}
