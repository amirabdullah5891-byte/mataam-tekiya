#!/bin/bash
# سكريبت تشغيل نظام مطعم التكية - أبو أمنة الشعبي
# الاستخدام: ./start.sh

set -e

cd "$(dirname "$0")/.."

echo ""
echo "🚀 تشغيل نظام مطعم التكية - أبو أمنة الشعبي"
echo "═══════════════════════════════════════════════"
echo ""

# التحقق من تثبيت Bun
if ! command -v bun &> /dev/null; then
    echo "❌ Bun غير مثبت. جاري التثبيت..."
    curl -fsSL https://bun.sh/install | bash
    export PATH="$HOME/.bun/bin:$PATH"
    echo "✅ تم تثبيت Bun"
    echo ""
fi

# التحقق من وجود node_modules
if [ ! -d "node_modules" ]; then
    echo "📦 تثبيت المكتبات (أول مرة)..."
    bun install
    echo "✅ تم تثبيت المكتبات"
    echo ""
fi

# التحقق من وجود قاعدة البيانات
if [ ! -f "db/custom.db" ]; then
    echo "🗄️ إنشاء قاعدة البيانات..."
    bun run db:push
    echo "✅ تم إنشاء قاعدة البيانات"
    echo ""
fi

# إنشاء مجلدات ضرورية
mkdir -p db public/uploads backups

# الحصول على عنوان IP
LOCAL_IP=$(hostname -I 2>/dev/null | awk '{print $1}' || ip route get 1.1.1.1 2>/dev/null | awk '{print $7}' || echo "127.0.0.1")

echo "═══════════════════════════════════════════════"
echo "✅ النظام جاهز للعمل!"
echo ""
echo "📍 عناوين الوصول:"
echo "   • على هذا الجهاز:    http://localhost:3000"
echo "   • من هاتف على WiFi: http://${LOCAL_IP}:3000"
echo "   • المنيو العام:      http://${LOCAL_IP}:3000/menu"
echo "   • صفحة QR:           http://${LOCAL_IP}:3000/qrcode"
echo ""
echo "🔐 بيانات الدخول:"
echo "   اسم المستخدم: admin"
echo "   كلمة المرور:   admin123"
echo ""
echo "💡 لإيقاف النظام: اضغط Ctrl+C"
echo "═══════════════════════════════════════════════"
echo ""

# تشغيل النظام
exec bun run dev
