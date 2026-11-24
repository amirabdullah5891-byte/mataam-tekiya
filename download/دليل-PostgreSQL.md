# 🐘 دليل الانتقال إلى PostgreSQL

## لماذا PostgreSQL؟

| الميزة | SQLite | PostgreSQL |
|---|---|---|
| **السعة القصوى** | 50 GB | غير محدود |
| **المستخدمون المتزامنون** | محدود | آلاف |
| **الأداء مع البيانات الكبيرة** | متوسط | ممتاز |
| **التوسع الأفقي** | ❌ | ✅ |
| **النسخ الاحتياطي الساخن** | ❌ | ✅ |
| **الترتيب والبحث المتقدم** | أساسي | متقدم |
| **الأنواع المخصصة** | ❌ | ✅ |
| **القواعد (Rules)** | ❌ | ✅ |

---

## 🚀 طرق استخدام PostgreSQL

### الطريقة 1: تثبيت محلي (مجاني)

#### على ويندوز:
1. حمّل من: https://www.postgresql.org/download/windows/
2. ثبّت مع تذكر كلمة المرور
3. أنشئ قاعدة بيانات:
```sql
-- افتح psql
CREATE USER tekiya_user WITH PASSWORD 'your_strong_password';
CREATE DATABASE tekiya_db OWNER tekiya_user;
GRANT ALL PRIVILEGES ON DATABASE tekiya_db TO tekiya_user;
```

#### على لينكس (Ubuntu/Debian):
```bash
sudo apt install postgresql postgresql-contrib
sudo -u postgres psql

CREATE USER tekiya_user WITH PASSWORD 'your_strong_password';
CREATE DATABASE tekiya_db OWNER tekiya_user;
GRANT ALL PRIVILEGES ON DATABASE tekiya_db TO tekiya_user;
\q
```

#### على ماك:
```bash
brew install postgresql
brew services start postgresql
createuser -s tekiya_user
createdb -O tekiya_user tekiya_db
psql -c "ALTER USER tekiya_user WITH PASSWORD 'your_strong_password';"
```

رابط الاتصال:
```
postgresql://tekiya_user:your_strong_password@localhost:5432/tekiya_db
```

---

### الطريقة 2: خدمة سحابية مجانية (موصى به للبداية)

#### أ) Neon (الأفضل - مجاني حتى 10GB)
1. اذهب إلى: https://neon.tech
2. سجل حساب مجاني
3. أنشئ مشروع جديد
4. انسخ رابط الاتصال
5. رابط مثل: `postgresql://user:pass@ep-xxx.us-east-2.aws.neon.tech/dbname?sslmode=require`

**المميزات:**
- ✅ مجاني حتى 10GB
- ✅ نسخ احتياطي تلقائي
- ✅ استعادة لنقطة زمنية (Point-in-time recovery)
- ✅ تفرع (Branching) للتطوير
- ✅ يتجمد بعد عدم الاستخدام (توفير)

#### ب) Supabase (بديل - مجاني حتى 500MB)
1. اذهب إلى: https://supabase.com
2. سجل حساب مجاني
3. أنشئ مشروع جديد
4. من Settings → Database، انسخ رابط الاتصال
5. رابط مثل: `postgresql://postgres:pass@db.xxx.supabase.co:5432/postgres`

**المميزات:**
- ✅ مجاني حتى 500MB
- ✅ لوحة تحكم ويب
- ✅ API تلقائي
- ✅ مصادقة جاهزة

#### ج) Railway (بديل - تجربة مجانية)
1. اذهب إلى: https://railway.app
2. سجل عبر GitHub
3. أنشئ PostgreSQL database
4. انسخ رابط الاتصال

---

## 📋 خطوات الانتقال

### الخطوة 1: احصل على رابط PostgreSQL

اختر إحدى الطرق أعلاه واحصل على رابط مثل:
```
postgresql://tekiya_user:password@localhost:5432/tekiya_db
```

### الخطوة 2: حدّث ملف .env

```bash
# في ملف .env، استبدل السطر:
DATABASE_URL=file:/home/z/my-project/db/custom.db

# بـ:
DATABASE_URL=postgresql://tekiya_user:password@localhost:5432/tekiya_db
```

### الخطوة 3: بدّل المزود

```bash
bun run switch-db postgresql
```

### الخطوة 4: الإعداد التلقائي والترحيل

```bash
bun run setup:postgres
```

هذا السكريبت سيقوم بـ:
1. ✅ فحص الاتصال بـ PostgreSQL
2. ✅ إنشاء الجداول
3. ✅ ترحيل كل البيانات من SQLite
4. ✅ التحقق من النجاح

### الخطوة 5: شغّل النظام

```bash
bun run start:all
```

سجل الدخول بنفس بياناتك السابقة - كل البيانات ستكون موجودة!

---

## 🔄 أوامر مفيدة

| الأمر | الوصف |
|---|---|
| `bun run switch-db postgresql` | التبديل إلى PostgreSQL |
| `bun run switch-db sqlite` | العودة إلى SQLite |
| `bun run setup:postgres` | إعداد + ترحيل تلقائي |
| `bun run migrate:postgres` | ترحيل البيانات فقط |
| `bun run backup` | نسخة احتياطية |
| `bun run restore` | استرجاع نسخة |

---

## 🛡️ الأمان

### كلمات مرور قوية
استخدم كلمة مرور قوية لقاعدة البيانات:
- 16+ حرف
- أحرف كبيرة وصغيرة
- أرقام ورموز
- مثال: `Tk!ya_R3st@2024_Secure`

### لا تشارك ملف .env
- أضف `.env` إلى `.gitignore` (موجود بالفعل)
- لا ترفعه على GitHub
- لا ترسله لأحد

### للنشر السحابي
استخدم متغيرات البيئة في لوحة تحكم المنصة (Vercel، Railway، إلخ) بدلاً من ملف .env.

---

## 🔧 حل المشاكل

### المشكلة: "Connection refused"
- تأكد أن PostgreSQL يعمل: `sudo systemctl status postgresql`
- تأكد من المنفذ الصحيح (5432 افتراضياً)
- تأكد من جدار الحماية

### المشكلة: "Authentication failed"
- تحقق من اسم المستخدم وكلمة المرور
- تحقق من ملف `pg_hba.conf`
- للـ Neon/Supabase: تأكد من نسخ الرابط كاملاً

### المشكلة: "Database does not exist"
- أنشئ قاعدة البيانات أولاً:
```sql
CREATE DATABASE tekiya_db;
```

### المشكلة: "Permission denied"
- امنح الصلاحيات:
```sql
GRANT ALL PRIVILEGES ON DATABASE tekiya_db TO tekiya_user;
GRANT ALL ON SCHEMA public TO tekiya_user;
```

### المشكلة: SSL مطلوب (للخدمات السحابية)
أضف `?sslmode=require` لرابط الاتصال:
```
postgresql://user:pass@host/db?sslmode=require
```

---

## 📊 التحقق من نجاح الانتقال

بعد الانتقال، تحقق من:

1. **تسجيل الدخول** يعمل بنفس البيانات السابقة
2. **الأطباق** كلها موجودة (25 طبق)
3. **الفواتير** كلها موجودة
4. **المخزون** بالكميات الصحيحة
5. **الموردون** موجودون
6. **الزبائن والمحافظ** بالأرصدة الصحيحة

```bash
# فحص سريع
bun run audit
```

---

## 💡 نصائح للإنتاج

### 1. النسخ الاحتياطي المنتظم
```bash
# نسخة يومية
crontab -e
0 2 * * * cd /path/to/restaurant && bun run backup

# أو استخدم pg_dump لـ PostgreSQL مباشرة:
pg_dump -U tekiya_user -h localhost tekiya_db > backup.sql
```

### 2. مراقبة الأداء
- استخدم `pgAdmin` لمراقبة الأداء
- راجع الاستعلامات البطيئة
- أضف فهارس عند الحاجة

### 3. التوسع
- عند الوصول لـ 100GB+، فكر في:
  - تقسيم الجداول (Table Partitioning)
  - Read Replicas للقراءة
  - Connection Pooling (PgBouncer)

---

## 🆘 العودة إلى SQLite

إذا واجهت مشاكل، يمكنك العودة بسهولة:

```bash
# 1. بدّل المزود
bun run switch-db sqlite

# 2. استعد رابط SQLite في .env
DATABASE_URL=file:/home/z/my-project/db/custom.db

# 3. أعد توليد العميل
bun run db:generate

# 4. شغّل
bun run start:all
```

قاعدة بيانات SQLite الأصلية ما زالت محفوظة في `db/custom.db`!

---

## 📞 الدعم

إذا واجهت أي مشكلة:
1. راجع رسائل الخطأ في الطرفية
2. تأكد من رابط الاتصال
3. اختبر الاتصال: `psql $DATABASE_URL`
4. راجع سجل الأحداث في النظام
