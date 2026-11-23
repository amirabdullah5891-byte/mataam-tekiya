import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSessionUser, unauthorizedResponse, forbiddenResponse } from '@/lib/session'

// PUT /api/inventory/[id] - تعديل عنصر مخزون
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUser(request)
    if (!user) return unauthorizedResponse()
    if (user.role === 'cashier') return forbiddenResponse()

    const { id } = await params
    const body = await request.json()

    const existing = await db.inventoryItem.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'العنصر غير موجود' }, { status: 404 })
    }

    const { name, category, unit, quantity, minQuantity, costPerUnit, notes, isActive } = body

    const newQuantity = quantity !== undefined ? Number(quantity) : existing.quantity
    const oldQuantity = existing.quantity
    const diff = newQuantity - oldQuantity

    const updated = await db.$transaction(async (tx) => {
      const item = await tx.inventoryItem.update({
        where: { id },
        data: {
          name: name?.trim() ?? existing.name,
          category: category?.trim() ?? existing.category,
          unit: unit?.trim() ?? existing.unit,
          quantity: newQuantity,
          minQuantity: minQuantity !== undefined ? Number(minQuantity) : existing.minQuantity,
          costPerUnit: costPerUnit !== undefined ? Number(costPerUnit) : existing.costPerUnit,
          notes: notes !== undefined ? (notes?.trim() || null) : existing.notes,
          isActive: isActive !== undefined ? Boolean(isActive) : existing.isActive,
        },
      })

      if (diff !== 0) {
        await tx.stockMovement.create({
          data: {
            inventoryItemId: id,
            type: 'adjust',
            quantity: diff,
            reason: 'تسوية يدوية',
          },
        })
      }

      return item
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Error updating inventory item:', error)
    return NextResponse.json({ error: 'فشل في تعديل العنصر' }, { status: 500 })
  }
}

// DELETE /api/inventory/[id] - تعطيل عنصر مخزون
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUser(request)
    if (!user) return unauthorizedResponse()
    if (user.role === 'cashier') return forbiddenResponse()

    const { id } = await params

    const existing = await db.inventoryItem.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'العنصر غير موجود' }, { status: 404 })
    }

    await db.inventoryItem.update({
      where: { id },
      data: { isActive: false },
    })

    return NextResponse.json({ success: true, message: 'تم تعطيل العنصر' })
  } catch (error) {
    console.error('Error deleting inventory item:', error)
    return NextResponse.json({ error: 'فشل في تعطيل العنصر' }, { status: 500 })
  }
}
