# Recommended improvements

## Highest priority

1. Add end-to-end tests against a MongoDB replica set and Razorpay test mode. Include concurrent callback/webhook delivery, transaction rollback, successful payment followed by a closed browser, and two separate user sessions. MongoDB integration and concurrent trading tests now exist; hosted Razorpay checkout and public webhook delivery still need external test-mode checks.
2. Add a scheduled reconciliation worker for every pending payment, with pagination, bounded retries, and alerts. Funds-page recovery checks only the ten most recent pending orders for the current user; webhook delivery remains the primary recovery path.
3. Rate-limit login, registration, order creation, payment creation, and reconciliation using shared persistent storage. Add email verification and password reset. Use a session store for revocation, one-time login handoffs, and logout across devices.
4. Keep Razorpay in test mode until operational reconciliation, refund handling, monitoring, and security testing are complete. This application currently implements a trading simulation and demo withdrawals.

## Product and data integrity

5. Extend immediate paper market fills with pending limit orders, cancellation, fees, taxes, and settlement rules. Current market fills atomically update cash and holdings and prevent overselling. Add an authorised broker execution adapter and licensed price feed for actual exchange trading.
6. Move the embedded transaction history to an append-only ledger collection with pagination. Authoritative balances, cost basis, trade totals, and realized P&L now use integer paise; trades and paper transfers already use idempotency keys. The legacy rupee balance is kept for compatibility.
7. Add a verified email-change flow and optional avatar uploads. Personal details now persist through authenticated APIs keyed by user ID; the login email stays read-only in the profile editor. The summary page now derives cash, holdings, equity, and P&L from the account.
8. Paginate order history and move transactions from an ever-growing embedded array into a separate indexed collection. Add loading, retry, and empty states consistently.

## Maintainability and operations

9. Consolidate shared server code and dependency management into a workspace while preserving deployable app boundaries. The auth helper is currently duplicated between deployment roots and protected by an equality test.
10. Plan a migration from Create React App to a maintained build system. Review deprecated dependencies and audit findings before changing versions, then verify both apps in CI.
11. Add CI for regression tests and builds, secret scanning, structured logs, health checks, backups, and payment-failure alerts. Redact credentials, session tokens, and personal information from logs.
12. Improve modal accessibility with focus trapping and focus restoration. Add browser-level login/logout, navigation, and payment-state tests.
