# Child Labor Project — دليل النشر

نسخة **عرض / مراجعة** (Demo). الهدف: المدير يفتح لينك، يجرّب السيستم، ويكتب ملاحظاته.

---

## ⚠️ اقرأ ده الأول — طبيعة النسخة الحالية

| البند | الحالة |
|------|--------|
| قاعدة بيانات | ❌ لا يوجد. الداتا محفوظة في **متصفح كل مستخدم** (localStorage) |
| تسجيل الدخول | ⚠️ **وهمي** — أى باسورد بتدخّل. مجرد اختيار للدور |
| مشاركة الداتا | ❌ اللى تضيفه انت مش هيشوفه حد تاني. كل متصفح ليه نسخته |
| الصور | ✅ بتتحفظ وبتفضل بعد الـ refresh |

**يعني:** دي نسخة لعرض الشكل والـ workflow والأزرار — **مش** للتشغيل الحقيقي.

> 🔒 **مهم:** متدخلش بيانات أطفال حقيقية على النسخة دي. اللينك مفتوح لأى حد معاه العنوان، والـ login مش حقيقي.

---

## 1) التشغيل المحلي

فولدر `node_modules` القديم فيه بقايا من منصة Manus وبيكسر `npm install`.
**امسحه الأول:**

```powershell
cd "D:\Work\مشاريع المعمدانية\system\CLP-FINAL-PROJECT"

# امسح التثبيت القديم
Remove-Item -Recurse -Force node_modules -ErrorAction SilentlyContinue

# ثبّت من جديد
npm install

# جرّب
npm run check     # فحص TypeScript
npm run dev       # http://localhost:3000
```

> ملاحظة: لو ظهرلك `Debugger listening on ws://...` ده لإن عندك `NODE_OPTIONS` فيه `--inspect`. مش مشكلة، متجاهله.

أوامر تانية:

```powershell
npm run build     # يبني في dist/public
npm run preview   # يجرّب النسخة المبنية
```

---

## 2) الرفع على GitHub

```powershell
cd "D:\Work\مشاريع المعمدانية\system\CLP-FINAL-PROJECT"

git init
git add .
git commit -m "Child Labor Project - demo build for review"
git branch -M main
git remote add origin https://github.com/YouShiaZ/child-labor-project.git
git push -u origin main
```

**قبل الـ push:** اعمل repo جديد على https://github.com/new
- الاسم: `child-labor-project`
- خليه **Private** 🔒

> فيه `.gitignore` جاهز — فـ `node_modules` و `dist` مش هيترفعوا.

---

## 3) النشر على Vercel

1. ادخل https://vercel.com/new
2. اختار repo `child-labor-project`
3. Vercel هيقرا `vercel.json` لوحده، فالإعدادات هتيجي جاهزة:
   - Build Command: `npm run build`
   - Output Directory: `dist/public`
   - Install Command: `npm install`
4. اضغط **Deploy** → استنى دقيقتين.
5. هيطلعلك لينك زى `https://child-labor-project-xxx.vercel.app`

**ابعت اللينك ده للمدير.** ✅

### لو عايز تحدّث بعد تعليقات المدير

```powershell
git add .
git commit -m "وصف التعديل"
git push
```

Vercel هيعمل deploy تلقائي.

---

## 4) حسابات التجربة

| البريد | الدور | يقدر يعمل إيه |
|--------|------|----------------|
| `admin@clp.org` | Admin | كل حاجة + إدارة المستخدمين |
| `editor@clp.org` | Editor | يضيف ويعدّل أطفال وتقارير |
| `viewer@clp.org` | Viewer | قراءة فقط (زى الداعمين) |

**الباسورد:** أى حاجة.

💡 خلّي المدير يجرّب بـ **admin** الأول، وبعدين يخرج ويدخل بـ **viewer** عشان يشوف إن أزرار التعديل بتختفي.

---

## 5) رجّع الداتا لأصلها

لو الداتا اتلخبطت أثناء التجربة، افتح الـ Console (F12) واكتب:

```js
localStorage.clear(); location.reload();
```

---

## 6) اللى اتغيّر في النسخة دي

- ✅ **مشروع واحد بس** — اتشال مشروع كينيا. السيستم كله على "Child Labor Project".
- ✅ **تقارير ربع سنوية / نص سنوية / سنوية** — مع فلتر ومنع تكرار.
- ✅ **الداتا بتتحفظ** بعد الـ refresh (localStorage).
- ✅ **الصور بتتحفظ** فعلًا (بدل blob URLs اللى كانت بتضيع).
- ✅ **أرقام المستفيدين متسلسلة** (CLP-0001, CLP-0002, ...).
- ✅ **اتشالت كل اعتماديات Manus** — دي كانت سبب فشل `npm install`:
  - `@builder.io/vite-plugin-jsx-loc` (كان بيتعارض مع Vite 7)
  - `vite-plugin-manus-runtime`
  - patch بتاع wouter
  - ملفات مش مستخدمة: `Map.tsx`, `Home.tsx`, `ManusDialog.tsx`, `server/`, `shared/`
- ✅ بقى **static SPA** يتنشر في أى مكان.

---

## 7) الخطوة اللى بعد كده (للتشغيل الحقيقي)

قبل ما يتحط عليه بيانات أطفال فعلية، لازم:

1. **Backend حقيقي** + PostgreSQL (المواصفات كاملة في `STRUCTURE.md`).
2. **Auth حقيقي** — JWT + bcrypt، وباسوردات فعلية.
3. **رفع الصور** على object storage (S3).
4. **صلاحيات على السيرفر** (مش بس إخفاء أزرار في الواجهة).
5. **Backup** — الداتا هتفضل 2-3 سنين.
