#!/usr/bin/env bun
// سكريبت التشغيل الشامل - يبدأ النظام ويكتشف عنوان IP للشبكة المحلية
// الاستخدام: bun run start:all

import { networkInterfaces } from 'os'
import { existsSync, mkdirSync } from 'fs'
import { execSync, spawn } from 'child_process'
import path from 'path'

const PROJECT_DIR = process.cwd()

// الحصول على عنوان IP للشبكة المحلية (WiFi/LAN)
function getLocalIP(): string {
  const nets = networkInterfaces()
  for (const name of Object.keys(nets)) {
    for (const net of nets[name] || []) {
      // تخطي العناوين الداخلية وIPv6
      if (net.family === 'IPv4' && !net.internal) {
        return net.address
      }
    }
  }
  return '127.0.0.1'
}

// التحقق من تثبيت Bun
function checkBun(): boolean {
  try {
    execSync('bun --version', { stdio: 'ignore' })
    return true
  } catch {
    return false
  }
}

// التحقق من وجود node_modules
function checkDependencies(): boolean {
  return existsSync(path.join(PROJECT_DIR, 'node_modules'))
}

// التحقق من وجود قاعدة البيانات
function checkDatabase(): boolean {
  return existsSync(path.join(PROJECT_DIR, 'db', 'custom.db'))
}

// فحص المنفذ
function isPortInUse(port: number): boolean {
  try {
    execSync(`lsof -i :${port} 2>/dev/null || netstat -tuln | grep :${port}`)
    return true
  } catch {
    return false
  }
}

async function main() {
  console.log('\n🚀 تشغيل نظام مطعم التكية - أبو أمنة الشعبي')
  console.log('═══════════════════════════════════════════\n')

  // 1. التحقق من Bun
  if (!checkBun()) {
    console.log('❌ Bun غير مثبت. جاري التثبيت...')
    try {
      execSync('curl -fsSL https://bun.sh/install | bash', { stdio: 'inherit' })
      console.log('✅ تم تثبيت Bun')
    } catch {
      console.log('❌ فشل تثبيت Bun. ثبّته يدوياً من: https://bun.sh')
      process.exit(1)
    }
  }

  // 2. التحقق من المكتبات
  if (!checkDependencies()) {
    console.log('📦 تثبيت المكتبات (أول مرة)...')
    try {
      execSync('bun install', { stdio: 'inherit', cwd: PROJECT_DIR })
      console.log('✅ تم تثبيت المكتبات')
    } catch {
      console.log('❌ فشل تثبيت المكتبات')
      process.exit(1)
    }
  }

  // 3. التحقق من قاعدة البيانات
  if (!checkDatabase()) {
    console.log('🗄️ إنشاء قاعدة البيانات...')
    try {
      execSync('bun run db:push', { stdio: 'inherit', cwd: PROJECT_DIR })
      console.log('✅ تم إنشاء قاعدة البيانات')
    } catch {
      console.log('❌ فشل إنشاء قاعدة البيانات')
      process.exit(1)
    }
  }

  // 4. إنشاء مجلدات ضرورية
  const dirs = ['db', 'public/uploads', 'backups']
  for (const dir of dirs) {
    const fullPath = path.join(PROJECT_DIR, dir)
    if (!existsSync(fullPath)) {
      mkdirSync(fullPath, { recursive: true })
    }
  }

  // 5. فحص المنفذ 3000
  if (isPortInUse(3000)) {
    console.log('⚠️  المنفذ 3000 مستخدم. جاري إيقاف العملية السابقة...')
    try {
      execSync('pkill -f "next dev" || pkill -f "next-server"', { stdio: 'ignore' })
      await new Promise(r => setTimeout(r, 2000))
    } catch {
      // تجاهل
    }
  }

  // 6. الحصول على عنوان IP
  const localIP = getLocalIP()
  console.log('\n═══════════════════════════════════════════')
  console.log('✅ النظام جاهز للعمل!\n')
  console.log('📍 عناوين الوصول:')
  console.log(`   • على هذا الجهاز:    http://localhost:3000`)
  console.log(`   • من هاتف على WiFi: http://${localIP}:3000`)
  console.log(`   • المنيو العام:      http://${localIP}:3000/menu`)
  console.log(`   • صفحة QR:           http://${localIP}:3000/qrcode`)
  console.log('\n🔐 بيانات الدخول الافتراضية:')
  console.log('   اسم المستخدم: admin')
  console.log('   كلمة المرور:   admin123')
  console.log('\n💡 لإيقاف النظام: اضغط Ctrl+C')
  console.log('═══════════════════════════════════════════\n')

  // 7. تشغيل خادم التطوير
  const isProduction = process.env.NODE_ENV === 'production'
  const command = isProduction ? 'start' : 'dev'

  const child = spawn('bun', ['run', command], {
    cwd: PROJECT_DIR,
    stdio: 'inherit',
    env: { ...process.env, HOSTNAME: '0.0.0.0' },
  })

  child.on('close', (code) => {
    console.log(`\n تم إيقاف النظام (كود: ${code})`)
    process.exit(code || 0)
  })

  // التعامل مع Ctrl+C
  process.on('SIGINT', () => {
    console.log('\n⏹️  جاري إيقاف النظام...')
    child.kill('SIGINT')
    process.exit(0)
  })
}

main().catch((err) => {
  console.error('❌ خطأ:', err)
  process.exit(1)
})
