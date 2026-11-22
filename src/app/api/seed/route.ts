import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { hashPassword } from '@/lib/password'

// POST /api/seed - إضافة بيانات أولية للقائمة + المخزون + حساب المدير
export async function POST() {
  try {
    let result = { menuItems: 0, inventoryItems: 0, userCreated: false }

    // 1) عناصر القائمة
    const menuCount = await db.menuItem.count()
    if (menuCount === 0) {
      const seedData = [
        { name: 'شوي لحم ضأن', category: 'مشويات', price: 8500, cost: 5200, description: 'لحم ضأن مشوي على الفحم' },
        { name: 'شوي لحم بقري', category: 'مشويات', price: 7500, cost: 4500, description: 'لحم بقري مشوي على الفحم' },
        { name: 'شوي دجاج كامل', category: 'مشويات', price: 5500, cost: 3200, description: 'دجاجة كاملة مشوية' },
        { name: 'كباب لحم', category: 'مشويات', price: 6500, cost: 3800, description: 'كباب لحم مفروم مشوي' },
        { name: 'شوي سمك النيل', category: 'مشويات', price: 7000, cost: 4200, description: 'سمك طازج من النيل' },
        { name: 'شوي كباشي', category: 'مشويات', price: 9000, cost: 5500, description: 'كباشي ضأن مشوي كامل' },
        { name: 'أرز بسمتي باللحم', category: 'أطباق رئيسية', price: 4500, cost: 2200, description: 'أرز بسمتي مطهي بقطع اللحم' },
        { name: 'كباب حلة', category: 'أطباق رئيسية', price: 5000, cost: 2800, description: 'كباب مطهي بالحلة' },
        { name: 'فول سوداني باللحم', category: 'أطباق رئيسية', price: 4000, cost: 2100, description: 'فول سوداني مطهي باللحم' },
        { name: 'مولوخية بالدجاج', category: 'أطباق رئيسية', price: 3800, cost: 1900, description: 'مولوخية خضراء مع دجاج' },
        { name: 'بامية باللحم', category: 'أطباق رئيسية', price: 4200, cost: 2200, description: 'بامية حمراء باللحم' },
        { name: 'ويكة باللحم', category: 'أطباق رئيسية', price: 3500, cost: 1800, description: 'ويكة (خليط بقوليات) باللحم' },
        { name: 'كسرة (5 قطع)', category: 'خبز', price: 500, cost: 250, description: 'خبز كسرة سوداني تقليدي' },
        { name: 'عيش (رغيف)', category: 'خبز', price: 300, cost: 150, description: 'رغيف عيش أبيض' },
        { name: 'بالبدن (5 قطع)', category: 'خبز', price: 700, cost: 350, description: 'خبز بلدي دائري' },
        { name: 'شاي باللبن', category: 'مشروبات', price: 800, cost: 300, description: 'شاي أحمر بالحليب' },
        { name: 'قهوة عربية', category: 'مشروبات', price: 1000, cost: 400, description: 'قهوة عربية تقليدية' },
        { name: 'كركديه بارد', category: 'مشروبات', price: 700, cost: 200, description: 'عصير كركديه مثلج' },
        { name: 'عرديب بارد', category: 'مشروبات', price: 900, cost: 350, description: 'عصير عرديب (تمر هندي)' },
        { name: 'مياه معدنية', category: 'مشروبات', price: 500, cost: 250, description: 'زجاجة مياه 0.5 لتر' },
        { name: 'بيبسي', category: 'مشروبات', price: 800, cost: 400, description: 'علبة بيبسي 330 مل' },
        { name: 'حساء لحم', category: 'حساء', price: 2500, cost: 1300, description: 'حساء لحم بالخضروات' },
        { name: 'حساء دجاج', category: 'حساء', price: 2200, cost: 1100, description: 'حساء دجاج بالخضروات' },
        { name: 'حلاوة بالسمسم', category: 'حلويات', price: 1200, cost: 500, description: 'حلاوة طحينة بالسمسم' },
        { name: 'بسبوسة', category: 'حلويات', price: 1500, cost: 700, description: 'بسبوسة بالقشطة' },
      ]
      await db.menuItem.createMany({ data: seedData })
      result.menuItems = seedData.length
    }

    // 2) عناصر المخزون
    const invCount = await db.inventoryItem.count()
    if (invCount === 0) {
      const invData = [
        { name: 'لحم ضأن', category: 'لحوم', unit: 'كجم', quantity: 30, minQuantity: 5, costPerUnit: 4000 },
        { name: 'لحم بقري', category: 'لحوم', unit: 'كجم', quantity: 25, minQuantity: 5, costPerUnit: 3500 },
        { name: 'دجاج طازج', category: 'لحوم', unit: 'كجم', quantity: 20, minQuantity: 5, costPerUnit: 2500 },
        { name: 'سمك النيل', category: 'لحوم', unit: 'كجم', quantity: 15, minQuantity: 3, costPerUnit: 3000 },
        { name: 'أرز بسمتي', category: 'مواد جافة', unit: 'كيس 50كجم', quantity: 8, minQuantity: 2, costPerUnit: 45000 },
        { name: 'بصل', category: 'خضروات', unit: 'كجم', quantity: 40, minQuantity: 10, costPerUnit: 800 },
        { name: 'طماطم', category: 'خضروات', unit: 'كجم', quantity: 25, minQuantity: 5, costPerUnit: 1200 },
        { name: 'ثوم', category: 'خضروات', unit: 'كجم', quantity: 5, minQuantity: 1, costPerUnit: 2000 },
        { name: 'بطاطس', category: 'خضروات', unit: 'كجم', quantity: 30, minQuantity: 5, costPerUnit: 900 },
        { name: 'بامية', category: 'خضروات', unit: 'كجم', quantity: 10, minQuantity: 2, costPerUnit: 1500 },
        { name: 'مولوخية', category: 'خضروات', unit: 'حزمة', quantity: 20, minQuantity: 5, costPerUnit: 300 },
        { name: 'زيت طعام', category: 'مواد جافة', unit: 'لتر', quantity: 50, minQuantity: 10, costPerUnit: 1500 },
        { name: 'سكر', category: 'مواد جافة', unit: 'كجم', quantity: 20, minQuantity: 5, costPerUnit: 700 },
        { name: 'شاي', category: 'مواد جافة', unit: 'كجم', quantity: 3, minQuantity: 1, costPerUnit: 4000 },
        { name: 'قهوة', category: 'مواد جافة', unit: 'كجم', quantity: 2, minQuantity: 0.5, costPerUnit: 6000 },
        { name: 'ملح', category: 'توابل', unit: 'كجم', quantity: 5, minQuantity: 1, costPerUnit: 300 },
        { name: 'فلفل أسود', category: 'توابل', unit: 'كجم', quantity: 1, minQuantity: 0.2, costPerUnit: 5000 },
        { name: 'كركديه', category: 'مواد جافة', unit: 'كجم', quantity: 4, minQuantity: 1, costPerUnit: 1800 },
        { name: 'عرديب', category: 'مواد جافة', unit: 'كجم', quantity: 3, minQuantity: 0.5, costPerUnit: 2500 },
        { name: 'بيبسي', category: 'مشروبات', unit: 'علبة', quantity: 96, minQuantity: 24, costPerUnit: 400 },
        { name: 'مياه معدنية', category: 'مشروبات', unit: 'زجاجة', quantity: 120, minQuantity: 24, costPerUnit: 250 },
        { name: 'حطب الفحم', category: 'أخرى', unit: 'كيس', quantity: 10, minQuantity: 3, costPerUnit: 1500 },
      ]
      await db.inventoryItem.createMany({ data: invData })
      result.inventoryItems = invData.length
    }

    // 3) حساب المدير الافتراضي
    const userCount = await db.user.count()
    if (userCount === 0) {
      await db.user.create({
        data: {
          name: 'مدير المطعم',
          username: 'admin',
          password: hashPassword('admin123'),
          role: 'admin',
        },
      })
      result.userCreated = true
    }

    return NextResponse.json({
      success: true,
      message: 'تمت إضافة البيانات الأولية بنجاح',
      ...result,
    })
  } catch (error) {
    console.error('Error seeding data:', error)
    return NextResponse.json({ error: 'فشل في إضافة البيانات الأولية' }, { status: 500 })
  }
}
