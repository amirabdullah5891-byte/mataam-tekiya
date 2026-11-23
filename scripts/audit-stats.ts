#!/usr/bin/env bun
// عرض إحصائيات سجل الأحداث الأمنية
// الاستخدام: bun run scripts/audit-stats.ts

import { db } from '../src/lib/db'

async function main() {
  const total = await db.auditLog.count()
  console.log(`\n=== سجل الأحداث الأمنية ===`)
  console.log(`إجمالي الأحداث: ${total}\n`)

  // إحصائيات حسب الإجراء
  const byAction = await db.auditLog.groupBy({
    by: ['action'],
    _count: { _all: true },
    orderBy: { _count: { action: 'desc' } },
  })
  console.log('الأحداث حسب النوع:')
  for (const a of byAction) {
    console.log(`  ${a.action}: ${a._count._all}`)
  }

  // آخر 10 أحداث
  console.log('\nآخر 10 أحداث:')
  const recent = await db.auditLog.findMany({
    orderBy: { createdAt: 'desc' },
    take: 10,
  })
  for (const r of recent) {
    const user = r.userId || 'مجهول'
    const time = r.createdAt.toLocaleString('ar-SD')
    console.log(`  [${time}] ${r.action} - ${r.entityType} - ${user} - ${r.description || ''}`)
  }
}

main().catch(console.error).finally(() => process.exit(0))
