<div align="center">

# 🏛️ Auction V2

**An Arabic-first marketplace for live auctions and fixed-price products.**

[![Node.js](https://img.shields.io/badge/Node.js-20+-339933?logo=node.js&logoColor=white)](https://nodejs.org)
[![Express](https://img.shields.io/badge/Express-5.x-000000?logo=express&logoColor=white)](https://expressjs.com)
[![MongoDB](https://img.shields.io/badge/MongoDB-7.x-47A248?logo=mongodb&logoColor=white)](https://www.mongodb.com)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-6-646CFF?logo=vite&logoColor=white)](https://vitejs.dev)
[![Stripe](https://img.shields.io/badge/Stripe-Integrated-635BFF?logo=stripe&logoColor=white)](https://stripe.com)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](#-license)

[Overview](#-overview) · [Features](#-features) · [Tech Stack](#-tech-stack) · [Architecture](#-architecture) · [Getting Started](#-getting-started) · [API Reference](#-api-reference) · [Deployment](#-deployment)

</div>

---

## 📌 Overview

**Auction V2** is a full-stack Arabic marketplace platform that combines **live auctions** with **fixed-price e-commerce**. Users can browse products, participate in real-time bidding, purchase items directly, track their orders, and manage listings — all governed by a role-based access control system.

The platform is designed around four distinct user roles — **Customer, Merchant, Admin, and Delivery** — each with tailored dashboards and permissions. Real-time bidding is powered by **WebSocket** connections, and expired auctions are automatically closed via scheduled **`node-cron`** jobs.

---

## ✨ Features

### 👤 User Management
- 🔐 Registration and login with username and password
- 🔒 Passwords hashed with `bcryptjs` and verified on login
- 🌐 Google OAuth 2.0 login via Passport
- 🎭 Role-based access: `customer`, `merchant`, `admin`, `delivery`
- 🖼️ Profile management with identity image upload

### 🛒 Products & Auctions
- 📦 Create auction or fixed-price products with images, categories, and stock
- ⏱️ Browse active and expired auctions with type and category filters
- 💬 Product comments and real-time bidding
- 🏆 Automatic winner determination when auctions expire
- 🔄 Auction rooms with live status updates

### 💳 Payments & Wallet
- 💵 Cash-on-delivery for fixed-price products
- 💳 Stripe integration for online payments and wallet deposits
- 📥 Stripe webhook event handling
- 👛 User wallet with balance tracking

### ⚡ Real-Time Engine
- 🔌 WebSocket-based auction rooms
- 📡 Real-time bids, comments, and auction status broadcasts
- 💓 Heartbeat messages for connection health
- ⏰ Scheduled `node-cron` jobs to close expired auctions

### 🛡️ Administration
- 👥 Manage users, merchants, delivery staff
- 🏷️ Moderate products, bids, and categories
- 📊 View orders, sales reports, and delivery reports
- 📢 Manage advertisements

---

## 🧰 Tech Stack

<table>
<tr>
<td valign="top" width="50%">

### 🎨 Frontend
| Technology | Purpose |
|-----------|---------|
| **React 19** | UI framework |
| **Vite** | Build tool & dev server |
| **React Router** | Client-side routing |
| **Redux Toolkit** | State management |
| **Axios** | HTTP client |
| **Tailwind CSS** | Styling |
| **React Icons** | Icon library |
| **React Toastify** | Notifications |
| **@stripe/stripe-js** | Stripe integration |
| **socket.io-client** | Included dependency (native WebSocket used for auction rooms) |

</td>
<td valign="top" width="50%">

### ⚙️ Backend
| Technology | Purpose |
|-----------|---------|
| **Node.js 20+** | Runtime |
| **Express 5** | Web framework |
| **MongoDB + Mongoose** | Database & ODM |
| **JWT** | API authentication |
| **bcryptjs** | Password hashing |
| **Passport + Google OAuth 2.0** | Social login |
| **Express Session** | Passport sessions |
| **Multer** | Image uploads |
| **Stripe** | Payments & wallet |
| **ws** | Real-time WebSocket |
| **node-cron** | Scheduled jobs |
| **CORS** | Cross-origin requests |

</td>
</tr>
</table>

---

## 🏗️ Architecture

### Project Structure

```text
auction/
├── backend/
│   ├── config/
│   │   └── db.js                  # MongoDB connection
│   ├── controllers/               # Users, auctions, admin, orders
│   ├── middleware/                # Auth & image uploads
│   ├── models/
│   │   └── arts.js                # All Mongoose schemas & models
│   ├── routes/                    # REST API routes
│   ├── websocket/                 # Real-time auction support
│   ├── uploads/                   # Locally stored images
│   ├── server.js                  # Express + WebSocket entry point
│   ├── wallet.js                  # Stripe wallet & purchase sessions
│   └── webhook.js                 # Stripe webhook handler
│
├── frontend/my-app/
│   ├── src/pages/                 # User, merchant, admin pages
│   ├── src/pages/componant/       # Shared UI components
│   ├── src/radux/                 # Redux store & user state
│   ├── src/App.jsx                # Main app & navigation
│   └── vite.config.js             # Vite configuration
│
└── README.md
