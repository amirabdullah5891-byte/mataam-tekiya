import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSessionUser, unauthorizedResponse } from '@/lib/session'

// GET /api/dashboard - إحصائيات لوحة المعلومات
export async function GET(request: NextRequest) {
  try {
    const user = await getSessionUser(request)
    if (!user) return unauthorizedResponse()

    const { searchParams } = new URL(request.url)
    const range = searchParams.get('range') || 'today'

    const now = new Date()
    let start: Date
    let end: Date = new Date(now)

    if (range === 'today') {
      start = new Date(now)
      start.setHours(0, 0, 0, 0)
    } else if (range === 'week') {
      start = new Date(now)
      start.setDate(start.getDate() - 6)
      start.setHours(0, 0, 0, 0)
    } else if (range === 'month') {
      start = new Date(now)
      start.setMonth(start.getMonth() - 1)
      start.setHours(0, 0, 0, 0)
    } else {
      start = new Date(now)
      start.setHours(0, 0, 0, 0)
    }

    // الفواتير المكتملة في النطاق
    const invoices = await db.invoice.findMany({
      where: {
        status: 'completed',
        createdAt: { gte: start, lte: end },
      },
      include: { items: true },
    })

    const totalSales = invoices.reduce((s, inv) => s + inv.total, 0)
    const totalTax = invoices.reduce((s, inv) => s + inv.taxAmount, 0)
    const totalDiscount = invoices.reduce((s, inv) => s + inv.discount, 0)
    const invoiceCount = invoices.length
    const avgInvoice = invoiceCount > 0 ? totalSales / invoiceCount : 0

    // المصروفات في نفس الفترة
    const expenses = await db.expense.findMany({
      where: { date: { gte: start, lte: end } },
    })
    const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0)
    const expensesByCategory: Record<string, number> = {}
    for (const exp of expenses) {
      expensesByCategory[exp.category] = (expensesByCategory[exp.category] || 0) + exp.amount
    }

    // المشتريات في نفس الفترة
    const purchases = await db.purchase.findMany({
      where: {
        status: 'completed',
        createdAt: { gte: start, lte: end },
      },
    })
    const totalPurchases = purchases.reduce((s, p) => s + p.total, 0)

    // المخزون
    const allInventory = await db.inventoryItem.findMany({ where: { isActive: true } })
    const totalInventoryItems = allInventory.length
    const lowStockItems = allInventory
      .filter(i => i.quantity <= i.minQuantity)
      .map(i => ({ name: i.name, quantity: i.quantity, minQuantity: i.minQuantity, unit: i.unit }))
    const totalInventoryValue = allInventory.reduce((s, i) => s + i.quantity * i.costPerUnit, 0)

    // طرق الدفع
    const byPaymentMethod: Record<string, number> = {}
    for (const inv of invoices) {
      byPaymentMethod[inv.paymentMethod] =
        (byPaymentMethod[inv.paymentMethod] || 0) + inv.total
    }

    // أكثر الأطباق مبيعاً
    const itemSales: Record<string, { name: string; quantity: number; total: number }> = {}
    for (const inv of invoices) {
      for (const item of inv.items) {
        if (!itemSales[item.name]) {
          itemSales[item.name] = { name: item.name, quantity: 0, total: 0 }
        }
        itemSales[item.name].quantity += item.quantity
        itemSales[item.name].total += item.total
      }
    }
    const topItems = Object.values(itemSales)
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 8)

    // مبيعات يومية
    const dailySales: { date: string; total: number; count: number }[] = []
    const days = range === 'month' ? 30 : 7
    for (let i = days - 1; i >= 0; i--) {
      const day = new Date(now)
      day.setDate(day.getDate() - i)
      day.setHours(0, 0, 0, 0)
      const nextDay = new Date(day)
      nextDay.setDate(nextDay.getDate() + 1)

      const dayInvoices = invoices.filter(inv =>
        inv.createdAt >= day && inv.createdAt < nextDay
      )

      dailySales.push({
        date: day.toISOString().slice(0, 10),
        total: dayInvoices.reduce((s, inv) => s + inv.total, 0),
        count: dayInvoices.length,
      })
    }

    // آخر 5 فواتير
    const recentInvoices = await db.invoice.findMany({
      where: { status: 'completed' },
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: { items: true },
    })

    return NextResponse.json({
      range,
      period: { start: start.toISOString(), end: end.toISOString() },
      summary: {
        totalSales,
        totalTax,
        totalDiscount,
        invoiceCount,
        avgInvoice,
      },
      expenses: {
        total: totalExpenses,
        byCategory: expensesByCategory,
      },
      purchases: {
        total: totalPurchases,
        count: purchases.length,
      },
      inventory: {
        totalItems: totalInventoryItems,
        lowStock: lowStockItems.length,
        totalValue: totalInventoryValue,
        lowStockItems,
      },
      byPaymentMethod,
      topItems,
      dailySales,
      recentInvoices,
    })
  } catch (error) {
    console.error('Error fetching dashboard stats:', error)
    return NextResponse.json({ error: 'فشل في جلب الإحصائيات' }, { status: 500 })
  }
}
