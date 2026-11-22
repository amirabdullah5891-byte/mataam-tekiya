import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSessionUser, unauthorizedResponse, forbiddenResponse } from '@/lib/session'

// GET /api/inventory - قائمة المخزون
export async function GET(request: NextRequest) {
  try {
    const user = await getSessionUser(request)
    if (!user) return unauthorizedResponse()

    const { searchParams } = new URL(request.url)
    const activeOnly = searchParams.get('active') === 'true'
    const category = searchParams.get('category')

    const where: { isActive?: boolean; category?: string } = {}
    if (activeOnly) where.isActive = true
    if (category && category !== 'all') where.category = category

    const items = await db.inventoryItem.findMany({
      where,
      orderBy: [{ category: 'asc' }, { name: 'asc' }],
    })

    const grouped: Record<string, typeof items> = {}
    for (const item of items) {
      if (!grouped[item.category]) grouped[item.category] = []
      grouped[item.category].push(item)
    }

    const totalValue = items.reduce((s, i) => s + i.quantity * i.costPerUnit, 0)
    const lowStock = items.filter(i => i.quantity <= i.minQuantity).length

    return NextResponse.json({
      items,
      grouped,
      categories: Object.keys(grouped),
      stats: {
        total: items.length,
        totalValue,
        lowStock,
      },
    })
  } catch (error) {
    console.error('Error fetching inventory:', error)
    return NextResponse.json({ error: 'فشل في جلب المخزون' }, { status: 500 })
  }
}

// POST /api/inventory - إضافة عنصر مخزون جديد
export async function POST(request: NextRequest) {
  try {
    const user = await getSessionUser(request)
    if (!user) return unauthorizedResponse()
    if (user.role === 'cashier') return forbiddenResponse()

    const body = await request.json()
    const { name, category, unit, quantity, minQuantity, costPerUnit, notes } = body

    if (!name || !category || !unit) {
      return NextResponse.json(
        { error: 'الاسم والفئة والوحدة مطلوبة' },
        { status: 400 }
      )
    }

    const item = await db.inventoryItem.create({
      data: {
        name: name.trim(),
        category: category.trim(),
        unit: unit.trim(),
        quantity: Number(quantity) || 0,
        minQuantity: Number(minQuantity) || 0,
        costPerUnit: Number(costPerUnit) || 0,
        notes: notes?.trim() || null,
      },
    })

    if (item.quantity > 0) {
      await db.stockMovement.create({
        data: {
          inventoryItemId: item.id,
          type: 'adjust',
          quantity: item.quantity,
          reason: 'الرصيد الافتتاحي',
        },
      })
    }

    return NextResponse.json(item, { status: 201 })
  } catch (error) {
    console.error('Error creating inventory item:', error)
    return NextResponse.json({ error: 'فشل في إضافة العنصر' }, { status: 500 })
  }
}
