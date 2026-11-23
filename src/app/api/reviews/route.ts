import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSessionUser, unauthorizedResponse } from '@/lib/session'

// GET /api/reviews - قائمة كل التقييمات (للإدارة)
export async function GET(request: NextRequest) {
  try {
    const user = await getSessionUser(request)
    if (!user) return unauthorizedResponse()

    const { searchParams } = new URL(request.url)
    const menuItemId = searchParams.get('menuItemId')
    const hidden = searchParams.get('hidden')

    const where: {
      menuItemId?: string
      isHidden?: boolean
    } = {}
    if (menuItemId) where.menuItemId = menuItemId
    if (hidden === 'true') where.isHidden = true
    if (hidden === 'false') where.isHidden = false

    const reviews = await db.review.findMany({
      where,
      include: {
        menuItem: { select: { name: true, category: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    })

    // إحصائيات
    const allReviews = await db.review.findMany({
      where: { isHidden: false },
      select: { rating: true },
    })
    const avgRating = allReviews.length > 0
      ? allReviews.reduce((s, r) => s + r.rating, 0) / allReviews.length
      : 0

    // أعلى الأطباق تقييماً
    const topRated = await db.menuItem.findMany({
      where: { isActive: true },
      include: {
        reviews: { where: { isHidden: false }, select: { rating: true } },
      },
    })
    const topDishes = topRated
      .map(m => ({
        id: m.id,
        name: m.name,
        category: m.category,
        avgRating: m.reviews.length > 0
          ? m.reviews.reduce((s, r) => s + r.rating, 0) / m.reviews.length
          : 0,
        totalReviews: m.reviews.length,
      }))
      .filter(d => d.totalReviews > 0)
      .sort((a, b) => b.avgRating - a.avgRating)
      .slice(0, 5)

    return NextResponse.json({
      reviews,
      stats: {
        total: allReviews.length,
        avgRating: Math.round(avgRating * 10) / 10,
        hidden: await db.review.count({ where: { isHidden: true } }),
      },
      topDishes,
    })
  } catch (error) {
    console.error('Error fetching reviews:', error)
    return NextResponse.json({ error: 'فشل في جلب التقييمات' }, { status: 500 })
  }
}
