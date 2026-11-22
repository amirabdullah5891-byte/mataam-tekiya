import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSessionUser, unauthorizedResponse } from '@/lib/session'
import { RESTAURANT_INFO } from '@/lib/restaurant'

// رسائل SMS حسب حالة الطلب
function getStatusMessage(status: string, orderNumber: string, total: number): string {
  switch (status) {
    case 'confirmed':
      return `${RESTAURANT_INFO.name}: تم تأكيد طلبك ${orderNumber}. جاري التحضير. شكراً لك!`
    case 'preparing':
      return `${RESTAURANT_INFO.name}: طلبك ${orderNumber} قيد التحضير الآن. سنخبرك عند جاهزيته.`
    case 'ready':
      return `${RESTAURANT_INFO.name}: طلبك ${orderNumber} جاهز للتسليم! يرجى الحضور لاستلامه.`
    case 'completed':
      return `${RESTAURANT_INFO.name}: تم تسليم طلبك ${orderNumber} بقيمة ${total} ج.س. نتمنى لكم وجبة شهية وننتظر عودتكم!`
    case 'cancelled':
      return `${RESTAURANT_INFO.name}: نعتذر، تم إلغاء طلبك ${orderNumber}. للاستفسار اتصل على ${RESTAURANT_INFO.phones[0]}`
    default:
      return `${RESTAURANT_INFO.name}: تحديث حالة طلبك ${orderNumber}: ${status}`
  }
}

// PUT /api/customer-orders/[id]/status - تحديث حالة الطلب + إرسال SMS تلقائي
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

    if (status === 'confirmed' && !existing.acceptedById) {
      data.acceptedById = user.id
      data.acceptedAt = new Date()
    }

    if (status === 'completed') {
      data.completedAt = new Date()
    }

    // معالجة الإلغاء مع استرجاع المحفظة
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

        // إرسال إشعار SMS للزبون
        if (existing.customerPhone) {
          await db.notification.create({
            data: {
              customerPhone: existing.customerPhone,
              customerName: existing.customerName,
              message: getStatusMessage('cancelled', existing.orderNumber, existing.total),
              type: 'order_status',
              reference: existing.orderNumber,
              status: 'sent',
              sentAt: new Date(),
            },
          })
        }

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

    // إرسال إشعار SMS تلقائي للزبون عند تغير الحالة (لكل الحالات ما عدا pending)
    if (status !== 'pending' && existing.customerPhone) {
      try {
        await db.notification.create({
          data: {
            customerPhone: existing.customerPhone,
            customerName: existing.customerName,
            message: getStatusMessage(status, existing.orderNumber, existing.total),
            type: 'order_status',
            reference: existing.orderNumber,
            status: 'sent',
            sentAt: new Date(),
          },
        })
      } catch (e) {
        console.error('Failed to send notification:', e)
      }
    }

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Error updating order status:', error)
    return NextResponse.json({ error: 'فشل في تحديث حالة الطلب' }, { status: 500 })
  }
}
