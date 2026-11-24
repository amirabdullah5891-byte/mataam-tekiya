#!/usr/bin/env bun
// سكريبت التبديل بين مزودات قواعد البيانات (SQLite ↔ PostgreSQL ↔ MySQL)
// الاستخدام: bun run scripts/switch-db.ts <provider>
// مثال: bun run scripts/switch-db.ts postgresql
// مثال: bun run scripts/switch-db.ts sqlite

import { readFileSync, writeFileSync } from 'fs'
import path from 'path'

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
  const provider = process.argv[2]
  const validProviders = ['sqlite', 'postgresql', 'mysql']

  if (!provider || !validProviders.includes(provider)) {
    log('\n❌ استخدم: bun run scripts/switch-db.ts <provider>', colors.red)
    log('المزودات المدعومة:', colors.yellow)
    log('  sqlite      - للتطوير (افتراضي)', colors.green)
    log('  postgresql  - للإنتاج والتوسع', colors.green)
    log('  mysql       - بديل للإنتاج', colors.green)
    log('\nمثال:', colors.blue)
    console.log('  bun run scripts/switch-db.ts postgresql')
    process.exit(1)
  }

  const schemaPath = path.join(process.cwd(), 'prisma', 'schema.prisma')
  const schema = readFileSync(schemaPath, 'utf-8')

  // استبدال provider
  const newSchema = schema.replace(
    /provider\s*=\s*"(sqlite|postgresql|mysql)"/,
    `provider = "${provider}"`
  )

  if (schema === newSchema) {
    log(`\n⚠️  المزود الحالي هو بالفعل "${provider}"`, colors.yellow)
    process.exit(0)
  }

  writeFileSync(schemaPath, newSchema)
  log(`\n✅ تم التبديل إلى ${provider}`, colors.green)

  log('\n📋 الخطوات التالية:', colors.blue)
  
  if (provider === 'sqlite') {
    log('1. تأكد أن DATABASE_URL في .env يشير لملف SQLite', colors.green)
    log('   مثال: DATABASE_URL=file:./db/custom.db', colors.green)
    log('2. شغّل: bun run db:generate', colors.green)
    log('3. شغّل: bun run db:push', colors.green)
  } else if (provider === 'postgresql') {
    log('1. تأكد أن DATABASE_URL في .env يشير لـ PostgreSQL', colors.green)
    log('   مثال: DATABASE_URL=postgresql://user:pass@localhost:5432/dbname', colors.green)
    log('2. شغّل: bun run setup:postgres (للإعداد التلقائي + الترحيل)', colors.green)
    log('   أو يدوياً:', colors.yellow)
    log('   - bun run db:generate', colors.green)
    log('   - bun run db:push', colors.green)
    log('   - bun run migrate:postgres (لترحيل البيانات الموجودة)', colors.green)
  } else if (provider === 'mysql') {
    log('1. تأكد أن DATABASE_URL في .env يشير لـ MySQL', colors.green)
    log('   مثال: DATABASE_URL=mysql://user:pass@localhost:3306/dbname', colors.green)
    log('2. شغّل: bun run db:generate', colors.green)
    log('3. شغّل: bun run db:push', colors.green)
  }

  log('\n💡 لتشغيل النظام بعد التبديل:', colors.blue)
  log('   bun run start:all', colors.green)
}

main().catch((e) => {
  log(`\n❌ خطأ: ${e.message}`, colors.red)
  process.exit(1)
})
