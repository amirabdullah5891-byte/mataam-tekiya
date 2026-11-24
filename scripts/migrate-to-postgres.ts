#!/usr/bin/env bun
// سكريبت ترحيل البيانات من SQLite إلى PostgreSQL
// الاستخدام: bun run scripts/migrate-to-postgres.ts
//
// يقرأ البيانات من SQLite (db/custom.db) ويكتبها إلى PostgreSQL
// يستخدم Prisma Client للكتابة (يتبع الـ DATABASE_URL الحالي)

import { PrismaClient } from '@prisma/client'
import { existsSync } from 'fs'
import path from 'path'
import Database from 'better-sqlite3'

// إنشاء عميل SQLite منفصل للقراءة
function createSqliteClient() {
  const sqlitePath = path.join(process.cwd(), 'db', 'custom.db')
  if (!existsSync(sqlitePath)) {
    throw new Error('قاعدة بيانات SQLite غير موجودة')
  }

  const db = new Database(sqlitePath, { readonly: true })
  return db
}

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

async function main() {
  console.log('\n🔄 ترحيل البيانات من SQLite إلى PostgreSQL\n')

  const sqlite = createSqliteClient()
  const prisma = new PrismaClient()

  try {
    // قائمة الجداول للترحيل (بالترتيب الصحيح للعلاقات)
    const tables = [
      { name: 'User', table: 'User' },
      { name: 'Session', table: 'Session' },
      { name: 'MenuItem', table: 'MenuItem' },
      { name: 'Supplier', table: 'Supplier' },
      { name: 'InventoryItem', table: 'InventoryItem' },
      { name: 'Customer', table: 'Customer' },
      { name: 'Invoice', table: 'Invoice' },
      { name: 'InvoiceItem', table: 'InvoiceItem' },
      { name: 'Purchase', table: 'Purchase' },
      { name: 'PurchaseItem', table: 'PurchaseItem' },
      { name: 'StockMovement', table: 'StockMovement' },
      { name: 'Expense', table: 'Expense' },
      { name: 'WalletTransaction', table: 'WalletTransaction' },
      { name: 'CustomerOrder', table: 'CustomerOrder' },
      { name: 'CustomerOrderItem', table: 'CustomerOrderItem' },
      { name: 'Review', table: 'Review' },
      { name: 'Notification', table: 'Notification' },
      { name: 'AuditLog', table: 'AuditLog' },
    ]

    let totalMigrated = 0

    for (const { name, table } of tables) {
      try {
        // قراءة البيانات من SQLite
        const rows = sqlite.prepare(`SELECT * FROM "${table}"`).all()
        
        if (rows.length === 0) {
          log(`   ${name}: 0 سجل (تخطي)`, colors.blue)
          continue
        }

        // تحويل التواريخ من نص إلى كائن Date
        const processedRows = rows.map((row: any) => {
          const processed: any = {}
          for (const [key, value] of Object.entries(row)) {
            if (value !== null && typeof value === 'string') {
              // تحويل التواريخ
              if (key === 'createdAt' || key === 'updatedAt' || key === 'lastLogin' || 
                  key === 'expiresAt' || key === 'acceptedAt' || key === 'completedAt' ||
                  key === 'sentAt' || key === 'date') {
                const date = new Date(value)
                if (!isNaN(date.getTime())) {
                  processed[key] = date
                } else {
                  processed[key] = value
                }
              } else {
                processed[key] = value
              }
            } else {
              processed[key] = value
            }
          }
          return processed
        })

        // كتابة البيانات إلى PostgreSQL عبر Prisma
        const prismaModel = (prisma as any)[name.charAt(0).toLowerCase() + name.slice(1)]
        if (!prismaModel) {
          log(`   ⚠️  ${name}: النموذج غير موجود في Prisma`, colors.yellow)
          continue
        }

        // حذف البيانات الموجودة (إن أي) لتجنب التكرار
        await prismaModel.deleteMany({})

        // إدراج البيانات على دفعات (100 سجل في كل دفعة)
        const batchSize = 100
        for (let i = 0; i < processedRows.length; i += batchSize) {
          const batch = processedRows.slice(i, i + batchSize)
          await prismaModel.createMany({ data: batch })
        }

        log(`   ✅ ${name}: ${rows.length} سجل`, colors.green)
        totalMigrated += rows.length
      } catch (e: any) {
        log(`   ❌ ${name}: ${e.message}`, colors.red)
      }
    }

    log(`\n✅ تم ترحيل ${totalMigrated} سجل بنجاح!`, colors.bold + colors.green)

    // إعادة تعيين تسلسل المعرفات في PostgreSQL
    log('\n📋 إعادة تعيين التسلسلات...', colors.yellow)
    try {
      await prisma.$executeRawUnsafe(`
        SELECT setval(pg_get_serial_sequence('"User"', 'id'), 
          COALESCE(MAX(CAST(SUBSTRING(id FROM 2) AS INTEGER)), 1) + 1, false) FROM "User"
      `).catch(() => {})
      log('✅ تم إعادة تعيين التسلسلات', colors.green)
    } catch (e) {
      log('⚠️  تعذر إعادة تعيين التسلسلات (غير حرج)', colors.yellow)
    }

  } finally {
    sqlite.close()
    await prisma.$disconnect()
  }
}

main().catch((e) => {
  log(`\n❌ فشل الترحيل: ${e.message}`, colors.red)
  console.error(e)
  process.exit(1)
})
