import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSessionUser, unauthorizedResponse } from '@/lib/session'

// PUT /api/customer-orders/[id]/status - تحديث حالة الطلب
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUser(request)
    if (!user) return unauthorizedResponse()

    const { id } = await params
    const body = await request.json()
    const { status } = body

    const validStatuses = ['pending', 'confirmed', 'preparing', 'ready', 'completed', 'cancelled']
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: 'حالة غير صالحة' }, { status: 400 })
    }

    const existing = await db.customerOrder.findUnique({
      where: { id },
      include: { customer: true, items: true },
    })
    if (!existing) {
      return NextResponse.json({ error: 'الطلب غير موجود' }, { status: 404 })
    }

    const data: {
      status: string
      acceptedById?: string
      acceptedAt?: Date
      completedAt?: Date
    } = { status }

    // عند التأكيد لأول مرة، نسجل من قبِل من
    if (status === 'confirmed' && !existing.acceptedById) {
      data.acceptedById = user.id
      data.acceptedAt = new Date()
    }

    // عند الإكمال
    if (status === 'completed') {
      data.completedAt = new Date()
    }

    // عند الإلغاء بعد الدفع من المحفظة، نسترجع المبلغ
    if (status === 'cancelled' && existing.paymentMethod === 'wallet' && existing.customerId) {
      const customer = existing.customer
      if (customer) {
        const balanceBefore = customer.balance
        const balanceAfter = balanceBefore + existing.total

        await db.$transaction(async (tx) => {
          await tx.customer.update({
            where: { id: customer.id },
            data: { balance: balanceAfter },
          })

          await tx.walletTransaction.create({
            data: {
              customerId: customer.id,
              type: 'refund',
              amount: existing.total,
              balanceBefore,
              balanceAfter,
              description: `استرجاع طلب ملغى ${existing.orderNumber}`,
              reference: existing.orderNumber,
            },
          })

          const updated = await tx.customerOrder.update({
            where: { id },
            data,
            include: { items: true },
          })

          return updated
        })

        return NextResponse.json({
          success: true,
          message: `تم إلغاء الطلب واسترجاع ${existing.total} ج.س لمحفظة الزبون`,
        })
      }
    }

    const updated = await db.customerOrder.update({
      where: { id },
      data,
      include: { items: true },
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Error updating order status:', error)
    return NextResponse.json({ error: 'فشل في تحديث حالة الطلب' }, { status: 500 })
  }
}
