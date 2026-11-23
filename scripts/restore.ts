#!/usr/bin/env bun
// سكريبت استرجاع نسخة احتياطية
// الاستخدام: bun run scripts/restore.ts <backup-name>
// مثال: bun run scripts/restore.ts backup-2026-11-23-12-03-25

import { copyFile, readdir, stat, existsSync, mkdir } from 'fs/promises'
import path from 'path'

const PROJECT_DIR = path.resolve(process.cwd())
const BACKUPS_DIR = path.join(PROJECT_DIR, 'backups')
const DB_PATH = path.join(PROJECT_DIR, 'db', 'custom.db')
const UPLOADS_DIR = path.join(PROJECT_DIR, 'public', 'uploads')

async function main() {
  const backupName = process.argv[2]
  if (!backupName) {
    // عرض آخر 5 نسخ احتياطية
    if (!existsSync(BACKUPS_DIR)) {
      console.log('لا توجد نسخ احتياطية')
      process.exit(1)
    }
    const entries = await readdir(BACKUPS_DIR)
    const backups = []
    for (const entry of entries) {
      const stats = await stat(path.join(BACKUPS_DIR, entry))
      if (stats.isDirectory() && entry.startsWith('backup-')) {
        backups.push({ name: entry, date: stats.mtime })
      }
    }
    backups.sort((a, b) => b.date.getTime() - a.date.getTime())
    console.log('\nالنسخ الاحتياطية المتاحة:')
    for (const b of backups.slice(0, 10)) {
      console.log(`  ${b.name}  (${b.date.toLocaleString()})`)
    }
    console.log('\nلاسترجاع نسخة: bun run scripts/restore.ts <backup-name>')
    process.exit(0)
  }

  const backupDir = path.join(BACKUPS_DIR, backupName)
  if (!existsSync(backupDir)) {
    console.error(`النسخة غير موجودة: ${backupName}`)
    process.exit(1)
  }

  console.log(`\nاسترجاع النسخة: ${backupName}`)
  console.log('تحذير: سيتم استبدال البيانات الحالية!')
  console.log('اضغط Ctrl+C خلال 5 ثوانٍ للإلغاء...')
  await new Promise((r) => setTimeout(r, 5000))

  // استرجاع قاعدة البيانات
  const dbBackup = path.join(backupDir, 'database.db')
  if (existsSync(dbBackup)) {
    await copyFile(dbBackup, DB_PATH)
    console.log('✓ تم استرجاع قاعدة البيانات')
  }

  // استرجاع الصور
  const uploadsBackup = path.join(backupDir, 'uploads')
  if (existsSync(uploadsBackup)) {
    if (!existsSync(UPLOADS_DIR)) {
      await mkdir(UPLOADS_DIR, { recursive: true })
    }
    const files = await readdir(uploadsBackup)
    for (const file of files) {
      await copyFile(path.join(uploadsBackup, file), path.join(UPLOADS_DIR, file))
    }
    console.log(`✓ تم استرجاع ${files.length} صورة`)
  }

  console.log('\n✓ اكتمل الاسترجاع. أعد تشغيل الخادم.')
}

main().catch((err) => {
  console.error('✗ فشل الاسترجاع:', err)
  process.exit(1)
})
