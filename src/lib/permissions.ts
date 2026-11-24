// نظام الصلاحيات التفصيلي لكل مستخدم
// كل تبويب/قسم له صلاحية مستقلة يمكن منحها أو حجبها لأي مستخدم

export type PermissionKey =
  | 'dashboard'        // لوحة المعلومات
  | 'invoices'         // الفواتير
  | 'purchases'        // المشتريات
  | 'inventory'        // المخزون
  | 'expenses'         // المصروفات
  | 'suppliers'        // الموردون
  | 'reports'          // التقارير
  | 'users'            // المستخدمون (admin only)
  | 'customerOrders'   // طلبات الزبائن
  | 'customers'        // المحافظ الرقمية
  | 'reviews'          // تقييمات الأطباق
  | 'audit'            // سجل الأحداث
  | 'menu'             // قائمة الطعام (إدارة)

// كل الصلاحيات المتاحة
export const ALL_PERMISSIONS: { key: PermissionKey; label: string; description: string }[] = [
  { key: 'dashboard', label: 'لوحة المعلومات', description: 'عرض الإحصائيات والمبيعات' },
  { key: 'customerOrders', label: 'طلبات الزبائن', description: 'استقبال ومعالجة طلبات الزبائن' },
  { key: 'invoices', label: 'الفواتير', description: 'إنشاء وطباعة الفواتير' },
  { key: 'purchases', label: 'المشتريات', description: 'إنشاء فواتير الشراء من الموردين' },
  { key: 'customers', label: 'المحافظ الرقمية', description: 'إدارة محافظ الزبائن وشحن الأرصدة' },
  { key: 'inventory', label: 'المخزون', description: 'إدارة أصناف المخزون والكميات' },
  { key: 'suppliers', label: 'الموردون', description: 'إدارة بيانات الموردين' },
  { key: 'expenses', label: 'المصروفات', description: 'تسجيل المصروفات (رواتب، إيجار، إلخ)' },
  { key: 'reviews', label: 'تقييمات الأطباق', description: 'مراجعة وإدارة تقييمات الزبائن' },
  { key: 'reports', label: 'التقارير', description: 'عرض تقارير المبيعات والمخزون' },
  { key: 'audit', label: 'سجل الأحداث', description: 'عرض سجل العمليات الأمنية' },
  { key: 'menu', label: 'قائمة الطعام', description: 'إضافة وتعديل وحذف الأطباق' },
  { key: 'users', label: 'المستخدمون', description: 'إدارة حسابات المستخدمين (المدير فقط)' },
]

// الصلاحيات الافتراضية حسب الدور
export function getDefaultPermissions(role: string): Record<PermissionKey, boolean> {
  switch (role) {
    case 'admin':
      // المدير له كل الصلاحيات
      return ALL_PERMISSIONS.reduce((acc, p) => ({ ...acc, [p.key]: true }), {} as Record<PermissionKey, boolean>)
    case 'manager':
      // المشفر: كل شيء إلا إدارة المستخدمين
      return {
        dashboard: true,
        customerOrders: true,
        invoices: true,
        purchases: true,
        customers: true,
        inventory: true,
        suppliers: true,
        expenses: true,
        reviews: true,
        reports: true,
        audit: true,
        menu: true,
        users: false,
      }
    case 'cashier':
      // الكاشير: العمليات اليومية فقط
      return {
        dashboard: true,
        customerOrders: true,
        invoices: true,
        purchases: false,
        customers: true,
        inventory: false,
        suppliers: false,
        expenses: false,
        reviews: false,
        reports: false,
        audit: false,
        menu: false,
        users: false,
      }
    default:
      return ALL_PERMISSIONS.reduce((acc, p) => ({ ...acc, [p.key]: false }), {} as Record<PermissionKey, boolean>)
  }
}

// تحويل الصلاحيات من JSON string إلى كائن
export function parsePermissions(permissionsStr: string | null | undefined, role: string): Record<PermissionKey, boolean> {
  if (!permissionsStr) {
    return getDefaultPermissions(role)
  }
  try {
    const parsed = JSON.parse(permissionsStr)
    // دمج مع الافتراضي لضمان وجود كل المفاتيح
    const defaults = getDefaultPermissions(role)
    return { ...defaults, ...parsed }
  } catch {
    return getDefaultPermissions(role)
  }
}

// تحويل الصلاحيات من كائن إلى JSON string
export function serializePermissions(permissions: Record<PermissionKey, boolean>): string {
  return JSON.stringify(permissions)
}

// فحص صلاحية واحدة
export function hasPermission(
  permissions: Record<PermissionKey, boolean>,
  key: PermissionKey
): boolean {
  return permissions[key] === true
}

// المسميات الوظيفية المقترحة
export const JOB_TITLES = [
  'مدير عام',
  'مدير المطعم',
  'محاسب',
  'مشرف',
  'كاشير',
  'ويتر',
  'شيف',
  'مساعد شيف',
  'عامل مطبخ',
  'موظف استقبال',
  'موظف توصيل',
  'أخرى',
]
