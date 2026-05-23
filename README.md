# Cold Flyer Server

Express.js API server for the Cold Flyer AC e-commerce platform — handles products, orders, services, bookings, payments (Stripe + SSLCOMMERZ), and user management.

## Tech Stack

**Runtime:** Node.js 18+  
**Framework:** Express.js 4 (CommonJS)  
**Database:** MongoDB with Mongoose ODM  
**Auth:** JWT single access token, bcrypt, Google OAuth  
**Payments:** Stripe, SSLCOMMERZ (Bangladesh)  
**File Storage:** Cloudinary  
**Security:** helmet, CORS, rate limiting, mongo-sanitize

## Getting Started

```bash
git clone https://github.com/devabutaher/cold-flyer.git
cd cold-flyer/cold-flyer-server
npm install
```

Copy or configure `.env` with the required variables. Start the server:

```bash
node src/server.js
```

Server runs at `http://localhost:5000`. The frontend at `cold-flyer/` proxies all `/api/*` requests here.

## Scripts

| Command | Description |
|---------|-------------|
| `node src/server.js` | Start server |
| `npm run seed` | Seed sample data |
| (register with ADMIN_EMAIL) | Auto-creates admin on signup |
| `npm run lint` | Run ESLint |
| `npm run format` | Format with Prettier |

## API

Base path: `/api`. All endpoints are proxied from the Next.js frontend.

See `BACKEND.md` for the full API specification including all endpoints, database schemas, and auth details.

## Deployment

Vercel (`vercel.json` → serverless) or standard Node hosting. Node >= 18 required.

## License

MIT
