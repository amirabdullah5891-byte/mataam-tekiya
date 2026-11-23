import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/public/notifications?phone=xxx - جلب إشعارات زبون حسب رقم هاتفه
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const phone = searchParams.get('phone')

    if (!phone) {
      return NextResponse.json({ notifications: [] })
    }

    const notifications = await db.notification.findMany({
      where: { customerPhone: phone.trim() },
      orderBy: { createdAt: 'desc' },
      take: 20,
    })

    return NextResponse.json({ notifications })
  } catch (error) {
    console.error('Error fetching notifications:', error)
    return NextResponse.json({ notifications: [] })
  }
}
