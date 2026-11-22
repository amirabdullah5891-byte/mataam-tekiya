import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSessionUser, unauthorizedResponse } from '@/lib/session'

// GET /api/notifications - قائمة الإشعارات (للإدارة)
export async function GET(request: NextRequest) {
  try {
    const user = await getSessionUser(request)
    if (!user) return unauthorizedResponse()

    const { searchParams } = new URL(request.url)
    const limit = Number(searchParams.get('limit') || '50')

    const notifications = await db.notification.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
    })

    return NextResponse.json({ notifications })
  } catch (error) {
    console.error('Error fetching notifications:', error)
    return NextResponse.json({ error: 'فشل في جلب الإشعارات' }, { status: 500 })
  }
}
