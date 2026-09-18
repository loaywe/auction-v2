# Auction V2

منصة ويب عربية للبيع والشراء عبر المزادات والمنتجات ذات السعر الثابت. يتيح
المشروع للمستخدمين تصفح المنتجات، المشاركة في المزادات لحظيًا، شراء المنتجات
بسعر ثابت، متابعة الطلبات والمشتريات، وإدارة الإعلانات والمستخدمين والطلبات من
خلال صلاحيات متعددة.

## المزايا الرئيسية

- تسجيل المستخدمين وتسجيل الدخول باستخدام اسم المستخدم وكلمة المرور.
- تشفير كلمات المرور الجديدة باستخدام `bcryptjs` والتحقق منها عند تسجيل الدخول.
- أدوار مستخدمين منفصلة: عميل، تاجر، مدير، ومندوب توصيل.
- إنشاء منتجات بنظام مزاد أو بسعر ثابت مع الصور والتصنيفات والحالة والكمية.
- عرض المزادات النشطة والمنتهية، الفلترة حسب النوع والتصنيف، وتسجيل المزايدات.
- تحديث المزايدات والتعليقات وحالة المزاد لحظيًا عبر WebSocket.
- معالجة المزادات المنتهية تلقائيًا من خلال مهام مجدولة باستخدام `node-cron`.
- شراء بالدفع عند التوصيل أو عبر Stripe للمنتجات ذات السعر الثابت.
- محفظة للمستخدم ومعالجة أحداث Stripe Webhook.
- إدارة المستخدمين والمنتجات والمزايدات والطلبات والتقارير والإعلانات من لوحة الإدارة.
- رفع صور الهوية وصور المنتجات والإعلانات إلى مجلد `backend/uploads`.
- تسجيل الدخول باستخدام Google OAuth عبر Passport.

## بنية المشروع

```text
auction/
├── backend/
│   ├── config/db.js              اتصال MongoDB
│   ├── controllers/              منطق المستخدمين والمزاد والإدارة والطلبات
│   ├── middleware/               المصادقة ورفع الصور
│   ├── models/arts.js            مخططات ونماذج MongoDB
│   ├── routes/                   مسارات REST API
│   ├── websocket/                ملفات دعم الاتصال اللحظي
│   ├── uploads/                  الصور المرفوعة محليًا
│   ├── server.js                 تشغيل Express وWebSocket
│   ├── wallet.js                 جلسات Stripe للمحفظة والشراء
│   └── webhook.js                معالجة Stripe Webhook
├── frontend/my-app/
│   ├── src/pages/                صفحات React للمستخدم والإدارة والتاجر
│   ├── src/pages/componant/       مكونات الواجهة المشتركة
│   ├── src/radux/                Redux store وحالة المستخدم
│   ├── src/App.jsx               التطبيق والتنقل والبيانات الرئيسية
│   └── vite.config.js             إعداد Vite
└── README.md
```

## التقنيات المستخدمة

### الواجهة الأمامية

- React 19 وReact DOM.
- Vite للتطوير والبناء.
- React Router للتنقل بين الصفحات.
- Redux Toolkit وReact Redux لإدارة حالة المستخدم.
- Axios للاتصال بالخادم.
- Tailwind CSS و`@tailwindcss/vite` للتنسيق.
- React Icons وReact Toastify للأيقونات والتنبيهات.
- `@stripe/stripe-js` لتكامل الدفع في الواجهة.
- `socket.io-client` موجود ضمن الاعتمادات، بينما اتصال المزادات الحالي يستخدم WebSocket الأصلي.

### الخادم

- Node.js وExpress 5.
- MongoDB عبر Mongoose.
- JWT للمصادقة والجلسات الخاصة بالـ API.
- `bcryptjs` لتجزئة كلمات المرور والتحقق منها.
- Passport وGoogle OAuth 2.0 لتسجيل الدخول عبر Google.
- Express Session لجلسات Passport.
- Multer لرفع الصور.
- Stripe للدفع وشحن المحفظة.
- `ws` للاتصال اللحظي بالمزادات.
- `node-cron` للمهام المجدولة.
- CORS للسماح باتصال الواجهة بالخادم.

## قاعدة البيانات

يستخدم المشروع MongoDB، ويتم الاتصال من خلال المتغير `MONGODB_URI` في ملف
البيئة. النماذج المعرفة في `backend/models/arts.js` هي:

| النموذج | الاستخدام |
| --- | --- |
| `User` | الحسابات والأدوار والرصيد وصورة الهوية وحالة التحقق |
| `Product` | منتجات المزاد والمنتجات ذات السعر الثابت |
| `Bid` | عروض المزايدة وعمليات شراء السعر الثابت |
| `Comment` | تعليقات المستخدمين على المنتجات |
| `Ad` | الإعلانات المعروضة في المنصة |
| `Order` | الطلبات وحالة التوصيل وطريقة وحالة الدفع |
| `Report` | تقارير المبيعات والمزاد والمشتري والبائع |

العلاقات بين النماذج تعتمد على `ObjectId` و`populate`، مثل ربط المنتج بالبائع،
والطلب بالمنتج والمزايدة والمندوب.

## المصادقة والصلاحيات

- تسجيل الدخول المحلي يعيد JWT صالحًا لمدة 12 ساعة.
- يرسل العميل التوكن في الترويسة التالية:

```http
Authorization: Bearer <JWT_TOKEN>
```

- الصلاحيات مدعومة للأدوار `customer` و`merchant` و`admin` و`delivery`.
- كلمات المرور لا يتم إرجاعها في استجابات المستخدمين.
- تسجيل Google يستخدم المسارين `/auth/google` و`/auth/google/callback`.

## مسارات API الرئيسية

> العنوان الافتراضي للخادم هو `http://localhost:5000`.

### المستخدمون

- `POST /api/users` تسجيل مستخدم محلي جديد.
- `POST /api/users/login` تسجيل الدخول المحلي.
- `GET /api/users/me` جلب المستخدم الحالي، ويتطلب JWT.
- `GET /api/users/:username` جلب ملف مستخدم.
- `PATCH /api/users/:username` تعديل ملف المستخدم ورفع صورة الهوية.
- `POST /api/customers/register` و`POST /api/customers/login` للعملاء.
- `POST /merchant/register` و`POST /merchant/login` للتجار.
- `POST /api/delivery/register` و`POST /api/delivery/login` للمندوبين.

### المنتجات والمزادات

- `GET /api/home` جلب بيانات الصفحة الرئيسية.
- `GET /api/users/auction/active` المزادات النشطة.
- `GET /api/users/auction/all` المزادات مع حالتها.
- `GET /api/users/auction/available` المنتجات المتاحة للمزايدة.
- `GET /api/users/auction/:productId/details` تفاصيل مزاد.
- `GET /api/users/auction/category/:category` المزادات حسب التصنيف.
- `POST /api/users/auction/:productId/bid` إضافة مزايدة، وتتطلب JWT.
- `GET /api/users/my-bids` مزايدات المستخدم، وتتطلب JWT.
- `GET /api/users/my-won-auctions` المزادات التي فاز بها المستخدم، وتتطلب JWT.
- `GET /api/users/products/fixed` المنتجات ذات السعر الثابت.
- `GET /api/users/products/:productId` تفاصيل منتج.
- `POST /api/users/purchase/cod` شراء بالدفع عند التوصيل، ويتطلب JWT.

### الإدارة والتاجر

- مسارات الإدارة تبدأ من `/admin` وتتطلب دور `admin`.
- إدارة المستخدمين والمنتجات والمزايدات والطلبات والتقارير والإعلانات تدعم
	عمليات الجلب والإنشاء والتعديل والحذف حسب المسار.
- مسارات التاجر تبدأ من `/merchant` وتتيح إدارة المنتجات والمزايدات والطلبات.

### الدفع والمحفظة

- `POST /api/wallet/create-wallet-session` إنشاء جلسة شحن المحفظة عبر Stripe.
- `POST /api/wallet/create-product-session` إنشاء جلسة شراء منتج عبر Stripe.
- `POST /api/wallet/webhook` استقبال أحداث الدفع.
- يدعم الخادم أيضًا مسار Stripe Webhook الموجود في `webhook.js`.

## متطلبات التشغيل

- Node.js إصدار حديث، ويفضل Node.js 20 أو أحدث.
- npm.
- حساب MongoDB وقاعدة بيانات متاحة عبر URI.
- حساب Stripe عند تفعيل الدفع الإلكتروني.
- بيانات Google OAuth عند تفعيل تسجيل الدخول عبر Google.

## الإعداد المحلي

### 1. تثبيت الاعتمادات

من مجلد المشروع:

```bash
cd backend
npm install

cd ../frontend/my-app
npm install
```

### 2. إعداد متغيرات البيئة

أنشئ ملف `backend/.env` محليًا، ولا ترفعه إلى GitHub:

```env
MONGODB_URI=mongodb://localhost:27017/auction
JWT_SECRET=ضع_مفتاحًا_سريًا_قويًا
SESSION_SECRET=ضع_سر_الجلسة_هنا
PORT=5000
NODE_ENV=development
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret
```

المتغيرات الخاصة بـ Google وStripe مطلوبة فقط عند استخدام خصائصها. لا تستخدم
القيم الافتراضية للأسرار في بيئة الإنتاج.

### 3. تشغيل الخادم

من مجلد `backend`:

```bash
node server.js
```

أو أثناء التطوير:

```bash
npx nodemon server.js
```

الخادم يختار منفذًا متاحًا بدءًا من قيمة `PORT`، ويزيده تلقائيًا إذا كان
المنفذ مشغولًا.

### 4. تشغيل الواجهة

من مجلد `frontend/my-app`:

```bash
npm run dev
```

عادةً تعمل الواجهة على `http://localhost:5173`، وهي مهيأة حاليًا للاتصال
بالخادم على `http://localhost:5000`.

### 5. البناء والتحقق

```bash
cd frontend/my-app
npm run build
npm run lint
```

لا يحتوي الخادم حاليًا على اختبارات آلية مضافة في `package.json`.

## WebSocket للمزاد

يستخدم الخادم WebSocket على نفس منفذ HTTP. تنضم الواجهة إلى غرفة المنتج بإرسال
رسالة `join` تحتوي على `token` و`productId`. تدعم الغرفة رسائل التهيئة،
المزايدات الجديدة، التعليقات، انتهاء المزاد، وheartbeat للحفاظ على الاتصال.

## الملفات التي لا يجب رفعها

يستبعد ملف `.gitignore` الملفات التالية:

- `backend/.env` وملفات البيئة الأخرى.
- `node_modules`.
- `backend/uploads` والصور المرفوعة محليًا.
- ملفات البناء وملفات السجلات.

لا تضع مفاتيح MongoDB أو JWT أو Stripe أو Google داخل الكود أو README أو GitHub.

## النشر

قبل النشر يجب تحديث عناوين الواجهة والخادم من `localhost` إلى نطاقات البيئة
الفعلية، وضبط CORS وCallback الخاص بـ Google وSuccess/Cancel URLs الخاصة بـ
Stripe، واستخدام HTTPS، وتعيين أسرار قوية، وتخزين الصور في خدمة دائمة بدلًا من
الاعتماد على نظام ملفات مؤقت.

## المستودع

GitHub: https://github.com/loaywe/auction-v2
