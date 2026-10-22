# Stashflow

Multi-user paper-trading platform with React, MongoDB transactions, Express/Vercel APIs, and optional Razorpay test payments. Each user has their own cash, holdings, order history, and profit/loss. Prices are simulated, and no orders reach an exchange.

## Run locally

Use Node.js 22 or 24 and a MongoDB replica set (Atlas also works). Payments use MongoDB transactions, so a standalone MongoDB server is insufficient.

1. Run `npm run setup` at the repository root to install all three applications.
2. Copy `backend/.env.example`, `frontend/.env.example`, and `dashboard/.env.example` to `.env` in their respective directories. Replace placeholders. Generate a SESSION_SECRET with `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` and use the same value for both services. Never commit these files.
3. Set backend MongoDB and `PAYMENT_MODE=paper`. Paper deposits need no Razorpay keys. Set `REACT_APP_DASHBOARD_URL=http://localhost:3001` in frontend and `REACT_APP_PUBLIC_SITE_URL=http://localhost:3000` plus `PORT=3001` in dashboard.
4. In three terminals, run `npm start --prefix backend`, `npm start --prefix frontend`, and `npm start --prefix dashboard`.
5. Visit http://localhost:3000/signup and register. Both React development servers proxy `/api` to the backend on port 3002. Leave `REACT_APP_API_URL` unset for this setup.

The frontend login endpoint issues a signed 60-second handoff in the redirect URL fragment. The dashboard removes it from the URL, validates it server-side, and establishes an HttpOnly session cookie. Portfolio and financial APIs derive ownership from that session, never from a client-supplied account ID. Logout expires the cookie.

## Deploy

Deploy `frontend` and `dashboard` as separate Vercel projects with their own root directories. Serverless handlers live inside each project's `api` directory. Alternatively deploy the Express adapter with the complete repository and install all application dependencies.

Configure the same strong `SESSION_SECRET` in frontend and dashboard, and set `MONGO_URL` in both. Set frontend `REACT_APP_DASHBOARD_URL` and dashboard `REACT_APP_PUBLIC_SITE_URL` to the actual HTTPS site URLs before building. Use `PAYMENT_MODE=paper` for instant simulated deposits. To test payment checkout, use `PAYMENT_MODE=razorpay_test` and set `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, and `RAZORPAY_WEBHOOK_SECRET`. Live Razorpay keys are rejected by payment order creation. Set `NODE_ENV=production` for Express deployment so cookies have the Secure attribute. Prefer same-origin `/api` requests; if using a separate API host, configure exact `CLIENT_ORIGIN` values and account for browser third-party cookie restrictions.

In Razorpay, enable automatic capture and register the public dashboard endpoint `/api/razorpay-webhook` for `payment.captured`. Configure its signing secret as `RAZORPAY_WEBHOOK_SECRET`. The endpoint verifies the original request bytes. Configure webhook retries and monitor failed deliveries. Local webhook testing needs a public HTTPS tunnel to port 3002.

Both browser verification and webhook delivery check amount, currency, captured status, and stored ownership. A MongoDB transaction marks the order paid and credits its owner once. Repeated deliveries are idempotent. Opening Funds also checks the latest ten pending payment orders against Razorpay to recover missed callbacks. Older pending orders require an operational reconciliation job; see IMPROVEMENTS.md.

## Existing data

Existing global demo funds, orders, holdings, and positions have no trustworthy user ownership. They are intentionally not shown to new accounts. Back up your database before deploying. To migrate genuine historical data, assign each order/holding/position a string `userId` equal to its verified User `_id`; migrate funds to a corresponding string `accountKey`, and payment orders to that same `userId`. Do not assign the shared demo account to an arbitrary user. Prefer a fresh demo database when ownership cannot be established.

Each new account starts with zero cash and no holdings. Existing owned accounts preserve cash through a one-time integer-paise conversion; fictitious used margin is cleared. Legacy shared data is not assigned automatically.

## Trading behaviour

- Add paper funds in Funds, then place a buy or sell from the watchlist or Holdings. Only whole-share, fully paid paper market orders are supported. A new account has no shares; a buy stays open until another app user offers shares of that stock. Existing holdings from earlier paper trades can be listed for sale. There is no automatic starter inventory or synthetic market maker.
- Placing a trade creates an `OPEN` paper order. Orders for the same stock from different users match in placement order, potentially partially. The older order's stored simulated reference price is used for the trade; client prices and user IDs cannot change it. A user cannot match their own order. The watchlist shows other users' outstanding buy and sell quantities.
- A MongoDB transaction transfers virtual cash from buyer to seller, shares from seller to buyer, updates cost basis and order statuses, and records a paper trade together. Pending orders reserve estimated cash or shares against new orders, but execution still rechecks actual balances and holdings; a later shortfall can reject the remaining quantity. Open or partially filled orders can be cancelled.
- Monetary calculations use integer paise. Realized P&L comes from completed sales. Holdings, delivery positions, and the summary refresh after actions and every 15 seconds.
- Deposits, withdrawals, and trades require a unique `requestId` (8–100 letters, digits, underscores, or hyphens). Retrying the same action with the same ID returns the original result without moving money twice. Reusing an ID with different details returns 409. The UI preserves the ID for unchanged retries.
- Paper deposits and withdrawals accept ₹1–₹5,00,000 per request. Withdrawals reduce only available cash; invested cash must first be recovered by selling shares. There are no bank payouts.
- No short selling, leverage, intraday settlement, limit orders, brokerage, tax, dividends, or corporate actions are modelled. Prices are sample data, not a live or historical exchange feed.

For actual exchange trading, replace the simulator with an authorised broker order API, licensed quotes, broker account linking, risk checks, settlement handling, and a real reconciliation ledger. Never present the current simulator as a real-money brokerage.

## Validation

- `npm test`: security tests and integration tests against an ephemeral MongoDB replica set. No external database credentials are needed. The first integration run downloads a MongoDB binary unless one is cached.
- On Windows, `python scripts/fetch_test_mongo.py` fetches only the 7.0.24 executable from the official archive, skipping large debug-symbol files. It writes the ignored `.cache/mongodb/mongod.exe`, which integration tests use automatically. Alternatively set `MONGOMS_SYSTEM_BINARY` to an installed executable.
- `npm run build --prefix frontend`
- `npm run build --prefix dashboard`

The suite tests real registration/login sessions, separate users, deposits and withdrawals, server-priced fills, cost basis, partial/full sales, simultaneous trades, buys racing withdrawals, duplicate requests, transaction rollback, and payment-credit idempotency. Payment entities are supplied as test fixtures; hosted Razorpay checkout and public webhook delivery still need a Razorpay test account.

## Individual profiles

The profile menu opens `/profile/<user-id>` for the signed-in account. Profiles show the unique user ID, registration email, member-since date, name, phone, city, occupation, and bio. Name and personal details are saved to MongoDB and loaded again on the next login. The registered email and user ID cannot be changed through the profile editor. Profile APIs always use the signed session ID and never a supplied URL or body ID. Another user's profile route displays a privacy message. Browser profile state is held in memory and repopulated from the server.
