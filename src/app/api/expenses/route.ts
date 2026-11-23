import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSessionUser, unauthorizedResponse, forbiddenResponse } from '@/lib/session'
import { logAudit } from '@/lib/audit'

// GET /api/expenses - قائمة المصروفات
export async function GET(request: NextRequest) {
  try {
    const user = await getSessionUser(request)
    if (!user) return unauthorizedResponse()

    const { searchParams } = new URL(request.url)
    const limit = Number(searchParams.get('limit') || '50')
    const category = searchParams.get('category')
    const from = searchParams.get('from')
    const to = searchParams.get('to')

    const where: {
      category?: string
      date?: { gte?: Date; lte?: Date }
    } = {}

    if (category && category !== 'all') where.category = category
    if (from || to) {
      const range: { gte?: Date; lte?: Date } = {}
      if (from) {
        const f = new Date(from); f.setHours(0, 0, 0, 0); range.gte = f
      }
      if (to) {
        const t = new Date(to); t.setHours(23, 59, 59, 999); range.lte = t
      }
      where.date = range
    }

    const expenses = await db.expense.findMany({
      where,
      include: { createdBy: { select: { name: true } } },
      orderBy: { date: 'desc' },
      take: limit,
    })

    const total = expenses.reduce((s, e) => s + e.amount, 0)
    const byCategory: Record<string, number> = {}
    for (const e of expenses) {
      byCategory[e.category] = (byCategory[e.category] || 0) + e.amount
    }

    return NextResponse.json({ expenses, total, byCategory })
  } catch (error) {
    console.error('Error fetching expenses:', error)
    return NextResponse.json({ error: 'فشل في جلب المصروفات' }, { status: 500 })
  }
}

// POST /api/expenses - إضافة مصروف
export async function POST(request: NextRequest) {
  try {
    const user = await getSessionUser(request)
    if (!user) return unauthorizedResponse()
    if (user.role === 'cashier') return forbiddenResponse()

    const body = await request.json()
    const { category, amount, description, date } = body

    if (!category || !amount) {
      return NextResponse.json(
        { error: 'الفئة والمبلغ مطلوبان' },
        { status: 400 }
      )
    }

    if (Number(amount) <= 0) {
      return NextResponse.json({ error: 'المبلغ يجب أن يكون أكبر من صفر' }, { status: 400 })
    }

    const expense = await db.expense.create({
      data: {
        category: category.trim(),
        amount: Number(amount),
        description: description?.trim() || null,
        date: date ? new Date(date) : new Date(),
        createdById: user.id,
      },
      include: { createdBy: { select: { name: true } } },
    })

    // تسجيل إضافة مصروف
    await logAudit({
      action: 'expense_create',
      entityType: 'expense',
      entityId: expense.id,
      description: `إضافة مصروف ${category}: ${amount} ج.س`,
      userId: user.id,
      metadata: { category, amount: Number(amount), description: description?.trim() || null },
    })

    return NextResponse.json(expense, { status: 201 })
  } catch (error) {
    console.error('Error creating expense:', error)
    return NextResponse.json({ error: 'فشل في إضافة المصروف' }, { status: 500 })
  }
}
