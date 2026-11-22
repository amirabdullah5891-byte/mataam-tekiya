import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

// POST /api/seed - إضافة بيانات أولية للقائمة
export async function POST() {
  try {
    const count = await db.menuItem.count()
    if (count > 0) {
      return NextResponse.json({
        success: true,
        message: 'القائمة تحتوي على بيانات بالفعل',
        count,
      })
    }

    const seedData = [
      // مشويات
      { name: 'شوي لحم ضأن', category: 'مشويات', price: 8500, cost: 5200, description: 'لحم ضأن مشوي على الفحم' },
      { name: 'شوي لحم بقري', category: 'مشويات', price: 7500, cost: 4500, description: 'لحم بقري مشوي على الفحم' },
      { name: 'شوي دجاج كامل', category: 'مشويات', price: 5500, cost: 3200, description: 'دجاجة كاملة مشوية' },
      { name: 'كباب لحم', category: 'مشويات', price: 6500, cost: 3800, description: 'كباب لحم مفروم مشوي' },
      { name: 'شوي سمك النيل', category: 'مشويات', price: 7000, cost: 4200, description: 'سمك طازج من النيل' },
      { name: 'شوي كباشي', category: 'مشويات', price: 9000, cost: 5500, description: 'كباشي ضأن مشوي كامل' },

      // أطباق رئيسية (مقلية وأرز)
      { name: 'أرز بسمتي باللحم', category: 'أطباق رئيسية', price: 4500, cost: 2200, description: 'أرز بسمتي مطهي بقطع اللحم' },
      { name: 'كباب حلة', category: 'أطباق رئيسية', price: 5000, cost: 2800, description: 'كباب مطهي بالحلة' },
      { name: 'فول سوداني باللحم', category: 'أطباق رئيسية', price: 4000, cost: 2100, description: 'فول سوداني مطهي باللحم' },
      { name: 'مولوخية بالدجاج', category: 'أطباق رئيسية', price: 3800, cost: 1900, description: 'مولوخية خضراء مع دجاج' },
      { name: 'بامية باللحم', category: 'أطباق رئيسية', price: 4200, cost: 2200, description: 'بامية حمراء باللحم' },
      { name: 'ويكة باللحم', category: 'أطباق رئيسية', price: 3500, cost: 1800, description: 'ويكة (خليط بقوليات) باللحم' },

      // خبز
      { name: 'كسرة (5 قطع)', category: 'خبز', price: 500, cost: 250, description: 'خبز كسرة سوداني تقليدي' },
      { name: 'عيش (رغيف)', category: 'خبز', price: 300, cost: 150, description: 'رغيف عيش أبيض' },
      { name: 'بالبدن (5 قطع)', category: 'خبز', price: 700, cost: 350, description: 'خبز بلدي دائري' },

      // مشروبات
      { name: 'شاي باللبن', category: 'مشروبات', price: 800, cost: 300, description: 'شاي أحمر بالحليب' },
      { name: 'قهوة عربية', category: 'مشروبات', price: 1000, cost: 400, description: 'قهوة عربية تقليدية' },
      { name: 'كركديه بارد', category: 'مشروبات', price: 700, cost: 200, description: 'عصير كركديه مثلج' },
      { name: 'عرديب بارد', category: 'مشروبات', price: 900, cost: 350, description: 'عصير عرديب (تمر هندي)' },
      { name: 'مياه معدنية', category: 'مشروبات', price: 500, cost: 250, description: 'زجاجة مياه 0.5 لتر' },
      { name: 'بيبسي', category: 'مشروبات', price: 800, cost: 400, description: 'علبة بيبسي 330 مل' },

      // حساء
      { name: 'حساء لحم', category: 'حساء', price: 2500, cost: 1300, description: 'حساء لحم بالخضروات' },
      { name: 'حساء دجاج', category: 'حساء', price: 2200, cost: 1100, description: 'حساء دجاج بالخضروات' },

      // حلويات
      { name: 'حلاوة بالسمسم', category: 'حلويات', price: 1200, cost: 500, description: 'حلاوة طحينة بالسمسم' },
      { name: 'بسبوسة', category: 'حلويات', price: 1500, cost: 700, description: 'بسبوسة بالقشطة' },
    ]

    await db.menuItem.createMany({ data: seedData })

    return NextResponse.json({
      success: true,
      message: `تمت إضافة ${seedData.length} عنصر للقائمة`,
      count: seedData.length,
    })
  } catch (error) {
    console.error('Error seeding menu:', error)
    return NextResponse.json({ error: 'فشل في إضافة البيانات الأولية' }, { status: 500 })
  }
}
