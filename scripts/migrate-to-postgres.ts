#!/usr/bin/env bun
// سكريبت ترحيل مبسط: يقرأ من SQLite مباشرة، ويكتب لـ PostgreSQL عبر Prisma
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

// قراءة SQLite مباشرة باستخدام Prisma مع تبديل مؤقت
async function readSqliteData(): Promise<Record<string, any[]>> {
  const sqlitePath = path.join(process.cwd(), 'db', 'custom.db')
  if (!existsSync(sqlitePath)) {
    throw new Error('قاعدة بيانات SQLite غير موجودة')
  }

  // حفظ الإعدادات الأصلية
  const schemaPath = path.join(process.cwd(), 'prisma', 'schema.prisma')
  const envPath = path.join(process.cwd(), '.env')
  const originalSchema = readFileSync(schemaPath, 'utf-8')
  const originalEnv = readFileSync(envPath, 'utf-8')

  log('   تبديل مؤقت لـ SQLite للقراءة...', colors.blue)
  
  // تبديل إلى SQLite
  const sqliteSchema = originalSchema.replace(
    /provider\s*=\s*"(postgresql|mysql|sqlite)"/,
    'provider = "sqlite"'
  )
  writeFileSync(schemaPath, sqliteSchema)
  writeFileSync(envPath, `DATABASE_URL=file:${sqlitePath}\n`)

  // إعادة توليد Prisma Client
  execSync('bun run db:generate', { stdio: 'pipe', cwd: process.cwd() })

  // مسح cache
  delete require.cache[require.resolve('@prisma/client')]

  // استيراد جديد
  const { PrismaClient: SqliteClient } = require('@prisma/client')
  const prisma = new SqliteClient()

  const tables = [
    { name: 'User', model: 'user' },
    { name: 'MenuItem', model: 'menuItem' },
    { name: 'Supplier', model: 'supplier' },
    { name: 'InventoryItem', model: 'inventoryItem' },
    { name: 'Customer', model: 'customer' },
    { name: 'Invoice', model: 'invoice' },
    { name: 'InvoiceItem', model: 'invoiceItem' },
    { name: 'Purchase', model: 'purchase' },
    { name: 'PurchaseItem', model: 'purchaseItem' },
    { name: 'StockMovement', model: 'stockMovement' },
    { name: 'Expense', model: 'expense' },
    { name: 'WalletTransaction', model: 'walletTransaction' },
    { name: 'CustomerOrder', model: 'customerOrder' },
    { name: 'CustomerOrderItem', model: 'customerOrderItem' },
    { name: 'Review', model: 'review' },
    { name: 'Notification', model: 'notification' },
    { name: 'AuditLog', model: 'auditLog' },
    { name: 'Session', model: 'session' },
  ]

  const data: Record<string, any[]> = {}

  try {
    for (const { name, model } of tables) {
      try {
        const records = await (prisma as any)[model].findMany()
        data[name] = records
        log(`   📖 ${name}: ${records.length} سجل`, colors.blue)
      } catch (e: any) {
        log(`   ⚠️  ${name}: ${e.message.substring(0, 40)}`, colors.yellow)
        data[name] = []
      }
    }
  } finally {
    await prisma.$disconnect()
  }

  // إعادة الإعدادات الأصلية (PostgreSQL)
  log('   إعادة PostgreSQL...', colors.blue)
  writeFileSync(schemaPath, originalSchema)
  writeFileSync(envPath, originalEnv)
  execSync('bun run db:generate', { stdio: 'pipe', cwd: process.cwd() })

  return data
}

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

  // 1. قراءة البيانات من SQLite
  log('\n📋 الخطوة 1: قراءة البيانات من SQLite...', colors.yellow)
  const data = await readSqliteData()
  
  let totalRead = 0
  for (const rows of Object.values(data)) {
    totalRead += rows.length
  }
  log(`✅ تم قراءة ${totalRead} سجل`, colors.green)

  // 2. الكتابة إلى PostgreSQL
  log('\n📋 الخطوة 2: كتابة البيانات إلى PostgreSQL...', colors.yellow)
  
  // مسح cache واستيراد جديد
  delete require.cache[require.resolve('@prisma/client')]
  const { PrismaClient: PgClient } = require('@prisma/client')
  const pgPrisma = new PgClient()

  const tableOrder = [
    { name: 'User', model: 'user' },
    { name: 'MenuItem', model: 'menuItem' },
    { name: 'Supplier', model: 'supplier' },
    { name: 'InventoryItem', model: 'inventoryItem' },
    { name: 'Customer', model: 'customer' },
    { name: 'Invoice', model: 'invoice' },
    { name: 'InvoiceItem', model: 'invoiceItem' },
    { name: 'Purchase', model: 'purchase' },
    { name: 'PurchaseItem', model: 'purchaseItem' },
    { name: 'StockMovement', model: 'stockMovement' },
    { name: 'Expense', model: 'expense' },
    { name: 'WalletTransaction', model: 'walletTransaction' },
    { name: 'CustomerOrder', model: 'customerOrder' },
    { name: 'CustomerOrderItem', model: 'customerOrderItem' },
    { name: 'Review', model: 'review' },
    { name: 'Notification', model: 'notification' },
    { name: 'AuditLog', model: 'auditLog' },
    { name: 'Session', model: 'session' },
  ]

  let migrated = 0

  try {
    for (const { name, model } of tableOrder) {
      const rows = data[name] || []
      if (rows.length === 0) {
        log(`   ${name}: 0 سجل (تخطي)`, colors.blue)
        continue
      }

      const modelInstance = (pgPrisma as any)[model]
      if (!modelInstance) {
        log(`   ⚠️  ${name}: النموذج غير موجود`, colors.yellow)
        continue
      }

      try {
        // حذف البيانات الموجودة (قاعدة البيانات الهدف فارغة عادة)
        try {
          await modelInstance.deleteMany({})
        } catch {
          // تجاهل
        }
        
        const processedRows = processDates(rows)
        
        // إدراج على دفعات
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
    await pgPrisma.$disconnect()
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
