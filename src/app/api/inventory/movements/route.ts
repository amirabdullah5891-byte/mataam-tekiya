import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSessionUser, unauthorizedResponse } from '@/lib/session'

// GET /api/inventory/movements - سجل حركات المخزون
export async function GET(request: NextRequest) {
  try {
    const user = await getSessionUser(request)
    if (!user) return unauthorizedResponse()

    const { searchParams } = new URL(request.url)
    const inventoryItemId = searchParams.get('itemId')
    const limit = Number(searchParams.get('limit') || '50')

    const where: { inventoryItemId?: string } = {}
    if (inventoryItemId) where.inventoryItemId = inventoryItemId

    const movements = await db.stockMovement.findMany({
      where,
      include: { inventoryItem: true },
      orderBy: { createdAt: 'desc' },
      take: limit,
    })

    return NextResponse.json({ movements })
  } catch (error) {
    console.error('Error fetching stock movements:', error)
    return NextResponse.json({ error: 'فشل في جلب الحركات' }, { status: 500 })
  }
}
