# 🚀 دليل النشر على Vercel

## المتطلبات

1. حساب GitHub (مجاني)
2. حساب Vercel (مجاني - يسجل عبر GitHub)
3. رابط قاعدة بيانات PostgreSQL (لديك بالفعل على Neon)

---

## الخطوة 1: إنشاء حساب GitHub

1. اذهب إلى: https://github.com/signup
2. سجل بحسابك (اسم، بريد، كلمة مرور)
3. تأكد من تفعيل البريد الإلكتروني

---

## الخطوة 2: إنشاء مستودع (Repository) جديد

1. بعد الدخول لـ GitHub، اضغط **"+"** في الأعلى → **"New repository"**
2. اسم المستودع: `mataam-tekiya`
3. اختر **Private** (خاص)
4. ✅ فعّل **"Add a README file"**
5. اضغط **"Create repository"**

---

## الخطوة 3: رفع المشروع إلى GitHub

### الطريقة الأسهل: رفع الملفات يدوياً

1. حمّل ملف: [mataam-tekiya-vercel.zip](mataam-tekiya-vercel.zip)
2. فك الضغط على جهازك
3. ادخل لمستودع GitHub الذي أنشأته
4. اضغط **"Add file"** → **"Upload files"**
5. اسحب كل الملفات (من داخل مجلد `my-project`)
6. اضغط **"Commit changes"**

### الطريقة الاحترافية: عبر Git

```bash
# فك الضغط
unzip mataam-tekiya-vercel.zip
cd my-project

# تهيئة Git
git init
git add .
git commit -m "نظام مطعم التكية - جاهز للنشر"

# ربط بـ GitHub (استبدل USERNAME باسمك)
git remote add origin https://github.com/USERNAME/mataam-tekiya.git
git branch -M main
git push -u origin main
```

---

## الخطوة 4: التسجيل في Vercel

1. اذهب إلى: https://vercel.com
2. اضغط **"Sign Up"**
3. اختر **"Continue with GitHub"**
4. اسمح لـ Vercel بالوصول لحساب GitHub

---

## الخطوة 5: استيراد المشروع

1. في لوحة Vercel، اضغط **"Add New"** → **"Project"**
2. ستجد مستودع `mataam-tekiya` في القائمة
3. اضغط **"Import"** بجانبه

---

## الخطوة 6: إعداد المتغيرات البيئية (مهم جداً!)

قبل النشر، أضف متغير البيئة:

1. في صفحة الإعداد، انزل لقسم **"Environment Variables"**
2. اضغط **"Add"**
3. أدخل:
   - **Key**: `DATABASE_URL`
   - **Value**: `postgresql://neondb_owner:npg_7JRbxOcNowh8@ep-jolly-pine-bd9trp60-pooler.c-8.us-east-2.aws.neon.tech/neondb?sslmode=require`
4. تأكد أن **"All Environments"** محدد
5. اضغط **"Add"**

---

## الخطوة 7: النشر!

1. اضغط **"Deploy"**
2. انتظر 2-3 دقائق (سيتم بناء المشروع)
3. عند الانتهاء، ستحصل على رابط مثل:
   ```
   https://mataam-tekiya.vercel.app
   ```

---

## الخطوة 8: اختبار الموقع

1. افتح الرابط في المتصفح
2. سجل الدخول:
   - اسم المستخدم: `admin`
   - كلمة المرور: `admin123`
3. تحقق من أن كل البيانات موجودة

---

## الخطوة 9 (اختياري): ربط نطاق خاص

### شراء نطاق:
1. اذهب إلى: https://www.namecheap.com أو https://www.godaddy.com
2. ابحث عن نطاق مثل: `mataam-tekiya.com`
3. اشتره (~$10-15/سنة)

### ربطه بـ Vercel:
1. في لوحة Vercel، اذهب للمشروع → **"Settings"** → **"Domains"**
2. اضغط **"Add"**
3. أدخل النطاق: `mataam-tekiya.com`
4. اتبع التعليمات لتحديث DNS عند مسجل النطاق:
   - أضف سجل **CNAME**:
     - Name: `www`
     - Value: `cname.vercel-dns.com`
   - أضف سجل **A**:
     - Name: `@`
     - Value: `76.76.21.21`

---

## ⚠️ ملاحظات مهمة

### 1. متغير البيئة DATABASE_URL
**لا ترفع ملف `.env` إلى GitHub!** متغير البيئة يُضاف فقط من لوحة Vercel.

### 2. التحديثات
عند تعديل الكود:
```bash
git add .
git commit -m "وصف التعديل"
git push
```
Vercel سيعيد النشر تلقائياً!

### 3. مراقبة الأداء
- لوحة Vercel تعرض: عدد الزوار، الاستجابة، الأخطاء
- تنبيهات تلقائية عند الأخطاء

### 4. النسخ الاحتياطي
قاعدة بيانات Neon لديها نسخ احتياطي تلقائي، لكن يُنصح بـ:
```bash
# نسخة يدوية (شغّل محلياً)
bun run backup
```

---

## 🔧 حل المشاكل

### المشكلة: "Build failed"
- تأكد أن `package.json` محدّث
- تأكد أن `prisma generate` يشتغل (postinstall)
- راجع سجل البناء في Vercel

### المشكلة: "Database connection failed"
- تأكد أن `DATABASE_URL` صحيح في Vercel
- تأكد أن Neon يعمل (قد يكون نائماً)

### المشكلة: "404 on /menu"
- تأكد أن الملفات في `src/app/menu/page.tsx`
- أعد النشر

---

## 📞 الدعم

إذا واجهت أي مشكلة أثناء النشر:
1. راجع سجل البناء في Vercel
2. تأكد من متغيرات البيئة
3. تأكد أن GitHub محدّث بأحدث الكود
