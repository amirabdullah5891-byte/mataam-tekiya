#!/usr/bin/env bun
// سكريبت موحد لإنشاء اختصار على سطح المكتب - يكتشف نظام التشغيل تلقائياً
// الاستخدام: bun run install:shortcut

import { spawn } from 'child_process'
import path from 'path'

const PROJECT_DIR = process.cwd()
const platform = process.platform

async function main() {
  console.log('\n📌 إنشاء اختصار على سطح المكتب')
  console.log('═══════════════════════════════════════════════\n')

  if (platform === 'win32') {
    // ويندوز
    const scriptPath = path.join(PROJECT_DIR, 'scripts', 'install-desktop-shortcut-windows.bat')
    console.log(`🔄 تشغيل سكريبت ويندوز...`)
    const child = spawn('cmd', ['/c', scriptPath], { stdio: 'inherit' })
    child.on('close', (code) => process.exit(code || 0))
  } else if (platform === 'linux' || platform === 'darwin') {
    // لينكس أو ماك
    const scriptPath = path.join(PROJECT_DIR, 'scripts', 'install-desktop-shortcut-linux.sh')
    console.log(`🔄 تشغيل سكريبت ${platform}...`)
    const child = spawn('bash', [scriptPath], { stdio: 'inherit' })
    child.on('close', (code) => process.exit(code || 0))
  } else {
    console.log(`❌ نظام التشغيل غير مدعوم: ${platform}`)
    process.exit(1)
  }
}

main()
