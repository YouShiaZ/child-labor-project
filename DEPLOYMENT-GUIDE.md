# Child Labor Project - Deployment Guide

## 📋 خطوات النشر (Deployment Steps)

### المرحلة الأولى: إعداد البيئة

#### الخطوة 1: تثبيت المتطلبات
```bash
# تأكد من تثبيت Node.js و pnpm
node --version  # يجب أن يكون 18+
pnpm --version  # يجب أن يكون مثبتاً

# إذا لم يكن pnpm مثبتاً:
npm install -g pnpm
```

#### الخطوة 2: تثبيت المكتبات
```bash
cd /path/to/CLP-FINAL-PROJECT
pnpm install
```

#### الخطوة 3: التحقق من عدم وجود أخطاء
```bash
pnpm run check  # TypeScript check
pnpm run dev    # اختبار محلي
```

---

### المرحلة الثانية: البناء (Build)

#### الخطوة 4: بناء المشروع للإنتاج
```bash
pnpm run build
```

**ماذا يحدث:**
- يتم تجميع TypeScript إلى JavaScript
- يتم تحسين الكود (minification)
- يتم إنشاء ملف `dist/` يحتوي على الملفات النهائية

#### الخطوة 5: اختبار البناء محلياً
```bash
pnpm run preview
```

**ستفتح الصفحة على:** `http://localhost:4173`

---

### المرحلة الثالثة: النشر على Manus

#### الخطوة 6: إنشاء Checkpoint
1. افتح واجهة Manus الإدارية
2. اذهب إلى المشروع "child-labor-project"
3. اضغط زر "Save Checkpoint" (أو ⋯ → Version history)
4. أضف وصف: "Final version with Egyptian Coptic names"
5. اضغط "Save"

#### الخطوة 7: النشر المباشر
1. في واجهة Manus، اضغط زر **"Publish"** (أعلى اليمين)
2. اختر الـ checkpoint اللي حفظته للتو
3. اضغط "Publish to Production"
4. انتظر 2-3 دقائق

**ستحصل على:**
- رابط دائم: `https://childlabr-kfreludm.manus.space`
- أو رابط مخصص إذا ربطت domain

---

### المرحلة الرابعة: التحقق من النشر

#### الخطوة 8: اختبار الموقع المنشور
```
1. افتح الرابط المنشور
2. سجّل دخول بـ admin@clp.org (أي كلمة مرور)
3. تحقق من:
   - Dashboard يعرض البيانات
   - الأسماء الجديدة ظاهرة (Mina, Kyrillos, Amgad, Mahab)
   - جميع الصفحات تعمل بشكل صحيح
```

---

## 🔗 الروابط الهامة

### رابط المشروع المنشور (Live)
```
https://childlabr-kfreludm.manus.space
```

### رابط الديفيلوبمنت (Development)
```
https://3000-iy10blfjs370mr26p68hg-0782797c.sg1.manus.computer
```

### حسابات الديمو
| البريد | الدور | كلمة المرور |
|--------|-------|------------|
| admin@clp.org | Admin | أي قيمة |
| editor@clp.org | Editor | أي قيمة |
| viewer@clp.org | Viewer | أي قيمة |

---

## 📊 ملخص البيانات الحالية

### الأطفال (Beneficiaries)
1. **Mina Adel** - CLP-0001 - Sponsored
2. **Kyrillos Ashraf** - CLP-0002 - Entry
3. **Amgad Ramzy** - CLP-0003 - Priority
4. **Mahab Kamel** - CLP-0101 - Sponsored

### المشاريع (Projects)
1. Hope for Children 2024 (Egypt)
2. Bright Future Initiative (Kenya)

### المستخدمون (Users)
1. System Administrator (Admin)
2. Mariam Adel (Editor)
3. John Director (Viewer)

---

## 🛠️ استكشاف الأخطاء

### المشكلة: الموقع لا يفتح
```
الحل:
1. تحقق من الرابط صحيح
2. انتظر 5 دقائق بعد النشر
3. امسح cache المتصفح (Ctrl+Shift+Delete)
4. جرّب متصفح آخر
```

### المشكلة: البيانات لا تظهر
```
الحل:
1. تحقق من تسجيل الدخول
2. افتح DevTools (F12) وشاهد Console
3. تحقق من أن mockData.ts محدّثة
4. أعد بناء المشروع (pnpm run build)
```

### المشكلة: الأسماء القديمة تظهر
```
الحل:
1. امسح cache المتصفح
2. تحقق من mockData.ts محدّثة
3. أعد النشر (Publish)
4. انتظر 5 دقائق
```

---

## 📝 خطوات إضافة ميزات جديدة بعد النشر

### إذا أردت إضافة أطفال جدد:

#### الخطوة 1: تحديث mockData.ts
```tsx
// في client/src/lib/mockData.ts
export const beneficiaries: Beneficiary[] = [
  // ... الأطفال الموجودين
  {
    id: "b-5",
    projectId: "p-1",
    beneficiaryNumber: "CLP-0004",
    status: "entry",
    firstName: "Boulos",  // اسم مسيحي مصري جديد
    lastName: "Tawfik",
    // ... باقي البيانات
  },
];
```

#### الخطوة 2: بناء ونشر
```bash
pnpm run build
# ثم اضغط Publish في واجهة Manus
```

---

## 🚀 الخطوات التالية (Next Steps)

### قريباً:
1. **ربط قاعدة بيانات حقيقية** (PostgreSQL/MongoDB)
2. **مصادقة حقيقية** (JWT/OAuth)
3. **رفع الصور** (S3/Cloud Storage)
4. **البحث والفلترة**
5. **تصدير البيانات** (CSV/PDF)

---

## 📞 الدعم والمساعدة

### للأسئلة التقنية:
- اقرأ `CLP-COMPLETE-TECHNICAL-GUIDE.md`
- اقرأ `STRUCTURE.md` للمواصفات
- اقرأ `ideas.md` لفلسفة التصميم

### للمشاكل:
1. افتح DevTools (F12)
2. شاهد Console للأخطاء
3. جرّب الخطوات في قسم "استكشاف الأخطاء"

---

## ✅ Checklist قبل النشر

- [ ] تثبيت Node.js و pnpm
- [ ] تشغيل `pnpm install`
- [ ] تشغيل `pnpm run check` بدون أخطاء
- [ ] تشغيل `pnpm run dev` واختبار محلياً
- [ ] تشغيل `pnpm run build` بنجاح
- [ ] إنشاء Checkpoint في Manus
- [ ] اضغط Publish
- [ ] اختبار الرابط المنشور
- [ ] تحقق من الأسماء الجديدة

---

## 📋 أوامر سريعة

```bash
# التطوير المحلي
pnpm run dev

# التحقق من الأخطاء
pnpm run check

# البناء للإنتاج
pnpm run build

# اختبار البناء
pnpm run preview

# تنسيق الكود
pnpm run format
```

---

**آخر تحديث:** 7 يوليو 2026  
**الإصدار:** 1.0.0 - Final  
**الحالة:** جاهز للنشر المباشر
