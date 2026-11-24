import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSessionUser, unauthorizedResponse, forbiddenResponse } from '@/lib/session'

// POST /api/import - استيراد أصناف من CSV
// الصيغة المتوقعة: name,category,price,cost,description (للأطباق)
// أو: name,category,unit,quantity,minQuantity,costPerUnit (للمخزون)
export async function POST(request: NextRequest) {
  try {
    const user = await getSessionUser(request)
    if (!user) return unauthorizedResponse()
    if (user.role === 'cashier') return forbiddenResponse()

    const body = await request.json()
    const { type, data } = body // type: 'menu' or 'inventory'

    if (!type || !data || !Array.isArray(data)) {
      return NextResponse.json(
        { error: 'البيانات غير صحيحة. أرسل type و data (مصفوفة)' },
        { status: 400 }
      )
    }

    let imported = 0
    let errors: string[] = []

    if (type === 'menu') {
      // استيراد أطباق
      for (let i = 0; i < data.length; i++) {
        const row = data[i]
        if (!row.name || !row.category || row.price === undefined) {
          errors.push(`السطر ${i + 1}: الاسم والفئة والسعر مطلوبة`)
          continue
        }
        try {
          await db.menuItem.create({
            data: {
              name: String(row.name).trim(),
              category: String(row.category).trim(),
              price: Number(row.price),
              cost: Number(row.cost) || 0,
              description: row.description ? String(row.description).trim() : null,
              isActive: true,
              isAvailable: true,
            },
          })
          imported++
        } catch (e: any) {
          errors.push(`السطر ${i + 1}: ${e.message.substring(0, 50)}`)
        }
      }
    } else if (type === 'inventory') {
      // استيراد مخزون
      for (let i = 0; i < data.length; i++) {
        const row = data[i]
        if (!row.name || !row.category || !row.unit) {
          errors.push(`السطر ${i + 1}: الاسم والفئة والوحدة مطلوبة`)
          continue
        }
        try {
          const item = await db.inventoryItem.create({
            data: {
              name: String(row.name).trim(),
              category: String(row.category).trim(),
              unit: String(row.unit).trim(),
              quantity: Number(row.quantity) || 0,
              minQuantity: Number(row.minQuantity) || 0,
              costPerUnit: Number(row.costPerUnit) || 0,
              isActive: true,
            },
          })
          // تسجيل حركة افتتاحية
          if (item.quantity > 0) {
            await db.stockMovement.create({
              data: {
                inventoryItemId: item.id,
                type: 'adjust',
                quantity: item.quantity,
                reason: 'الرصيد الافتتاحي (استيراد)',
              },
            })
          }
          imported++
        } catch (e: any) {
          errors.push(`السطر ${i + 1}: ${e.message.substring(0, 50)}`)
        }
      }
    } else {
      return NextResponse.json(
        { error: 'النوع غير صحيح. استخدم menu أو inventory' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      imported,
      errors: errors.length > 0 ? errors : undefined,
      message: `تم استيراد ${imported} صنف بنجاح${errors.length > 0 ? ` مع ${errors.length} خطأ` : ''}`,
    })
  } catch (error) {
    console.error('Import error:', error)
    return NextResponse.json({ error: 'فشل الاستيراد' }, { status: 500 })
  }
}
