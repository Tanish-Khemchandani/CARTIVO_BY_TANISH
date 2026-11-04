# CARTIVO

CARTIVO is a MERN ecommerce website: React + Vite storefront and admin dashboard, an Express API, and MongoDB through Mongoose. Customers do not need accounts. The `/admin` dashboard uses a separate admin-only login.

## Project layout

- `client/` — React + Vite + Tailwind storefront and the `/admin` dashboard
- `server/` — Express API, Mongoose models, and sample data seed script
- `render.yaml` — one Render web service that builds the client and serves it from Express

## Run locally

1. In `server/`, create `.env` from `.env.example` and set `MONGO_URI`, `ADMIN_EMAIL`, and `ADMIN_PASSWORD`.
2. Install and start the API:

   ```sh
   cd server
   npm ci
   npm run dev
   ```

3. In another terminal, start the React app:

   ```sh
   cd client
   npm ci
   npm run dev
   ```

Open `http://localhost:5173`. The admin sign-in is at `http://localhost:5173/admin/login`; the API runs on `http://localhost:5000`. The health endpoint is `http://localhost:5000/health`.

For a production-style local run, build the client with `VITE_API_URL=/api`, then start Express. It serves `client/dist` and supports direct navigation to React routes.

## Render deployment

The Blueprint defines one Node web service. It installs both dependency sets, builds the Vite client, then starts Express. Express binds to Render's `PORT` on `0.0.0.0`, serves the built client, and exposes `/health` as its health check.

When applying the Blueprint, set `MONGO_URI`, `ADMIN_EMAIL`, and `ADMIN_PASSWORD` as private Render environment variables. The client calls the API on the same Render origin at `/api`. Keep all three values out of frontend code and committed files.

Admin credentials are read from the server environment. Admin sessions use an HTTP-only cookie backed by a MongoDB session record. Customers do not have a login. Admin APIs and write routes require an admin session.

New admin products require at least three unique uploaded photos. Product details and photo bytes are stored in MongoDB: photos use GridFS and products retain database-backed `/api/uploads/<id>` references. The frontend does not persist product data or photo files.

For an upload smoke test, set `ADMIN_EMAIL` and `ADMIN_PASSWORD` in `server/.env`, start the API, then run `node scripts/_uploadTest.js` from `server/`. It checks image validation and cleanup; authenticated product checks run when credentials are configured.

After deploying this update to an existing database, run `node scripts/migrateProductPhotosToGridFs.js` from `server/` once. It migrates legacy product files and seeded product assets into GridFS, updates their product records, and keeps old files in place for manual verification.

## API routes

- `GET /health` — 200 status for Render and UptimeRobot
- `GET /api/health` — API status alias
- `POST /api/admin/auth/login`, `GET /api/admin/auth/me`, `POST /api/admin/auth/logout`
- `POST /api/uploads` — admin-only multipart photo upload (`images`, up to 8 files); `GET /api/uploads/:id` streams the image from MongoDB GridFS
- `/api/categories`
- `/api/products`
- `/api/contact`
- `/api/newsletter/subscribe`
- `/api/orders` — admin session required
- `/api/admin/summary` — admin session required

## Seed sample data

From `server/`, run `node seed/seed.js`. This replaces categories and products with sample CARTIVO data. Do not run it against a database containing real orders.
