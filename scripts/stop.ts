#!/usr/bin/env bun
// إيقاف النظام - يغلق جميع عمليات Next.js
// الاستخدام: bun run stop

import { execSync } from 'child_process'

try {
  execSync('pkill -f "next dev" 2>/dev/null; pkill -f "next-server" 2>/dev/null; pkill -f "next dev -p 3000" 2>/dev/null', { stdio: 'ignore' })
  console.log('✅ تم إيقاف النظام بنجاح')
} catch {
  console.log('ℹ️  لا توجد عمليات قيد التشغيل')
}

// فحص المنفذ
try {
  execSync('lsof -i :3000 2>/dev/null || netstat -tuln 2>/dev/null | grep :3000', { stdio: 'ignore' })
  console.log('⚠️  المنفذ 3000 لا يزال مستخدماً. قد تحتاج لإيقاف العملية يدوياً')
} catch {
  console.log('✅ المنفذ 3000 متاح الآن')
}
