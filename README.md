# Cold Flyer Server

Express.js API server for the Cold Flyer AC e-commerce platform — handles products, orders, services, bookings, payments (Stripe + SSLCOMMERZ), and user management.

---

## Demo Accounts

Run `npm run seed` to populate sample data:

| Role | Email | Password |
|------|-------|----------|
| Admin | `admin@coldflyer.com` | `Admin@1234` |
| Moderator | `mod@coldflyer.com` | `Mod@1234` |
| Worker | `tech@coldflyer.com` | `Tech@1234` |
| Customer | `fatima@example.com` | `User@1234` |

---

## Tech Stack

| Category | Technology |
|----------|-----------|
| **Runtime** | Node.js 20+ |
| **Framework** | Express.js 4 (CommonJS) |
| **Database** | MongoDB + Mongoose ODM |
| **Auth** | JWT single access token, bcrypt, Google OAuth |
| **Payments** | Stripe, SSLCOMMERZ (Bangladesh) |
| **File Storage** | Cloudinary |
| **Email** | Nodemailer (SMTP) |
| **Security** | helmet, CORS, rate limiting, mongo-sanitize |

---

## Getting Started

```bash
git clone https://github.com/devabutaher/cold-flyer.git
cd cold-flyer/cold-flyer-server
npm install
```

Copy `.env.example` to `.env` and fill in the required variables. Then:

```bash
npm run seed     # Seed 92 records across 12 models
npm start        # Start server on port 5000
```

The frontend at `cold-flyer/` proxies all `/api/*` requests to this server.

---

## Scripts

| Command | Description |
|---------|-------------|
| `npm start` | Start production server |
| `npm run dev` | Start with nodemon (auto-restart) |
| `npm run seed` | Seed database with 92 sample records |
| `npm run lint` | Run ESLint |
| `npm run format` | Format with Prettier |

---

## API Endpoints

Base path: `/api`. All endpoints are proxied from the Next.js frontend.

| Module | Endpoints | Auth |
|--------|-----------|------|
| **Auth** | POST register, login, google, logout, change-password, forgot/reset-password, verify-email — GET me, status | Mixed |
| **Products** | Full CRUD `/api/products` | Public read, Admin write |
| **Orders** | Full CRUD `/api/orders` + status updates | Auth read, Admin manage |
| **Services** | Full CRUD `/api/services` | Public read, Admin write |
| **Bookings** | CRUD `/api/services/bookings` + cancel | Public create, Auth manage |
| **Payments** | Stripe intent + webhook, SSLCOMMERZ init/return/IPN/verify | Mixed |
| **Users** | Full CRUD `/api/users` | Admin |
| **Customers** | Full CRUD `/api/customers` | Admin |
| **Workers** | Full CRUD `/api/workers` | Admin |
| **Blogs** | Full CRUD `/api/blogs` | Public read, Admin write |
| **Coupons** | Full CRUD `/api/coupons` + apply | Public read, Admin write |
| **Reviews** | Full CRUD `/api/reviews` | Public read, Auth write |
| **Expenses** | Full CRUD `/api/expenses` | Admin |
| **Attendance** | Full CRUD `/api/attendance` | Admin/Worker |
| **Activity Log** | GET `/api/activity` | Admin |
| **Messages** | Full CRUD `/api/messages` | Auth |
| **Recent Works** | Full CRUD `/api/recent-works` | Admin |
| **Upload** | POST `/api/upload` | Auth — Cloudinary |
| **Stats** | GET `/api/public/stats` | Public |

---

## Project Structure

```
src/
├── server.js                 # Entry point — connects DB, starts HTTP server
├── app.js                    # Express app — middleware, routes, error handler
├── config/                   # DB, Google OAuth, Cloudinary config
├── models/                   # 20 Mongoose schemas (User, Product, Order, Service, Booking, etc.)
├── controllers/              # Request handlers (one per resource)
├── routes/                   # Express routers
├── middleware/               # Auth (JWT), error handler, Zod validation, upload
├── services/                 # Email, Cloudinary, notifications
├── validators/               # Zod validation schemas
└── utils/                    # JWT helpers, ApiError, catchAsync, logger, seed script
```

---

## Middleware Architecture

```
Request → Request ID → Logging → Helmet → Compression → CORS
       → Body parsing → mongo-sanitize → Rate limiter → Routes
       → Auth middleware (JWT: cookie or Bearer) → Controller → Response
       → 404 handler → Global error handler (structured JSON)
```

### Key Patterns

- **Auth**: JWT in httpOnly cookie with Bearer header fallback
- **Validation**: Zod schemas via `validate()` middleware
- **Error Handling**: `catchAsync` wrapper + `ApiError` class → consistent `{ success, message, code }` responses
- **Account Lockout**: 5 failed attempts → 15-min lock
- **Auto UID**: `USR-{random5}` / `CUST-{random5}` via Mongoose hooks
- **Auto Customer**: Booking creation upserts Customer records (dedup by phone/email)

---

## Database Models (20)

| Model | Purpose |
|-------|---------|
| **User** | Auth, roles, addresses, account lockout |
| **Product** | AC units & parts catalog |
| **Order** | Customer orders with items, status, payment |
| **Service** | Service offerings (cleaning, repair, installation) |
| **ServiceBooking** | Appointments with AC details |
| **Cart** | Shopping cart |
| **Coupon** | Discount codes with scopes & conditions |
| **Payment** | Payment transactions |
| **Worker** | Profiles, skills, availability |
| **Customer** | Auto-created CRM records |
| **Blog** | Blog posts with SEO fields |
| **Review** | Product & service ratings |
| **Expense** | Business expenses |
| **ActivityLog** | Admin audit trail |
| **Attendance** | Worker attendance |
| **Notification** | In-app alerts |
| **MessageLog** | In-app messaging |
| **JobApplication** | Careers |
| **RecentWork** | Portfolio projects |
| **LocationLog** | Worker location tracking |

---

## Deployment

- **Vercel**: Uses `vercel.json` with `@vercel/node` runtime
- **Render** (recommended): Persistent connections, env vars
- **VPS**: Standard Node.js hosting with PM2

Node >= 20 required.

---

## Environment Variables

See `.env.example` for full reference. Key variables:

| Variable | Description |
|----------|-------------|
| `MONGODB_URI` | MongoDB connection string |
| `JWT_SECRET` | JWT signing secret |
| `FRONTEND_URL` | CORS origin + email links |
| `GOOGLE_CLIENT_ID` | Google OAuth |
| `CLOUDINARY_*` | Image storage |
| `SMTP_*` | Email server |
| `STRIPE_*` | Payment processing |
| `SSLCOMMERZ_*` | Bangladesh payment gateway |

---

## License

MIT
