import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/dashboard - إحصائيات لوحة المعلومات
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const range = searchParams.get('range') || 'today' // today, week, month

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

    // مبيعات يومية (للأسبوع)
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
