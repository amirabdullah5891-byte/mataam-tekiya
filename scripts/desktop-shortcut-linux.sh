#!/bin/bash
# سكريبت تشغيل سريع - يبدأ النظام ويفتح المتصفح تلقائياً
# يُستخدم كاختصار على سطح المكتب

cd "$(dirname "$0")/.."

# التحقق من تشغيل الخادم
if ! curl -s -o /dev/null http://localhost:3000 2>/dev/null; then
    echo "🚀 بدء تشغيل النظام..."
    # تشغيل الخادم في الخلفية
    nohup bun run dev > /dev/null 2>&1 &
    
    # انتظار بدء الخادم
    echo "⏳ جاري التحضير..."
    sleep 8
fi

# فتح المتصفح
echo "🌐 فتح النظام..."
URL="http://localhost:3000"

# محاولة فتح المتصفح المناسب
if command -v xdg-open &> /dev/null; then
    xdg-open "$URL" 2>/dev/null
elif command -v google-chrome &> /dev/null; then
    google-chrome --app="$URL" 2>/dev/null &
elif command -v chromium &> /dev/null; then
    chromium --app="$URL" 2>/dev/null &
elif command -v firefox &> /dev/null; then
    firefox "$URL" 2>/dev/null &
fi

exit
