import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSessionUser, unauthorizedResponse } from '@/lib/session'
import { logAudit } from '@/lib/audit'

// توليد رقم فاتورة تسلسلي بصيغة INV-YYYYMMDD-XXX
async function generateInvoiceNumber(): Promise<string> {
  const today = new Date()
  const yyyy = today.getFullYear()
  const mm = String(today.getMonth() + 1).padStart(2, '0')
  const dd = String(today.getDate()).padStart(2, '0')
  const prefix = `INV-${yyyy}${mm}${dd}-`

  const startOfDay = new Date(today)
  startOfDay.setHours(0, 0, 0, 0)
  const endOfDay = new Date(today)
  endOfDay.setHours(23, 59, 59, 999)

  const todayCount = await db.invoice.count({
    where: { createdAt: { gte: startOfDay, lte: endOfDay } },
  })

  const seq = String(todayCount + 1).padStart(3, '0')
  return `${prefix}${seq}`
}

// GET /api/invoices - قائمة الفواتير
export async function GET(request: NextRequest) {
  try {
    const user = await getSessionUser(request)
    if (!user) return unauthorizedResponse()

    const { searchParams } = new URL(request.url)
    const page = Number(searchParams.get('page') || '1')
    const limit = Number(searchParams.get('limit') || '20')
    const status = searchParams.get('status')
    const date = searchParams.get('date')
    const from = searchParams.get('from')
    const to = searchParams.get('to')

    const where: {
      status?: string
      createdAt?: { gte?: Date; lte?: Date }
    } = {}

    if (status && status !== 'all') where.status = status

    if (date) {
      const start = new Date(date)
      start.setHours(0, 0, 0, 0)
      const end = new Date(date)
      end.setHours(23, 59, 59, 999)
      where.createdAt = { gte: start, lte: end }
    } else if (from || to) {
      const range: { gte?: Date; lte?: Date } = {}
      if (from) {
        const f = new Date(from); f.setHours(0, 0, 0, 0); range.gte = f
      }
      if (to) {
        const t = new Date(to); t.setHours(23, 59, 59, 999); range.lte = t
      }
      where.createdAt = range
    }

    const [invoices, total] = await Promise.all([
      db.invoice.findMany({
        where,
        include: { items: true },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.invoice.count({ where }),
    ])

    return NextResponse.json({
      invoices,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    })
  } catch (error) {
    console.error('Error fetching invoices:', error)
    return NextResponse.json({ error: 'فشل في جلب الفواتير' }, { status: 500 })
  }
}

// POST /api/invoices - إنشاء فاتورة جديدة
export async function POST(request: NextRequest) {
  try {
    const user = await getSessionUser(request)
    if (!user) return unauthorizedResponse()

    const body = await request.json()

    const {
      customerName,
      customerPhone,
      tableNumber,
      items,
      taxRate = 0,
      discount = 0,
      paidAmount = 0,
      paymentMethod = 'cash',
      notes,
      shift,
    } = body

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'الفاتورة يجب أن تحتوي على بند واحد على الأقل' },
        { status: 400 }
      )
    }

    const invoiceItemsData = items.map((it: {
      menuItemId?: string
      name: string
      quantity: number
      price: number
    }) => {
      const qty = Math.max(1, Number(it.quantity) || 1)
      const price = Number(it.price) || 0
      return {
        menuItemId: it.menuItemId || null,
        name: it.name,
        quantity: qty,
        price,
        total: qty * price,
      }
    })

    const subtotal = invoiceItemsData.reduce((s, it) => s + it.total, 0)
    const taxAmount = subtotal * (Number(taxRate) || 0) / 100
    const total = Math.max(0, subtotal + taxAmount - (Number(discount) || 0))
    const change = Math.max(0, (Number(paidAmount) || 0) - total)

    const invoiceNumber = await generateInvoiceNumber()

    const invoice = await db.invoice.create({
      data: {
        invoiceNumber,
        customerName: customerName?.trim() || null,
        customerPhone: customerPhone?.trim() || null,
        tableNumber: tableNumber?.trim() || null,
        subtotal,
        taxRate: Number(taxRate) || 0,
        taxAmount,
        discount: Number(discount) || 0,
        total,
        paidAmount: Number(paidAmount) || 0,
        change,
        paymentMethod,
        status: 'completed',
        notes: notes?.trim() || null,
        shift: shift || null,
        cashierId: user.id,
        items: { create: invoiceItemsData },
      },
      include: { items: true },
    })

    // تسجيل إنشاء الفاتورة في سجل الأحداث
    await logAudit({
      action: 'invoice_create',
      entityType: 'invoice',
      entityId: invoice.id,
      description: `فاتورة ${invoiceNumber} بقيمة ${total} ج.س`,
      userId: user.id,
      metadata: { invoiceNumber, total, paymentMethod },
    })

    return NextResponse.json(invoice, { status: 201 })
  } catch (error) {
    console.error('Error creating invoice:', error)
    return NextResponse.json({ error: 'فشل في إنشاء الفاتورة' }, { status: 500 })
  }
}
