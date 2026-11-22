import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSessionUser, unauthorizedResponse, forbiddenResponse } from '@/lib/session'

// POST /api/wallet/topup - شحن محفظة زبون
export async function POST(request: NextRequest) {
  try {
    const user = await getSessionUser(request)
    if (!user) return unauthorizedResponse()
    if (user.role === 'cashier') return forbiddenResponse('هذه الميزة للمشرف أو المدير')

    const body = await request.json()
    const { customerId, amount, description } = body

    if (!customerId) {
      return NextResponse.json({ error: 'معرّف الزبون مطلوب' }, { status: 400 })
    }

    const topupAmount = Number(amount)
    if (!topupAmount || topupAmount <= 0) {
      return NextResponse.json({ error: 'المبلغ يجب أن يكون أكبر من صفر' }, { status: 400 })
    }

    const customer = await db.customer.findUnique({ where: { id: customerId } })
    if (!customer) {
      return NextResponse.json({ error: 'الزبون غير موجود' }, { status: 404 })
    }

    const balanceBefore = customer.balance
    const balanceAfter = balanceBefore + topupAmount

    const result = await db.$transaction(async (tx) => {
      const updatedCustomer = await tx.customer.update({
        where: { id: customerId },
        data: { balance: balanceAfter },
      })

      const transaction = await tx.walletTransaction.create({
        data: {
          customerId,
          type: 'topup',
          amount: topupAmount,
          balanceBefore,
          balanceAfter,
          description: description?.trim() || `شحن محفظة بقيمة ${topupAmount} ج.س`,
          createdById: user.id,
        },
        include: { createdBy: { select: { name: true } } },
      })

      return { customer: updatedCustomer, transaction }
    })

    return NextResponse.json(result, { status: 201 })
  } catch (error) {
    console.error('Error topping up wallet:', error)
    return NextResponse.json({ error: 'فشل في شحن المحفظة' }, { status: 500 })
  }
}
