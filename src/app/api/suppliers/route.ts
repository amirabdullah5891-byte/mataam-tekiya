import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSessionUser, unauthorizedResponse, forbiddenResponse } from '@/lib/session'

// GET /api/suppliers - قائمة الموردين
export async function GET(request: NextRequest) {
  try {
    const user = await getSessionUser(request)
    if (!user) return unauthorizedResponse()

    const suppliers = await db.supplier.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: { select: { purchases: true } },
      },
    })

    return NextResponse.json({ suppliers })
  } catch (error) {
    console.error('Error fetching suppliers:', error)
    return NextResponse.json({ error: 'فشل في جلب الموردين' }, { status: 500 })
  }
}

// POST /api/suppliers - إضافة مورد جديد
export async function POST(request: NextRequest) {
  try {
    const user = await getSessionUser(request)
    if (!user) return unauthorizedResponse()
    if (user.role === 'cashier') return forbiddenResponse()

    const body = await request.json()
    const { name, phone, address, notes, balance } = body

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'اسم المورد مطلوب' }, { status: 400 })
    }

    const supplier = await db.supplier.create({
      data: {
        name: name.trim(),
        phone: phone?.trim() || null,
        address: address?.trim() || null,
        notes: notes?.trim() || null,
        balance: Number(balance) || 0,
      },
    })

    return NextResponse.json(supplier, { status: 201 })
  } catch (error) {
    console.error('Error creating supplier:', error)
    return NextResponse.json({ error: 'فشل في إضافة المورد' }, { status: 500 })
  }
}
