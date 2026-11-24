// أدوات مساعدة للصور الافتراضية حسب الفئة

const CATEGORY_IMAGES: Record<string, string> = {
  'مشويات': '/dishes/مشويات.jpg',
  'أطباق رئيسية': '/dishes/أطباق-رئيسية.jpg',
  'مشروبات': '/dishes/مشروبات.jpg',
  'خبز': '/dishes/خبز.jpg',
  'حساء': '/dishes/حساء.jpg',
  'حلويات': '/dishes/حلويات.jpg',
  'أخرى': '/dishes/أخرى.jpg',
}

// ألوان لكل فئة (للخلفية عند عدم وجود صورة)
export const CATEGORY_COLORS: Record<string, string> = {
  'مشويات': 'from-red-600 to-red-800',
  'أطباق رئيسية': 'from-orange-500 to-amber-700',
  'مشروبات': 'from-blue-500 to-blue-700',
  'خبز': 'from-amber-400 to-amber-600',
  'حساء': 'from-green-500 to-green-700',
  'حلويات': 'from-pink-500 to-rose-700',
  'أخرى': 'from-gray-500 to-gray-700',
}

// أيقونات emoji لكل فئة
export const CATEGORY_ICONS: Record<string, string> = {
  'مشويات': '🥩',
  'أطباق رئيسية': '🍲',
  'مشروبات': '🥤',
  'خبز': '🫓',
  'حساء': '🍜',
  'حلويات': '🍰',
  'أخرى': '🍽️',
}

// الحصول على صورة الطبق (الصورة المرفوعة أو الافتراضية)
export function getDishImage(imageUrl: string | null | undefined, category: string): string {
  if (imageUrl) return imageUrl
  return CATEGORY_IMAGES[category] || CATEGORY_IMAGES['أخرى']
}

// الحصول على أيقونة الفئة
export function getCategoryIcon(category: string): string {
  return CATEGORY_ICONS[category] || '🍽️'
}

// الحصول على لون الفئة
export function getCategoryColor(category: string): string {
  return CATEGORY_COLORS[category] || CATEGORY_COLORS['أخرى']
}
