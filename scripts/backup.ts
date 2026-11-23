#!/usr/bin/env bun
// سكريبت النسخ الاحتياطي التلقائي لقاعدة البيانات والصور
// الاستخدام: bun run scripts/backup.ts
//
// لإعداد النسخ الاحتياطي التلقائي (cron):
// 0 2 * * * cd /path/to/project && bun run scripts/backup.ts >> backups/backup.log 2>&1
// هذا يشغّل النسخ كل يوم الساعة 2:00 صباحاً

import { copyFile, mkdir, readdir, stat, rm } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'

const PROJECT_DIR = path.resolve(process.cwd())
const BACKUPS_DIR = path.join(PROJECT_DIR, 'backups')
const DB_PATH = path.join(PROJECT_DIR, 'db', 'custom.db')
const UPLOADS_DIR = path.join(PROJECT_DIR, 'public', 'uploads')

// الاحتفاظ بآخر 30 نسخة احتياطية
const MAX_BACKUPS = 30

function timestamp(): string {
  const now = new Date()
  return now.toISOString().slice(0, 19).replace(/[T:]/g, '-').slice(0, 19)
}

async function main() {
  console.log(`\n[${new Date().toISOString()}] بدء النسخ الاحتياطي...`)
  
  // إنشاء مجلد النسخ الاحتياطية إن لم يوجد
  if (!existsSync(BACKUPS_DIR)) {
    await mkdir(BACKUPS_DIR, { recursive: true })
  }

  const backupName = `backup-${timestamp()}`
  const backupDir = path.join(BACKUPS_DIR, backupName)
  await mkdir(backupDir, { recursive: true })

  // 1. نسخ قاعدة البيانات
  if (existsSync(DB_PATH)) {
    const dbBackup = path.join(backupDir, 'database.db')
    await copyFile(DB_PATH, dbBackup)
    const stats = await stat(dbBackup)
    console.log(`✓ تم نسخ قاعدة البيانات: ${(stats.size / 1024).toFixed(2)} KB`)
  } else {
    console.log('⚠ تحذير: قاعدة البيانات غير موجودة')
  }

  // 2. نسخ الصور المرفوعة
  if (existsSync(UPLOADS_DIR)) {
    const uploadsBackup = path.join(backupDir, 'uploads')
    await mkdir(uploadsBackup, { recursive: true })
    const files = await readdir(UPLOADS_DIR)
    let copiedImages = 0
    for (const file of files) {
      const src = path.join(UPLOADS_DIR, file)
      const dst = path.join(uploadsBackup, file)
      const fileStat = await stat(src)
      if (fileStat.isFile()) {
        await copyFile(src, dst)
        copiedImages++
      }
    }
    console.log(`✓ تم نسخ ${copiedImages} صورة مرفوعة`)
  }

  // 3. نسخ ملف البيئة
  const envPath = path.join(PROJECT_DIR, '.env')
  if (existsSync(envPath)) {
    await copyFile(envPath, path.join(backupDir, 'env.backup'))
    console.log('✓ تم نسخ ملف البيئة')
  }

  // 4. كتابة معلومات النسخة
  const manifest = {
    timestamp: new Date().toISOString(),
    version: '2.0',
    files: ['database.db', 'uploads/', 'env.backup'],
  }
  const { writeFile } = await import('fs/promises')
  await writeFile(
    path.join(backupDir, 'manifest.json'),
    JSON.stringify(manifest, null, 2)
  )

  console.log(`✓ اكتمل النسخ الاحتياطي: ${backupName}`)

  // 5. تنظيف النسخ القديمة
  await cleanOldBackups()

  console.log(`[${new Date().toISOString()}] اكتمل بنجاح\n`)
}

async function cleanOldBackups() {
  if (!existsSync(BACKUPS_DIR)) return
  const entries = await readdir(BACKUPS_DIR)
  const backupDirs = []
  for (const entry of entries) {
    const fullPath = path.join(BACKUPS_DIR, entry)
    const stats = await stat(fullPath)
    if (stats.isDirectory() && entry.startsWith('backup-')) {
      backupDirs.push({ name: entry, path: fullPath, mtime: stats.mtime })
    }
  }
  // ترتيب من الأقدم للأحدث
  backupDirs.sort((a, b) => a.mtime.getTime() - b.mtime.getTime())

  // حذف النسخ القديمة الزائدة
  const toDelete = backupDirs.slice(0, Math.max(0, backupDirs.length - MAX_BACKUPS))
  for (const backup of toDelete) {
    await rm(backup.path, { recursive: true, force: true })
    console.log(`✓ تم حذف نسخة قديمة: ${backup.name}`)
  }
  if (toDelete.length > 0) {
    console.log(`✓ تم تنظيف ${toDelete.length} نسخة قديمة`)
  }
}

main().catch((err) => {
  console.error('✗ فشل النسخ الاحتياطي:', err)
  process.exit(1)
})
