import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSessionUser, unauthorizedResponse, forbiddenResponse } from '@/lib/session'

// GET /api/audit - عرض سجل الأحداث الأمنية (admin/manager فقط)
export async function GET(request: NextRequest) {
  try {
    const user = await getSessionUser(request)
    if (!user) return unauthorizedResponse()
    if (user.role === 'cashier') return forbiddenResponse('هذه الميزة للمشرف أو المدير')

    const { searchParams } = new URL(request.url)
    const limit = Number(searchParams.get('limit') || '100')
    const action = searchParams.get('action')

    const where: { action?: string } = {}
    if (action && action !== 'all') where.action = action

    const logs = await db.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: Math.min(limit, 500),
    })

    // إحصائيات حسب النوع
    const stats = await db.auditLog.groupBy({
      by: ['action'],
      _count: { _all: true },
      orderBy: { _count: { action: 'desc' } },
    })

    const total = await db.auditLog.count()
    const today = await db.auditLog.count({
      where: {
        createdAt: {
          gte: new Date(new Date().setHours(0, 0, 0, 0)),
        },
      },
    })

    return NextResponse.json({
      logs,
      stats: stats.map(s => ({ action: s.action, count: s._count._all })),
      total,
      today,
    })
  } catch (error) {
    console.error('Error fetching audit logs:', error)
    return NextResponse.json({ error: 'فشل في جلب السجل' }, { status: 500 })
  }
}
