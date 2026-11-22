import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSessionUser, unauthorizedResponse } from '@/lib/session'

// GET /api/menu - قائمة جميع عناصر القائمة
export async function GET(request: NextRequest) {
  try {
    const user = await getSessionUser(request)
    if (!user) return unauthorizedResponse()
    const { searchParams } = new URL(request.url)
    const activeOnly = searchParams.get('active') === 'true'
    const category = searchParams.get('category')

    const where: {
      isActive?: boolean
      category?: string
    } = {}
    if (activeOnly) where.isActive = true
    if (category && category !== 'all') where.category = category

    const items = await db.menuItem.findMany({
      where,
      orderBy: [{ category: 'asc' }, { name: 'asc' }],
    })

    // تجميع حسب الفئة
    const grouped: Record<string, typeof items> = {}
    for (const item of items) {
      if (!grouped[item.category]) grouped[item.category] = []
      grouped[item.category].push(item)
    }

    return NextResponse.json({ items, grouped, categories: Object.keys(grouped) })
  } catch (error) {
    console.error('Error fetching menu items:', error)
    return NextResponse.json(
      { error: 'فشل في جلب عناصر القائمة' },
      { status: 500 }
    )
  }
}

// POST /api/menu - إضافة عنصر جديد للقائمة
export async function POST(request: NextRequest) {
  try {
    const user = await getSessionUser(request)
    if (!user) return unauthorizedResponse()

    const body = await request.json()

    const { name, category, price, cost, description, isActive, isAvailable, imageUrl, prepTime } = body

    if (!name || !category || price === undefined) {
      return NextResponse.json(
        { error: 'الاسم والفئة والسعر مطلوبة' },
        { status: 400 }
      )
    }

    const item = await db.menuItem.create({
      data: {
        name: name.trim(),
        category: category.trim(),
        price: Number(price),
        cost: Number(cost) || 0,
        description: description?.trim() || null,
        isActive: isActive !== false,
        isAvailable: isAvailable !== false,
        imageUrl: imageUrl?.trim() || null,
        prepTime: prepTime ? Number(prepTime) : null,
      },
    })

    return NextResponse.json(item, { status: 201 })
  } catch (error) {
    console.error('Error creating menu item:', error)
    return NextResponse.json(
      { error: 'فشل في إضافة العنصر' },
      { status: 500 }
    )
  }
}
