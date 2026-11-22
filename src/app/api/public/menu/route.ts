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
      },
    })

    // تجميع حسب الفئة
    const grouped: Record<string, typeof items> = {}
    for (const item of items) {
      if (!grouped[item.category]) grouped[item.category] = []
      grouped[item.category].push(item)
    }

    return NextResponse.json({
      restaurant: RESTAURANT_INFO,
      items,
      grouped,
      categories: Object.keys(grouped),
    })
  } catch (error) {
    console.error('Error fetching public menu:', error)
    return NextResponse.json({ error: 'فشل في جلب القائمة' }, { status: 500 })
  }
}
