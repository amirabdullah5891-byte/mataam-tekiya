import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSessionUser, unauthorizedResponse } from '@/lib/session'

// GET /api/reports/expenses - تقرير المصروفات التفصيلي
export async function GET(request: NextRequest) {
  try {
    const user = await getSessionUser(request)
    if (!user) return unauthorizedResponse()

    const { searchParams } = new URL(request.url)
    const from = searchParams.get('from')
    const to = searchParams.get('to')
    const category = searchParams.get('category')

    const where: {
      category?: string
      date?: { gte?: Date; lte?: Date }
    } = {}

    if (category && category !== 'all') where.category = category
    if (from || to) {
      const range: { gte?: Date; lte?: Date } = {}
      if (from) { const f = new Date(from); f.setHours(0, 0, 0, 0); range.gte = f }
      if (to) { const t = new Date(to); t.setHours(23, 59, 59, 999); range.lte = t }
      where.date = range
    }

    const expenses = await db.expense.findMany({
      where,
      include: { createdBy: { select: { name: true } } },
      orderBy: { date: 'desc' },
      take: 500,
    })

    const total = expenses.reduce((s, e) => s + e.amount, 0)

    // تجميع حسب الفئة
    const byCategory: Record<string, { count: number; total: number }> = {}
    for (const e of expenses) {
      if (!byCategory[e.category]) byCategory[e.category] = { count: 0, total: 0 }
      byCategory[e.category].count++
      byCategory[e.category].total += e.amount
    }

    // تجميع حسب اليوم
    const byDate: Record<string, { count: number; total: number }> = {}
    for (const e of expenses) {
      const day = e.date.toISOString().slice(0, 10)
      if (!byDate[day]) byDate[day] = { count: 0, total: 0 }
      byDate[day].count++
      byDate[day].total += e.amount
    }

    return NextResponse.json({
      summary: {
        total,
        count: expenses.length,
        avgExpense: expenses.length > 0 ? total / expenses.length : 0,
        categories: Object.keys(byCategory).length,
      },
      byCategory: Object.entries(byCategory)
        .map(([cat, data]) => ({ category: cat, count: data.count, total: data.total }))
        .sort((a, b) => b.total - a.total),
      byDate: Object.entries(byDate)
        .map(([date, data]) => ({ date, count: data.count, total: data.total }))
        .sort((a, b) => b.date.localeCompare(a.date)),
      expenses: expenses.map(e => ({
        id: e.id,
        category: e.category,
        amount: e.amount,
        description: e.description,
        date: e.date,
        createdBy: e.createdBy?.name || null,
      })),
    })
  } catch (error) {
    console.error('Error fetching expenses report:', error)
    return NextResponse.json({ error: 'فشل في جلب التقرير' }, { status: 500 })
  }
}
