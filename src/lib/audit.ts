// نظام سجل الأحداث الأمنية - Audit Log
// يسجل كل عملية حساسة في قاعدة البيانات لأغراض المراجعة والامتثال
import { db } from './db'

export type AuditAction =
  | 'login'
  | 'login_failed'
  | 'logout'
  | 'invoice_create'
  | 'invoice_cancel'
  | 'purchase_create'
  | 'wallet_topup'
  | 'customer_create'
  | 'expense_create'
  | 'expense_delete'
  | 'user_create'
  | 'user_update'
  | 'user_deactivate'
  | 'menu_item_create'
  | 'menu_item_update'
  | 'menu_item_delete'
  | 'order_status_change'
  | 'inventory_update'
  | 'review_hide'
  | 'review_delete'
  | 'supplier_create'
  | 'supplier_update'
  | 'supplier_delete'

export type EntityType =
  | 'user'
  | 'invoice'
  | 'purchase'
  | 'customer'
  | 'expense'
  | 'menu_item'
  | 'customer_order'
  | 'inventory_item'
  | 'review'
  | 'supplier'
  | 'session'

type LogOptions = {
  action: AuditAction | string
  entityType: EntityType | string
  entityId?: string
  description?: string
  userId?: string
  ipAddress?: string
  userAgent?: string
  metadata?: Record<string, any>
  status?: 'success' | 'failed' | 'error'
}

// تسجيل حدث في سجل الأحداث الأمنية
export async function logAudit(options: LogOptions): Promise<void> {
  try {
    await db.auditLog.create({
      data: {
        action: options.action,
        entityType: options.entityType,
        entityId: options.entityId || null,
        description: options.description || null,
        userId: options.userId || null,
        ipAddress: options.ipAddress || null,
        userAgent: options.userAgent || null,
        metadata: options.metadata ? JSON.stringify(options.metadata) : null,
        status: options.status || 'success',
      },
    })
  } catch (e) {
    // لا نفشل العملية الأصلية بسبب فشل التسجيل
    console.error('Failed to log audit event:', e)
  }
}

// استخراج عنوان IP من request
export function getClientIP(request: Request): string | undefined {
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) return forwarded.split(',')[0].trim()
  const realIP = request.headers.get('x-real-ip')
  if (realIP) return realIP.trim()
  return undefined
}

// استخراج معلومات المتصفح
export function getUserAgent(request: Request): string | undefined {
  return request.headers.get('user-agent') || undefined
}
