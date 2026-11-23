import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { checkRateLimit, rateLimitResponse, getRateLimitIdentifier } from '@/lib/rate-limit'

// GET /api/public/reviews?menuItemId=xxx - جلب تقييمات طبق (الظاهرة فقط)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const menuItemId = searchParams.get('menuItemId')

    if (!menuItemId) {
      return NextResponse.json({ error: 'معرف الطبق مطلوب' }, { status: 400 })
    }

    const reviews = await db.review.findMany({
      where: {
        menuItemId,
        isHidden: false,
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
      select: {
        id: true,
        customerName: true,
        rating: true,
        comment: true,
        createdAt: true,
      },
    })

    // حساب المتوسط
    const allReviews = await db.review.findMany({
      where: { menuItemId, isHidden: false },
      select: { rating: true },
    })
    const avgRating = allReviews.length > 0
      ? allReviews.reduce((s, r) => s + r.rating, 0) / allReviews.length
      : 0
    const totalReviews = allReviews.length

    return NextResponse.json({
      reviews,
      avgRating: Math.round(avgRating * 10) / 10,
      totalReviews,
    })
  } catch (error) {
    console.error('Error fetching reviews:', error)
    return NextResponse.json({ error: 'فشل في جلب التقييمات' }, { status: 500 })
  }
}

// POST /api/public/reviews - زبون يضيف تقييماً (بدون مصادقة)
// مع Rate Limiting: 5 تقييمات/ساعة لكل IP (لمنع الإساءة)
export async function POST(request: NextRequest) {
  // فحص Rate Limit - 5 تقييمات/ساعة
  const identifier = getRateLimitIdentifier(request, 'review')
  const limit = checkRateLimit(identifier, 5, 60 * 60 * 1000) // 5/ساعة
  if (!limit.allowed) {
    return rateLimitResponse(limit.resetTime)
  }

  try {
    const body = await request.json()
    const { menuItemId, customerName, customerPhone, rating, comment } = body

    if (!menuItemId) {
      return NextResponse.json({ error: 'معرف الطبق مطلوب' }, { status: 400 })
    }

    const ratingNum = Number(rating)
    if (!ratingNum || ratingNum < 1 || ratingNum > 5) {
      return NextResponse.json({ error: 'التقييم يجب أن يكون بين 1 و 5' }, { status: 400 })
    }

    // التحقق من وجود الطبق
    const menuItem = await db.menuItem.findUnique({ where: { id: menuItemId } })
    if (!menuItem) {
      return NextResponse.json({ error: 'الطبق غير موجود' }, { status: 404 })
    }

    // منع التكرار: زبون واحد لكل طبق (حسب رقم الهاتف)
    if (customerPhone) {
      const existing = await db.review.findFirst({
        where: { menuItemId, customerPhone: customerPhone.trim() },
      })
      if (existing) {
        return NextResponse.json(
          { error: 'لقد قمت بتقييم هذا الطبق من قبل' },
          { status: 400 }
        )
      }
    }

    const review = await db.review.create({
      data: {
        menuItemId,
        customerName: customerName?.trim() || null,
        customerPhone: customerPhone?.trim() || null,
        rating: Math.round(ratingNum),
        comment: comment?.trim() || null,
      },
    })

    return NextResponse.json(review, { status: 201 })
  } catch (error) {
    console.error('Error creating review:', error)
    return NextResponse.json({ error: 'فشل في إضافة التقييم' }, { status: 500 })
  }
}
