import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { RESTAURANT_INFO } from '@/lib/restaurant'

// GET /api/public/menu - القائمة العامة للزبائن (بدون مصادقة)
export async function GET() {
  try {
    const items = await db.menuItem.findMany({
      where: {
        isActive: true,
      },
      orderBy: [{ category: 'asc' }, { name: 'asc' }],
      select: {
        id: true,
        name: true,
        category: true,
        price: true,
        description: true,
        imageUrl: true,
        prepTime: true,
        isAvailable: true,
        reviews: {
          where: { isHidden: false },
          select: { rating: true },
        },
      },
    })

    // حساب متوسط التقييم لكل طبق
    const itemsWithRating = items.map(item => {
      const totalReviews = item.reviews.length
      const avgRating = totalReviews > 0
        ? item.reviews.reduce((s, r) => s + r.rating, 0) / totalReviews
        : 0
      return {
        ...item,
        reviews: undefined, // لا نرسل التفاصيل
        avgRating: Math.round(avgRating * 10) / 10,
        totalReviews,
      }
    })

    // تجميع حسب الفئة
    const grouped: Record<string, typeof itemsWithRating> = {}
    for (const item of itemsWithRating) {
      if (!grouped[item.category]) grouped[item.category] = []
      grouped[item.category].push(item)
    }

    return NextResponse.json({
      restaurant: RESTAURANT_INFO,
      items: itemsWithRating,
      grouped,
      categories: Object.keys(grouped),
    })
  } catch (error) {
    console.error('Error fetching public menu:', error)
    return NextResponse.json({ error: 'فشل في جلب القائمة' }, { status: 500 })
  }
}
