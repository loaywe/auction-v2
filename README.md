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
