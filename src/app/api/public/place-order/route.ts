import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { checkRateLimit, rateLimitResponse, getRateLimitIdentifier } from '@/lib/rate-limit'

// توليد رقم طلب تسلسلي ORD-YYYYMMDD-XXX
async function generateOrderNumber(): Promise<string> {
  const today = new Date()
  const yyyy = today.getFullYear()
  const mm = String(today.getMonth() + 1).padStart(2, '0')
  const dd = String(today.getDate()).padStart(2, '0')
  const prefix = `ORD-${yyyy}${mm}${dd}-`

  const startOfDay = new Date(today)
  startOfDay.setHours(0, 0, 0, 0)
  const endOfDay = new Date(today)
  endOfDay.setHours(23, 59, 59, 999)

  const todayCount = await db.customerOrder.count({
    where: { createdAt: { gte: startOfDay, lte: endOfDay } },
  })

  const seq = String(todayCount + 1).padStart(3, '0')
  return `${prefix}${seq}`
}

// POST /api/public/place-order - زبون يرسل طلباً جديداً (بدون مصادقة)
// مع Rate Limiting: 10 طلبات/دقيقة لكل IP (لمنع الإساءة)
export async function POST(request: NextRequest) {
  // فحص Rate Limit - 10 طلبات/دقيقة
  const identifier = getRateLimitIdentifier(request, 'order')
  const limit = checkRateLimit(identifier, 10, 60 * 1000)
  if (!limit.allowed) {
    return rateLimitResponse(limit.resetTime)
  }

  try {
    const body = await request.json()

    const {
      customerName,
      customerPhone,
      tableNumber,
      items,
      paymentMethod = 'cash',
      notes,
      orderType = 'dine_in', // dine_in (داخل المحل), takeaway (سفري)
      waiterName, // اسم الويتر/الكاشير
      address, // عنوان التوصيل للسفري
    } = body

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'الطلب يجب أن يحتوي على بند واحد على الأقل' },
        { status: 400 }
      )
    }

    // التحقق من البيانات المطلوبة حسب نوع الطلب
    if (orderType === 'takeaway') {
      if (!customerPhone?.trim()) {
        return NextResponse.json(
          { error: 'رقم الهاتف مطلوب للطلبات السفرية' },
          { status: 400 }
        )
      }
      if (!address?.trim()) {
        return NextResponse.json(
          { error: 'العنوان مطلوب للطلبات السفرية' },
          { status: 400 }
        )
      }
    }

    // التحقق من أن العناصر موجودة في القائمة
    const menuItemIds = items.map((it: any) => it.menuItemId).filter(Boolean)
    const menuItems = await db.menuItem.findMany({
      where: { id: { in: menuItemIds }, isActive: true, isAvailable: true },
    })

    const menuItemMap = new Map(menuItems.map(m => [m.id, m]))

    const orderItemsData = items.map((it: {
      menuItemId?: string
      name: string
      quantity: number
      price: number
      notes?: string
    }) => {
      const menuItem = it.menuItemId ? menuItemMap.get(it.menuItemId) : null
      if (it.menuItemId && !menuItem) {
        throw new Error(`الصنف "${it.name}" غير متاح حالياً`)
      }
      const qty = Math.max(1, Number(it.quantity) || 1)
      const price = Number(it.price) || 0
      return {
        menuItemId: menuItem?.id || null,
        name: it.name,
        quantity: qty,
        price,
        total: qty * price,
        notes: it.notes?.trim() || null,
      }
    })

    const subtotal = orderItemsData.reduce((s, it) => s + it.total, 0)
    const total = subtotal
    // حساب عدد الأطباق الإجمالي
    const itemCount = orderItemsData.reduce((s, it) => s + it.quantity, 0)

    // البحث عن زبون مسجل برقم الهاتف (إن وُجد)
    let customer: { id: string; balance: number } | null = null
    if (customerPhone) {
      customer = await db.customer.findUnique({
        where: { phone: customerPhone.trim() },
        select: { id: true, balance: true },
      })

      // إذا اختار الدفع من المحفظة، تحقق من الرصيد
      if (paymentMethod === 'wallet') {
        if (!customer) {
          return NextResponse.json(
            { error: 'لا توجد محفظة مرتبطة بهذا الرقم. يرجى شحن المحفظة أولاً' },
            { status: 400 }
          )
        }
        if (customer.balance < total) {
          return NextResponse.json(
            {
              error: `رصيد المحفظة غير كافٍ. الرصيد: ${customer.balance} ج.س، المطلوب: ${total} ج.س`,
              balance: customer.balance,
              total,
            },
            { status: 400 }
          )
        }
      }
    }

    const orderNumber = await generateOrderNumber()

    // إنشاء الطلب + خصم المحفظة إن لزم
    const order = await db.$transaction(async (tx) => {
      const newOrder = await tx.customerOrder.create({
        data: {
          orderNumber,
          customerId: customer?.id || null,
          customerName: customerName?.trim() || null,
          customerPhone: customerPhone?.trim() || null,
          tableNumber: tableNumber?.trim() || null,
          subtotal,
          total,
          paymentMethod,
          status: 'pending',
          notes: notes?.trim() || null,
          orderType,
          waiterName: waiterName?.trim() || null,
          address: address?.trim() || null,
          itemCount,
          items: { create: orderItemsData },
        },
        include: { items: true },
      })

      // خصم من المحفظة إن كان الدفع منها
      if (paymentMethod === 'wallet' && customer) {
        const balanceBefore = customer.balance
        const balanceAfter = balanceBefore - total

        await tx.customer.update({
          where: { id: customer.id },
          data: { balance: balanceAfter },
        })

        await tx.walletTransaction.create({
          data: {
            customerId: customer.id,
            type: 'payment',
            amount: -total,
            balanceBefore,
            balanceAfter,
            description: `دفع طلب ${orderNumber}`,
            reference: orderNumber,
          },
        })
      }

      return newOrder
    })

    return NextResponse.json({
      success: true,
      order,
      message: paymentMethod === 'wallet'
        ? `تم إنشاء الطلب ${orderNumber} وخصم ${total} ج.س من محفظتك`
        : `تم استلام طلبك ${orderNumber}. سيتم تأكيد الطلب قريباً`,
    }, { status: 201 })
  } catch (error: any) {
    console.error('Error placing order:', error)
    return NextResponse.json(
      { error: error.message || 'فشل في إنشاء الطلب' },
      { status: 500 }
    )
  }
}
