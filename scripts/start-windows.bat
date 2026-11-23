@echo off
chcp 65001 >nul
title مطعم التكية - نظام الحسابات

echo.
echo 🚀 تشغيل نظام مطعم التكية - أبو أمنة الشعبي
echo ═══════════════════════════════════════════════
echo.

REM التحقق من تثبيت Bun
where bun >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ Bun غير مثبت. جاري التثبيت...
    echo.
    powershell -Command "irm bun.sh/install.ps1 | iex"
    if %errorlevel% neq 0 (
        echo ❌ فشل تثبيت Bun تلقائياً
        echo ثبّته يدوياً من: https://bun.sh
        pause
        exit /b 1
    )
    echo ✅ تم تثبيت Bun
    echo.
    REM تحديث PATH
    set "PATH=%USERPROFILE%\.bun\bin;%PATH%"
)

REM التحقق من وجود node_modules
if not exist "node_modules" (
    echo 📦 تثبيت المكتبات (أول مرة)...
    call bun install
    if %errorlevel% neq 0 (
        echo ❌ فشل تثبيت المكتبات
        pause
        exit /b 1
    )
    echo ✅ تم تثبيت المكتبات
    echo.
)

REM التحقق من وجود قاعدة البيانات
if not exist "db\custom.db" (
    echo 🗄️ إنشاء قاعدة البيانات...
    call bun run db:push
    echo ✅ تم إنشاء قاعدة البيانات
    echo.
)

REM إنشاء مجلدات ضرورية
if not exist "db" mkdir db
if not exist "public\uploads" mkdir public\uploads
if not exist "backups" mkdir backups

REM الحصول على عنوان IP
echo 📍 جاري اكتشاف عنوان IP...
echo.
ipconfig | findstr /i "IPv4"
echo.

echo ═══════════════════════════════════════════════
echo ✅ النظام جاهز للعمل!
echo.
echo 📍 عناوين الوصول:
echo    • على هذا الجهاز:    http://localhost:3000
echo    • من هاتف على WiFi: http://YOUR_IP:3000  (انظر عنوان IPv4 أعلاه)
echo    • المنيو العام:      http://YOUR_IP:3000/menu
echo    • صفحة QR:           http://localhost:3000/qrcode
echo.
echo 🔐 بيانات الدخول:
echo    اسم المستخدم: admin
echo    كلمة المرور:   admin123
echo.
echo 💡 لإيقاف النظام: اضغط Ctrl+C
echo ═══════════════════════════════════════════════
echo.

REM تشغيل النظام
call bun run dev
pause
