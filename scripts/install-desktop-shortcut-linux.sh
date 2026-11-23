#!/bin/bash
# إنشاء اختصار على سطح المكتب - لينكس/ماك
# يُنشئ ملف .desktop على سطح المكتب

set -e

cd "$(dirname "$0")/.."
PROJECT_DIR="$(pwd)"
DESKTOP_DIR="${HOME}/Desktop"
[ ! -d "$DESKTOP_DIR" ] && DESKTOP_DIR="${HOME}/ سطح المكتب"
mkdir -p "$DESKTOP_DIR"

SHORTCUT_PATH="$DESKTOP_DIR/mataam-tekiya.desktop"

cat > "$SHORTCUT_PATH" << EOF
[Desktop Entry]
Version=1.0
Type=Application
Name=مطعم التكية
Name[ar]=مطعم التكية
Comment=نظام حسابات مطعم التكية - أبو أمنة الشعبي
Comment[ar]=نظام حسابات مطعم التكية - أبو أمنة الشعبي
Exec=bash ${PROJECT_DIR}/scripts/desktop-shortcut-linux.sh
Icon=${PROJECT_DIR}/public/icon-192.png
Terminal=false
Categories=Office;Finance;
StartupNotify=true
EOF

chmod +x "$SHORTCUT_PATH"
chmod +x "${PROJECT_DIR}/scripts/desktop-shortcut-linux.sh"

echo "✅ تم إنشاء اختصار على سطح المكتب"
echo "📍 الموقع: $SHORTCUT_PATH"
echo ""
echo "💡 طريقة الاستخدام:"
echo "   دبل كلك على أيقونة 'مطعم التكية' على سطح المكتب"
echo "   سيبدأ النظام تلقائياً ويفتح المتصفح"
