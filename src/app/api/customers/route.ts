import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSessionUser, unauthorizedResponse, forbiddenResponse } from '@/lib/session'

// GET /api/customers - قائمة الزبائن (للإدارة)
export async function GET(request: NextRequest) {
  try {
    const user = await getSessionUser(request)
    if (!user) return unauthorizedResponse()

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')

    const where: {
      OR?: Array<{ phone?: { contains: string }; name?: { contains: string } }>
    } = {}

    if (search) {
      where.OR = [
        { phone: { contains: search } },
        { name: { contains: search } },
      ]
    }

    const customers = await db.customer.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { orders: true, walletTransactions: true },
        },
      },
      take: 100,
    })

    return NextResponse.json({ customers })
  } catch (error) {
    console.error('Error fetching customers:', error)
    return NextResponse.json({ error: 'فشل في جلب الزبائن' }, { status: 500 })
  }
}

// POST /api/customers - إضافة زبون جديد (إنشاء محفظة)
export async function POST(request: NextRequest) {
  try {
    const user = await getSessionUser(request)
    if (!user) return unauthorizedResponse()
    if (user.role === 'cashier') return forbiddenResponse('هذه الميزة للمشرف أو المدير')

    const body = await request.json()
    const { phone, name, balance, notes } = body

    if (!phone || !phone.trim()) {
      return NextResponse.json({ error: 'رقم الهاتف مطلوب' }, { status: 400 })
    }

    const existing = await db.customer.findUnique({ where: { phone: phone.trim() } })
    if (existing) {
      return NextResponse.json({ error: 'هذا الرقم مسجل بمحفظة بالفعل' }, { status: 400 })
    }

    const initialBalance = Number(balance) || 0

    const customer = await db.$transaction(async (tx) => {
      const newCustomer = await tx.customer.create({
        data: {
          phone: phone.trim(),
          name: name?.trim() || null,
          balance: initialBalance,
          notes: notes?.trim() || null,
        },
      })

      // تسجيل معاملة الشحن الافتتاحي
      if (initialBalance > 0) {
        await tx.walletTransaction.create({
          data: {
            customerId: newCustomer.id,
            type: 'topup',
            amount: initialBalance,
            balanceBefore: 0,
            balanceAfter: initialBalance,
            description: 'رصيد افتتاحي',
            createdById: user.id,
          },
        })
      }

      return newCustomer
    })

    return NextResponse.json(customer, { status: 201 })
  } catch (error) {
    console.error('Error creating customer:', error)
    return NextResponse.json({ error: 'فشل في إضافة الزبون' }, { status: 500 })
  }
}
