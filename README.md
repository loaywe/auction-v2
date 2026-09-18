# Auction V2
Auction V2 is an Arabic marketplace for auctions and fixed-price products. The
platform allows users to browse products, participate in live auctions, buy
fixed-price products, track purchases and orders, and manage listings through
role-based access control.

## Main Features

- User registration and login with username and password.
- New passwords are hashed with `bcryptjs` and verified during login.
- Separate roles for customers, merchants, administrators, and delivery staff.
- Product creation for auctions or fixed-price sales, including images,
	categories, status, and quantity.
- Active and expired auction listings with type and category filtering.
- Real-time bids, comments, auction status updates, and auction rooms through
	WebSocket.
- Automatic processing of expired auctions with scheduled `node-cron` jobs.
- Cash-on-delivery and Stripe payments for fixed-price products.
- User wallet and Stripe webhook event handling.
- Administration of users, products, bids, orders, reports, and advertisements.
- Identity, product, and advertisement image uploads to `backend/uploads`.
- Google OAuth login through Passport.

## Project Structure

```text
auction/
├── backend/
│   ├── config/db.js              MongoDB connection
│   ├── controllers/              Users, auctions, admin, and order logic
│   ├── middleware/               Authentication and image uploads
│   ├── models/arts.js            MongoDB schemas and models
│   ├── routes/                   REST API routes
│   ├── websocket/                Realtime auction support
│   ├── uploads/                  Locally uploaded images
│   ├── server.js                 Express and WebSocket server
│   ├── wallet.js                 Stripe wallet and purchase sessions
│   └── webhook.js                Stripe webhook handling
├── frontend/my-app/
│   ├── src/pages/                React pages for users, merchants, and admins
│   ├── src/pages/componant/       Shared UI components
│   ├── src/radux/                Redux store and user state
│   ├── src/App.jsx               Main application and navigation
│   └── vite.config.js             Vite configuration
└── README.md
```

## Technologies

### Frontend

- React 19 and React DOM.
- Vite for development and production builds.
- React Router for client-side navigation.
- Redux Toolkit and React Redux for user state management.
- Axios for API requests.
- Tailwind CSS and `@tailwindcss/vite` for styling.
- React Icons and React Toastify for icons and notifications.
- `@stripe/stripe-js` for frontend Stripe integration.
- `socket.io-client` is included as a dependency; the current auction room
	implementation uses the native WebSocket API.

### Backend

- Node.js and Express 5.
- MongoDB with Mongoose.
- JWT for API authentication.
- `bcryptjs` for password hashing and verification.
- Passport and Google OAuth 2.0 for Google login.
- Express Session for Passport sessions.
- Multer for image uploads.
- Stripe for payments and wallet deposits.
- `ws` for real-time auction communication.
- `node-cron` for scheduled jobs.
- CORS for frontend-to-backend communication.

## Database

The project uses MongoDB and connects through the `MONGODB_URI` environment
variable. The schemas and models are defined in `backend/models/arts.js`.

| Model | Purpose |
| --- | --- |
| `User` | Accounts, roles, wallet balance, identity image, and verification status |
| `Product` | Auction products and fixed-price products |
| `Bid` | Auction bids and fixed-price purchase records |
| `Comment` | User comments on products |
| `Ad` | Advertisements shown on the platform |
| `Order` | Orders, delivery status, payment method, and payment status |
| `Report` | Sales, auction, buyer, seller, and delivery reports |

The models use MongoDB `ObjectId` references and Mongoose `populate` for
relationships such as product sellers, order products, bids, buyers, and
delivery staff.

## Authentication and Authorization

- Local login returns a JWT that expires after 12 hours.
- Clients send the token in the following header:

```http
Authorization: Bearer <JWT_TOKEN>
```

- Supported roles are `customer`, `merchant`, `admin`, and `delivery`.
- Passwords are removed from user API responses.
- Google login uses `/auth/google` and `/auth/google/callback`.

## Main API Routes

> The default backend URL is `http://localhost:5000`.

### Users

- `POST /api/users` - Register a local user.
- `POST /api/users/login` - Local login.
- `GET /api/users/me` - Get the current user; requires a JWT.
- `GET /api/users/:username` - Get a user profile.
- `PATCH /api/users/:username` - Update a profile and upload an identity image.
- `POST /api/customers/register` and `POST /api/customers/login` - Customer auth.
- `POST /merchant/register` and `POST /merchant/login` - Merchant auth.
- `POST /api/delivery/register` and `POST /api/delivery/login` - Delivery auth.

### Products and Auctions

- `GET /api/home` - Get homepage data.
- `GET /api/users/auction/active` - Get active auctions.
- `GET /api/users/auction/all` - Get auctions with their current status.
- `GET /api/users/auction/available` - Get products available for bidding.
- `GET /api/users/auction/:productId/details` - Get auction details.
- `GET /api/users/auction/category/:category` - Filter auctions by category.
- `POST /api/users/auction/:productId/bid` - Place a bid; requires a JWT.
- `GET /api/users/my-bids` - Get the current user's bids; requires a JWT.
- `GET /api/users/my-won-auctions` - Get auctions won by the current user.
- `GET /api/users/products/fixed` - Get fixed-price products.
- `GET /api/users/products/:productId` - Get product details.
- `POST /api/users/purchase/cod` - Create a cash-on-delivery order.

### Administration and Merchants

- Administration routes are under `/admin` and require the `admin` role.
- Admins can manage users, products, bids, orders, reports, and advertisements.
- Merchant routes are under `/merchant` and manage merchant products, bids, and
	orders.

### Payments and Wallet

- `POST /api/wallet/create-wallet-session` - Create a Stripe wallet deposit session.
- `POST /api/wallet/create-product-session` - Create a Stripe product purchase session.
- `POST /api/wallet/webhook` - Receive payment events.
- Stripe webhook handling is also implemented in `webhook.js`.

## Requirements

- A recent Node.js version, preferably Node.js 20 or newer.
- npm.
- A MongoDB database and connection URI.
- A Stripe account when online payments are enabled.
- Google OAuth credentials when Google login is enabled.

## Local Setup

### 1. Install dependencies

From the project root:

```bash
cd backend
npm install

cd ../frontend/my-app
npm install
```

### 2. Configure environment variables

Create `backend/.env` locally. Do not commit this file to GitHub:

```env
MONGODB_URI=mongodb://localhost:27017/auction
JWT_SECRET=your_strong_jwt_secret
SESSION_SECRET=your_session_secret
PORT=5000
NODE_ENV=development
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret
```

Google and Stripe variables are only required when those integrations are used.
Do not use default secrets in production.

### 3. Start the backend

From `backend`:

```bash
node server.js
```

For development with automatic restarts:

```bash
npx nodemon server.js
```

The server starts from the port in `PORT`, defaulting to `5000`. If that port
is busy, it automatically searches for an available port.

### 4. Start the frontend

From `frontend/my-app`:

```bash
npm run dev
```

The frontend normally runs at `http://localhost:5173` and is currently
configured to call the backend at `http://localhost:5000`.

### 5. Build and lint

```bash
cd frontend/my-app
npm run build
npm run lint
```

The backend does not currently define automated tests in its `package.json`.

## WebSocket Auctions

The WebSocket server runs on the same port as the HTTP server. The frontend
joins a product room by sending a `join` message containing `token` and
`productId`. Auction rooms support initialization, new bids, comments, auction
completion, and heartbeat messages.

## Files Excluded from Git

The `.gitignore` excludes:

- `backend/.env` and other environment files.
- `node_modules` directories.
- `backend/uploads` and locally uploaded images.
- Build output and log files.

Never place MongoDB, JWT, Stripe, or Google secrets in source code, README, or
GitHub.

## Deployment Notes

Before deployment, replace localhost URLs with production domains, configure
CORS and Google OAuth callbacks, update Stripe success/cancel URLs, use HTTPS,
set strong secrets, and store uploaded images in persistent storage instead of
relying on a temporary local filesystem.

## Repository

GitHub: https://github.com/loaywe/auction-v2
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
