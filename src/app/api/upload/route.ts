import { NextRequest, NextResponse } from 'next/server'
import { getSessionUser, unauthorizedResponse } from '@/lib/session'
import { writeFile, mkdir } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'

// POST /api/upload - رفع صورة طبق (لكل المستخدمين المسجلين)
export async function POST(request: NextRequest) {
  try {
    const user = await getSessionUser(request)
    if (!user) return unauthorizedResponse()

    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'لم يتم إرسال ملف' }, { status: 400 })
    }

    // التحقق من نوع الملف
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'نوع الملف غير مدعوم. الأنواع المدعومة: JPG, PNG, WebP, GIF' },
        { status: 400 }
      )
    }

    // الحد الأقصى للحجم: 5 ميجابايت
    const maxSize = 5 * 1024 * 1024
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'حجم الصورة كبير جداً. الحد الأقصى 5 ميجابايت' },
        { status: 400 }
      )
    }

    // إنشاء مجلد uploads إن لم يكن موجوداً
    const uploadDir = path.join(process.cwd(), 'public', 'uploads')
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true })
    }

    // توليد اسم فريد للملف
    const ext = file.name.split('.').pop() || 'jpg'
    const fileName = `dish-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`
    const filePath = path.join(uploadDir, fileName)

    // كتابة الملف
    const bytes = await file.arrayBuffer()
    await writeFile(filePath, new Uint8Array(bytes))

    // إرجاع الرابط النسبي للصورة
    const imageUrl = `/uploads/${fileName}`

    return NextResponse.json({
      success: true,
      imageUrl,
      message: 'تم رفع الصورة بنجاح',
    })
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json({ error: 'فشل في رفع الصورة' }, { status: 500 })
  }
}
