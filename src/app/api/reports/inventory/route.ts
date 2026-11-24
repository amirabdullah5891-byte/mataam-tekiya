import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSessionUser, unauthorizedResponse } from '@/lib/session'

// GET /api/reports/inventory - تقرير المخزون الشامل
export async function GET(request: NextRequest) {
  try {
    const user = await getSessionUser(request)
    if (!user) return unauthorizedResponse()

    const { searchParams } = new URL(request.url)
    const from = searchParams.get('from')
    const to = searchParams.get('to')

    // كل أصناف المخزون
    const items = await db.inventoryItem.findMany({
      where: { isActive: true },
      orderBy: [{ category: 'asc' }, { name: 'asc' }],
    })

    // إحصائيات
    const totalValue = items.reduce((s, i) => s + i.quantity * i.costPerUnit, 0)
    const lowStockItems = items.filter(i => i.quantity <= i.minQuantity)
    const totalItems = items.length

    // تجميع حسب الفئة
    const categoryStats: Record<string, { count: number; value: number }> = {}
    for (const item of items) {
      if (!categoryStats[item.category]) {
        categoryStats[item.category] = { count: 0, value: 0 }
      }
      categoryStats[item.category].count++
      categoryStats[item.category].value += item.quantity * item.costPerUnit
    }

    // حركات المخزون في الفترة
    let movements: any[] = []
    if (from || to) {
      const where: { createdAt?: { gte?: Date; lte?: Date } } = {}
      if (from || to) {
        const range: { gte?: Date; lte?: Date } = {}
        if (from) { const f = new Date(from); f.setHours(0, 0, 0, 0); range.gte = f }
        if (to) { const t = new Date(to); t.setHours(23, 59, 59, 999); range.lte = t }
        where.createdAt = range
      }
      movements = await db.stockMovement.findMany({
        where,
        include: { inventoryItem: { select: { name: true, category: true, unit: true } } },
        orderBy: { createdAt: 'desc' },
        take: 200,
      })
    }

    // أعلى الأصناف قيمة
    const topValueItems = [...items]
      .sort((a, b) => (b.quantity * b.costPerUnit) - (a.quantity * a.costPerUnit))
      .slice(0, 10)
      .map(i => ({
        name: i.name,
        category: i.category,
        quantity: i.quantity,
        unit: i.unit,
        costPerUnit: i.costPerUnit,
        totalValue: i.quantity * i.costPerUnit,
      }))

    return NextResponse.json({
      summary: {
        totalItems,
        totalValue,
        lowStockCount: lowStockItems.length,
        categories: Object.keys(categoryStats).length,
      },
      categoryStats: Object.entries(categoryStats).map(([category, stats]) => ({
        category,
        count: stats.count,
        value: stats.value,
      })),
      items: items.map(i => ({
        id: i.id,
        name: i.name,
        category: i.category,
        unit: i.unit,
        quantity: i.quantity,
        minQuantity: i.minQuantity,
        costPerUnit: i.costPerUnit,
        totalValue: i.quantity * i.costPerUnit,
        isLowStock: i.quantity <= i.minQuantity,
      })),
      lowStockItems: lowStockItems.map(i => ({
        name: i.name,
        quantity: i.quantity,
        minQuantity: i.minQuantity,
        unit: i.unit,
        category: i.category,
      })),
      topValueItems,
      movements: movements.map(m => ({
        id: m.id,
        itemName: m.inventoryItem.name,
        category: m.inventoryItem.category,
        type: m.type,
        quantity: m.quantity,
        reason: m.reason,
        reference: m.reference,
        date: m.createdAt,
      })),
    })
  } catch (error) {
    console.error('Error fetching inventory report:', error)
    return NextResponse.json({ error: 'فشل في جلب التقرير' }, { status: 500 })
  }
}
