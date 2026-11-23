@echo off
chcp 65001 >nul
title مطعم التكية - تشغيل النظام

REM سكريبت تشغيل سريع - يبدأ النظام ويفتح المتصفح تلقائياً
REM يُستخدم كاختصار على سطح المكتب

cd /d "%~dp0\.."

REM التحقق من تشغيل الخادم
curl -s -o nul http://localhost:3000 2>nul
if %errorlevel% neq 0 (
    echo 🚀 بدء تشغيل النظام...
    start /min cmd /c "bun run dev"
    
    REM انتظار بدء الخادم
    echo ⏳ جاري التحضير...
    timeout /t 8 /nobreak >nul
)

REM فتح المتصفح في وضع ملء الشاشة (Chrome)
echo 🌐 فتح النظام...
start "" "http://localhost:3000"

exit
