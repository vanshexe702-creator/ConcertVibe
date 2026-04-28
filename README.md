<<<<<<< HEAD
# 🎵 ConcertVibe — Concert Ticket Booking System

A full-stack concert ticket booking system with a premium dark-themed UI, interactive seat selection, payment simulation, e-ticket generation, and complete admin panel.

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | HTML5, CSS3, Vanilla JavaScript |
| Backend | Node.js + Express.js |
| Database | MySQL 8.0+ |
| Auth | JWT + bcrypt |
| Charts | Chart.js |
| QR/PDF | qrcode.js + jsPDF |

## 📋 Features

### User Side
- ✅ User Registration & Login (JWT auth, bcrypt password hashing)
- ✅ Browse upcoming concerts with search, filter by city/genre/date
- ✅ Interactive seat map with real-time availability
- ✅ Seat locking (5-min timeout) to prevent double-booking
- ✅ Payment simulation (Card/UPI/Net Banking)
- ✅ E-ticket with QR code + PDF download
- ✅ Booking history with cancel support
- ✅ Promo code discounts
- ✅ Countdown timer to events

### Admin Panel
- ✅ Admin login with role-based auth
- ✅ Concert CRUD (Add/Edit/Delete)
- ✅ Visual seat management (block/unblock seats)
- ✅ View all user bookings
- ✅ Revenue dashboard with Chart.js charts

## 🚀 Setup Guide

### Prerequisites
1. **Node.js** (v18+) — [Download](https://nodejs.org)
2. **MySQL** (v8.0+) — [Download](https://dev.mysql.com/downloads/)

### Step 1: Clone & Install Dependencies

```bash
cd d:\project
npm install
```

### Step 2: Setup MySQL Database

1. Open MySQL client (MySQL Workbench, command line, etc.)
2. Run the schema file:

```bash
mysql -u root -p < database/schema.sql
```

Or copy-paste the contents of `database/schema.sql` into your MySQL client.

### Step 3: Configure Environment

Edit `.env` file in the project root:

```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=concert_booking
DB_PORT=3306
JWT_SECRET=your_secret_key
PORT=3000
```

### Step 4: Start the Server

```bash
npm start
```

Server will start at: **http://localhost:3000**

### Step 5: Access the App

| Page | URL |
|---|---|
| Home | http://localhost:3000 |
| Login | http://localhost:3000/login.html |
| Register | http://localhost:3000/register.html |
| Admin Login | http://localhost:3000/admin/login.html |
| Admin Dashboard | http://localhost:3000/admin/dashboard.html |

### Default Admin Credentials
- **Username:** `admin`
- **Password:** `admin123`

### Sample Promo Codes
- `WELCOME10` — 10% off
- `SUMMER20` — 20% off
- `VIP15` — 15% off

## 📂 Project Structure

```
project/
├── server/                    # Backend
│   ├── config/db.js          # MySQL connection pool
│   ├── middleware/            # JWT auth middleware
│   ├── controllers/           # Business logic
│   ├── routes/                # API endpoints
│   ├── utils/                 # Helpers
│   └── server.js             # Entry point
├── public/                    # Frontend
│   ├── index.html            # Landing page
│   ├── login.html            # User login
│   ├── register.html         # User registration
│   ├── concert.html          # Concert detail + seat map
│   ├── booking.html          # E-ticket confirmation
│   ├── history.html          # Booking history
│   ├── admin/                # Admin panel pages
│   ├── css/                  # Stylesheets
│   └── js/                   # Client-side JavaScript
├── database/
│   └── schema.sql            # Database schema + seed data
├── .env                      # Environment config
├── package.json
└── README.md
```

## 🔑 API Endpoints

### Auth
- `POST /api/auth/register` — Register new user
- `POST /api/auth/login` — Login
- `GET /api/auth/me` — Current user profile

### Concerts
- `GET /api/concerts` — List concerts (search, filter, sort)
- `GET /api/concerts/:id` — Concert detail
- `GET /api/concerts/cities` — Available cities
- `GET /api/concerts/categories` — Available genres

### Seats
- `GET /api/seats/:concertId` — Seat map
- `POST /api/seats/lock` — Lock seats (auth required)
- `POST /api/seats/unlock` — Unlock seats

### Bookings
- `POST /api/bookings` — Create booking (auth required)
- `GET /api/bookings/history` — User bookings
- `GET /api/bookings/:id` — Booking detail
- `POST /api/bookings/:id/cancel` — Cancel booking

### Admin
- `POST /api/admin/login` — Admin login
- `GET /api/admin/dashboard` — Revenue stats
- CRUD: `/api/admin/concerts`
- `GET /api/admin/bookings` — All bookings
- `POST /api/admin/seats/block` — Block/unblock seats

## 📜 License
MIT License — © 2026 ConcertVibe
=======
# ConcertVibe
>>>>>>> 1e4ba0f7681d5427683e209dec2d43487c754316
