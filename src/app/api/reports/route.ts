import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSessionUser, unauthorizedResponse } from '@/lib/session'

// GET /api/reports - تقارير المبيعات
export async function GET(request: NextRequest) {
  try {
    const user = await getSessionUser(request)
    if (!user) return unauthorizedResponse()

    const { searchParams } = new URL(request.url)
    const from = searchParams.get('from')
    const to = searchParams.get('to')

    const now = new Date()
    let startDate: Date = new Date(now)
    startDate.setMonth(startDate.getMonth() - 1)
    let endDate: Date = new Date(now)

    if (from) {
      startDate = new Date(from)
      startDate.setHours(0, 0, 0, 0)
    }
    if (to) {
      endDate = new Date(to)
      endDate.setHours(23, 59, 59, 999)
    }

    const invoices = await db.invoice.findMany({
      where: {
        status: 'completed',
        createdAt: { gte: startDate, lte: endDate },
      },
      include: { items: true },
      orderBy: { createdAt: 'asc' },
    })

    const totalSales = invoices.reduce((s, inv) => s + inv.total, 0)
    const totalTax = invoices.reduce((s, inv) => s + inv.taxAmount, 0)
    const totalDiscount = invoices.reduce((s, inv) => s + inv.discount, 0)
    const totalPaid = invoices.reduce((s, inv) => s + inv.paidAmount, 0)
    const invoiceCount = invoices.length
    const avgInvoice = invoiceCount > 0 ? totalSales / invoiceCount : 0
    const itemCount = invoices.reduce(
      (s, inv) => s + inv.items.reduce((ss, it) => ss + it.quantity, 0),
      0
    )

    // تجميع يومي
    const dailyMap: Record<string, { total: number; count: number; items: number }> = {}
    for (const inv of invoices) {
      const day = inv.createdAt.toISOString().slice(0, 10)
      if (!dailyMap[day]) dailyMap[day] = { total: 0, count: 0, items: 0 }
      dailyMap[day].total += inv.total
      dailyMap[day].count += 1
      dailyMap[day].items += inv.items.reduce((s, it) => s + it.quantity, 0)
    }
    const dailyBreakdown = Object.entries(dailyMap)
      .map(([date, d]) => ({ date, ...d }))
      .sort((a, b) => a.date.localeCompare(b.date))

    const allMenuItems = await db.menuItem.findMany()
    const itemCategoryMap: Record<string, string> = {}
    for (const m of allMenuItems) itemCategoryMap[m.id] = m.category

    const categorySales: Record<string, number> = {}
    for (const inv of invoices) {
      for (const item of inv.items) {
        const cat = item.menuItemId
          ? itemCategoryMap[item.menuItemId] || 'غير مصنف'
          : 'غير مصنف'
        categorySales[cat] = (categorySales[cat] || 0) + item.total
      }
    }

    const itemStats: Record<string, { name: string; quantity: number; total: number }> = {}
    for (const inv of invoices) {
      for (const item of inv.items) {
        if (!itemStats[item.name]) {
          itemStats[item.name] = { name: item.name, quantity: 0, total: 0 }
        }
        itemStats[item.name].quantity += item.quantity
        itemStats[item.name].total += item.total
      }
    }
    const topItems = Object.values(itemStats).sort((a, b) => b.total - a.total)

    const paymentBreakdown: Record<string, { count: number; total: number }> = {}
    for (const inv of invoices) {
      if (!paymentBreakdown[inv.paymentMethod]) {
        paymentBreakdown[inv.paymentMethod] = { count: 0, total: 0 }
      }
      paymentBreakdown[inv.paymentMethod].count += 1
      paymentBreakdown[inv.paymentMethod].total += inv.total
    }

    return NextResponse.json({
      period: { from: startDate.toISOString(), to: endDate.toISOString() },
      summary: {
        totalSales,
        totalTax,
        totalDiscount,
        totalPaid,
        invoiceCount,
        avgInvoice,
        itemCount,
      },
      dailyBreakdown,
      categorySales,
      topItems,
      paymentBreakdown,
      invoices,
    })
  } catch (error) {
    console.error('Error fetching reports:', error)
    return NextResponse.json({ error: 'فشل في جلب التقرير' }, { status: 500 })
  }
}
