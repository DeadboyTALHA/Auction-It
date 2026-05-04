# 🔨 Auction-It

> A real-time auction bidding platform built with the MERN stack and Socket.io — where every second counts.

[![MongoDB](https://img.shields.io/badge/MongoDB-4EA94B?style=for-the-badge&logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![Express.js](https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/)
[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![Socket.io](https://img.shields.io/badge/Socket.io-010101?style=for-the-badge&logo=socketdotio&logoColor=white)](https://socket.io/)
[![Stripe](https://img.shields.io/badge/Stripe-635BFF?style=for-the-badge&logo=stripe&logoColor=white)](https://stripe.com/)
[![Recharts](https://img.shields.io/badge/Recharts-FF6384?style=for-the-badge&logo=chartdotjs&logoColor=white)](https://recharts.org/)
[![jsPDF](https://img.shields.io/badge/jsPDF-FF0000?style=for-the-badge&logo=adobeacrobatreader&logoColor=white)](https://github.com/parallax/jsPDF)

---

## 📖 Overview

**Auction-It** is a full-stack real-time auction bidding system where users can list items for auction and compete in live bidding wars. Powered by **Socket.io**, all bids are broadcast instantly to every connected participant — no refreshing required. Whether you're a seller looking to get the best price or a buyer hunting for a deal, Auction-It keeps the action fast and fair.

---

## ✨ Features

### 🛠️ Admin
- **Manage Categories** — Full CRUD control over auction categories
- **Featured Auctions** — Admin can hand-pick and spotlight auctions
- **All Auction History** — Complete platform-wide auction log with visibility for admins
- **Issue Report & Chat System** — Handle user-reported issues and communicate via chat

### 🔴 Real-Time Bidding
- **Live Bidding Interface** — Bids are broadcast instantly to all participants via Socket.io
- **Auto-Bidding with Limit** — Set a max limit and let the system bid automatically on your behalf
- **Minimum Bid Increment** — Enforced 1.25x minimum raise to keep bidding competitive
- **Bid History with Timestamp** — Full chronological log of every bid placed on an auction
- **Auction Countdown Timer** — Live countdown clock ticking on every active listing

### 🛒 Auctions & Discovery
- **Auction Listing** — Sellers can create and publish auction items
- **Browse Active Auctions** — Explore all live and upcoming auctions
- **Search & Filter** — Filter by category, price range, and remaining time
- **Request Featuring** — Sellers can request admin to feature their auction
- **Watchlist** — Save auctions to follow and get notified before they end

### 📊 Dashboards & Analytics
- **Buyer Dashboard** — View won auctions, active bids, and win percentage
- **Seller Dashboard** — Track listed auctions and per-auction profit
- **Bid Analytics Chart** — Visual bidding activity trends powered by Recharts

### 💳 Payments & Reports
- **Payment System** — Simulated checkout flow via Stripe (test/dummy mode)
- **Seller Report PDF** — Download detailed seller reports using jsPDF & jspdf-autotable

### 🔔 Notifications & Trust
- **Auction Ending Alerts** — Get notified when a watched auction is closing in 5 minutes
- **Seller Rating System** — Buyers can rate sellers after a completed auction

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React.js |
| **Backend** | Node.js, Express.js |
| **Database** | MongoDB (Mongoose ODM) |
| **Real-Time** | Socket.io |
| **Auth** | JWT / bcrypt |
| **Payments** | Stripe (test/dummy mode) |
| **Charts** | Recharts |
| **PDF Export** | jsPDF, jspdf-autotable |

---

## 📁 Project Structure

```
Auction-It/
├── backend/                  # Node/Express server
│   ├── config/               # DB and environment configuration
│   ├── controllers/          # Route handler logic
│   ├── middleware/           # Auth and other middleware
│   ├── models/               # Mongoose schemas
│   └── routes/               # API route definitions
│
├── frontend/                 # React client
│   ├── public/               # Static assets
│   └── src/
│       ├── components/       # Reusable UI components
│       ├── context/          # React Context (global state)
│       ├── pages/            # Page-level components
│       ├── services/         # API call functions
│       ├── App.css
│       ├── App.js
│       ├── index.css
│       └── index.js
│
├── .gitignore
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites

Make sure you have the following installed:

- [Node.js](https://nodejs.org/) (v16+)
- [MongoDB](https://www.mongodb.com/) (local or Atlas URI)
- npm or yarn

### Installation

1. **Clone the repository**

```bash
git clone https://github.com/DeadboyTALHA/Auction-It.git
cd Auction-It
```

2. **Install backend dependencies**

```bash
cd backend
npm install
```

3. **Install frontend dependencies**

```bash
cd ../frontend
npm install
```

4. **Configure environment variables**

Create a `.env` file inside the `backend/` directory:

```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
CLIENT_URL=http://localhost:3000
STRIPE_SECRET_KEY=your_stripe_test_secret_key
STRIPE_PUBLISHABLE_KEY=your_stripe_test_publishable_key
```

> 💡 Use Stripe's [test mode keys](https://dashboard.stripe.com/test/apikeys) — no real charges will be made.

5. **Run the development servers**

In the `backend/` directory:

```bash
npm run dev
```

In the `frontend/` directory:

```bash
npm start
```

The app will be running at `http://localhost:3000` with the API at `http://localhost:5000`.

---

## ⚙️ How It Works

1. A **seller** creates an auction listing with a starting price and end time.
2. **Bidders** join the auction room via Socket.io.
3. When a bid is placed, the server validates it and **broadcasts** the new highest bid to all connected clients in real time.
4. When the countdown expires, the auction closes and the **highest bidder wins**.

---

## 🔌 Socket Events

| Event | Direction | Description |
|---|---|---|
| `join_auction` | Client → Server | Join a specific auction room |
| `place_bid` | Client → Server | Submit a new bid |
| `bid_update` | Server → Client | Broadcast the latest bid to all users |
| `auction_ended` | Server → Client | Notify all users when auction closes |

---

## 🤝 Contributing

Contributions are welcome! Here's how to get started:

1. Fork the repository
2. Create a new branch: `git checkout -b feature/your-feature-name`
3. Commit your changes: `git commit -m 'Add some feature'`
4. Push to the branch: `git push origin feature/your-feature-name`
5. Open a Pull Request

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).

---

## 👥 Team — Section 9, Group 3 (Spring 2026)

| # | Name | Student ID | Contribution |
|---|---|---|---|
| 1 | **Md. Minhazul Mowla** | 23201390 | Admin Categories, Featured Auctions, Bidding History, Auto-Bidding, Issue Report & Chat, All Auction History | 25% |
| 2 | **Moshee-Ur Rahman** | 23201354 | Real-Time Bidding Interface, Buyer Dashboard, Watchlist, Notifications & Alerts, Payment System, All Auction History | 25% |
| 3 | **Farhan Ahmed** | 23201654 | Browse Auctions, Countdown Timer, Search & Filter, Request Featuring, Bid Analytics Chart | 25% |
| 4 | **Md. Rakib Hasan** | 23201141 | Auction Listing, Seller Dashboard, Min Bid Increment, Seller Report PDF, Seller Rating System | 25% |

---

> ⭐ If you found this project interesting, consider giving it a star on [GitHub](https://github.com/DeadboyTALHA/Auction-It)!
