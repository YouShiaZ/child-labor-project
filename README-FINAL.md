# Child Labor Project (CLP) - النسخة النهائية

## 🎯 نظرة عامة

**Child Labor Project** هو نظام إدارة حالات شامل موجه لدعم الأطفال المعرضين لخطر عمالة الأطفال في مصر وخارجها.

### المميزات الرئيسية:
✅ إدارة المشاريع والمستفيدين  
✅ تتبع التقدم لمدة 3 سنوات  
✅ نظام صلاحيات متقدم (Admin/Editor/Viewer)  
✅ واجهة مستخدم احترافية  
✅ بيانات مع أسماء أطفال مسيحيين مصريين  

---

## 📁 محتويات الفولدر

```
CLP-FINAL-PROJECT/
│
├── DEPLOYMENT-GUIDE.md           # ← ابدأ من هنا للنشر
├── CLP-COMPLETE-TECHNICAL-GUIDE.md
├── STRUCTURE.md
├── ideas.md
├── package.json
├── tsconfig.json
├── vite.config.ts
│
├── client/
│   ├── public/
│   │   └── favicon.png
│   ├── src/
│   │   ├── pages/                # 8 صفحات رئيسية
│   │   ├── components/           # 20+ مكون
│   │   ├── contexts/             # Auth + Theme
│   │   ├── lib/                  # Types, API, Mock Data
│   │   ├── App.tsx               # المسارات
│   │   ├── main.tsx              # نقطة الدخول
│   │   └── index.css             # الأنماط العامة
│   └── index.html
│
├── server/
│   └── index.ts
│
└── shared/
    └── const.ts
```

---

## 🚀 البدء السريع

### 1. التثبيت
```bash
cd CLP-FINAL-PROJECT
pnpm install
```

### 2. التطوير المحلي
```bash
pnpm run dev
```
ستفتح على: `http://localhost:3000`

### 3. البناء للإنتاج
```bash
pnpm run build
```

### 4. النشر على Manus
اتبع خطوات `DEPLOYMENT-GUIDE.md`

---

## 👥 حسابات الديمو

| البريد | الدور | الصلاحيات |
|--------|-------|----------|
| admin@clp.org | Admin | كل شيء |
| editor@clp.org | Editor | إضافة/تعديل البيانات |
| viewer@clp.org | Viewer | عرض فقط |

**كلمة المرور:** أي قيمة (mock auth)

---

## 👶 الأطفال المسجلون

1. **Mina Adel** - CLP-0001 - Sponsored
2. **Kyrillos Ashraf** - CLP-0002 - Entry
3. **Amgad Ramzy** - CLP-0003 - Priority
4. **Mahab Kamel** - CLP-0101 - Sponsored

---

## 📚 الوثائق

| الملف | الوصف |
|------|-------|
| `DEPLOYMENT-GUIDE.md` | خطوات النشر والديبلوى |
| `CLP-COMPLETE-TECHNICAL-GUIDE.md` | شرح تقني شامل |
| `STRUCTURE.md` | مواصفات الـ Backend |
| `ideas.md` | فلسفة التصميم |

---

## 🔧 الأوامر المتاحة

```bash
pnpm run dev      # تطوير محلي
pnpm run build    # بناء للإنتاج
pnpm run preview  # اختبار البناء
pnpm run check    # التحقق من TypeScript
pnpm run format   # تنسيق الكود
```

---

## 🌐 الروابط

### المنشور (Live)
```
https://childlabr-kfreludm.manus.space
```

### التطوير (Development)
```
https://3000-iy10blfjs370mr26p68hg-0782797c.sg1.manus.computer
```

---

## 🛠️ التقنيات المستخدمة

- **Frontend:** React 19 + TypeScript
- **Styling:** Tailwind CSS 4 + shadcn/ui
- **Routing:** Wouter
- **State:** React Context + Hooks
- **Build:** Vite
- **Data:** Mock (في الذاكرة)

---

## 📝 الخطوات التالية

1. **ربط قاعدة بيانات حقيقية**
2. **مصادقة حقيقية (JWT)**
3. **رفع الصور (S3)**
4. **البحث والفلترة**
5. **تصدير البيانات (CSV/PDF)**

---

## ⚠️ ملاحظات مهمة

- البيانات محفوظة في الذاكرة فقط (تُفقد عند تحديث الصفحة)
- المصادقة وهمية (mock)
- عند النشر، ستحتاج إلى backend حقيقي

---

## 📞 الدعم

للمساعدة والأسئلة:
1. اقرأ `CLP-COMPLETE-TECHNICAL-GUIDE.md`
2. اقرأ `DEPLOYMENT-GUIDE.md`
3. افتح DevTools (F12) وشاهد Console

---

**آخر تحديث:** 7 يوليو 2026  
**الإصدار:** 1.0.0 - Final  
**الحالة:** جاهز للنشر المباشر

---

**للنشر:** اتبع خطوات `DEPLOYMENT-GUIDE.md` 🚀
