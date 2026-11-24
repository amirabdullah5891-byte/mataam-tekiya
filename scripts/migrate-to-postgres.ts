#!/usr/bin/env bun
// سكريبت ترحيل البيانات من SQLite إلى PostgreSQL
// الاستخدام: bun run scripts/migrate-to-postgres.ts
//
// يقوم بـ:
// 1. قراءة البيانات من SQLite عبر Prisma
// 2. إعادة توليد Prisma Client للمزود الهدف
// 3. كتابة البيانات إلى قاعدة البيانات الهدف

import { PrismaClient } from '@prisma/client'
import { existsSync, readFileSync, writeFileSync } from 'fs'
import path from 'path'
import { execSync } from 'child_process'

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  bold: '\x1b[1m',
}

function log(msg: string, color = '') {
  console.log(`${color}${msg}${colors.reset}`)
}

// تحويل التواريخ من نص إلى كائن Date
function processDates(rows: any[]): any[] {
  const dateKeys = ['createdAt', 'updatedAt', 'lastLogin', 'expiresAt',
    'acceptedAt', 'completedAt', 'sentAt', 'date']
  
  return rows.map((row: any) => {
    const processed: any = {}
    for (const [key, value] of Object.entries(row)) {
      if (value !== null && typeof value === 'string' && dateKeys.includes(key)) {
        const date = new Date(value)
        processed[key] = isNaN(date.getTime()) ? value : date
      } else {
        processed[key] = value
      }
    }
    return processed
  })
}

async function main() {
  console.log('\n🔄 ترحيل البيانات من SQLite إلى PostgreSQL\n')
  console.log('═'.repeat(60))

  // فحص وجود قاعدة بيانات SQLite
  const sqlitePath = path.join(process.cwd(), 'db', 'custom.db')
  if (!existsSync(sqlitePath)) {
    log('❌ قاعدة بيانات SQLite غير موجودة في db/custom.db', colors.red)
    process.exit(1)
  }

  // 1. قراءة البيانات من SQLite
  log('\n📋 الخطوة 1: قراءة البيانات من SQLite...', colors.yellow)

  // حفظ الإعدادات الأصلية
  const schemaPath = path.join(process.cwd(), 'prisma', 'schema.prisma')
  const envPath = path.join(process.cwd(), '.env')
  const originalSchema = readFileSync(schemaPath, 'utf-8')
  const originalEnv = readFileSync(envPath, 'utf-8')

  // تبديل مؤقت إلى SQLite للقراءة
  const sqliteSchema = originalSchema.replace(
    /provider\s*=\s*"(postgresql|mysql|sqlite)"/,
    'provider = "sqlite"'
  )
  writeFileSync(schemaPath, sqliteSchema)
  writeFileSync(envPath, originalEnv.replace(
    /^DATABASE_URL=.+$/m,
    `DATABASE_URL=file:${sqlitePath}`
  ))

  try {
    execSync('bun run db:generate', { stdio: 'pipe', cwd: process.cwd() })
  } catch (e) {
    log('❌ فشل تحديث Prisma Client لـ SQLite', colors.red)
    // إعادة الإعدادات
    writeFileSync(schemaPath, originalSchema)
    writeFileSync(envPath, originalEnv)
    process.exit(1)
  }

  // إنشاء عميل SQLite
  const { PrismaClient: SqlitePrisma } = await import('@prisma/client')
  const sqlitePrisma = new SqlitePrisma()

  const tables = [
    // التابعون أولاً (لحذفهم قبل الآباء)
    { name: 'Session', model: 'session' },
    { name: 'AuditLog', model: 'auditLog' },
    { name: 'Notification', model: 'notification' },
    { name: 'Review', model: 'review' },
    { name: 'CustomerOrderItem', model: 'customerOrderItem' },
    { name: 'CustomerOrder', model: 'customerOrder' },
    { name: 'WalletTransaction', model: 'walletTransaction' },
    { name: 'Expense', model: 'expense' },
    { name: 'StockMovement', model: 'stockMovement' },
    { name: 'PurchaseItem', model: 'purchaseItem' },
    { name: 'Purchase', model: 'purchase' },
    { name: 'InvoiceItem', model: 'invoiceItem' },
    { name: 'Invoice', model: 'invoice' },
    { name: 'Customer', model: 'customer' },
    { name: 'InventoryItem', model: 'inventoryItem' },
    { name: 'Supplier', model: 'supplier' },
    { name: 'MenuItem', model: 'menuItem' },
    { name: 'User', model: 'user' },
  ]

  const data: Record<string, any[]> = {}

  try {
    for (const { name, model } of tables) {
      try {
        const records = await (sqlitePrisma as any)[model].findMany()
        data[name] = records
        log(`   📖 ${name}: ${records.length} سجل`, colors.blue)
      } catch (e: any) {
        log(`   ⚠️  ${name}: ${e.message.substring(0, 50)}`, colors.yellow)
        data[name] = []
      }
    }
  } finally {
    await sqlitePrisma.$disconnect()
  }

  let totalRecords = 0
  for (const rows of Object.values(data)) {
    totalRecords += rows.length
  }
  log(`\n✅ تم قراءة ${totalRecords} سجل من ${Object.keys(data).length} جدول`, colors.green)

  // 2. إعادة الإعدادات للمزود الهدف
  log('\n📋 الخطوة 2: إعداد Prisma للمزود الهدف...', colors.yellow)
  writeFileSync(schemaPath, originalSchema)
  writeFileSync(envPath, originalEnv)

  try {
    execSync('bun run db:generate', { stdio: 'inherit', cwd: process.cwd() })
    log('✅ تم تحديث Prisma Client للمزود الهدف', colors.green)
  } catch {
    log('⚠️  تعذر تحديث Prisma Client', colors.yellow)
  }

  // 3. الكتابة إلى قاعدة البيانات الهدف
  log('\n📋 الخطوة 3: كتابة البيانات إلى قاعدة البيانات الهدف...', colors.yellow)

  const { PrismaClient: TargetPrisma } = await import('@prisma/client')
  const targetPrisma = new TargetPrisma()

  try {
    let migrated = 0
    for (const { name, model } of tables) {
      const rows = data[name] || []
      if (rows.length === 0) {
        log(`   ${name}: 0 سجل (تخطي)`, colors.blue)
        continue
      }

      const modelInstance = (targetPrisma as any)[model]
      if (!modelInstance) {
        log(`   ⚠️  ${name}: النموذج غير موجود`, colors.yellow)
        continue
      }

      try {
        // فحص عدد السجلات الموجودة
        const existingCount = await modelInstance.count()
        if (existingCount > 0) {
          // محاولة الحذف، تجاهل الأخطاء
          try {
            await modelInstance.deleteMany({})
          } catch {
            log(`   ⚠️  ${name}: تعذر حذف السجلات الموجودة، سيتم الإضافة`, colors.yellow)
          }
        }
        
        const processedRows = processDates(rows)
        
        const batchSize = 100
        for (let i = 0; i < processedRows.length; i += batchSize) {
          const batch = processedRows.slice(i, i + batchSize)
          await modelInstance.createMany({ data: batch })
        }

        log(`   ✅ ${name}: ${rows.length} سجل`, colors.green)
        migrated += rows.length
      } catch (e: any) {
        log(`   ❌ ${name}: ${e.message.substring(0, 60)}`, colors.red)
      }
    }

    log(`\n✅ تم ترحيل ${migrated} سجل بنجاح!`, colors.bold + colors.green)

  } finally {
    await targetPrisma.$disconnect()
  }

  console.log('\n' + '═'.repeat(60))
  log('🎉 اكتمل الترحيل بنجاح!', colors.bold + colors.green)
  console.log('═'.repeat(60) + '\n')
}

main().catch((e) => {
  log(`\n❌ فشل الترحيل: ${e.message}`, colors.red)
  console.error(e)
  process.exit(1)
})
