import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSessionUser, unauthorizedResponse } from '@/lib/session'

// توليد رقم شراء تسلسلي
async function generatePurchaseNumber(): Promise<string> {
  const today = new Date()
  const yyyy = today.getFullYear()
  const mm = String(today.getMonth() + 1).padStart(2, '0')
  const dd = String(today.getDate()).padStart(2, '0')
  const prefix = `PUR-${yyyy}${mm}${dd}-`

  const startOfDay = new Date(today)
  startOfDay.setHours(0, 0, 0, 0)
  const endOfDay = new Date(today)
  endOfDay.setHours(23, 59, 59, 999)

  const todayCount = await db.purchase.count({
    where: { createdAt: { gte: startOfDay, lte: endOfDay } },
  })

  const seq = String(todayCount + 1).padStart(3, '0')
  return `${prefix}${seq}`
}

// GET /api/purchases - قائمة المشتريات
export async function GET(request: NextRequest) {
  try {
    const user = await getSessionUser(request)
    if (!user) return unauthorizedResponse()

    const { searchParams } = new URL(request.url)
    const limit = Number(searchParams.get('limit') || '50')
    const supplierId = searchParams.get('supplierId')

    const where: { supplierId?: string } = {}
    if (supplierId) where.supplierId = supplierId

    const purchases = await db.purchase.findMany({
      where,
      include: {
        supplier: true,
        items: true,
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    })

    return NextResponse.json({ purchases })
  } catch (error) {
    console.error('Error fetching purchases:', error)
    return NextResponse.json({ error: 'فشل في جلب المشتريات' }, { status: 500 })
  }
}

// POST /api/purchases - إنشاء فاتورة شراء جديدة (مع تحديث المخزون)
export async function POST(request: NextRequest) {
  try {
    const user = await getSessionUser(request)
    if (!user) return unauthorizedResponse()

    const body = await request.json()
    const {
      supplierId,
      items,
      paidAmount = 0,
      notes,
    } = body

    if (!supplierId) {
      return NextResponse.json({ error: 'يجب اختيار مورد' }, { status: 400 })
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'يجب إضافة بند واحد على الأقل' }, { status: 400 })
    }

    const supplier = await db.supplier.findUnique({ where: { id: supplierId } })
    if (!supplier) {
      return NextResponse.json({ error: 'المورد غير موجود' }, { status: 404 })
    }

    // تجهيز البنود
    const purchaseItemsData = items.map((it: {
      inventoryItemId?: string
      name: string
      quantity: number
      unit?: string
      unitCost: number
    }) => {
      const qty = Math.max(0, Number(it.quantity) || 0)
      const unitCost = Math.max(0, Number(it.unitCost) || 0)
      return {
        inventoryItemId: it.inventoryItemId || null,
        name: it.name,
        quantity: qty,
        unit: it.unit || null,
        unitCost,
        total: qty * unitCost,
      }
    })

    const subtotal = purchaseItemsData.reduce((s, it) => s + it.total, 0)
    const total = subtotal
    const paid = Number(paidAmount) || 0

    const purchaseNumber = await generatePurchaseNumber()

    // إنشاء الشراء + تحديث المخزون + حركات المخزون في معاملة واحدة
    const purchase = await db.$transaction(async (tx) => {
      const newPurchase = await tx.purchase.create({
        data: {
          purchaseNumber,
          supplierId,
          subtotal,
          total,
          paidAmount: paid,
          status: paid >= total ? 'completed' : 'pending',
          notes: notes?.trim() || null,
          createdById: user.id,
          items: { create: purchaseItemsData },
        },
        include: { items: true },
      })

      // تحديث المخزون لكل بند مرتبط بعنصر مخزون
      for (const item of purchaseItemsData) {
        if (item.inventoryItemId) {
          await tx.inventoryItem.update({
            where: { id: item.inventoryItemId },
            data: {
              quantity: { increment: item.quantity },
              costPerUnit: item.unitCost,
              updatedAt: new Date(),
            },
          })

          await tx.stockMovement.create({
            data: {
              inventoryItemId: item.inventoryItemId,
              type: 'in',
              quantity: item.quantity,
              reason: `شراء من ${supplier.name}`,
              reference: purchaseNumber,
            },
          })
        }
      }

      // تحديث رصيد المورد
      const remaining = total - paid
      if (remaining > 0) {
        await tx.supplier.update({
          where: { id: supplierId },
          data: { balance: { increment: remaining } },
        })
      }

      return newPurchase
    })

    return NextResponse.json(purchase, { status: 201 })
  } catch (error) {
    console.error('Error creating purchase:', error)
    return NextResponse.json({ error: 'فشل في إنشاء فاتورة الشراء' }, { status: 500 })
  }
}
