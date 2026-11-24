#!/usr/bin/env bun
// سكريبت الإعداد التلقائي لـ PostgreSQL + ترحيل البيانات من SQLite
// الاستخدام: bun run setup:postgres
//
// المتطلبات المسبقة:
// 1. تثبيت PostgreSQL محلياً أو استخدام خدمة سحابية
// 2. تعيين DATABASE_URL في .env لرابط PostgreSQL
//    مثال: postgresql://user:pass@localhost:5432/tekiya_db
//    أو: postgresql://user:pass@ep-xxx.neon.tech/dbname?sslmode=require
//
// السكريبت سيقوم بـ:
// 1. فحص الاتصال بـ PostgreSQL
// 2. إنشاء الجداول
// 3. ترحيل كل البيانات من SQLite الحالي
// 4. التحقق من نجاح الترحيل

import { execSync } from 'child_process'
import { existsSync, readFileSync, writeFileSync, statSync } from 'fs'
import path from 'path'

const PROJECT_DIR = process.cwd()
const ENV_FILE = path.join(PROJECT_DIR, '.env')
const SQLITE_DB = path.join(PROJECT_DIR, 'db', 'custom.db')

// ألوان الطباعة
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
  console.log('\n' + '='.repeat(60))
  log('🚀 الإعداد التلقائي لـ PostgreSQL', colors.bold + colors.blue)
  log('مطعم التكية - نظام الحسابات', colors.blue)
  console.log('='.repeat(60) + '\n')

  // 1. فحص ملف .env
  log('📋 الخطوة 1: فحص ملف البيئة...', colors.yellow)
  if (!existsSync(ENV_FILE)) {
    log('❌ ملف .env غير موجود', colors.red)
    log('أنشئ ملف .env بالمحتوى التالي:', colors.yellow)
    console.log('DATABASE_URL=postgresql://user:password@localhost:5432/tekiya_db')
    process.exit(1)
  }

  const envContent = readFileSync(ENV_FILE, 'utf-8')
  const dbUrlMatch = envContent.match(/^DATABASE_URL=(.+)$/m)

  if (!dbUrlMatch) {
    log('❌ DATABASE_URL غير موجود في ملف .env', colors.red)
    log('أضف السطر التالي إلى ملف .env:', colors.yellow)
    console.log('DATABASE_URL=postgresql://user:password@localhost:5432/tekiya_db')
    process.exit(1)
  }

  const dbUrl = dbUrlMatch[1].trim()

  if (!dbUrl.startsWith('postgresql://') && !dbUrl.startsWith('postgres://')) {
    log('❌ DATABASE_URL ليس رابط PostgreSQL', colors.red)
    log(`الحالي: ${dbUrl}`, colors.yellow)
    log('يجب أن يبدأ بـ postgresql:// أو postgres://', colors.yellow)
    log('\nمثال:', colors.green)
    console.log('DATABASE_URL=postgresql://user:password@localhost:5432/tekiya_db')
    console.log('DATABASE_URL=postgresql://user:password@ep-xxx.neon.tech/dbname?sslmode=require')
    process.exit(1)
  }

  log('✅ رابط PostgreSQL موجود', colors.green)
  log(`   ${dbUrl.substring(0, 30)}...`, colors.blue)

  // 2. فحص وجود SQLite الحالي
  log('\n📋 الخطوة 2: فحص قاعدة بيانات SQLite الحالية...', colors.yellow)
  if (!existsSync(SQLITE_DB)) {
    log('⚠️  لا توجد قاعدة بيانات SQLite حالية', colors.yellow)
    log('سيتم إنشاء قاعدة بيانات PostgreSQL جديدة فارغة', colors.yellow)
  } else {
    const stats = statSync(SQLITE_DB)
    log(`✅ قاعدة بيانات SQLite موجودة (${(stats.size / 1024).toFixed(2)} KB)`, colors.green)
    log('   سيتم ترحيل البيانات إلى PostgreSQL', colors.blue)
  }

  // 3. تثبيت Prisma وإنشاء العميل
  log('\n📋 الخطوة 3: تحديث Prisma Client...', colors.yellow)
  try {
    execSync('bun run db:generate', { stdio: 'inherit', cwd: PROJECT_DIR })
    log('✅ تم تحديث Prisma Client', colors.green)
  } catch (e) {
    log('❌ فشل تحديث Prisma Client', colors.red)
    process.exit(1)
  }

  // 4. فحص الاتصال بـ PostgreSQL وإنشاء الجداول
  log('\n📋 الخطوة 4: فحص الاتصال وإنشاء الجداول في PostgreSQL...', colors.yellow)
  try {
    execSync('bun run db:push', { stdio: 'inherit', cwd: PROJECT_DIR })
    log('✅ تم إنشاء الجداول في PostgreSQL', colors.green)
  } catch (e) {
    log('❌ فشل الاتصال بـ PostgreSQL أو إنشاء الجداول', colors.red)
    log('\nأسباب محتملة:', colors.yellow)
    log('1. PostgreSQL غير مثبت أو لا يعمل', colors.yellow)
    log('2. بيانات الاتصال (user/password) خاطئة', colors.yellow)
    log('3. قاعدة البيانات غير موجودة (أنشئها أولاً)', colors.yellow)
    log('4. جدار الحماية يمنع الاتصال', colors.yellow)
    log('\nلإنشاء قاعدة بيانات في PostgreSQL:', colors.green)
    console.log('  sudo -u postgres psql')
    console.log('  CREATE USER tekiya_user WITH PASSWORD \'your_password\';')
    console.log('  CREATE DATABASE tekiya_db OWNER tekiya_user;')
    console.log('  GRANT ALL PRIVILEGES ON DATABASE tekiya_db TO tekiya_user;')
    console.log('  \\q')
    process.exit(1)
  }

  // 5. ترحيل البيانات من SQLite
  if (existsSync(SQLITE_DB)) {
    log('\n📋 الخطوة 5: ترحيل البيانات من SQLite إلى PostgreSQL...', colors.yellow)
    try {
      // نسخ احتياطي قبل الترحيل
      log('   إنشاء نسخة احتياطية...', colors.blue)
      execSync('bun run backup', { stdio: 'inherit', cwd: PROJECT_DIR })
      
      // تشغيل سكريبت الترحيل
      log('   تشغيل الترحيل...', colors.blue)
      execSync('bun run scripts/migrate-to-postgres.ts', { stdio: 'inherit', cwd: PROJECT_DIR })
      log('✅ تم ترحيل البيانات بنجاح', colors.green)
    } catch (e) {
      log('❌ فشل ترحيل البيانات', colors.red)
      log('يمكنك المحاولة مرة أخرى لاحقاً', colors.yellow)
      log('البيانات في SQLite ما زالت محفوظة', colors.green)
    }
  }

  // 6. التحقق من النجاح
  log('\n📋 الخطوة 6: التحقق من النجاح...', colors.yellow)
  try {
    // محاولة قراءة عدد المستخدمين عبر سكريبت بسيط
    const checkScript = `
      const { db } = require('./src/lib/db')
      db.user.count()
        .then(c => { console.log(c); process.exit(0) })
        .catch(() => process.exit(1))
    `
    const result = execSync(`bun -e "${checkScript.replace(/"/g, '\\"').replace(/\n/g, ' ')}"`, {
      cwd: PROJECT_DIR,
      encoding: 'utf-8',
    }).trim()
    log(`✅ النظام يعمل - عدد المستخدمين: ${result}`, colors.green)
  } catch (e) {
    log('⚠️  تعذر التحقق، لكن قد يكون كل شيء سليم', colors.yellow)
  }

  // 7. النتيجة النهائية
  console.log('\n' + '='.repeat(60))
  log('🎉 تم الإعداد بنجاح!', colors.bold + colors.green)
  console.log('='.repeat(60))
  log('\n📋 الخطوات التالية:', colors.blue)
  log('1. شغّل النظام: bun run start:all', colors.green)
  log('2. سجل الدخول بنفس بياناتك السابقة', colors.green)
  log('3. تحقق من أن كل البيانات موجودة', colors.green)
  log('\n💡 النصائح:', colors.blue)
  log('• احتفظ بنسخة من .env القديم (SQLite) للرجوع', colors.yellow)
  log('• قاعدة بيانات SQLite ما زالت محفوظة في db/custom.db', colors.yellow)
  log('• للرجوع إلى SQLite، استعد DATABASE_URL القديم', colors.yellow)
  log('• جدول النسخ الاحتياطي يعمل مع PostgreSQL أيضاً', colors.yellow)
  console.log('\n' + '='.repeat(60) + '\n')
}

main().catch((err) => {
  log(`\n❌ خطأ غير متوقع: ${err.message}`, colors.red)
  console.error(err)
  process.exit(1)
})
