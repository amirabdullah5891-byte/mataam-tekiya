@echo off
chcp 65001 >nul
title إنشاء اختصار على سطح المكتب - مطعم التكية

echo.
echo 📌 إنشاء اختصار على سطح المكتب
echo ════════════════════════════════════════════════
echo.

REM تحديد مسار سطح المكتب
set "DESKTOP=%USERPROFILE%\Desktop"
if not exist "%DESKTOP%" set "DESKTOP=%USERPROFILE%\OneDrive\Desktop"
if not exist "%DESKTOP%" set "DESKTOP=%USERPROFILE%\سطح المكتب"

REM مسار المشروع (مجلد أعلى من السكريبت)
set "PROJECT_DIR=%~dp0.."
set "PROJECT_DIR=%PROJECT_DIR:~0,-1%"

REM إنشاء اختصار VBS لتوليد .lnk
set "VBS_SCRIPT=%TEMP%\create_shortcut.vbs"
echo Set WshShell = WScript.CreateObject("WScript.Shell") > "%VBS_SCRIPT%"
echo Set shortcut = WshShell.CreateShortcut("%DESKTOP%\مطعم التكية.lnk") >> "%VBS_SCRIPT%"
echo shortcut.TargetPath = "%PROJECT_DIR%\scripts\desktop-shortcut-windows.bat" >> "%VBS_SCRIPT%"
echo shortcut.WorkingDirectory = "%PROJECT_DIR%" >> "%VBS_SCRIPT%"
echo shortcut.IconLocation = "%PROJECT_DIR%\public\icon-192.png" >> "%VBS_SCRIPT%"
echo shortcut.Description = "تشغيل نظام مطعم التكية - أبو أمنة الشعبي" >> "%VBS_SCRIPT%"
echo shortcut.WindowStyle = 7 >> "%VBS_SCRIPT%"
echo shortcut.Save >> "%VBS_SCRIPT%"

cscript //nologo "%VBS_SCRIPT%"
del "%VBS_SCRIPT%"

if exist "%DESKTOP%\مطعم التكية.lnk" (
    echo ✅ تم إنشاء اختصار "مطعم التكية" على سطح المكتب
    echo.
    echo 📍 موقع الاختصار: %DESKTOP%\مطعم التكية.lnk
    echo.
    echo 💡 طريقة الاستخدام:
    echo    1. دبل كلك على أيقونة "مطعم التكية" على سطح المكتب
    echo    2. سيبدأ النظام تلقائياً
    echo    3. سيفتح المتصفح على النظام
    echo.
) else (
    echo ❌ فشل إنشاء الاختصار
    echo يمكنك إنشاؤه يدوياً:
    echo    1. كليك يمين على scripts\desktop-shortcut-windows.bat
    echo    2. اختر "إرسال إلى" ^> "سطح المكتب (إنشاء اختصار)"
)

echo ════════════════════════════════════════════════
pause
