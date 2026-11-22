// أدوات تنسيق العملة والأرقام والتواريخ - الجنيه الجنوب سوداني

export function formatCurrency(amount: number): string {
  const formatted = new Intl.NumberFormat('ar-SD', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount || 0)
  return `${formatted} ج.س`
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat('ar-SD').format(value || 0)
}

export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return new Intl.DateTimeFormat('ar-SD', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(d)
}

export function formatDateTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return new Intl.DateTimeFormat('ar-SD', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d)
}

export function formatTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return new Intl.DateTimeFormat('ar-SD', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(d)
}

// اسم الفترة بالعربية
export function rangeLabel(range: 'today' | 'week' | 'month'): string {
  switch (range) {
    case 'today': return 'اليوم'
    case 'week': return 'آخر أسبوع'
    case 'month': return 'آخر شهر'
    default: return range
  }
}

// ترجمة طريقة الدفع
export function paymentMethodLabel(method: string): string {
  switch (method) {
    case 'cash': return 'نقداً'
    case 'card': return 'بطاقة'
    case 'transfer': return 'تحويل'
    case 'credit': return 'آجل'
    default: return method
  }
}

// ترجمة حالة الفاتورة
export function statusLabel(status: string): string {
  switch (status) {
    case 'completed': return 'مكتملة'
    case 'cancelled': return 'ملغاة'
    case 'refunded': return 'مسترجعة'
    default: return status
  }
}

// ترجمة أسماء الأيام
export function dayName(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return new Intl.DateTimeFormat('ar-SD', { weekday: 'short' }).format(d)
}
