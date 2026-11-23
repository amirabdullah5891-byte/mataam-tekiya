// نظام Rate Limiting - تحديد معدل الطلبات لمنع الإساءة
// يستخدم تخزين في الذاكرة (in-memory) - مناسب لخادم واحد
// للنشر متعدد الخوادم، استبدله بـ Redis

type RateLimitEntry = {
  count: number
  resetTime: number
}

const store = new Map<string, RateLimitEntry>()

// تنظيف دوري للمدخلات المنتهية (كل 5 دقائق)
const CLEANUP_INTERVAL = 5 * 60 * 1000
let lastCleanup = Date.now()

function cleanup() {
  const now = Date.now()
  if (now - lastCleanup < CLEANUP_INTERVAL) return
  lastCleanup = now
  for (const [key, entry] of store.entries()) {
    if (entry.resetTime < now) {
      store.delete(key)
    }
  }
}

type RateLimitResult = {
  allowed: boolean
  remaining: number
  resetTime: number
  limit: number
}

// فحص معدل الطلبات
// limit: عدد الطلبات المسموح
// windowMs: النافذة الزمنية بالمللي ثانية
export function checkRateLimit(
  identifier: string,
  limit: number,
  windowMs: number
): RateLimitResult {
  cleanup()
  const now = Date.now()
  const existing = store.get(identifier)

  if (!existing || existing.resetTime < now) {
    // نافذة جديدة
    store.set(identifier, {
      count: 1,
      resetTime: now + windowMs,
    })
    return {
      allowed: true,
      remaining: limit - 1,
      resetTime: now + windowMs,
      limit,
    }
  }

  // ضمن النافذة الحالية
  if (existing.count >= limit) {
    return {
      allowed: false,
      remaining: 0,
      resetTime: existing.resetTime,
      limit,
    }
  }

  existing.count++
  return {
    allowed: true,
    remaining: limit - existing.count,
    resetTime: existing.resetTime,
    limit,
  }
}

// إنشاء response عند تجاوز الحد
export function rateLimitResponse(resetTime: number) {
  const retryAfter = Math.ceil((resetTime - Date.now()) / 1000)
  const res = Response.json(
    {
      error: 'تجاوزت الحد المسموح من الطلبات',
      retryAfter,
    },
    { status: 429 }
  )
  res.headers.set('Retry-After', String(retryAfter))
  return res
}

// الحصول على معرّف العميل (IP + المسار)
export function getRateLimitIdentifier(request: Request, prefix = ''): string {
  const forwarded = request.headers.get('x-forwarded-for')
  const ip = forwarded
    ? forwarded.split(',')[0].trim()
    : request.headers.get('x-real-ip')?.trim() || 'unknown'
  return `${prefix}:${ip}`
}
